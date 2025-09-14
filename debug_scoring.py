#!/usr/bin/env python3
"""
Debug scoring to see why concrete scoring isn't working
"""

import asyncio
import logging
from services.extraordinary_index import ExtraordinaryIndexCalculator
from schemas.candidate import CandidateProfile, Project

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def debug_scoring():
    """Debug the scoring process"""
    
    # Create a test profile with some projects
    projects = [
        Project(
            name="test-project",
            description="A test project",
            stars=5,
            forks=2,
            technologies=["Python", "JavaScript"]
        )
    ]
    
    profile = CandidateProfile(
        candidate_id="debug-test",
        projects=projects,
        data_sources=["github"],
        confidence_score=0.8
    )
    
    # Test the scoring calculator
    calculator = ExtraordinaryIndexCalculator()
    
    print("🔍 Testing Innovation Scoring Agent...")
    try:
        innovation_score = await calculator.scoring_agents["innovation"].calculate_score(profile)
        print(f"✅ Innovation Score: {innovation_score}")
    except Exception as e:
        print(f"❌ Innovation Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🔍 Testing Velocity Scoring Agent...")
    try:
        velocity_score = await calculator.scoring_agents["velocity"].calculate_score(profile)
        print(f"✅ Velocity Score: {velocity_score}")
    except Exception as e:
        print(f"❌ Velocity Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n🔍 Testing Selectivity Scoring Agent...")
    try:
        selectivity_score = await calculator.scoring_agents["selectivity"].calculate_score(profile)
        print(f"✅ Selectivity Score: {selectivity_score}")
    except Exception as e:
        print(f"❌ Selectivity Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_scoring())