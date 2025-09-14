# app.py
import os, time
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import firestore, storage as fa_storage
from google.cloud import storage as gcs
from services.vector_store import ingest_embedding, init_vertex
from services.nearest_neighbor import find_nearest_neighbors, find_similar_faces



# ---- Init Flask first ----
app = Flask(__name__)

# Global variables for lazy initialization
_db = None
_bucket = None
_gcs_client = None

def get_firebase_clients():
    """Initialize Firebase clients lazily"""
    global _db, _bucket, _gcs_client
    
    if _db is None:
        try:
            # Check for BUCKET env var only when needed
            bucket_name = os.environ.get("BUCKET")
            if not bucket_name:
                raise RuntimeError("Missing BUCKET env var (e.g., mementoai-ed5d8.firebasestorage.app)")
            
            if not firebase_admin._apps:
                firebase_admin.initialize_app(options={"storageBucket": bucket_name})
            _db = firestore.client()
            _bucket = fa_storage.bucket()
            _gcs_client = gcs.Client()
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            # Return None clients to prevent crashes
            return None, None, None
    
    return _db, _bucket, _gcs_client

# ---------- Health ----------
@app.route("/", methods=["GET"])
def root():
    return "MementoAI Backend is running", 200

@app.route("/healthz", methods=["GET", "HEAD"])
@app.route("/health", methods=["GET", "HEAD"])
@app.route("/_ah/health", methods=["GET", "HEAD"])  # GCP convention
def healthz():
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

# ---------- Ingest numeric arrays (e.g., 128-dim embeddings) ----------
# Request JSON: { uid, sessionId, itemType: "embedding"|..., vector: [floats], meta?: {...} }
# Response JSON: { ok, itemId }
@app.route("/ingestArray", methods=["POST"])
def ingest_array():
    data = request.get_json(force=True, silent=True) or {}
    uid = data.get("uid")
    session_id = data.get("sessionId")
    item_type = data.get("itemType", "embedding")
    vector = data.get("vector")
    meta = data.get("meta", {})

    if not uid or not session_id or vector is None:
        return jsonify({"error": "uid, sessionId, and vector are required"}), 400
    if not isinstance(vector, list):
        return jsonify({"error": "vector must be a list (e.g., 128 floats)"}), 400

    # Get Firebase clients lazily
    db, bucket, gcs_client = get_firebase_clients()

    ts = int(time.time() * 1000)
    doc = {
        "uid": uid,
        "sessionId": session_id,
        "itemType": item_type,
        "vector": vector,
        "meta": meta,
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    db.document(f"sessions/{session_id}/items/{ts}").set(doc, merge=True)

    return jsonify({"ok": True, "itemId": str(ts)}), 200

# ---------- Audio ingestion for Meta glasses ----------
# Request JSON: { uid, sessionId, timestamp, transcript?, skills?, location, nextSteps?, confidence?, summary, contactInfo? }
@app.route("/ingestAudio", methods=["POST"])
def ingest_array():
    data = request.get_json(force=True, silent=True) or {}
    uid        = data.get("uid")
    session_id = data.get("sessionId")
    item_type  = data.get("itemType", "embedding")
    vector     = data.get("vector")
    meta       = data.get("meta", {})
    name       = data.get("name")  # Optional name parameter
    
    # Add name to meta if provided
    if name:
        meta["name"] = name

    if not uid or not session_id or vector is None:
        return jsonify({"error": "uid, sessionId, and vector are required"}), 400
    if not isinstance(vector, list):
        return jsonify({"error": "vector must be a list (e.g., 128/256/512 floats)"}), 400

    # Optional: dimension sanity
    dim = meta.get("dim")
    if dim is not None and isinstance(dim, int) and dim != len(vector):
        return jsonify({"error": f"vector dimension mismatch: got {len(vector)}, expected {dim}"}), 400

    # Get Firebase clients lazily
    db, _, _ = get_firebase_clients()
    if db is None:
        return jsonify({"error": "Firebase initialization failed"}), 500

    # Ensure Vertex client is initialized (safe to call multiple times)
    try:
        init_vertex()
    except Exception as e:
        return jsonify({"error": f"Vertex init failed: {e}"}), 500

    # Upsert to Vertex + write pointer docs
    try:
        vector_id, user_path = ingest_embedding(
            db=db,
            uid=uid,
            session_id=session_id,
            vector=vector,
            meta=meta,
            item_type=item_type
        )
    except Exception as e:
        return jsonify({"error": f"ingest failed: {e}"}), 500

    return jsonify({"ok": True, "vectorId": vector_id, "path": user_path}), 200

# ---------- Vector Search Endpoints ----------
# Request JSON: { queryVector: [floats], numNeighbors?: int, filters?: {...}, uid?: "..." }
# Response JSON: { results: [{ vectorId, distance, metadata }] }
@app.route("/search", methods=["POST"])
def search_vectors():
    data = request.get_json(force=True, silent=True) or {}
    query_vector = data.get("queryVector")
    num_neighbors = data.get("numNeighbors", 10)
    filters = data.get("filters", {})
    uid = data.get("uid")

    if not query_vector or not isinstance(query_vector, list):
        return jsonify({"error": "queryVector is required and must be a list of floats"}), 400

    try:
        # Initialize Vertex AI
        init_vertex()
        
        # Perform the search
        results = find_nearest_neighbors(
            query_vector=query_vector,
            num_neighbors=num_neighbors,
            filters=filters,
            uid=uid
        )
        
        return jsonify({"results": results}), 200
        
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

# Request JSON: { queryVector: [floats], numNeighbors?: int, uid?: "...", sessionId?: "..." }
# Response JSON: { results: [{ vectorId, distance, uid, sessionId, metadata, ... }] }
@app.route("/searchFaces", methods=["POST"])
def search_faces():
    data = request.get_json(force=True, silent=True) or {}
    query_vector = data.get("queryVector")
    num_neighbors = data.get("numNeighbors", 10)
    uid = data.get("uid")
    session_id = data.get("sessionId")

    if not query_vector or not isinstance(query_vector, list):
        return jsonify({"error": "queryVector is required and must be a list of floats"}), 400

    try:
        # Get Firebase clients
        db, _, _ = get_firebase_clients()
        if db is None:
            return jsonify({"error": "Firebase initialization failed"}), 500

        # Initialize Vertex AI
        init_vertex()
        
        # Perform the face search with Firestore enrichment
        results = find_similar_faces(
            db=db,
            query_vector=query_vector,
            num_neighbors=num_neighbors,
            uid=uid,
            session_id=session_id
        )
        
        return jsonify({"results": results}), 200
        
    except Exception as e:
        return jsonify({"error": f"Face search failed: {str(e)}"}), 500

# Request JSON: { identityId: "...", numResults?: int, uid?: "..." }
# Response JSON: { results: [{ vectorId, uid, sessionId, metadata, ... }] }
@app.route("/searchByIdentity", methods=["POST"])
def search_by_identity():
    data = request.get_json(force=True, silent=True) or {}
    identity_id = data.get("identityId")
    num_results = data.get("numResults", 10)
    uid = data.get("uid")

    if not identity_id:
        return jsonify({"error": "identityId is required"}), 400

    try:
        # Get Firebase clients
        db, _, _ = get_firebase_clients()
        if db is None:
            return jsonify({"error": "Firebase initialization failed"}), 500

        # Import the function here to avoid circular imports
        from services.nearest_neighbor import search_by_identity
        
        # Search for faces by identity
        results = search_by_identity(
            db=db,
            identity_id=identity_id,
            num_neighbors=num_results,
            uid=uid
        )
        
        return jsonify({"results": results}), 200
        
    except Exception as e:
        return jsonify({"error": f"Identity search failed: {str(e)}"}), 500


# def ingest_audio():
#     data = request.get_json(force=True, silent=True) or {}
#     uid = data.get("uid")
#     session_id = data.get("sessionId")
#     timestamp = data.get("timestamp")  # Required
#     location = data.get("location")    # Required
#     summary = data.get("summary")      # Required
    
#     # Optional fields
#     transcript = data.get("transcript")
#     skills = data.get("skills")
#     next_steps = data.get("nextSteps")
#     confidence = data.get("confidence")
#     contact_info = data.get("contactInfo")

#     # Validate required fields
#     if not uid or not session_id:
#         return jsonify({"error": "uid and sessionId are required"}), 400
#     if not timestamp:
#         return jsonify({"error": "timestamp is required"}), 400
#     if not location:
#         return jsonify({"error": "location is required"}), 400
#     if not summary:
#         return jsonify({"error": "summary is required"}), 400

#     # Validate confidence is int if provided
#     if confidence is not None and not isinstance(confidence, int):
#         return jsonify({"error": "confidence must be an integer"}), 400

#     # Get Firebase clients lazily
#     db, bucket, gcs_client = get_firebase_clients()
#     if db is None:
#         return jsonify({"error": "Firebase initialization failed"}), 500

#     ts = int(time.time() * 1000)
#     doc = {
#         "uid": uid,
#         "sessionId": session_id,
#         "itemType": "audio_meta",
#         "timestamp": timestamp,
#         "location": location,
#         "summary": summary,
#         "createdAt": firestore.SERVER_TIMESTAMP
#     }
    
#     # Add optional fields if provided
#     if transcript:
#         doc["transcript"] = transcript
#     if skills:
#         doc["skills"] = skills
#     if next_steps:
#         doc["nextSteps"] = next_steps
#     if confidence is not None:
#         doc["confidence"] = confidence
#     if contact_info:
#         doc["contactInfo"] = contact_info
    
#     db.document(f"sessions/{session_id}/items/{ts}").set(doc, merge=True)

#     return jsonify({"ok": True, "itemId": str(ts)}), 200

# ---------- (Optional) Direct multipart ingest (if you want to proxy file uploads) ----------
# Glasses POST multipart: fields(uid, sessionId, itemType) + file=@/path/to/file
# Response JSON: { ok, storagePath, itemId }
@app.route("/ingest", methods=["POST"])
def ingest_multipart():
    uid = request.form.get("uid")
    session_id = request.form.get("sessionId")
    item_type = request.form.get("itemType", "unknown")
    file = request.files.get("file")

    if not uid or not session_id or not file:
        return jsonify({"error": "uid, sessionId and file are required"}), 400

    # Get Firebase clients lazily
    db, bucket, gcs_client = get_firebase_clients()

    ts = int(time.time() * 1000)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    storage_path = f"inputs/{uid}/{session_id}/{ts}.{ext}"
    content_type = file.mimetype or "application/octet-stream"

    blob = bucket.blob(storage_path)
    blob.upload_from_file(file.stream, content_type=content_type)

    db.document(f"sessions/{session_id}/items/{ts}").set({
        "uid": uid,
        "storagePath": storage_path,
        "status": "uploaded",
        "itemType": item_type,
        "contentType": content_type,
        "createdAt": firestore.SERVER_TIMESTAMP
    }, merge=True)

    return jsonify({"ok": True, "storagePath": storage_path, "itemId": str(ts)}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
