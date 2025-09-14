# app.py
import os, time, datetime, hashlib
from typing import Optional, Tuple
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import firestore, storage as fa_storage
from google.cloud import storage as gcs
from google.cloud.firestore_v1 import GeoPoint

from services.vector_store import (
    init_vertex,
    upsert_to_vertex,
    write_embedding_doc,
    find_neighbors,
)

# ---- Flask ----
app = Flask(__name__)

# ---- Lazy Firebase/GCS singletons ----
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

# ---- Helpers ----
def _parse_timestamp(ts):
    """Accept epoch ms or seconds; return aware UTC datetime if parseable."""
    try:
        ts = float(ts)
        if ts > 10_000_000_000:  # ms
            ts /= 1000.0
        return datetime.datetime.utcfromtimestamp(ts).replace(tzinfo=datetime.timezone.utc)
    except Exception:
        return None

def _get_user_threshold(db, uid: str, fallback: float = 0.55) -> float:
    """Read users/{uid}.defaults.search.threshold if present."""
    try:
        d = db.document(f"users/{uid}").get()
        if d.exists:
            t = (((d.to_dict() or {}).get("defaults") or {}).get("search") or {}).get("threshold")
            if isinstance(t, (int, float)):
                return float(t)
    except Exception:
        pass
    return float(fallback)

def _cosine_similarity_from_distance(distance: float) -> float:
    """Vertex COSINE_DISTANCE ≈ 1 - cosine_similarity; clamp to [-1, 1]."""
    try:
        sim = 1.0 - float(distance)
        return max(-1.0, min(1.0, sim))
    except Exception:
        return 0.0

def _norm_email(email: Optional[str]) -> str:
    return (email or "").strip().lower()

def _person_id_for_user(uid: str, email: Optional[str], name_hint: Optional[str]) -> str:
    """
    Deterministic personId per user (avoid collisions across users).
    Prefer email hash; else fallback to name+uid hash.
    """
    if email:
        base = _norm_email(email)
        h = hashlib.sha1(base.encode()).hexdigest()[:10]
        return f"per_{uid}_{h}"
    base = (name_hint or "contact").strip().lower()
    h = hashlib.sha1(f"{uid}:{base}".encode()).hexdigest()[:10]
    return f"per_{uid}_{h}"

def _ensure_person_for_user(
    db: firestore.Client,
    *,
    uid: str,
    email: Optional[str] = None,
    display_name: Optional[str] = None,
    summary: Optional[str] = None
) -> Tuple[str, str]:
    """
    Idempotently create a person owned by this user. Returns (personId, docPath).
    - Only called from the audio route when enrollment is allowed.
    """
    pid = _person_id_for_user(uid, email, display_name)
    ref = db.document(f"people/{pid}")
    snap = ref.get()
    if not snap.exists:
        doc = {
            "displayName": display_name or (email or "Unknown"),
            "emails": [_norm_email(email)] if email else [],
            "summary": summary or "",
            "createdByUid": uid,
            "owners": { uid: True },  # optional shareable pattern
            "encounterCount": 0,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        ref.set(doc, merge=True)
    return pid, ref.path

# ---------- Health ----------
@app.route("/", methods=["GET"])
def root():
    return "MementoAI Backend is running", 200

@app.route("/health", methods=["GET", "HEAD"])
def health():
    return ("ok", 200, {"Content-Type": "text/plain"})

# ---------- Signed upload for media files (optional to keep) ----------
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

    db, bucket, gcs_client = get_firebase_clients()

    ts = int(time.time() * 1000)
    object_path = f"inputs/{uid}/{session_id}/{ts}.{ext}"

    blob = gcs_client.bucket(bucket.name).blob(object_path)
    upload_url = blob.generate_signed_url(
        version="v4", expiration=600, method="PUT", content_type=content_type
    )

    # (Legacy) Pre-create a status doc your client can watch
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

# ---------- Identify-only (embedding → name/summary if already linked) ----------
# JSON: { uid, vector:[128], k?:5, threshold?:number }
@app.route("/identifyEmbedding", methods=["POST"])
def identify_embedding():
    data = request.get_json(force=True, silent=True) or {}
    uid     = data.get("uid")
    vector  = data.get("vector")
    k       = int(data.get("k", 5))

    if not uid or not isinstance(vector, list) or len(vector) != 128:
        return jsonify({"error": "uid and vector(128) are required"}), 400

    db, _, _ = get_firebase_clients()
    thr = float(data.get("threshold", _get_user_threshold(db, uid, 0.55)))

    try:
        init_vertex()
        neighbors = find_neighbors(
            vector,
            num_neighbors=k,
            filters={"modality": "face", "model": "face-128@v1"},
            uid=uid
        )
    except Exception as e:
        return jsonify({"error": f"Vertex search failed: {e}"}), 500

    if not neighbors:
        return jsonify({"status": "unknown", "candidates": []}), 200

    best = min(neighbors, key=lambda n: n["distance"])
    best_vec_id = best["vectorId"]
    best_sim = _cosine_similarity_from_distance(best["distance"])

    # Recognized only if the best embedding is already linked to a person
    if best_sim >= thr:
        emb_doc = db.document(f"embeddings/{best_vec_id}").get()
        if emb_doc.exists:
            emb = emb_doc.to_dict()
            person_id = emb.get("personId")
            if person_id:
                p_doc = db.document(f"people/{person_id}").get()
                person = p_doc.to_dict() if p_doc.exists else {}
                person_out = {
                    "id": person_id,
                    "displayName": person.get("displayName"),
                    "summary": person.get("summary"),
                    "avatarUri": person.get("avatarUri"),
                    "company": person.get("company"),
                    "role": person.get("role"),
                }
                return jsonify({
                    "status": "recognized",
                    "person": person_out,
                    "confidence": best_sim,
                    "vectorId": best_vec_id
                }), 200

    # Not linked or below threshold → unknown (read-only endpoint)
    candidates = []
    for n in neighbors[:min(3, len(neighbors))]:
        candidates.append({
            "vectorId": n["vectorId"],
            "similarity": _cosine_similarity_from_distance(n["distance"])
        })
    return jsonify({
        "status": "unknown",
        "confidence": best_sim,
        "vectorId": best_vec_id,
        "candidates": candidates
    }), 200

# ---------- Ingest full encounter (writes + optional enroll with audio) ----------
# JSON:
# {
#   uid, sessionId, timestamp, location, gps:{lat,lng},
#   summary, transcript, rawTranscript,
#   confidence (int), nextSteps?, skills?, name?,
#   contactEmail?,      # only here can we create/link a person
#   vector? [128 ints]  # optional; if present we upsert & can auto-match
# }
@app.route("/ingestEncounter", methods=["POST"])
def ingest_encounter():
    data = request.get_json(force=True, silent=True) or {}

    # Required base fields
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

    # GPS (object form preferred)
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
    next_steps   = data.get("nextSteps")
    skills       = data.get("skills")
    name         = data.get("name")
    contact_email = _norm_email(data.get("contactEmail"))

    # Optional embedding (128 ints)
    vector = data.get("vector")
    if vector is not None and (not isinstance(vector, list) or len(vector) != 128):
        return jsonify({"error": "vector must be a list of 128 numbers"}), 400

    db, _, _ = get_firebase_clients()

    # Upsert vector if provided
    vector_id = None
    if vector is not None:
        try:
            init_vertex()
            meta = {"uid": uid, "modality": "face", "model": "face-128@v1"}
            vector_id = upsert_to_vertex(uid, session_id, vector, meta)
        except Exception as e:
            return jsonify({"error": f"Vertex upsert failed: {e}"}), 500

    # Prefer encounterId == vectorId when possible
    enc_id = vector_id or f"enc_{int(time.time()*1000)}"

    # Build encounter doc
    device_dt = _parse_timestamp(timestamp)
    encounter_doc = {
        "uid": uid,
        "sessionId": session_id,
        "timestamp": device_dt or timestamp,
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
    db.document(enc_path).set({k: v for k, v in encounter_doc.items() if v is not None}, merge=True)

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

    # ---- Auto-match if vector present: set recognized if best already linked to a person ----
    recognized = None
    sim_score = None
    if vector_id and vector is not None:
        thr = _get_user_threshold(db, uid, 0.55)
        try:
            neighbors = find_neighbors(
                vector,
                num_neighbors=5,
                filters={"modality": "face", "model": "face-128@v1"},
                uid=uid
            )
            if neighbors:
                best = min(neighbors, key=lambda n: n["distance"])
                sim = _cosine_similarity_from_distance(best["distance"])
                sim_score = sim
                if sim >= thr:
                    emb_doc = db.document(f"embeddings/{best['vectorId']}").get()
                    if emb_doc.exists:
                        emb = emb_doc.to_dict()
                        pid = emb.get("personId")
                        if pid:
                            # Mark encounter as recognized
                            db.document(enc_path).set({
                                "match": {"status": "recognized", "personId": pid, "score": sim}
                            }, merge=True)
                            recognized = pid
        except Exception as e:
            # Non-fatal; continue
            print(f"Auto-match error: {e}")

    # ---- Enrollment: only in audio flow, when contact info is supplied ----
    # If NOT recognized above, but we have contactEmail (or a confirmed name), create/link a person.
    if not recognized and (contact_email or name):
        try:
            person_id, _ = _ensure_person_for_user(
                db, uid=uid, email=contact_email or None, display_name=name or None, summary=None
            )
            # Link encounter
            db.document(enc_path).set({
                "match": {"status": "enrolled", "personId": person_id}
            }, merge=True)
            # Link embedding pointer too (if present)
            if vector_id:
                db.document(f"embeddings/{vector_id}").set({"personId": person_id}, merge=True)
            recognized = person_id
        except Exception as e:
            return jsonify({"error": f"Enrollment failed: {e}"}), 500

    resp = {"ok": True, "encounterId": enc_id, "vectorId": vector_id}
    if recognized:
        # Optionally include a tiny summary for immediate UI feedback
        p_doc = db.document(f"people/{recognized}").get()
        if p_doc.exists:
            p = p_doc.to_dict()
            resp["person"] = {
                "id": recognized,
                "displayName": p.get("displayName"),
                "summary": p.get("summary"),
                "avatarUri": p.get("avatarUri"),
                "company": p.get("company"),
                "role": p.get("role"),
            }
            if sim_score is not None:
                resp["confidence"] = sim_score

    return jsonify(resp), 200

# ---------- Debug: raw Vertex neighbors ----------
# JSON: { uid, queryVector:[128], numNeighbors?:10, filters? }
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
            query_vector,
            num_neighbors=num_neighbors,
            filters=filters,
            uid=uid
        )
        for r in results:
            r["similarity"] = _cosine_similarity_from_distance(r["distance"])
        return jsonify({"results": results}), 200
    except Exception as e:
        return jsonify({"error": f"Search failed: {e}"}), 500
    
    
# ---------- Bulk upsert embeddings ----------
# JSON (two forms):
# Simple: { uid, sessionId?, vectors:[[128]...], model?="face-128@v1", modality?="face", storeVector?:bool }
# Rich:   { uid, sessionId?, items:[{vector:[128], model?, modality?, meta?}...], storeVector?:bool }
@app.route("/bulkUpsertEmbeddings", methods=["POST"])
def bulk_upsert_embeddings():
    payload = request.get_json(force=True, silent=True) or {}
    uid = payload.get("uid")
    session_id = payload.get("sessionId") or f"bulk_{int(time.time()*1000)}"
    store_vector = bool(payload.get("storeVector", False))

    if not uid:
        return jsonify({"error": "uid is required"}), 400

    # Accept either `vectors` (list[list[128]]) or `items` (list[dict])
    vectors = payload.get("vectors")
    items = payload.get("items")
    default_model = payload.get("model") or "face-128@v1"
    default_modality = payload.get("modality") or "face"

    to_process = []
    if isinstance(items, list):
        for it in items:
            vec = (it or {}).get("vector")
            if not isinstance(vec, list) or len(vec) != 128:
                return jsonify({"error": "each items[i].vector must be a list of 128 numbers"}), 400
            to_process.append({
                "vector": vec,
                "model": it.get("model") or default_model,
                "modality": it.get("modality") or default_modality,
                "meta": (it.get("meta") or {})
            })
    elif isinstance(vectors, list):
        for vec in vectors:
            if not isinstance(vec, list) or len(vec) != 128:
                return jsonify({"error": "each vectors[i] must be a list of 128 numbers"}), 400
            to_process.append({
                "vector": vec,
                "model": default_model,
                "modality": default_modality,
                "meta": {}
            })
    else:
        return jsonify({"error": "Provide either `vectors` (list) or `items` (list)"}), 400

    db, _, _ = get_firebase_clients()

    try:
        init_vertex()
    except Exception as e:
        return jsonify({"error": f"Vertex init failed: {e}"}), 500

    vector_ids = []
    for entry in to_process:
        vec = entry["vector"]
        meta = {"uid": uid, "modality": entry["modality"], "model": entry["model"], **(entry["meta"] or {})}
        try:
            vector_id = upsert_to_vertex(uid, session_id, vec, meta)
            vector_ids.append(vector_id)

            # Minimal pointer doc
            write_embedding_doc(
                db,
                vector_id=vector_id,
                uid=uid,
                tenant_id=None,
                encounter_path=None,
                model=entry["model"],
                modality=entry["modality"],
                dim=128,
                precision="int"  # or "float" depending on your pipeline
            )

            # Optionally persist raw vector so GET can return it
            if store_vector:
                db.document(f"embeddings/{vector_id}").set({
                    "vector": vec,
                    "storedVector": True,
                    "updatedAt": firestore.SERVER_TIMESTAMP
                }, merge=True)

        except Exception as e:
            return jsonify({"error": f"Upsert failed for one vector: {e}"}), 500

    return jsonify({"ok": True, "count": len(vector_ids), "vectorIds": vector_ids}), 200

# ---------- List embedding metadata (optionally include stored vectors) ----------
# GET /embeddings?uid=...&limit=100&includeVector=true&pageToken=embeddings%2FABC123
@app.route("/embeddings", methods=["GET"])
def list_embeddings():
    uid = request.args.get("uid")
    include_vector = request.args.get("includeVector", "false").lower() == "true"
    try:
        limit = int(request.args.get("limit", 100))
    except ValueError:
        limit = 100
    limit = max(1, min(1000, limit))
    page_token = request.args.get("pageToken")  # expects a doc path or doc id

    db, _, _ = get_firebase_clients()

    coll = db.collection("embeddings")

    # Basic filtering
    if uid:
        q = coll.where("uid", "==", uid)
    else:
        q = coll

    # Ordering for stable pagination. Prefer createdAt; fall back to __name__
    # Not all docs may have createdAt; write_embedding_doc uses SERVER_TIMESTAMP
    # Use __name__ to keep it robust.
    q = q.order_by("__name__").limit(limit)

    # Pagination
    if page_token:
        try:
            # Allow either raw ID or full path
            if "/" in page_token:
                start_doc = db.document(page_token).get()
            else:
                start_doc = db.document(f"embeddings/{page_token}").get()
            if start_doc.exists:
                q = q.start_after(start_doc)
        except Exception:
            pass

    snaps = q.stream()
    items = []
    last_doc_id = None

    def _ts_to_iso(ts):
        try:
            # Firestore timestamp to ISO 8601 Z
            return ts.to_datetime().astimezone(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
        except Exception:
            return None

    for s in snaps:
        d = s.to_dict() or {}
        row = {
            "vectorId": s.id,
            "uid": d.get("uid"),
            "model": d.get("model"),
            "modality": d.get("modality"),
            "dim": d.get("dim"),
            "precision": d.get("precision"),
            "personId": d.get("personId"),
            "encounterPath": d.get("encounterPath"),
            "createdAt": _ts_to_iso(d.get("createdAt")) if d.get("createdAt") else None,
            "updatedAt": _ts_to_iso(d.get("updatedAt")) if d.get("updatedAt") else None,
        }
        if include_vector and d.get("storedVector"):
            # Only return if you chose to store it
            row["vector"] = d.get("vector")
        items.append(row)
        last_doc_id = s.id

    next_token = f"embeddings/{last_doc_id}" if last_doc_id and len(items) == limit else None

    return jsonify({"items": items, "nextPageToken": next_token}), 200


# ---------- Main ----------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
