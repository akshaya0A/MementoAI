#!/usr/bin/env python3
"""
Debug script to test the ingestion pipeline step by step
"""

import asyncio
import logging
from services.ingestion import IngestionOrchestrator
from schemas.candidate import DataSource

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_ingestion():
    """Test the ingestion pipeline"""
    print("🔍 Testing TRA Ingestion Pipeline...")
    
    # Initialize orchestrator
    orchestrator = IngestionOrchestrator()
    
    # Test GitHub ingestion directly
    print("\n📡 Testing GitHub Agent Directly...")
    github_agent = orchestrator.agents[DataSource.GITHUB]
    
    async with github_agent as agent:
        try:
            result = await agent.ingest("nic-olo")
            print(f"✅ GitHub ingestion result:")
            print(f"   Source: {result.get('source')}")
            print(f"   Username: {result.get('username')}")
            print(f"   Profile keys: {list(result.get('profile', {}).keys())}")
            print(f"   Repositories count: {len(result.get('repositories', []))}")
            print(f"   Confidence: {result.get('confidence_score')}")
            print(f"   Status: {result.get('status', 'success')}")
            
            if 'error' in result:
                print(f"❌ Error: {result['error']}")
            else:
                print(f"✅ Success! Profile data: {result.get('profile', {}).get('name', 'N/A')}")
                
        except Exception as e:
            print(f"❌ GitHub agent failed: {e}")
    
    # Test full orchestrator
    print("\n🎯 Testing Full Orchestrator...")
    try:
        result = await orchestrator.ingest_candidate_data(
            candidate_id="nic-olo",
            data_sources=["github"],
            include_social_media=True
        )
        
        print(f"✅ Orchestrator result:")
        print(f"   Candidate ID: {result.get('candidate_id')}")
        print(f"   Sources: {list(result.get('sources', {}).keys())}")
        print(f"   Successful sources: {result.get('ingestion_metadata', {}).get('successful_sources', [])}")
        
        # Check GitHub data specifically
        github_data = result.get('sources', {}).get('github', {})
        if github_data:
            print(f"   GitHub data keys: {list(github_data.keys())}")
            if 'error' in github_data:
                print(f"   GitHub error: {github_data['error']}")
            else:
                print(f"   GitHub profile: {github_data.get('profile', {}).get('name', 'N/A')}")
        else:
            print(f"   ❌ No GitHub data found!")
            
    except Exception as e:
        print(f"❌ Orchestrator failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ingestion())
