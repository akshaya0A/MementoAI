#!/usr/bin/env python3
"""
Test API validation and concrete scoring integration
"""

import requests
import json

def test_api_validation():
    """Test API with different payloads to identify validation issues"""
    
    base_url = "http://localhost:8000"
    
    # Test 1: Minimal payload
    print("🧪 Test 1: Minimal payload")
    minimal_payload = {
        "candidate_id": "test-user",
        "data_sources": ["github"]
    }
    
    try:
        response = requests.post(f"{base_url}/process-candidate", json=minimal_payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 422:
            print(f"Validation Error: {response.json()}")
        else:
            print("✅ Minimal payload works")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Full payload
    print("\n🧪 Test 2: Full payload")
    full_payload = {
        "candidate_id": "nicolo-micheletti",
        "data_sources": ["github"],
        "include_social_media": True,
        "priority": "normal",
        "identifiers": {
            "github": "nic-olo"
        }
    }
    
    try:
        response = requests.post(f"{base_url}/process-candidate", json=full_payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 422:
            print(f"Validation Error: {response.json()}")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Scores: Innovation={data['extraordinary_index']['innovation_score']}")
        else:
            print(f"❌ Unexpected status: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Health check
    print("\n🧪 Test 3: Health check")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ API is healthy")
        else:
            print(f"❌ Health check failed: {response.text}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    test_api_validation()
