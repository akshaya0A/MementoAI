"""
TRA Demo Script

This script demonstrates the Talent Resolution Agent system with sample data.
It shows the complete workflow from data ingestion to action planning.
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any

from schemas.models import DataSource, ProcessingRequest
from services.ingestion import IngestionAgent
from services.extraction import ExtractionAgent
from services.resolution import ResolutionAgent

async def run_demo():
    """Run the complete TRA demo workflow"""
    print("🚀 Starting Talent Resolution Agent (TRA) Demo")
    print("=" * 60)
    
    # Initialize agents
    print("\n📋 Initializing agents...")
    ingestion_agent = IngestionAgent()
    extraction_agent = ExtractionAgent()
    resolution_agent = ResolutionAgent()
    
    # Create sample data sources
    print("\n📊 Creating sample data sources...")
    sample_sources = create_sample_sources()
    
    # Step 1: Ingestion
    print("\n🔍 Step 1: Data Ingestion")
    print("-" * 30)
    raw_data_list = await ingestion_agent.process_sources(sample_sources)
    print(f"✅ Ingested {len(raw_data_list)} data sources")
    
    # Step 2: Extraction
    print("\n🔧 Step 2: Data Extraction & Validation")
    print("-" * 40)
    extracted_data_list = await extraction_agent.extract_and_validate(raw_data_list)
    print(f"✅ Extracted and validated {len(extracted_data_list)} data sources")
    
    # Step 3: Entity Resolution
    print("\n🔗 Step 3: Entity Resolution")
    print("-" * 30)
    processed_candidates = await resolution_agent.resolve_entities(extracted_data_list)
    print(f"✅ Resolved {len(processed_candidates)} candidates")
    
    # Step 4: Contradiction Detection
    print("\n⚠️  Step 4: Contradiction Detection")
    print("-" * 35)
    contradictions = await resolution_agent.detect_contradictions(processed_candidates)
    print(f"✅ Detected {len(contradictions)} contradictions")
    
    # Step 5: Extraordinary Index Calculation
    print("\n📈 Step 5: Extraordinary Index Calculation")
    print("-" * 40)
    extraordinary_indices = await resolution_agent.calculate_extraordinary_index(
        processed_candidates, contradictions
    )
    print(f"✅ Calculated Extraordinary Index for {len(extraordinary_indices)} candidates")
    
    # Step 6: Action Planning
    print("\n🎯 Step 6: Action Planning")
    print("-" * 25)
    action_plans = await resolution_agent.generate_action_plan(
        processed_candidates, extraordinary_indices
    )
    print(f"✅ Generated {len(action_plans)} action plans")
    
    # Display Results
    print("\n📋 Demo Results")
    print("=" * 60)
    display_results(processed_candidates, contradictions, extraordinary_indices, action_plans)
    
    # Cleanup
    await ingestion_agent.close()
    print("\n✅ Demo completed successfully!")

def create_sample_sources() -> List[DataSource]:
    """Create sample data sources for the demo"""
    return [
        DataSource(
            source_id="github_demo",
            source_type="github",
            url="https://api.github.com/users/octocat",
            metadata={"demo": True}
        ),
        DataSource(
            source_id="arxiv_demo",
            source_type="arxiv",
            url="http://export.arxiv.org/api/query?search_query=au:octocat",
            metadata={"demo": True}
        ),
        DataSource(
            source_id="resume_demo",
            source_type="resume",
            file_content="John Doe\nSoftware Engineer\nPython, Machine Learning\n5 years experience",
            filename="john_doe_resume.txt",
            metadata={"demo": True}
        ),
        DataSource(
            source_id="crm_demo",
            source_type="crm",
            data={
                "contact_id": "12345",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "company": "Tech Corp",
                "title": "Senior Software Engineer"
            },
            metadata={"demo": True}
        )
    ]

def display_results(
    candidates: List[Any],
    contradictions: List[Any],
    indices: List[Any],
    action_plans: List[Any]
):
    """Display the demo results in a formatted way"""
    
    print(f"\n👥 Processed Candidates: {len(candidates)}")
    for i, candidate in enumerate(candidates, 1):
        print(f"  {i}. {candidate.candidate_id}")
        print(f"     Confidence: {candidate.confidence_score:.2f}")
        print(f"     Sources: {len(candidate.source_data)}")
    
    print(f"\n⚠️  Contradictions Detected: {len(contradictions)}")
    for i, contradiction in enumerate(contradictions, 1):
        print(f"  {i}. {contradiction.contradiction_type}")
        print(f"     Field: {contradiction.field_name}")
        print(f"     Severity: {contradiction.severity}")
    
    print(f"\n📊 Extraordinary Index Scores:")
    for i, index in enumerate(indices, 1):
        print(f"  Candidate {i}:")
        print(f"    Innovation: {index.innovation:.2f}")
        print(f"    Adoption: {index.adoption:.2f}")
        print(f"    Influence: {index.influence:.2f}")
        print(f"    Velocity: {index.velocity:.2f}")
        print(f"    Selectivity: {index.selectivity:.2f}")
        print(f"    Overall: {index.overall_score:.2f}")
    
    print(f"\n🎯 Action Plans Generated: {len(action_plans)}")
    for i, plan in enumerate(action_plans, 1):
        print(f"  {i}. Candidate: {plan.candidate_id}")
        print(f"     Priority: {plan.priority}")
        print(f"     Actions: {len(plan.actions)}")
        print(f"     Expected Outcome: {plan.expected_outcome}")

def create_sample_processing_request() -> ProcessingRequest:
    """Create a sample processing request for API testing"""
    return ProcessingRequest(
        sources=create_sample_sources(),
        processing_options={
            "enable_contradiction_detection": True,
            "calculate_extraordinary_index": True,
            "generate_action_plans": True
        },
        metadata={
            "demo": True,
            "created_at": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    # Run the demo
    asyncio.run(run_demo())
    
    # Also create a sample API request
    print("\n📝 Sample API Request:")
    print("=" * 30)
    sample_request = create_sample_processing_request()
    print(json.dumps(sample_request.dict(), indent=2, default=str))
