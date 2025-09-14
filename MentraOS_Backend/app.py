import os, time, datetime
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import firestore, storage as fa_storage
from google.cloud import storage as gcs
from google.cloud.firestore_v1 import GeoPoint

from services.vector_store import init_vertex, upsert_to_vertex
from services.nearest_neighbor import find_nearest_neighbors

app = Flask(__name__)
_db = _bucket = _gcs_client = None

def get_firebase_clients():
    global _db, _bucket, _gcs_client
    if _db is None:
        bucket_name = os.environ.get("BUCKET")
        if not bucket_name:
            raise RuntimeError("Missing BUCKET env var (e.g., mementoai.appspot.com)")
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={"storageBucket": bucket_name})
        _db = firestore.client()
        _bucket = fa_storage.bucket()
        _gcs_client = gcs.Client()
    return _db, _bucket, _gcs_client

def _parse_timestamp(ts):
    # Accept epoch ms or seconds; otherwise leave None
    try:
        ts = float(ts)
        if ts > 10_000_000_000: ts /= 1000.0  # ms → s
        return datetime.datetime.utcfromtimestamp(ts).replace(tzinfo=datetime.timezone.utc)
    except Exception:
        return None

# ---------- Health ----------
@app.route("/", methods=["GET"])
def root():
    return "MementoAI Backend is running", 200

@app.route("/health", methods=["GET", "HEAD"])
def health():
    return ("ok", 200, {"Content-Type": "text/plain"})


# ---------- Signed upload for media files (audio/video/image) ----------
# Glasses call this first to get a signed URL to PUT bytes to.
# Request JSON: { uid, sessionId, ext, contentType }
# Response JSON: { uploadUrl, storagePath, itemId }
@app.route("/mintUploadUrl", methods=["POST"])
def mint_upload_url():
    data = request.get_json(force=True, silent=True) or {}
    uid = data.get("uid")
    session_id = data.get("sessionId")
    ext = (data.get("ext") or "bin").strip(".")
    content_type = data.get("contentType") or "application/octet-stream"

    if not uid or not session_id:
        return jsonify({"error": "uid and sessionId are required"}), 400

    # Get Firebase clients lazily
    db, bucket, gcs_client = get_firebase_clients()

    ts = int(time.time() * 1000)
    object_path = f"inputs/{uid}/{session_id}/{ts}.{ext}"

    # Signed URL for a single-shot PUT with a strict Content-Type
    blob = gcs_client.bucket(bucket.name).blob(object_path)
    upload_url = blob.generate_signed_url(
        version="v4",
        expiration=600,          # 10 minutes
        method="PUT",
        content_type=content_type
    )

    # Pre-create Firestore doc (client can watch this in RN)
    db.document(f"sessions/{session_id}/items/{ts}").set({
        "uid": uid,
        "storagePath": object_path,
        "status": "uploading",
        "contentType": content_type,
        "createdAt": firestore.SERVER_TIMESTAMP
    }, merge=True)

    return jsonify({
        "uploadUrl": upload_url,
        "storagePath": object_path,
        "itemId": str(ts)
    }), 200

# ---------- Ingest audio metadata from smart glasses ----------
# Request JSON: { uid, sessionId, timestamp, location, summary, transcript, nextSteps?, skills?, confidence, gpsLocation, rawTranscript, name? }
# Response JSON: { ok, itemId }
@app.route("/ingestAudio", methods=["POST"])
def ingest_audio():
    data = request.get_json(force=True, silent=True) or {}
    
    # Required fields
    uid = data.get("uid")
    session_id = data.get("sessionId")
    timestamp = data.get("timestamp")
    location = data.get("location")
    summary = data.get("summary")
    transcript = data.get("transcript")
    confidence = data.get("confidence")
    gps_location = data.get("gpsLocation")
    raw_transcript = data.get("rawTranscript")
    
    # Optional fields
    next_steps = data.get("nextSteps")
    skills = data.get("skills")
    name = data.get("name")

    # Validate required fields
    if not uid or not session_id or not timestamp or not location or not summary or not transcript:
        return jsonify({"error": "uid, sessionId, timestamp, location, summary, and transcript are required"}), 400
    
    if confidence is None or not isinstance(confidence, (int, float)):
        return jsonify({"error": "confidence is required and must be a number"}), 400
    
    if not gps_location or not isinstance(gps_location, list) or len(gps_location) != 2:
        return jsonify({"error": "gpsLocation is required and must be an array of two numbers [lat, lng]"}), 400
    
    if not raw_transcript:
        return jsonify({"error": "rawTranscript is required"}), 400

    # Get Firebase clients lazily
    db, bucket, gcs_client = get_firebase_clients()
    if db is None:
        return jsonify({"error": "Firebase initialization failed"}), 500

    # Create audio metadata document
    ts = int(time.time() * 1000) if not isinstance(timestamp, (int, float)) else timestamp
    doc = {
        "uid": uid,
        "sessionId": session_id,
        "itemType": "audio",
        "timestamp": timestamp,
        "location": location,
        "summary": summary,
        "transcript": transcript,
        "confidence": confidence,
        "gpsLocation": gps_location,
        "rawTranscript": raw_transcript,
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    
    # Add optional fields if provided
    if next_steps:
        doc["nextSteps"] = next_steps
    if skills:
        doc["skills"] = skills
    if name:
        doc["name"] = name

    # Save to Firestore
    try:
        db.document(f"sessions/{session_id}/items/{ts}").set(doc, merge=True)
        return jsonify({"ok": True, "itemId": str(ts)}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to save audio data: {str(e)}"}), 500

# ---------- Vector Embedding Ingestion ----------
# Request JSON: { uid, sessionId, vector: [floats], meta?: {...} }
# Response JSON: { ok, vectorId, userPath }
# @app.route("/ingestEmbedding", methods=["POST"])
# def ingest_embedding_endpoint():
#     data = request.get_json(force=True, silent=True) or {}
#     uid = data.get("uid")
#     session_id = data.get("sessionId")
#     vector = data.get("vector")
#     meta = data.get("meta", {})
#     item_type = data.get("itemType", "embedding")

#     if not uid or not session_id or vector is None:
#         return jsonify({"error": "uid, sessionId, and vector are required"}), 400
#     if not isinstance(vector, list):
#         return jsonify({"error": "vector must be a list (e.g., 512 floats)"}), 400

#     # Optional: dimension validation
#     dim = meta.get("dim")
#     if dim is not None and isinstance(dim, int) and dim != len(vector):
#         return jsonify({"error": f"vector dimension mismatch: got {len(vector)}, expected {dim}"}), 400

#     # Get Firebase clients lazily
#     db, _, _ = get_firebase_clients()
#     if db is None:
#         return jsonify({"error": "Firebase initialization failed"}), 500

#     # Ensure Vertex client is initialized
#     try:
#         init_vertex()
#     except Exception as e:
#         return jsonify({"error": f"Vertex init failed: {e}"}), 500

#     # Upsert to Vertex + write pointer docs
#     try:
#         vector_id, user_path = ingest_embedding(
#             db=db,
#             uid=uid,
#             session_id=session_id,
#             vector=vector,
#             meta=meta,
#             item_type=item_type
#         )
#     except Exception as e:
#         return jsonify({"error": f"ingest failed: {e}"}), 500

#     return jsonify({"vectorId": vector_id, "userPath": user_path}), 200
    
# ---------- NEW: Ingest a full encounter from glasses ----------
# JSON:
# {
#   uid, sessionId, timestamp, location, summary, transcript, rawTranscript,
#   confidence (int), gps: {lat,lng} (or lat,lng top-level),
#   nextSteps?, skills?, name?, vector? (list of 128 ints)
# }
@app.route("/ingestEncounter", methods=["POST"])
def ingest_encounter():
    data = request.get_json(force=True, silent=True) or {}

    # Required fields
    uid        = data.get("uid")
    session_id = data.get("sessionId")
    timestamp  = data.get("timestamp")
    location   = data.get("location")
    summary    = data.get("summary")
    transcript = data.get("transcript")
    raw_trans  = data.get("rawTranscript")
    confidence = data.get("confidence")

    if not uid or not session_id:
        return jsonify({"error": "uid and sessionId are required"}), 400
    if timestamp is None or location is None or summary is None or transcript is None or raw_trans is None:
        return jsonify({"error": "timestamp, location, summary, transcript, rawTranscript are required"}), 400
    if not isinstance(confidence, int):
        return jsonify({"error": "confidence must be an integer"}), 400

    # GPS (accept gps.lat/lng OR top-level lat/lng; cast to float)
    gps = data.get("gps") or {}
    lat = gps.get("lat", data.get("lat"))
    lng = gps.get("lng", data.get("lng"))
    if lat is None or lng is None:
        return jsonify({"error": "gps.lat and gps.lng (or top-level lat/lng) are required"}), 400
    try:
        geopoint = GeoPoint(float(lat), float(lng))
    except Exception:
        return jsonify({"error": "lat/lng must be numbers"}), 400

    # Optional
    next_steps = data.get("nextSteps")
    skills     = data.get("skills")
    name       = data.get("name")

    # Optional embedding (128 ints)
    vector = data.get("vector")
    if vector is not None and (not isinstance(vector, list) or len(vector) != 128):
        return jsonify({"error": "vector must be a list of 128 numbers"}), 400

    db, _, _ = get_firebase_clients()

    # Ensure Vertex is ready if we have a vector
    vector_id = None
    try:
        if vector is not None:
            init_vertex()
            # cast to float for Vertex; include restricts metadata
            meta = {"uid": uid, "modality": "face", "model": "face-128@v1"}
            vector_id = upsert_to_vertex(uid, session_id, vector, meta)
    except Exception as e:
        return jsonify({"error": f"Vertex upsert failed: {e}"}), 500

    # Choose encounterId: prefer vectorId (so 1:1 link), else timestamp-based
    enc_id = vector_id or f"enc_{int(time.time()*1000)}"

    # Build encounter doc
    device_dt = _parse_timestamp(timestamp)
    encounter_doc = {
        "uid": uid,
        "sessionId": session_id,
        "timestamp": device_dt or timestamp,   # store datetime if parsed, else raw
        "location": location,
        "geo": geopoint,
        "summary": summary,
        "transcript": transcript,
        "rawTranscript": raw_trans,
        "nextSteps": next_steps,
        "skills": skills,
        "confidence": confidence,
        "name": name,
        "vectorId": vector_id,
        "match": {"status": "unknown"},
        "createdAt": firestore.SERVER_TIMESTAMP
    }

    enc_path = f"encounters/{enc_id}"
    db.document(enc_path).set({k:v for k,v in encounter_doc.items() if v is not None}, merge=True)

    # Write embedding pointer if we upserted to Vertex
    if vector_id:
        try:
            write_embedding_doc(
                db,
                vector_id=vector_id,
                uid=uid,
                tenant_id=None,
                encounter_path=enc_path,
                model="face-128@v1",
                modality="face",
                dim=128,
                precision="int"
            )
        except Exception as e:
            return jsonify({"error": f"Failed to write embedding pointer: {e}"}), 500

    return jsonify({"ok": True, "encounterId": enc_id, "vectorId": vector_id}), 200

# ---------- NEW: Match ----------
# JSON: { uid, queryVector:[128 floats/ints], k?:5, threshold?:0.55 }
@app.route("/match", methods=["POST"])
def match():
    data = request.get_json(force=True, silent=True) or {}
    uid = data.get("uid")
    qv  = data.get("queryVector")
    k   = int(data.get("k", 5))
    thr = float(data.get("threshold", 0.55))

    if not uid or not isinstance(qv, list) or len(qv) != 128:
        return jsonify({"error": "uid and queryVector(128) are required"}), 400

    db, _, _ = get_firebase_clients()
    try:
        init_vertex()
        # neighbors: [{vectorId, distance}] (if using cosine distance, you may convert to similarity = 1 - distance)
        neighbors = find_neighbors(qv, num_neighbors=k, filters={"modality":"face","model":"face-128@v1"}, uid=uid)
    except Exception as e:
        return jsonify({"error": f"Vertex search failed: {e}"}), 500

    if not neighbors:
        return jsonify({"status":"unknown", "candidates":[]}), 200

    # Convert distance to similarity if you use COSINE_DISTANCE (sim ~ 1 - dist)
    best = min(neighbors, key=lambda n: n["distance"])
    similarity = 1.0 - float(best["distance"])
    vector_id = best["vectorId"]

    # Load encounter in 1 read (encounterId == vectorId if created via /ingestEncounter)
    enc_ref = db.document(f"encounters/{vector_id}")
    enc = enc_ref.get()
    payload = {
        "status": "unknown",
        "best": {"vectorId": vector_id, "distance": best["distance"], "similarity": similarity}
    }

    if similarity >= thr and enc.exists:
        doc = enc.to_dict()
        person_id = (doc.get("match") or {}).get("personId")
        if person_id:
            person = db.document(f"people/{person_id}").get()
            payload["status"] = "recognized"
            payload["person"] = {"id": person_id, **(person.to_dict() if person.exists else {})}
            payload["encounter"] = {"id": vector_id, "summary": doc.get("summary"), "timestamp": doc.get("timestamp")}
        else:
            payload["status"] = "candidate"
            payload["encounter"] = {"id": vector_id, "summary": doc.get("summary"), "timestamp": doc.get("timestamp")}
    else:
        payload["status"] = "unknown"

    return jsonify(payload), 200

# ---------- Vector Search Endpoints ----------
# Request JSON: { queryVector: [floats], numNeighbors?: int, filters?: {...}, uid?: "..." }
# Response JSON: { results: [{ vectorId, distance, metadata }] }
@app.route("/search", methods=["POST"])
def search_vectors():
    data = request.get_json(force=True, silent=True) or {}
    query_vector = data.get("queryVector")
    num_neighbors = int(data.get("numNeighbors", 10))
    filters = data.get("filters", {}) or {}
    uid = data.get("uid")

    if not isinstance(query_vector, list) or len(query_vector) != 128:
        return jsonify({"error": "queryVector must be a list of 128 numbers"}), 400

    try:
        init_vertex()
        results = find_neighbors(
            query_vector, num_neighbors=num_neighbors,
            filters=filters, uid=uid
        )  # returns [{ "vectorId", "distance" }]
        # You can add similarity here if you like:
        for r in results:
            r["similarity"] = 1.0 - float(r["distance"])
        return jsonify({"results": results}), 200
    except Exception as e:
        return jsonify({"error": f"Search failed: {e}"}), 500


# # Request JSON: { queryVector: [floats], numNeighbors?: int, uid?: "...", sessionId?: "..." }
# # Response JSON: { results: [{ vectorId, distance, uid, sessionId, metadata, ... }] }
# @app.route("/searchFaces", methods=["POST"])
# def search_faces():
#     data = request.get_json(force=True, silent=True) or {}
#     query_vector = data.get("queryVector")
#     num_neighbors = data.get("numNeighbors", 10)
#     uid = data.get("uid")
#     session_id = data.get("sessionId")

#     if not query_vector or not isinstance(query_vector, list):
#         return jsonify({"error": "queryVector is required and must be a list of floats"}), 400

#     try:
#         # Get Firebase clients
#         db, _, _ = get_firebase_clients()
#         if db is None:
#             return jsonify({"error": "Firebase initialization failed"}), 500

#         # Initialize Vertex AI
#         init_vertex()
        
#         # Perform the face search with Firestore enrichment
#         results = find_similar_faces(
#             db=db,
#             query_vector=query_vector,
#             num_neighbors=num_neighbors,
#             uid=uid,
#             session_id=session_id
#         )
        
#         return jsonify({"results": results}), 200
        
#     except Exception as e:
#         return jsonify({"error": f"Face search failed: {str(e)}"}), 500

# # Request JSON: { identityId: "...", numResults?: int, uid?: "..." }
# # Response JSON: { results: [{ vectorId, uid, sessionId, metadata, ... }] }
# @app.route("/searchByIdentity", methods=["POST"])
# def search_by_identity():
#     data = request.get_json(force=True, silent=True) or {}
#     identity_id = data.get("identityId")
#     num_results = data.get("numResults", 10)
#     uid = data.get("uid")

#     if not identity_id:
#         return jsonify({"error": "identityId is required"}), 400

#     try:
#         # Get Firebase clients
#         db, _, _ = get_firebase_clients()
#         if db is None:
#             return jsonify({"error": "Firebase initialization failed"}), 500

#         # Import the function here to avoid circular imports
#         from services.nearest_neighbor import search_by_identity
        
#         # Search for faces by identity
#         results = search_by_identity(
#             db=db,
#             identity_id=identity_id,
#             num_neighbors=num_results,
#             uid=uid
#         )
        
#         return jsonify({"results": results}), 200
        
#     except Exception as e:
#         return jsonify({"error": f"Identity search failed: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
