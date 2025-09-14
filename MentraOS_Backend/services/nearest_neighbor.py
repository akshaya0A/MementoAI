# services/nearest_neighbor.py
import os
from typing import Dict, List, Optional, Tuple
from google.cloud import aiplatform, firestore
from .vector_store import init_vertex, _build_restricts

def find_nearest_neighbors(
    query_vector: List[float],
    num_neighbors: int = 10,
    filters: Optional[Dict] = None,
    uid: Optional[str] = None
) -> List[Dict]:
    try:
        index_ep, deployed_id = init_vertex()

        restricts = _build_restricts(filters or {})
        if uid:
            restricts.append({"namespace": "uid", "allow_list": [uid]})

        resp = index_ep.find_neighbors(
            deployed_index_id=deployed_id,
            queries=[{
                "datapoint": {"feature_vector": [float(x) for x in query_vector]},
                "neighbor_count": int(num_neighbors),
                "restricts": restricts or None
            }]
        )

        out = []
        if resp and resp[0].neighbors:
            for n in resp[0].neighbors:
                out.append({
                    "vector_id": n.datapoint.datapoint_id,  # keep snake_case for your other funcs
                    "distance": n.distance,
                    "metadata": {}
                })
        return out
    except Exception as e:
        print(f"Error in find_nearest_neighbors: {str(e)}")
        return []


def find_similar_faces(
    db: firestore.Client,
    query_vector: List[float],
    num_neighbors: int = 10,
    uid: Optional[str] = None,
    session_id: Optional[str] = None
) -> List[Dict]:
    """
    Find similar face embeddings and enrich with Firestore metadata.
    
    Args:
        db: Firestore client
        query_vector: Face embedding vector
        num_neighbors: Number of similar faces to return
        uid: Optional user ID filter
        session_id: Optional session ID filter
    
    Returns:
        List of similar faces with full metadata from Firestore
    """
    try:
        # Search for similar vectors
        filters = {"modality": "face"}
        neighbors = find_nearest_neighbors(
            query_vector=query_vector,
            num_neighbors=num_neighbors,
            filters=filters,
            uid=uid
        )
        
        # Enrich with Firestore metadata
        enriched_results = []
        for neighbor in neighbors:
            vector_id = neighbor['vector_id']
            
            # Look up the full document in Firestore
            vector_doc = db.document(f"vectorsIndex/{vector_id}").get()
            if vector_doc.exists:
                vector_data = vector_doc.to_dict()
                user_path = vector_data.get('path')
                
                if user_path:
                    user_doc = db.document(user_path).get()
                    if user_doc.exists:
                        user_data = user_doc.to_dict()
                        
                        # Filter by session_id if provided
                        if session_id and user_data.get('sessionId') != session_id:
                            continue
                        
                        enriched_result = {
                            'vector_id': vector_id,
                            'distance': neighbor['distance'],
                            'uid': user_data.get('uid'),
                            'session_id': user_data.get('sessionId'),
                            'item_type': user_data.get('itemType'),
                            'model': user_data.get('model'),
                            'quality': user_data.get('quality'),
                            'identity_id': user_data.get('identityId'),
                            'tenant_id': user_data.get('tenantId'),
                            'created_at': user_data.get('createdAt'),
                            'metadata': user_data.get('meta', {}),
                            'firestore_path': user_path
                        }
                        enriched_results.append(enriched_result)
        
        return enriched_results
        
    except Exception as e:
        print(f"Error in find_similar_faces: {str(e)}")
        return []

def search_by_identity(
    db: firestore.Client,
    identity_id: str,
    num_neighbors: int = 10,
    uid: Optional[str] = None
) -> List[Dict]:
    """
    Search for faces of a specific identity.
    
    Args:
        db: Firestore client
        identity_id: The identity ID to search for
        num_neighbors: Number of results to return
        uid: Optional user ID filter
    
    Returns:
        List of matching faces for the identity
    """
    try:
        # Get all faces for this identity from Firestore
        query = db.collection_group('embeddings').where('identityId', '==', identity_id)
        if uid:
            query = query.where('uid', '==', uid)
        
        identity_docs = query.limit(num_neighbors).stream()
        results = []
        
        for doc in identity_docs:
            data = doc.to_dict()
            results.append({
                'vector_id': data.get('vectorId'),
                'distance': 0.0,  # Exact identity match
                'uid': data.get('uid'),
                'session_id': data.get('sessionId'),
                'item_type': data.get('itemType'),
                'model': data.get('model'),
                'quality': data.get('quality'),
                'identity_id': data.get('identityId'),
                'tenant_id': data.get('tenantId'),
                'created_at': data.get('createdAt'),
                'metadata': data.get('meta', {}),
                'firestore_path': doc.reference.path
            })
        
        return results
        
    except Exception as e:
        print(f"Error in search_by_identity: {str(e)}")
        return []
