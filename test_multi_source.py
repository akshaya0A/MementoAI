#!/usr/bin/env python3
"""
Test script for multi-source data processing with identifiers
"""

import requests
import json

def test_multi_source():
    """Test with multiple data sources and identifiers"""
    payload = {
        "candidate_id": "nicolo-micheletti",
        "identifiers": {
            "github": "nic-olo",
            "linkedin": "https://www.linkedin.com/in/nicolo-m/",
            "arxiv": "Nicolo Micheletti",
            "pdfs": "nicolo_resume.pdf"
        },
        "data_sources": ["github", "arxiv", "linkedin", "pdfs"],
        "include_social_media": True,
        "priority": "high"
    }
    
    print("🚀 Testing TRA with MULTIPLE data sources...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            "http://localhost:8000/process-candidate",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS! Multi-source data processed:")
            print(f"📊 Extraordinary Index: {result['extraordinary_index']['overall_score']}")
            print(f"🎯 Actions Generated: {len(result['action_plan']['actions'])}")
            print(f"⏱️ Processing Time: {result['processing_time_seconds']:.2f}s")
            print(f"👤 Human Review Required: {result['requires_human_review']}")
            
            # Show detailed scores
            index = result['extraordinary_index']
            print(f"\n📈 Detailed Scores:")
            print(f"   Innovation: {index['innovation_score']}")
            print(f"   Adoption: {index['adoption_score']}")
            print(f"   Influence: {index['influence_score']}")
            print(f"   Velocity: {index['velocity_score']}")
            print(f"   Selectivity: {index['selectivity_score']}")
            
            # Show CRM data
            crm_data = result['action_plan']['actions'][0]['crm_upsert']['fields_to_update']
            print(f"\n💼 CRM Data:")
            print(f"   Location: {crm_data.get('location', 'N/A')}")
            print(f"   Skills: {crm_data.get('skills', [])}")
            print(f"   Data Sources: {crm_data.get('data_sources', [])}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_multi_source()
