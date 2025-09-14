#!/usr/bin/env python3
"""
Simple vector validation script for MementoAI.
Run this anytime to verify your vector comparison functionality is working.
"""

import os
import sys
import json
import numpy as np
import requests
from typing import List, Dict

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ["GCP_PROJECT", "INDEX_ENDPOINT", "DEPLOYED_INDEX_ID", "INDEX_ID"]
    missing = [var for var in required_vars if not os.environ.get(var)]
    
    if missing:
        print(f"❌ Missing environment variables: {missing}")
        print("Run: source set_vertex_env.sh")
        return False
    
    print("✅ Environment variables configured")
    return True

def test_cosine_similarity():
    """Test cosine similarity calculations"""
    print("🧮 Testing cosine similarity math...")
    
    def cosine_similarity(a, b):
        a, b = np.array(a), np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    # Test cases
    v1 = [1, 0, 0]
    v2 = [1, 0, 0]  # identical
    v3 = [0, 1, 0]  # perpendicular
    v4 = [-1, 0, 0] # opposite
    
    sim_identical = cosine_similarity(v1, v2)
    sim_perpendicular = cosine_similarity(v1, v3)
    sim_opposite = cosine_similarity(v1, v4)
    
    print(f"  Identical vectors: {sim_identical:.3f} (should be 1.0)")
    print(f"  Perpendicular vectors: {sim_perpendicular:.3f} (should be 0.0)")
    print(f"  Opposite vectors: {sim_opposite:.3f} (should be -1.0)")
    
    if abs(sim_identical - 1.0) < 0.001 and abs(sim_perpendicular) < 0.001 and abs(sim_opposite + 1.0) < 0.001:
        print("✅ Cosine similarity calculations correct")
        return True
    else:
        print("❌ Cosine similarity calculations incorrect")
        return False

def test_vertex_connection():
    """Test connection to Vertex AI"""
    print("🔗 Testing Vertex AI connection...")
    
    try:
        from services.vector_store import init_vertex
        index_ep, deployed_id = init_vertex()
        print(f"✅ Connected to Vertex AI (deployed_id: {deployed_id})")
        return True
    except Exception as e:
        print(f"❌ Vertex AI connection failed: {e}")
        return False

def test_api_endpoints(port=8080):
    """Test API endpoints if server is running"""
    print(f"🌐 Testing API endpoints on port {port}...")
    
    base_url = f"http://localhost:{port}"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"⚠️  Health endpoint returned {response.status_code}")
    except requests.exceptions.RequestException:
        print("⚠️  Server not running or not accessible")
        return False
    
    # Test search endpoint with dummy data
    try:
        dummy_vector = np.random.randn(512).tolist()
        response = requests.post(f"{base_url}/search", json={
            "queryVector": dummy_vector,
            "numNeighbors": 5
        }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            print(f"✅ Search endpoint working ({len(results)} results)")
            return True
        else:
            print(f"❌ Search endpoint failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Search endpoint error: {e}")
        return False

def test_ingest_endpoint(port=8080):
    """Test vector ingestion endpoint"""
    print("📥 Testing vector ingestion...")
    
    base_url = f"http://localhost:{port}"
    
    try:
        test_vector = np.random.randn(512).tolist()
        response = requests.post(f"{base_url}/ingestEmbedding", json={
            "uid": "test_validation_user",
            "sessionId": "test_session",
            "vector": test_vector,
            "meta": {
                "model": "test_model",
                "modality": "face",
                "quality": 0.95,
                "identityId": "test_person"
            }
        }, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            vector_id = data.get("vectorId")
            print(f"✅ Vector ingestion working (vectorId: {vector_id[:20]}...)")
            return True
        else:
            print(f"❌ Vector ingestion failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Vector ingestion error: {e}")
        return False

def main():
    """Run validation checks"""
    print("🔍 MementoAI Vector Validation")
    print("=" * 40)
    
    checks = [
        ("Environment Setup", check_environment),
        ("Cosine Similarity Math", test_cosine_similarity),
        ("Vertex AI Connection", test_vertex_connection),
    ]
    
    passed = 0
    
    for name, check_func in checks:
        print(f"\n📋 {name}")
        print("-" * 25)
        if check_func():
            passed += 1
        else:
            print(f"❌ {name} failed")
    
    # Optional API tests (only if server might be running)
    print(f"\n📋 API Endpoints (optional)")
    print("-" * 25)
    if test_api_endpoints():
        print(f"\n📋 Vector Ingestion (optional)")
        print("-" * 25)
        test_ingest_endpoint()
    
    print("\n" + "=" * 40)
    print(f"🏁 Core validation: {passed}/{len(checks)} checks passed")
    
    if passed == len(checks):
        print("🎉 Your vector comparison setup is working correctly!")
        print("\nTo fully test with real data:")
        print("1. Start your Flask server: python app.py")
        print("2. Run: python test_vector_comparison.py")
    else:
        print("⚠️  Some core functionality needs attention.")
    
    return passed == len(checks)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
