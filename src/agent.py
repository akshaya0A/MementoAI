import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from .models import SourceType, Source, Claim, ResearchResult
from .crawler.nytimes_crawler import NYTimesCrawler
from .crawler.ibm_crawler import IBMCrawler
from .crawler.nature_crawler import NatureCrawler
from .crawler.arxiv_crawler import ArxivCrawler
from .crawler.uspto_crawler import USPTOCrawler
from .extractor.nytimes_extractor import NYTimesExtractor
from .extractor.ibm_extractor import IBMExtractor
from .extractor.nature_extractor import NatureExtractor
from .extractor.arxiv_extractor import ArxivExtractor
from .extractor.uspto_extractor import USPTOExtractor
from .cross_validator.validator import CrossValidator
from .composer.profile_composer import ProfileComposer

logger = logging.getLogger(__name__)

class DeepResearchAgent:
    def __init__(self):
        self.crawlers = {
            SourceType.NYTIMES: NYTimesCrawler(),
            SourceType.IBM: IBMCrawler(),
            SourceType.NATURE: NatureCrawler(),
            SourceType.ARXIV: ArxivCrawler(),
            SourceType.USPTO: USPTOCrawler()
        }
        
        self.extractors = {
            SourceType.NYTIMES: NYTimesExtractor(),
            SourceType.IBM: IBMExtractor(),
            SourceType.NATURE: NatureExtractor(),
            SourceType.ARXIV: ArxivExtractor(),
            SourceType.USPTO: USPTOExtractor()
        }
        
        self.cross_validator = CrossValidator()
        self.composer = ProfileComposer()
        
        self.source_credibility = {
            SourceType.NATURE: 0.98,
            SourceType.IBM: 0.9,
            SourceType.USPTO: 0.88,
            SourceType.NYTIMES: 0.85,
            SourceType.ARXIV: 0.8
        }
    
    def research(self, query: str, max_results_per_source: int = 5, sources: Optional[List[str]] = None) -> ResearchResult:
        start_time = time.time()
        logger.info(f"Starting deep research for query: {query}")
        
        if sources:
            source_types = [SourceType(s) for s in sources if s in [st.value for st in SourceType]]
        else:
            source_types = list(SourceType)
        
        all_claims = []
        
        for source_type in source_types:
            try:
                logger.info(f"Crawling {source_type.value} for query: {query}")
                
                crawler = self.crawlers[source_type]
                extractor = self.extractors[source_type]
                
                crawl_results = crawler.crawl(query, max_results_per_source)
                
                for result in crawl_results:
                    try:
                        source = Source(
                            url=result['url'],
                            source_type=source_type,
                            title=result.get('title', 'No title'),
                            extraction_timestamp=datetime.now(),
                            credibility_score=self.source_credibility[source_type],
                            raw_content=result.get('raw_html', result.get('raw_xml', ''))
                        )
                        
                        claims = extractor.extract(result, source)
                        all_claims.extend(claims)
                        
                        logger.info(f"Extracted {len(claims)} claims from {result['url']}")
                        
                    except Exception as e:
                        logger.error(f"Failed to extract from {result.get('url', 'unknown')}: {e}")
                        continue
                
            except Exception as e:
                logger.error(f"Failed to crawl {source_type.value}: {e}")
                continue
        
        logger.info(f"Total claims extracted: {len(all_claims)}")
        
        validated_claims = self.cross_validator.validate_claims(all_claims)
        logger.info(f"Claims after validation: {len(validated_claims)}")
        
        processing_time = time.time() - start_time
        result = self.composer.compose_profile(
            query=query,
            claims=validated_claims,
            processing_time=processing_time,
            sources_searched=source_types
        )
        
        logger.info(f"Research completed in {processing_time:.2f} seconds")
        return result
    
    def research_example_jane_doe(self) -> ResearchResult:
        """
        Run the example "Dr. Jane Doe" query as specified in the requirements
        """
        logger.info("Running example Dr. Jane Doe research")
        return self.research("Dr. Jane Doe", max_results_per_source=3)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    agent = DeepResearchAgent()
    result = agent.research_example_jane_doe()
    
    print(f"\nResearch Results for: {result.query}")
    print(f"Processing Time: {result.processing_time:.2f} seconds")
    print(f"Total Claims: {result.total_claims}")
    print(f"High Confidence Claims: {result.high_confidence_claims}")
    print(f"Conflicting Claims: {result.conflicting_claims}")
    print(f"Human Review Required: {result.human_review_required}")
    
    print("\nClaims:")
    for claim in result.person.all_claims:
        print(f"- {claim.claim_text} (confidence: {claim.confidence_score:.2f})")
        if claim.contradictory_claims:
            print(f"  Contradictory: {len(claim.contradictory_claims)} claims")
