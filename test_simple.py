#!/usr/bin/env python3
"""
Simple test to isolate the 500 error
"""

import asyncio
import logging
from services.ingestion import IngestionOrchestrator
from services.extraction import ExtractionOrchestrator
from services.extraordinary_index import ExtraordinaryIndexCalculator
from services.action_planner import ActionPlanner
from schemas.candidate import CandidateProfile, Project, Skill

# Enable logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_simple_pipeline():
    """Test the pipeline step by step"""
    
    try:
        print("🔍 Testing Simple Pipeline...")
        
        # Initialize orchestrators
        print("📡 Initializing orchestrators...")
        ingestion = IngestionOrchestrator()
        extraction = ExtractionOrchestrator()
        extraordinary_index = ExtraordinaryIndexCalculator()
        action_planner = ActionPlanner()
        
        # Test data
        candidate_id = "test-user"
        data_sources = ["github"]
        identifiers = {"github": "nic-olo"}
        
        print("📊 Step 1: Data Ingestion...")
        raw_data = await ingestion.ingest_candidate_data(
            candidate_id=candidate_id,
            data_sources=data_sources,
            include_social_media=True,
            identifiers=identifiers
        )
        print(f"✅ Ingestion completed: {len(raw_data.get('sources', {}))} sources")
        
        print("🔍 Step 2: Data Extraction...")
        extracted_data = await extraction.extract_and_validate(
            raw_data=raw_data,
            candidate_id=candidate_id
        )
        print(f"✅ Extraction completed: {extracted_data.get('status', 'unknown')}")
        
        print("📊 Step 3: Creating Candidate Profile...")
        validated_data = extracted_data.get("extracted_data", {})
        
        # Convert projects
        projects = []
        for proj_dict in validated_data.get("projects", []):
            technologies = [proj_dict.get("language", "")] if proj_dict.get("language") else []
            project = Project(
                name=proj_dict.get("name", ""),
                description=proj_dict.get("description", ""),
                url=proj_dict.get("url", ""),
                stars=proj_dict.get("stars", 0),
                forks=proj_dict.get("forks", 0),
                technologies=technologies
            )
            projects.append(project)
        
        # Convert skills
        skills = []
        for skill_dict in validated_data.get("skills", []):
            skill = Skill(
                name=skill_dict.get("name", ""),
                category=skill_dict.get("category", ""),
                proficiency=skill_dict.get("proficiency", "")
            )
            skills.append(skill)
        
        # Create profile
        profile = CandidateProfile(
            candidate_id=candidate_id,
            name=validated_data.get("name", ""),
            email=validated_data.get("email", ""),
            location=validated_data.get("location", ""),
            projects=projects,
            skills=skills,
            data_sources=data_sources,
            confidence_score=0.8
        )
        print(f"✅ Profile created: {len(projects)} projects, {len(skills)} skills")
        
        print("📈 Step 4: Extraordinary Index Calculation...")
        extraordinary_index_result = await extraordinary_index.calculate_index(profile)
        print(f"✅ Extraordinary Index: {extraordinary_index_result.overall_score}")
        
        print("🎯 Step 5: Action Planning...")
        action_plan = await action_planner.generate_action_plan(
            candidate_profile=profile,
            extraordinary_index=extraordinary_index_result
        )
        print(f"✅ Action Plan: {len(action_plan.actions)} actions")
        
        print("🎉 All steps completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_simple_pipeline())
