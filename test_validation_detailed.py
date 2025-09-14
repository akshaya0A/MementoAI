#!/usr/bin/env python3
"""
Test detailed validation to identify 422 error source
"""

import requests
import json
from schemas.candidate import ExtraordinaryIndex, ConfidenceLevel
from datetime import datetime

def test_extraordinary_index_validation():
    """Test ExtraordinaryIndex validation specifically"""
    
    print("🧪 Testing ExtraordinaryIndex Validation...")
    
    # Test 1: Valid scores
    try:
        valid_index = ExtraordinaryIndex(
            innovation_score=15.03,
            adoption_score=0.0,
            influence_score=0.0,
            velocity_score=20.0,
            selectivity_score=54.0,
            overall_score=8.1075,
            calculation_method="concrete_scoring",
            confidence_level=ConfidenceLevel.MEDIUM,
            factors_considered=["github_data"],
            calculation_timestamp=datetime.now()
        )
        print("✅ Valid ExtraordinaryIndex created successfully")
        print(f"   Innovation: {valid_index.innovation_score}")
        print(f"   Overall: {valid_index.overall_score}")
    except Exception as e:
        print(f"❌ Validation Error: {e}")
    
    # Test 2: Invalid scores (negative)
    try:
        invalid_index = ExtraordinaryIndex(
            innovation_score=-1.0,  # Invalid: negative
            adoption_score=0.0,
            influence_score=0.0,
            velocity_score=20.0,
            selectivity_score=54.0,
            overall_score=8.1075,
            calculation_method="concrete_scoring",
            confidence_level=ConfidenceLevel.MEDIUM,
            factors_considered=["github_data"],
            calculation_timestamp=datetime.now()
        )
        print("❌ Should have failed but didn't")
    except Exception as e:
        print(f"✅ Correctly caught validation error: {e}")
    
    # Test 3: Invalid scores (over 100)
    try:
        invalid_index = ExtraordinaryIndex(
            innovation_score=101.0,  # Invalid: over 100
            adoption_score=0.0,
            influence_score=0.0,
            velocity_score=20.0,
            selectivity_score=54.0,
            overall_score=8.1075,
            calculation_method="concrete_scoring",
            confidence_level=ConfidenceLevel.MEDIUM,
            factors_considered=["github_data"],
            calculation_timestamp=datetime.now()
        )
        print("❌ Should have failed but didn't")
    except Exception as e:
        print(f"✅ Correctly caught validation error: {e}")

def test_api_with_problematic_payload():
    """Test API with potentially problematic payloads"""
    
    base_url = "http://localhost:8000"
    
    # Test payload that might cause 422
    problematic_payloads = [
        # Empty data_sources
        {
            "candidate_id": "test-user",
            "data_sources": []
        },
        # Invalid data source
        {
            "candidate_id": "test-user",
            "data_sources": ["invalid_source"]
        },
        # Missing required field
        {
            "data_sources": ["github"]
        },
        # Invalid priority
        {
            "candidate_id": "test-user",
            "data_sources": ["github"],
            "priority": "invalid_priority"
        }
    ]
    
    for i, payload in enumerate(problematic_payloads, 1):
        print(f"\n🧪 Test {i}: Problematic payload")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            response = requests.post(f"{base_url}/process-candidate", json=payload)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 422:
                error_detail = response.json()
                print(f"❌ Validation Error: {error_detail}")
            elif response.status_code == 200:
                print("✅ Unexpected success")
            else:
                print(f"❌ Other error: {response.text}")
                
        except Exception as e:
            print(f"❌ Request error: {e}")

if __name__ == "__main__":
    test_extraordinary_index_validation()
    test_api_with_problematic_payload()
