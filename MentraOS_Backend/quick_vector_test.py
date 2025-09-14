#!/usr/bin/env python3
"""
Quick vector comparison test - validates core functionality without full test suite.
Run this to quickly verify your vector search is working correctly.
"""

import os
import numpy as np
from typing import List
from services.vector_store import init_vertex
from services.nearest_neighbor import find_nearest_neighbors

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

def cosine_distance(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine distance (1 - cosine_similarity)"""
    return 1.0 - cosine_similarity(vec1, vec2)

def test_vector_math():
    """Test basic vector similarity calculations"""
    print("🧮 Testing vector similarity calculations...")
    
    # Create test vectors
    dim = 512
    base_vector = np.random.randn(dim)
    base_vector = base_vector / np.linalg.norm(base_vector)  # Normalize
    
    # Test cases
    identical_vector = base_vector.copy()
    similar_vector = base_vector + np.random.randn(dim) * 0.1
    similar_vector = similar_vector / np.linalg.norm(similar_vector)
    
    opposite_vector = -base_vector
    random_vector = np.random.randn(dim)
    random_vector = random_vector / np.linalg.norm(random_vector)
    
    # Calculate similarities
    tests = [
        ("Identical vectors", base_vector, identical_vector, 1.0),
        ("Similar vectors", base_vector, similar_vector, 0.9),
        ("Opposite vectors", base_vector, opposite_vector, -1.0),
        ("Random vectors", base_vector, random_vector, 0.0)
    ]
    
    print("\nSimilarity Test Results:")
    print("-" * 50)
    
    for name, vec1, vec2, expected in tests:
        similarity = cosine_similarity(vec1.tolist(), vec2.tolist())
        distance = cosine_distance(vec1.tolist(), vec2.tolist())
        
        print(f"{name}:")
        print(f"  Similarity: {similarity:.4f} (expected ~{expected:.1f})")
        print(f"  Distance: {distance:.4f}")
        
        # Check if result is reasonable
        if name == "Identical vectors" and similarity > 0.999:
            print("  ✅ PASS")
        elif name == "Similar vectors" and similarity > 0.8:
            print("  ✅ PASS")
        elif name == "Opposite vectors" and similarity < -0.8:
            print("  ✅ PASS")
        elif name == "Random vectors" and -0.3 < similarity < 0.3:
            print("  ✅ PASS")
        else:
            print("  ⚠️  Unexpected result")
        print()

def test_vertex_connection():
    """Test connection to Vertex AI"""
    print("🔗 Testing Vertex AI connection...")
    
    try:
        index_ep, deployed_id = init_vertex()
        print(f"✅ Successfully connected to Vertex AI")
        print(f"   Deployed Index ID: {deployed_id}")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Vertex AI: {e}")
        print("   Make sure environment variables are set:")
        print("   - GCP_PROJECT")
        print("   - INDEX_ENDPOINT") 
        print("   - DEPLOYED_INDEX_ID")
        return False

def test_search_functionality():
    """Test basic search functionality with dummy vector"""
    print("🔍 Testing search functionality...")
    
    # Create a random query vector
    query_vector = np.random.randn(512).tolist()
    
    try:
        results = find_nearest_neighbors(
            query_vector=query_vector,
            num_neighbors=5,
            filters={"modality": "face"}
        )
        
        print(f"✅ Search completed successfully")
        print(f"   Found {len(results)} results")
        
        if results:
            print("   Sample results:")
            for i, result in enumerate(results[:3]):
                vector_id = result.get('vector_id', 'unknown')
                distance = result.get('distance', 0)
                print(f"     {i+1}. Vector ID: {vector_id[:20]}..., Distance: {distance:.4f}")
        else:
            print("   No results found (this is normal if no vectors are indexed yet)")
        
        return True
        
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return False

def main():
    """Run quick vector tests"""
    print("🚀 Quick Vector Comparison Test")
    print("=" * 40)
    
    # Check environment
    required_vars = ["GCP_PROJECT", "INDEX_ENDPOINT", "DEPLOYED_INDEX_ID"]
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        print("Run: source set_vertex_env.sh")
        return False
    
    # Run tests
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Vector math
    test_vector_math()
    tests_passed += 1
    
    print("\n" + "=" * 40)
    
    # Test 2: Vertex connection
    if test_vertex_connection():
        tests_passed += 1
    
    print("\n" + "=" * 40)
    
    # Test 3: Search functionality
    if test_search_functionality():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 40)
    print(f"🏁 Quick Test Complete: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All basic tests passed! Your vector comparison setup looks good.")
    elif tests_passed >= 2:
        print("✅ Core functionality working. Some advanced features may need attention.")
    else:
        print("⚠️  Issues detected. Check configuration and try again.")
    
    return tests_passed >= 2

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
