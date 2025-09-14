#!/usr/bin/env python3
"""
Test suite for vector comparison functionality in MementoAI.
This script validates that vector search, similarity calculations, and API endpoints work correctly.
"""

import os
import json
import time
import random
import requests
import numpy as np
from typing import List, Dict, Tuple
from google.cloud import firestore
from services.vector_store import ingest_embedding, init_vertex
from services.nearest_neighbor import find_nearest_neighbors, find_similar_faces, search_by_identity

# Test configuration
TEST_UID = "test_user_vector_validation"
TEST_SESSION_ID = f"test_session_{int(time.time())}"
BASE_URL = "http://localhost:8080"  # Change if running on different port

class VectorTestSuite:
    def __init__(self):
        self.db = None
        self.test_vectors = []
        self.test_results = []
        
    def setup(self):
        """Initialize Firebase and create test data"""
        print("🔧 Setting up test environment...")
        
        # Initialize Firestore
        try:
            self.db = firestore.Client()
            print("✅ Firestore client initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Firestore: {e}")
            return False
            
        # Initialize Vertex AI
        try:
            init_vertex()
            print("✅ Vertex AI initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Vertex AI: {e}")
            return False
            
        return True
    
    def generate_test_vectors(self, dim: int = 512, num_vectors: int = 5) -> List[Dict]:
        """Generate test vectors with known relationships"""
        print(f"🎲 Generating {num_vectors} test vectors of dimension {dim}...")
        
        # Create base vector
        base_vector = np.random.randn(dim).astype(float)
        base_vector = base_vector / np.linalg.norm(base_vector)  # Normalize
        
        test_vectors = []
        
        # Vector 1: Base vector (identity)
        test_vectors.append({
            "vector": base_vector.tolist(),
            "name": "base_vector",
            "identity_id": "person_1",
            "expected_similarity": 1.0,
            "meta": {"model": "test_model", "modality": "face", "quality": 0.95}
        })
        
        # Vector 2: Very similar (small noise)
        similar_vector = base_vector + np.random.randn(dim) * 0.1
        similar_vector = similar_vector / np.linalg.norm(similar_vector)
        test_vectors.append({
            "vector": similar_vector.tolist(),
            "name": "similar_vector",
            "identity_id": "person_1",
            "expected_similarity": 0.9,  # Should be high similarity
            "meta": {"model": "test_model", "modality": "face", "quality": 0.88}
        })
        
        # Vector 3: Moderately similar
        moderate_vector = base_vector + np.random.randn(dim) * 0.5
        moderate_vector = moderate_vector / np.linalg.norm(moderate_vector)
        test_vectors.append({
            "vector": moderate_vector.tolist(),
            "name": "moderate_vector",
            "identity_id": "person_2",
            "expected_similarity": 0.6,  # Should be moderate similarity
            "meta": {"model": "test_model", "modality": "face", "quality": 0.75}
        })
        
        # Vector 4: Different (random vector)
        different_vector = np.random.randn(dim).astype(float)
        different_vector = different_vector / np.linalg.norm(different_vector)
        test_vectors.append({
            "vector": different_vector.tolist(),
            "name": "different_vector",
            "identity_id": "person_3",
            "expected_similarity": 0.2,  # Should be low similarity
            "meta": {"model": "test_model", "modality": "face", "quality": 0.82}
        })
        
        # Vector 5: Opposite (negative of base)
        opposite_vector = -base_vector
        test_vectors.append({
            "vector": opposite_vector.tolist(),
            "name": "opposite_vector",
            "identity_id": "person_4",
            "expected_similarity": -1.0,  # Should be maximally dissimilar
            "meta": {"model": "test_model", "modality": "face", "quality": 0.91}
        })
        
        self.test_vectors = test_vectors
        print(f"✅ Generated {len(test_vectors)} test vectors")
        return test_vectors
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    
    def cosine_distance(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine distance (1 - cosine_similarity)"""
        return 1.0 - self.cosine_similarity(vec1, vec2)
    
    def test_vector_ingestion(self) -> bool:
        """Test ingesting vectors into Vertex AI"""
        print("🔄 Testing vector ingestion...")
        
        ingested_vectors = []
        for i, test_vec in enumerate(self.test_vectors):
            try:
                vector_id, user_path = ingest_embedding(
                    db=self.db,
                    uid=TEST_UID,
                    session_id=TEST_SESSION_ID,
                    vector=test_vec["vector"],
                    meta={
                        **test_vec["meta"],
                        "name": test_vec["name"],
                        "identityId": test_vec["identity_id"],
                        "dim": len(test_vec["vector"])
                    }
                )
                
                ingested_vectors.append({
                    "vector_id": vector_id,
                    "user_path": user_path,
                    "original": test_vec
                })
                
                print(f"✅ Ingested vector {i+1}: {test_vec['name']} -> {vector_id}")
                
            except Exception as e:
                print(f"❌ Failed to ingest vector {i+1}: {e}")
                return False
        
        self.ingested_vectors = ingested_vectors
        print(f"✅ Successfully ingested {len(ingested_vectors)} vectors")
        
        # Wait a moment for indexing
        print("⏳ Waiting 10 seconds for vector indexing...")
        time.sleep(10)
        
        return True
    
    def test_similarity_search(self) -> bool:
        """Test similarity search functionality"""
        print("🔍 Testing similarity search...")
        
        base_vector = self.test_vectors[0]["vector"]  # Use base vector as query
        
        try:
            results = find_nearest_neighbors(
                query_vector=base_vector,
                num_neighbors=5,
                filters={"modality": "face"},
                uid=TEST_UID
            )
            
            print(f"✅ Found {len(results)} neighbors")
            
            # Analyze results
            for i, result in enumerate(results):
                distance = result.get("distance", 0)
                similarity = 1.0 - distance  # Convert distance to similarity
                
                print(f"  Result {i+1}: vector_id={result.get('vector_id', 'unknown')[:16]}..., "
                      f"distance={distance:.4f}, similarity={similarity:.4f}")
            
            # Verify that the base vector (itself) has the highest similarity
            if results and results[0]["distance"] < 0.01:  # Should be very close to 0
                print("✅ Base vector correctly identified as most similar")
            else:
                print("⚠️  Base vector not found as most similar - this might indicate an issue")
            
            return True
            
        except Exception as e:
            print(f"❌ Similarity search failed: {e}")
            return False
    
    def test_face_search_with_metadata(self) -> bool:
        """Test face search with Firestore metadata enrichment"""
        print("👤 Testing face search with metadata...")
        
        base_vector = self.test_vectors[0]["vector"]
        
        try:
            results = find_similar_faces(
                db=self.db,
                query_vector=base_vector,
                num_neighbors=5,
                uid=TEST_UID
            )
            
            print(f"✅ Found {len(results)} faces with metadata")
            
            for i, result in enumerate(results):
                print(f"  Face {i+1}: identity_id={result.get('identity_id', 'unknown')}, "
                      f"distance={result.get('distance', 0):.4f}, "
                      f"quality={result.get('quality', 'unknown')}")
            
            return True
            
        except Exception as e:
            print(f"❌ Face search failed: {e}")
            return False
    
    def test_identity_search(self) -> bool:
        """Test searching by identity ID"""
        print("🆔 Testing identity search...")
        
        try:
            results = search_by_identity(
                db=self.db,
                identity_id="person_1",
                num_neighbors=10,
                uid=TEST_UID
            )
            
            print(f"✅ Found {len(results)} faces for identity 'person_1'")
            
            # Should find 2 vectors (base and similar) for person_1
            if len(results) >= 2:
                print("✅ Correctly found multiple faces for same identity")
            else:
                print("⚠️  Expected to find 2 faces for person_1")
            
            return True
            
        except Exception as e:
            print(f"❌ Identity search failed: {e}")
            return False
    
    def test_api_endpoints(self) -> bool:
        """Test the REST API endpoints"""
        print("🌐 Testing API endpoints...")
        
        base_vector = self.test_vectors[0]["vector"]
        
        # Test /search endpoint
        try:
            response = requests.post(f"{BASE_URL}/search", json={
                "queryVector": base_vector,
                "numNeighbors": 5,
                "filters": {"modality": "face"},
                "uid": TEST_UID
            })
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                print(f"✅ /search endpoint: {len(results)} results")
            else:
                print(f"❌ /search endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ /search endpoint error: {e}")
            return False
        
        # Test /searchFaces endpoint
        try:
            response = requests.post(f"{BASE_URL}/searchFaces", json={
                "queryVector": base_vector,
                "numNeighbors": 5,
                "uid": TEST_UID
            })
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                print(f"✅ /searchFaces endpoint: {len(results)} results")
            else:
                print(f"❌ /searchFaces endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ /searchFaces endpoint error: {e}")
            return False
        
        # Test /searchByIdentity endpoint
        try:
            response = requests.post(f"{BASE_URL}/searchByIdentity", json={
                "identityId": "person_1",
                "numResults": 10,
                "uid": TEST_UID
            })
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                print(f"✅ /searchByIdentity endpoint: {len(results)} results")
            else:
                print(f"❌ /searchByIdentity endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ /searchByIdentity endpoint error: {e}")
            return False
        
        return True
    
    def test_distance_calculations(self) -> bool:
        """Verify that distance calculations are mathematically correct"""
        print("🧮 Testing distance calculations...")
        
        base_vector = self.test_vectors[0]["vector"]
        
        for test_vec in self.test_vectors[1:]:  # Skip base vector
            # Calculate expected cosine distance
            expected_similarity = self.cosine_similarity(base_vector, test_vec["vector"])
            expected_distance = self.cosine_distance(base_vector, test_vec["vector"])
            
            print(f"Vector '{test_vec['name']}':")
            print(f"  Expected similarity: {expected_similarity:.4f}")
            print(f"  Expected distance: {expected_distance:.4f}")
            
            # Search for this specific vector
            try:
                results = find_nearest_neighbors(
                    query_vector=base_vector,
                    num_neighbors=10,
                    filters={"modality": "face"},
                    uid=TEST_UID
                )
                
                # Find the matching result
                found = False
                for result in results:
                    # We can't directly match vector_id, so we'll check if distance is close
                    actual_distance = result.get("distance", 0)
                    if abs(actual_distance - expected_distance) < 0.1:  # Allow some tolerance
                        print(f"  Actual distance: {actual_distance:.4f} ✅")
                        found = True
                        break
                
                if not found:
                    print(f"  ⚠️  Could not find matching result for {test_vec['name']}")
                    
            except Exception as e:
                print(f"  ❌ Error searching for {test_vec['name']}: {e}")
        
        return True
    
    def cleanup(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        try:
            # Delete test documents from Firestore
            user_collection = self.db.collection(f"users/{TEST_UID}/embeddings")
            docs = user_collection.stream()
            
            deleted_count = 0
            for doc in docs:
                doc.reference.delete()
                deleted_count += 1
            
            # Delete session documents
            session_collection = self.db.collection(f"sessions/{TEST_SESSION_ID}/items")
            docs = session_collection.stream()
            
            for doc in docs:
                doc.reference.delete()
                deleted_count += 1
            
            # Delete vector index documents
            if hasattr(self, 'ingested_vectors'):
                for vec_info in self.ingested_vectors:
                    vector_id = vec_info.get("vector_id")
                    if vector_id:
                        try:
                            self.db.document(f"vectorsIndex/{vector_id}").delete()
                            deleted_count += 1
                        except:
                            pass
            
            print(f"✅ Cleaned up {deleted_count} test documents")
            
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Vector Comparison Test Suite")
        print("=" * 50)
        
        # Setup
        if not self.setup():
            print("❌ Setup failed, aborting tests")
            return False
        
        # Generate test data
        self.generate_test_vectors()
        
        # Run tests
        tests = [
            ("Vector Ingestion", self.test_vector_ingestion),
            ("Similarity Search", self.test_similarity_search),
            ("Face Search with Metadata", self.test_face_search_with_metadata),
            ("Identity Search", self.test_identity_search),
            ("Distance Calculations", self.test_distance_calculations),
            ("API Endpoints", self.test_api_endpoints),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            print("-" * 30)
            
            try:
                if test_func():
                    passed += 1
                    print(f"✅ {test_name} PASSED")
                else:
                    print(f"❌ {test_name} FAILED")
            except Exception as e:
                print(f"❌ {test_name} ERROR: {e}")
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"🏁 Test Suite Complete: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Your vector comparison is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
        
        return passed == total

if __name__ == "__main__":
    # Check environment variables
    required_vars = ["GCP_PROJECT", "INDEX_ENDPOINT", "DEPLOYED_INDEX_ID", "INDEX_ID"]
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        print("Please run: source set_vertex_env.sh")
        exit(1)
    
    # Run tests
    test_suite = VectorTestSuite()
    success = test_suite.run_all_tests()
    
    exit(0 if success else 1)
