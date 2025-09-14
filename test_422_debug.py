#!/usr/bin/env python3
"""
Debug 422 errors by testing various request scenarios
"""

import requests
import json
import time

def test_422_scenarios():
    """Test various scenarios that might cause 422 errors"""
    
    base_url = "http://localhost:8000"
    
    # Wait for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Test scenarios that might cause 422
    test_cases = [
        {
            "name": "Empty data_sources",
            "payload": {
                "candidate_id": "test-user",
                "data_sources": []
            }
        },
        {
            "name": "Invalid data source",
            "payload": {
                "candidate_id": "test-user",
                "data_sources": ["invalid_source"]
            }
        },
        {
            "name": "Missing candidate_id",
            "payload": {
                "data_sources": ["github"]
            }
        },
        {
            "name": "Invalid priority",
            "payload": {
                "candidate_id": "test-user",
                "data_sources": ["github"],
                "priority": "invalid_priority"
            }
        },
        {
            "name": "Invalid identifiers format",
            "payload": {
                "candidate_id": "test-user",
                "data_sources": ["github"],
                "identifiers": "invalid_format"  # Should be dict
            }
        },
        {
            "name": "Invalid include_social_media",
            "payload": {
                "candidate_id": "test-user",
                "data_sources": ["github"],
                "include_social_media": "invalid_boolean"  # Should be bool
            }
        },
        {
            "name": "Valid request",
            "payload": {
                "candidate_id": "test-user",
                "data_sources": ["github"],
                "include_social_media": True,
                "priority": "normal"
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['name']}")
        print(f"Payload: {json.dumps(test_case['payload'], indent=2)}")
        
        try:
            response = requests.post(f"{base_url}/process-candidate", json=test_case['payload'])
            print(f"Status: {response.status_code}")
            
            if response.status_code == 422:
                error_detail = response.json()
                print(f"❌ 422 Validation Error:")
                print(f"   {json.dumps(error_detail, indent=2)}")
            elif response.status_code == 200:
                data = response.json()
                print(f"✅ Success!")
                if 'extraordinary_index' in data:
                    scores = data['extraordinary_index']
                    print(f"   Innovation: {scores.get('innovation_score', 'N/A')}")
                    print(f"   Overall: {scores.get('overall_score', 'N/A')}")
            else:
                print(f"❌ Other error ({response.status_code}): {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection error - server not running")
            break
        except Exception as e:
            print(f"❌ Request error: {e}")

if __name__ == "__main__":
    test_422_scenarios()
