# services/vector_store.py
import os, hashlib, struct
from typing import Dict, List, Optional, Tuple
from google.cloud import aiplatform, firestore

# ---- Env ----
_GCP_PROJECT       = os.environ.get("GCP_PROJECT")
_GCP_LOCATION      = os.environ.get("GCP_LOCATION", "us-central1")
_INDEX_ENDPOINT    = os.environ.get("INDEX_ENDPOINT")        # projects/.../indexEndpoints/...
_DEPLOYED_INDEX_ID = os.environ.get("DEPLOYED_INDEX_ID")     # e.g., faces_prod
_INDEX_ID          = os.environ.get("INDEX_ID")              # numeric index id

# ---- Lazy singletons ----
_INDEX_EP: Optional[aiplatform.MatchingEngineIndexEndpoint] = None
_INDEX_OBJ: Optional[aiplatform.MatchingEngineIndex] = None

def init_vertex() -> Tuple[aiplatform.MatchingEngineIndexEndpoint, str]:
    """Init Vertex clients lazily (endpoint for queries, index for upserts)."""
    global _INDEX_EP, _INDEX_OBJ
    if not (_GCP_PROJECT and _INDEX_ENDPOINT and _DEPLOYED_INDEX_ID):
        raise RuntimeError("Missing GCP_PROJECT / INDEX_ENDPOINT / DEPLOYED_INDEX_ID")
    aiplatform.init(project=_GCP_PROJECT, location=_GCP_LOCATION)
    if _INDEX_EP is None:
        _INDEX_EP = aiplatform.MatchingEngineIndexEndpoint(index_endpoint_name=_INDEX_ENDPOINT)
    if _INDEX_OBJ is None:
        if not _INDEX_ID:
            raise RuntimeError("Missing INDEX_ID env var (for streaming upserts)")
        _INDEX_OBJ = aiplatform.MatchingEngineIndex(
            index_name=f"projects/{_GCP_PROJECT}/locations/{_GCP_LOCATION}/indexes/{_INDEX_ID}"
        )
    return _INDEX_EP, _DEPLOYED_INDEX_ID

def _stable_vector_id(uid: str, session_id: str, vector: List[float], model: str = "", modality: str = "face") -> str:
    """Deterministic id for idempotency."""
    floats = [float(x) for x in vector]
    h = hashlib.sha256()
    h.update(uid.encode()); h.update(session_id.encode())
    if model: h.update(model.encode())
    if modality: h.update(modality.encode())
    h.update(struct.pack(f"{len(floats)}f", *floats))
    return f"vec_{uid}_{session_id}_{h.hexdigest()[:16]}"

def _restricts(meta: Dict) -> List[Dict]:
    """Filterable attributes for Vertex upserts/queries."""
    out = []
    for k in ("uid", "tenantId", "modality", "model"):
        v = meta.get(k)
        if v is not None:
            out.append({"namespace": k, "allow_list": [str(v)]})
    return out

def upsert_to_vertex(uid: str, session_id: str, vector: List[float], meta: Dict) -> str:
    """
    Stream-upsert one embedding into Vertex. Returns the vectorId used.
    - vector is expected 128-d (int or float), will be cast to float.
    - meta should include at least { "uid": uid, "modality": "face", "model": "face-128@v1" }.
    """
    init_vertex()
    meta = dict(meta or {})
    meta.setdefault("uid", uid)

    vector_id = _stable_vector_id(uid, session_id, vector, meta.get("model",""), meta.get("modality","face"))
    dp = {
        "datapoint_id": vector_id,
        "feature_vector": [float(x) for x in vector],
    }
    rs = _restricts(meta)
    if rs:
        dp["restricts"] = rs

    # Streaming upsert to the index
    _INDEX_OBJ.upsert_datapoints(datapoints=[dp])
    return vector_id

def write_embedding_doc(
    db: firestore.Client,
    *,
    vector_id: str,
    uid: str,
    tenant_id: Optional[str],
    encounter_path: Optional[str],
    model: str,
    modality: str,
    dim: int = 128,
    precision: str = "int",  # device sent ints; backend cast to float32
    person_id: Optional[str] = None
) -> str:
    """
    Create /embeddings/{vectorId} pointer doc (no floats).
    """
    doc = {
        "vectorId": vector_id,
        "store": "vertex",
        "indexEndpoint": _INDEX_ENDPOINT,
        "deployedIndexId": _DEPLOYED_INDEX_ID,
        "uid": uid,
        "tenantId": tenant_id,
        "encounterRef": db.document(encounter_path) if encounter_path else None,
        "modality": modality,
        "model": model,
        "dim": dim,
        "precision": precision,
        "personId": person_id,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    # Strip Nones to keep the doc lean
    doc = {k: v for k, v in doc.items() if v is not None}
    path = f"embeddings/{vector_id}"
    db.document(path).set(doc, merge=True)
    return path

# services/nearest_neighbor.py
from typing import Dict, List, Optional
from google.cloud import firestore
from .vector_store import init_vertex, _build_restricts

def find_neighbors(
    query_vector: List[float],
    num_neighbors: int = 10,
    filters: Optional[Dict] = None,
    uid: Optional[str] = None
) -> List[Dict]:
    """
    Compatible with google-cloud-aiplatform==1.113.0.
    Uses the "simple" signature: queries = [list_of_floats], num_neighbors=int, restricts=[dicts...]
    """
    try:
        index_ep, deployed_id = init_vertex()
        rs = _build_restricts(filters or {})
        if uid:
            rs.append({"namespace": "uid", "allow_list": [str(uid)]})

        # Old/simple signature: list of vectors, not nested dicts
        resp = index_ep.find_neighbors(
            deployed_index_id=deployed_id,
            queries=[[float(x) for x in query_vector]],
            num_neighbors=int(num_neighbors),
            restricts=rs or None,
        )

        out: List[Dict] = []
        if resp and len(resp) > 0:
            first = resp[0]
            # Handle both shapes across minor versions
            # 1) iterable of neighbor-like with .datapoint_id / .distance
            # 2) object with .neighbors list of items above
            neighbors = getattr(first, "neighbors", first)
            for n in neighbors:
                # Try a few attribute names defensively
                vid = getattr(getattr(n, "datapoint", None), "datapoint_id", None)
                if not vid:
                    vid = getattr(n, "datapoint_id", None) or getattr(n, "id", None)
                dist = getattr(n, "distance", None)
                if vid is None or dist is None:
                    continue
                out.append({"vectorId": vid, "distance": float(dist), "metadata": {}})
        return out
    except Exception as e:
        print(f"[find_nearest_neighbors] ERROR: {e}")
        return []

