# services/nearest_neighbor.py
from typing import Dict, List, Optional
from google.cloud import firestore
from .vector_store import init_vertex, find_neighbors

def _sim_from_distance(distance: float) -> float:
    # assuming COSINE_DISTANCE (sim = 1 - dist)
    try:
        return 1.0 - float(distance)
    except Exception:
        return 0.0

def find_similar_faces(
    db: firestore.Client,
    query_vector: List[float],
    num_neighbors: int = 10,
    uid: Optional[str] = None,
    session_id: Optional[str] = None
) -> List[Dict]:
    """
    Vertex top-K, then enrich each neighbor from:
      /embeddings/{vectorId}  (pointer + uid/personId)
      /encounters/{vectorId}  (summary, timestamp, etc.)
    """
    # Query Vertex
    init_vertex()
    neighbors = find_neighbors(
        query_vector,
        num_neighbors=num_neighbors,
        filters={"modality": "face", "model": "face-128@v1"},
        uid=uid,
    )

    results: List[Dict] = []
    for n in neighbors:
        vector_id = n.get("vectorId") or n.get("vector_id")
        if not vector_id:
            continue

        emb_ref = db.document(f"embeddings/{vector_id}")
        emb_doc = emb_ref.get()
        if not emb_doc.exists:
            continue
        emb = emb_doc.to_dict()

        # Optional filters
        if uid and emb.get("uid") != uid:
            continue

        enc_ref = db.document(f"encounters/{vector_id}")
        enc_doc = enc_ref.get()
        enc = enc_doc.to_dict() if enc_doc.exists else {}

        if session_id and enc and enc.get("sessionId") != session_id:
            continue

        person_id = emb.get("personId")
        person = {}
        if person_id:
            p_doc = db.document(f"people/{person_id}").get()
            if p_doc.exists:
                person = {"id": person_id, **p_doc.to_dict()}

        distance = float(n["distance"])
        results.append({
            "vectorId": vector_id,
            "distance": distance,
            "similarity": _sim_from_distance(distance),
            "uid": emb.get("uid"),
            "person": person or None,
            "encounter": {
                "id": vector_id,
                "sessionId": enc.get("sessionId"),
                "summary": enc.get("summary"),
                "timestamp": enc.get("timestamp"),
                "location": enc.get("location"),
            } if enc else None,
            "paths": {
                "embedding": emb_ref.path,
                "encounter": enc_ref.path if enc else None,
            },
        })

    return results

def search_by_identity(
    db: firestore.Client,
    person_id: str,
    num_neighbors: int = 10,
    uid: Optional[str] = None
) -> List[Dict]:
    """
    List embeddings linked to a given person:
      query: /embeddings where personId == person_id (and optional uid)
      enrich with /encounters/{vectorId} and /people/{personId}
    """
    q = db.collection("embeddings").where("personId", "==", person_id)
    if uid:
        q = q.where("uid", "==", uid)
    q = q.limit(int(num_neighbors))

    person = {}
    p_doc = db.document(f"people/{person_id}").get()
    if p_doc.exists:
        person = {"id": person_id, **p_doc.to_dict()}

    results: List[Dict] = []
    for emb_doc in q.stream():
        emb = emb_doc.to_dict()
        vector_id = emb.get("vectorId") or emb_doc.id

        enc_ref = db.document(f"encounters/{vector_id}")
        enc_doc = enc_ref.get()
        enc = enc_doc.to_dict() if enc_doc.exists else {}

        results.append({
            "vectorId": vector_id,
            "uid": emb.get("uid"),
            "person": person or None,
            "encounter": {
                "id": vector_id,
                "sessionId": enc.get("sessionId"),
                "summary": enc.get("summary"),
                "timestamp": enc.get("timestamp"),
                "location": enc.get("location"),
            } if enc else None,
            "paths": {
                "embedding": emb_doc.reference.path,
                "encounter": enc_ref.path if enc else None,
            },
            # distance is not applicable here; this is a direct identity lookup
            "distance": 0.0,
            "similarity": 1.0,
        })

    return results
