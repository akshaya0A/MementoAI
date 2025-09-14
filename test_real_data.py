#!/usr/bin/env python3
"""
Test script with real GitHub data
"""

import requests
import json

def test_with_github():
    """Test with real GitHub data"""
    payload = {
        "candidate_id": "torvalds",
        "data_sources": ["github"],
        "include_social_media": True,
        "priority": "high"
    }
    
    print("🚀 Testing TRA with REAL GitHub data...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            "http://localhost:8000/process-candidate",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS! Real data processed:")
            print(f"📊 Extraordinary Index: {result['extraordinary_index']['overall_score']}")
            print(f"🎯 Actions Generated: {len(result['action_plan']['actions'])}")
            print(f"⏱️ Processing Time: {result['processing_time_seconds']:.2f}s")
            print(f"👤 Human Review Required: {result['requires_human_review']}")
            
            # Show the full response
            print(f"\n📋 Full Response:")
            print(json.dumps(result, indent=2))
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_with_github()
