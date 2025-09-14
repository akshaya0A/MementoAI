#!/usr/bin/env python3
"""
Test the corrected payload format
"""

import requests
import json

def test_corrected_payload():
    """Test with the properly formatted payload"""
    
    base_url = "http://localhost:8000"
    
    # Your payload with corrections
    corrected_payload = {
        "candidate_id": "nicolo-micheletti",
        "identifiers": {
            "github": "nic-olo",
            "linkedin": "https://www.linkedin.com/in/nicolo-m/",
            "arxiv": "Nicolo Micheletti",
            "pdfs": "nicolo_resume.pdf"
        },
        "data_sources": [
            "github",
            "arxiv", 
            "linkedin",
            "pdfs"
        ],
        "include_social_media": True,  # Fixed: boolean instead of string
        "priority": "normal"  # Added: optional but recommended
    }
    
    print("🧪 Testing corrected payload...")
    print(f"Payload: {json.dumps(corrected_payload, indent=2)}")
    
    try:
        response = requests.post(f"{base_url}/process-candidate", json=corrected_payload)
        print(f"\nStatus: {response.status_code}")
        
        if response.status_code == 422:
            error_detail = response.json()
            print(f"❌ Still getting 422 error:")
            print(f"   {json.dumps(error_detail, indent=2)}")
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(f"📊 Extraordinary Index: {data.get('extraordinary_index', {}).get('overall_score', 'N/A')}")
            print(f"🎯 Actions Generated: {len(data.get('action_plan', {}).get('actions', []))}")
            print(f"⏱️ Processing Time: {data.get('processing_time_seconds', 'N/A')}s")
            
            # Show detailed scores
            if 'extraordinary_index' in data:
                scores = data['extraordinary_index']
                print(f"\n📈 Detailed Scores:")
                print(f"   Innovation: {scores.get('innovation_score', 'N/A')}")
                print(f"   Adoption: {scores.get('adoption_score', 'N/A')}")
                print(f"   Influence: {scores.get('influence_score', 'N/A')}")
                print(f"   Velocity: {scores.get('velocity_score', 'N/A')}")
                print(f"   Selectivity: {scores.get('selectivity_score', 'N/A')}")
        else:
            print(f"❌ Unexpected status ({response.status_code}): {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - server not running")
    except Exception as e:
        print(f"❌ Request error: {e}")

if __name__ == "__main__":
    test_corrected_payload()
