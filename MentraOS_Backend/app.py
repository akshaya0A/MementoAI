import os, time
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore, storage as fa_storage
from google.cloud import storage as gcs

# Cloud Run uses Workload Identity; no key file needed.
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        "storageBucket": os.environ.get("BUCKET")  # e.g. myproj.appspot.com
    })

db = firestore.client()
bucket = fa_storage.bucket()             # firebase-admin wrapper
gcs_client = gcs.Client()                # for signed URLs if you prefer google-cloud-storage

app = Flask(__name__)

@app.get("/healthz")
def health():
    return "ok", 200

@app.post("/mintUploadUrl")
def mint_upload_url():
    data = request.get_json(force=True, silent=True) or {}
    uid = data.get("uid")
    session_id = data.get("sessionId")
    ext = (data.get("ext") or "mp4").strip(".")
    content_type = data.get("contentType") or "video/mp4"
    if not uid or not session_id:
        return jsonify({"error": "uid, sessionId required"}), 400

    ts = int(time.time() * 1000)
    object_path = f"inputs/{uid}/{session_id}/{ts}.{ext}"

    # Signed URL (WRITE)
    blob = gcs_client.bucket(os.environ["BUCKET"]).blob(object_path)
    upload_url = blob.generate_signed_url(
        version="v4",
        expiration=600,                   # 10 minutes
        method="PUT",
        content_type=content_type,
    )

    # Pre-create Firestore doc
    db.document(f"sessions/{session_id}/items/{ts}").set({
        "uid": uid,
        "storagePath": object_path,
        "status": "uploading",
        "createdAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)

    return jsonify({"uploadUrl": upload_url, "storagePath": object_path, "itemId": str(ts)})

@app.post("/ingest")
def ingest():
    """Glasses POST multipart: fields(uid, sessionId, itemType), file=file"""
    uid = request.form.get("uid")
    session_id = request.form.get("sessionId")
    item_type = request.form.get("itemType", "unknown")
    file = request.files.get("file")
    if not uid or not session_id or not file:
        return jsonify({"error": "uid, sessionId, file required"}), 400

    ts = int(time.time() * 1000)
    # Derive extension from original filename (fallback to bin)
    ext = (file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin")
    storage_path = f"inputs/{uid}/{session_id}/{ts}.{ext}"

    # Stream upload to GCS (via firebase_admin bucket)
    blob = bucket.blob(storage_path)
    # Content-Type from werkzeug file if available
    content_type = file.mimetype or "application/octet-stream"
    blob.upload_from_file(file.stream, content_type=content_type)

    # Write metadata
    db.document(f"sessions/{session_id}/items/{ts}").set({
        "uid": uid,
        "storagePath": storage_path,
        "status": "uploaded",
        "itemType": item_type,
        "contentType": content_type,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)

    return jsonify({"ok": True, "storagePath": storage_path, "itemId": str(ts)}), 200
