#!/usr/bin/env python3
"""
Test validation with exact real data values
"""

from schemas.candidate import ExtraordinaryIndex, ConfidenceLevel
from datetime import datetime

def test_exact_real_data():
    """Test with exact values from real data"""
    
    print("🧪 Testing with exact real data values...")
    
    # Exact values from the real pipeline
    innovation_score = 0.03
    adoption_score = 0.0
    influence_score = 0.0
    velocity_score = 0.0
    selectivity_score = 54.0
    overall_score = 8.1075
    
    print(f"Input scores:")
    print(f"  Innovation: {innovation_score}")
    print(f"  Adoption: {adoption_score}")
    print(f"  Influence: {influence_score}")
    print(f"  Velocity: {velocity_score}")
    print(f"  Selectivity: {selectivity_score}")
    print(f"  Overall: {overall_score}")
    
    # Calculate expected overall score
    expected = (
        innovation_score * 0.25 +
        adoption_score * 0.20 +
        influence_score * 0.25 +
        velocity_score * 0.15 +
        selectivity_score * 0.15
    )
    print(f"\nExpected overall score: {expected}")
    print(f"Difference: {abs(overall_score - expected)}")
    
    try:
        extraordinary_index = ExtraordinaryIndex(
            innovation_score=innovation_score,
            adoption_score=adoption_score,
            influence_score=influence_score,
            velocity_score=velocity_score,
            selectivity_score=selectivity_score,
            overall_score=overall_score,
            calculation_method="concrete_scoring",
            confidence_level=ConfidenceLevel.MEDIUM,
            factors_considered=["github_data"],
            calculation_timestamp=datetime.now()
        )
        print("✅ Validation passed!")
        print(f"Final overall score: {extraordinary_index.overall_score}")
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        
        # Try with the expected score
        try:
            extraordinary_index = ExtraordinaryIndex(
                innovation_score=innovation_score,
                adoption_score=adoption_score,
                influence_score=influence_score,
                velocity_score=velocity_score,
                selectivity_score=selectivity_score,
                overall_score=expected,  # Use expected score
                calculation_method="concrete_scoring",
                confidence_level=ConfidenceLevel.MEDIUM,
                factors_considered=["github_data"],
                calculation_timestamp=datetime.now()
            )
            print(f"✅ Validation passed with expected score: {expected}")
        except Exception as e2:
            print(f"❌ Still failed with expected score: {e2}")

if __name__ == "__main__":
    test_exact_real_data()
