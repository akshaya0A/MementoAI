#!/usr/bin/env python3
"""
Test the concrete scoring engine directly
"""

import asyncio
import logging
from services.ingestion import IngestionOrchestrator
from services.extraction import ExtractionOrchestrator
from concrete_scoring import ConcreteScoringEngine
from schemas.candidate import CandidateProfile, Project, Skill

# Enable detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_concrete_scoring():
    """Test concrete scoring directly"""
    print("🔍 Testing Concrete Scoring Engine...")
    
    # Step 1: Get real GitHub data
    print("\n📡 Step 1: Getting GitHub data...")
    ingestion_orchestrator = IngestionOrchestrator()
    
    ingested_data = await ingestion_orchestrator.ingest_candidate_data(
        candidate_id="nic-olo",
        data_sources=["github"],
        include_social_media=True
    )
    
    github_data = ingested_data.get('sources', {}).get('github', {})
    print(f"✅ GitHub data retrieved:")
    print(f"   Profile: {github_data.get('profile', {}).get('name', 'N/A')}")
    print(f"   Repositories: {len(github_data.get('repositories', []))}")
    
    # Step 2: Extract structured data
    print("\n🔍 Step 2: Extracting structured data...")
    extraction_orchestrator = ExtractionOrchestrator()
    
    extracted_data = await extraction_orchestrator.extract_and_validate(
        raw_data=ingested_data,
        candidate_id="nic-olo"
    )
    
    extracted_info = extracted_data.get('extracted_data', {})
    projects_data = extracted_info.get('projects', [])
    print(f"✅ Projects extracted: {len(projects_data)}")
    
    # Step 3: Convert to Project objects
    print("\n🎯 Step 3: Converting to Project objects...")
    projects = []
    for proj_dict in projects_data:
        # Convert language to technologies list
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
    
    print(f"✅ Project objects created: {len(projects)}")
    if projects:
        sample = projects[0]
        print(f"   Sample: {sample.name} - {sample.stars} stars, {sample.technologies}")
    
    # Step 4: Test concrete scoring
    print("\n📊 Step 4: Testing Concrete Scoring...")
    scoring_engine = ConcreteScoringEngine()
    
    # Test innovation scoring
    innovation_result = scoring_engine.calculate_github_innovation_score(projects)
    print(f"\n🚀 Innovation Score: {innovation_result['score']:.2f}")
    print(f"   Explanation: {innovation_result['explanation']}")
    for factor in innovation_result['factors']:
        print(f"   - {factor['name']}: {factor['value']} -> {factor['score']:.1f} points")
        print(f"     {factor['explanation']}")
    
    # Test velocity scoring
    velocity_result = scoring_engine.calculate_github_velocity_score(projects)
    print(f"\n⚡ Velocity Score: {velocity_result['score']:.2f}")
    print(f"   Explanation: {velocity_result['explanation']}")
    for factor in velocity_result['factors']:
        print(f"   - {factor['name']}: {factor['value']} -> {factor['score']:.1f} points")
        print(f"     {factor['explanation']}")
    
    # Test selectivity scoring
    selectivity_result = scoring_engine.calculate_github_selectivity_score(projects)
    print(f"\n🎯 Selectivity Score: {selectivity_result['score']:.2f}")
    print(f"   Explanation: {selectivity_result['explanation']}")
    for factor in selectivity_result['factors']:
        print(f"   - {factor['name']}: {factor['value']} -> {factor['score']:.1f} points")
        print(f"     {factor['explanation']}")
    
    # Generate full report
    print(f"\n📋 Full Concrete Report:")
    profile = CandidateProfile(
        candidate_id="nic-olo",
        projects=projects,
        data_sources=["github"],
        confidence_score=0.8
    )
    
    full_report = scoring_engine.generate_concrete_report(profile)
    print(f"   Overall Score: {full_report['overall_score']}")
    print(f"   Summary: {full_report['summary']}")

if __name__ == "__main__":
    asyncio.run(test_concrete_scoring())
