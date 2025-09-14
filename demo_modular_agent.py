import asyncio
from modular_research_agent import ModularDeepResearchAgent

async def demo_research():
    """Demo the modular deep research agent"""
    agent = ModularDeepResearchAgent()
    
    print("🔍 MODULAR DEEP WEB RESEARCH AGENT - DEMO")
    print("="*60)
    print("Testing with: Dr. Jane Smith")
    print("Additional info: MIT Computer Science, IBM Research Scientist")
    print("Expected sources: NYTimes, IBM, Nature, arXiv, USPTO")
    print("="*60)
    
    try:
        # Run research with demo data
        profile = await agent.research_person(
            "Dr. Jane Smith", 
            "MIT Computer Science, IBM Research Scientist, AI researcher"
        )
        
        # Display results
        agent.display_profile(profile)
        
        # Additional analysis
        print("\n" + "="*80)
        print("📈 DETAILED ANALYSIS")
        print("="*80)
        
        # Analyze by source type
        source_analysis = {}
        for claim in profile.claims:
            for source in claim.sources:
                if source.source_type not in source_analysis:
                    source_analysis[source.source_type] = {
                        'claims': 0,
                        'avg_confidence': 0,
                        'high_confidence': 0
                    }
                source_analysis[source.source_type]['claims'] += 1
                source_analysis[source.source_type]['avg_confidence'] += claim.confidence
                if claim.confidence >= 0.8:
                    source_analysis[source.source_type]['high_confidence'] += 1
        
        print("\n📊 SOURCE ANALYSIS:")
        for source_type, stats in source_analysis.items():
            avg_conf = stats['avg_confidence'] / stats['claims'] if stats['claims'] > 0 else 0
            print(f"  {source_type.upper()}:")
            print(f"    Claims: {stats['claims']}")
            print(f"    Avg Confidence: {avg_conf:.2f}")
            print(f"    High Confidence: {stats['high_confidence']}")
        
        # Show specific fact types
        print(f"\n🔬 FACT TYPE ANALYSIS:")
        fact_types = {}
        for claim in profile.claims:
            fact_type = claim.fact.split()[0].lower() if claim.fact else 'unknown'
            if fact_type not in fact_types:
                fact_types[fact_type] = []
            fact_types[fact_type].append(claim)
        
        for fact_type, claims in fact_types.items():
            print(f"  {fact_type.upper()}: {len(claims)} claims")
            for claim in claims[:2]:  # Show first 2
                print(f"    • {claim.fact}: {claim.value}")
                print(f"      Confidence: {claim.confidence:.2f}")
        
        # Show credibility breakdown
        print(f"\n📈 CREDIBILITY BREAKDOWN:")
        print(f"  Total Sources: {len(set(s.source_type for claim in profile.claims for s in claim.sources))}")
        print(f"  Claims Needing Review: {len([c for c in profile.claims if c.human_review_needed])}")
        print(f"  Contradictions: {len(profile.contradictions)}")
        print(f"  Timeline Events: {len(profile.timeline)}")
        
        # Show sample sources
        print(f"\n🔗 SAMPLE SOURCES:")
        sample_sources = set()
        for claim in profile.claims[:5]:  # First 5 claims
            for source in claim.sources:
                sample_sources.add((source.source_type, source.url))
        
        for source_type, url in list(sample_sources)[:5]:
            print(f"  {source_type.upper()}: {url}")
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(demo_research())
