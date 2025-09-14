# services/vector_store.py
import os, hashlib, struct
from typing import Dict, List, Optional, Tuple
from google.cloud import aiplatform, firestore

# ---- Env ----
_GCP_PROJECT       = os.environ.get("GCP_PROJECT")
_GCP_LOCATION      = os.environ.get("GCP_LOCATION", "us-central1")
_INDEX_ENDPOINT    = os.environ.get("INDEX_ENDPOINT")        # projects/.../indexEndpoints/...
_DEPLOYED_INDEX_ID = os.environ.get("DEPLOYED_INDEX_ID")     # e.g., faces-prod

# ---- Lazy singletons ----
_INDEX_EP = None

def init_vertex() -> Tuple[aiplatform.MatchingEngineIndexEndpoint, str]:
    """Lazily initialize Vertex Matching Engine index endpoint."""
    global _INDEX_EP
    if _INDEX_EP is None:
        if not (_GCP_PROJECT and _INDEX_ENDPOINT and _DEPLOYED_INDEX_ID):
            raise RuntimeError("Missing GCP_PROJECT / INDEX_ENDPOINT / DEPLOYED_INDEX_ID")
        aiplatform.init(project=_GCP_PROJECT, location=_GCP_LOCATION)
        _INDEX_EP = aiplatform.MatchingEngineIndexEndpoint(index_endpoint_name=_INDEX_ENDPOINT)
    return _INDEX_EP, _DEPLOYED_INDEX_ID

def _stable_vector_id(uid: str, session_id: str, vector: List[float], meta: Dict) -> str:
    """Deterministic id for idempotency."""
    floats = [float(x) for x in vector]
    h = hashlib.sha256()
    h.update(uid.encode()); h.update(session_id.encode())
    h.update(struct.pack(f"{len(floats)}f", *floats))
    if meta.get("model"):
        h.update(str(meta["model"]).encode())
    return f"vec_{uid}_{session_id}_{h.hexdigest()[:16]}"

def _build_restricts(meta: Dict) -> List[Dict]:
    """Optional filterable attributes for Vertex queries."""
    restricts = []
    if "modality" in meta: restricts.append({"namespace": "modality", "allow_list": [str(meta["modality"])]})
    if "model"    in meta: restricts.append({"namespace": "model",    "allow_list": [str(meta["model"])]})
    if "tenantId" in meta: restricts.append({"namespace": "tenantId", "allow_list": [str(meta["tenantId"])]})
    return restricts

def upsert_to_vertex(uid: str, session_id: str, vector: List[float], meta: Dict) -> str:
    """Upsert one datapoint into Vertex. Returns the vectorId used."""
    index_ep, deployed_id = init_vertex()
    vector_id = _stable_vector_id(uid, session_id, vector, meta)
    datapoint = {
        "datapoint_id": vector_id,
        "feature_vector": [float(x) for x in vector],
    }
    restricts = _build_restricts(meta)
    if restricts:
        datapoint["restricts"] = restricts
    # Get the index for upserting datapoints
    from google.cloud import aiplatform
    index = aiplatform.MatchingEngineIndex(
        index_name=f"projects/{os.environ.get('GCP_PROJECT')}/locations/{os.environ.get('GCP_LOCATION')}/indexes/{os.environ.get('INDEX_ID')}"
    )
    index.upsert_datapoints(datapoints=[datapoint])
    return vector_id

def write_pointer_docs(
    db: firestore.Client,
    uid: str,
    session_id: str,
    vector_id: str,
    item_type: str,
    meta: Dict
) -> str:
    """
    Write Firestore pointer under the user and a reverse index doc.
    Returns the Firestore user doc path.
    """
    dim = meta.get("dim")
    if not isinstance(dim, int):
        # if not provided, let it be filled by client or left None
        pass

    pointer_doc = {
        "uid": uid,
        "sessionId": session_id,
        "itemType": item_type,                 # 'embedding'
        "store": "vertex",
        "vectorId": vector_id,
        "indexEndpoint": _INDEX_ENDPOINT,
        "deployedIndexId": _DEPLOYED_INDEX_ID,
        "dim": dim,
        "model": meta.get("model"),
        "modality": meta.get("modality", "face"),
        "tenantId": meta.get("tenantId"),
        "identityId": meta.get("identityId"),
        "quality": meta.get("quality"),
        "meta": {k: v for k, v in meta.items() if k not in ("dim","model","modality","tenantId","identityId","quality")},
        "createdAt": firestore.SERVER_TIMESTAMP,
    }

    user_path = f"users/{uid}/embeddings/{vector_id}"
    db.document(user_path).set(pointer_doc, merge=True)

    # Reverse index for O(1) lookup by vectorId
    db.document(f"vectorsIndex/{vector_id}").set({
        "path": user_path,
        "uid": uid,
        "sessionId": session_id,
        "createdAt": firestore.SERVER_TIMESTAMP
    }, merge=True)

    return user_path

def ingest_embedding(
    db: firestore.Client,
    uid: str,
    session_id: str,
    vector: List[float],
    meta: Optional[Dict] = None,
    item_type: str = "embedding",
) -> Tuple[str, str]:
    """
    Orchestrates: upsert to Vertex + write Firestore pointers.
    Returns (vector_id, user_path).
    """
    meta = meta or {}
    vector_id = upsert_to_vertex(uid, session_id, vector, meta)
    user_path = write_pointer_docs(db, uid, session_id, vector_id, item_type, meta)
    return vector_id, user_path
