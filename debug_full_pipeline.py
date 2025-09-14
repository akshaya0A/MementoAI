#!/usr/bin/env python3
"""
Debug the full TRA pipeline step by step
"""

import asyncio
import logging
from services.ingestion import IngestionOrchestrator
from services.extraction import ExtractionOrchestrator
from schemas.candidate import DataSource

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_full_pipeline():
    """Test the complete pipeline"""
    print("🔍 Testing Full TRA Pipeline...")
    
    # Step 1: Ingestion
    print("\n📡 Step 1: Ingestion...")
    ingestion_orchestrator = IngestionOrchestrator()
    
    try:
        ingested_data = await ingestion_orchestrator.ingest_candidate_data(
            candidate_id="nic-olo",
            data_sources=["github"],
            include_social_media=True
        )
        
        print(f"✅ Ingestion successful!")
        print(f"   Sources: {list(ingested_data.get('sources', {}).keys())}")
        
        github_data = ingested_data.get('sources', {}).get('github', {})
        if github_data and 'error' not in github_data:
            print(f"   GitHub profile: {github_data.get('profile', {}).get('name', 'N/A')}")
            print(f"   GitHub repos: {len(github_data.get('repositories', []))}")
        else:
            print(f"   ❌ GitHub data issue: {github_data}")
            return
            
    except Exception as e:
        print(f"❌ Ingestion failed: {e}")
        return
    
    # Step 2: Extraction
    print("\n🔍 Step 2: Extraction...")
    extraction_orchestrator = ExtractionOrchestrator()
    
    try:
        extracted_data = await extraction_orchestrator.extract_and_validate(
            raw_data=ingested_data,
            candidate_id="nic-olo"
        )
        
        print(f"✅ Extraction successful!")
        print(f"   Extracted data keys: {list(extracted_data.keys())}")
        
        extracted_profile = extracted_data.get('extracted_data', {})
        print(f"   Contact info: {extracted_profile.get('contact_info', {})}")
        print(f"   Projects count: {len(extracted_profile.get('projects', []))}")
        print(f"   Skills count: {len(extracted_profile.get('skills', []))}")
        
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
