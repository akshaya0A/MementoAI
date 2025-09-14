"""
TRA Simple Demo Script

This script demonstrates the Talent Resolution Agent system with a simplified version
that doesn't require heavy dependencies like numpy or scikit-learn.
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any

from schemas.models import DataSource, ProcessingRequest

def run_simple_demo():
    """Run a simplified TRA demo workflow"""
    print("🚀 Starting Talent Resolution Agent (TRA) Simple Demo")
    print("=" * 60)
    
    # Create sample data sources
    print("\n📊 Creating sample data sources...")
    sample_sources = create_sample_sources()
    
    # Display sample sources
    print(f"✅ Created {len(sample_sources)} sample data sources:")
    for i, source in enumerate(sample_sources, 1):
        print(f"  {i}. {source.source_id} ({source.source_type})")
        if source.url:
            print(f"     URL: {source.url}")
        if source.data:
            print(f"     Data: {list(source.data.keys())}")
    
    # Create processing request
    print("\n📋 Creating processing request...")
    request = ProcessingRequest(
        sources=sample_sources,
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
    
    print("✅ Processing request created")
    
    # Simulate processing workflow
    print("\n🔄 Simulating Multi-Agent Processing Workflow")
    print("-" * 50)
    
    # Step 1: Ingestion
    print("\n🔍 Step 1: Data Ingestion")
    print("   - Scraping GitHub profile data")
    print("   - Processing ArXiv research papers")
    print("   - OCR processing resume document")
    print("   - Extracting CRM contact information")
    print("   - Applying PII redaction")
    print("   ✅ Ingestion completed")
    
    # Step 2: Extraction
    print("\n🔧 Step 2: Data Extraction & Validation")
    print("   - LLM-powered data extraction")
    print("   - Regex pattern validation")
    print("   - Unit test validation")
    print("   - Confidence scoring")
    print("   ✅ Extraction completed")
    
    # Step 3: Resolution
    print("\n🔗 Step 3: Entity Resolution")
    print("   - Fuzzy matching across sources")
    print("   - Vector similarity analysis")
    print("   - LLM adjudication for conflicts")
    print("   - Identity consolidation")
    print("   ✅ Resolution completed")
    
    # Step 4: Contradiction Detection
    print("\n⚠️  Step 4: Contradiction Detection")
    print("   - Cross-source field comparison")
    print("   - Conflict severity assessment")
    print("   - Confidence scoring")
    print("   ✅ Contradiction detection completed")
    
    # Step 5: Extraordinary Index
    print("\n📈 Step 5: Extraordinary Index Calculation")
    print("   - Innovation score: 0.85 (patents, papers, projects)")
    print("   - Adoption score: 0.72 (followers, company recognition)")
    print("   - Influence score: 0.91 (citations, stars, impact)")
    print("   - Velocity score: 0.68 (recent activity, progression)")
    print("   - Selectivity score: 0.79 (data quality, exclusivity)")
    print("   - Overall score: 0.79")
    print("   ✅ Extraordinary Index calculated")
    
    # Step 6: Action Planning
    print("\n🎯 Step 6: Action Planning")
    print("   - CRM upsert: Update candidate record")
    print("   - Outreach draft: Generate personalized message")
    print("   - Evidence packet: Compile visa application materials")
    print("   - Priority: High (score >= 0.75)")
    print("   ✅ Action plan generated")
    
    # Display Results
    print("\n📋 Demo Results Summary")
    print("=" * 60)
    print(f"👥 Processed Candidates: 1")
    print(f"   - Candidate ID: candidate_john_doe")
    print(f"   - Resolution Confidence: 0.87")
    print(f"   - Source Count: 4")
    print(f"   - Extraordinary Index: 0.79")
    
    print(f"\n⚠️  Contradictions Detected: 2")
    print(f"   - Name mismatch: 'John Doe' vs 'J. Doe'")
    print(f"   - Location conflict: 'San Francisco' vs 'SF Bay Area'")
    
    print(f"\n📊 Extraordinary Index Breakdown:")
    print(f"   - Innovation: 0.85 (Strong research background)")
    print(f"   - Adoption: 0.72 (Good market presence)")
    print(f"   - Influence: 0.91 (High community impact)")
    print(f"   - Velocity: 0.68 (Moderate recent activity)")
    print(f"   - Selectivity: 0.79 (High data quality)")
    print(f"   - Overall: 0.79 (Exceptional candidate)")
    
    print(f"\n🎯 Generated Actions: 3")
    print(f"   - CRM Upsert: Update with resolved data")
    print(f"   - Outreach Draft: Personalized recruitment message")
    print(f"   - Evidence Packet: O-1 visa application materials")
    
    # Display API Request
    print("\n📝 Sample API Request:")
    print("=" * 30)
    print(json.dumps(request.dict(), indent=2, default=str))
    
    print("\n✅ Simple demo completed successfully!")
    print("\n🚀 To run the full system:")
    print("   python main.py")
    print("\n🌐 API will be available at: http://localhost:8000")

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
            file_content="John Doe\nSenior Software Engineer\nPython, Machine Learning, AI\n5 years experience at Tech Corp\nSan Francisco, CA",
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
                "title": "Senior Software Engineer",
                "location": "SF Bay Area"
            },
            metadata={"demo": True}
        )
    ]

if __name__ == "__main__":
    run_simple_demo()
