
#!/usr/bin/env python3
"""
Simple test script to debug the TRA API
"""

import requests
import json

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"Health Status: {response.status_code}")
        print(f"Health Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_process_candidate():
    """Test the process-candidate endpoint"""
    try:
        payload = {
            "candidate_id": "torvalds",
            "data_sources": ["github"],
            "include_social_media": True,
            "priority": "high"
        }
        
        print(f"Sending payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/process-candidate",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"Success Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error Response: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"Process candidate test failed: {e}")
        return False

if __name__ == "__main__":
    print("=== TRA API Test ===")
    
    print("\n1. Testing Health Endpoint...")
    health_ok = test_health()
    
    if health_ok:
        print("\n2. Testing Process Candidate Endpoint...")
        test_process_candidate()
    else:
        print("Health check failed, skipping candidate test")
