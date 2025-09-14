#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from src.agent import DeepResearchAgent

def main():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("=" * 60)
    print("Deep Web Research Agent - Example Run")
    print("=" * 60)
    print()
    
    agent = DeepResearchAgent()
    
    print("Running example query: 'Dr. Jane Doe'")
    print("This will search across multiple sources and cross-validate findings...")
    print()
    
    try:
        result = agent.research_example_jane_doe()
        
        print("RESEARCH RESULTS")
        print("=" * 40)
        print(f"Query: {result.query}")
        print(f"Processing Time: {result.processing_time:.2f} seconds")
        print(f"Sources Searched: {', '.join([s.value for s in result.sources_searched])}")
        print(f"Total Claims: {result.total_claims}")
        print(f"High Confidence Claims: {result.high_confidence_claims}")
        print(f"Conflicting Claims: {result.conflicting_claims}")
        print(f"Human Review Required: {result.human_review_required}")
        print()
        
        if result.person.all_claims:
            print("EXTRACTED CLAIMS")
            print("=" * 40)
            
            for i, claim in enumerate(result.person.all_claims, 1):
                print(f"{i}. {claim.claim_text}")
                print(f"   Type: {claim.claim_type}")
                print(f"   Confidence: {claim.confidence_score:.2f}")
                print(f"   Sources: {len(claim.sources)}")
                
                if claim.contradictory_claims:
                    print(f"   ⚠️  {len(claim.contradictory_claims)} contradictory claims found")
                
                if isinstance(claim.value, dict) and 'notes' in claim.value:
                    for note in claim.value['notes']:
                        print(f"   📝 Note: {note}")
                
                print()
        else:
            print("No claims extracted. This might be due to:")
            print("- Network connectivity issues")
            print("- Source websites being unavailable")
            print("- No matching content found for the query")
            print()
        
        print("=" * 60)
        print("Example run completed!")
        print("To start the web UI, run: python -m src.ui.api")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error during research: {e}")
        logging.exception("Research failed")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
