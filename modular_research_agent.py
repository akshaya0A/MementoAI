import asyncio
import json
import re
import time
import random
import os
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from urllib.parse import urljoin, urlparse, quote
import hashlib
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

dedalus_key = os.getenv('DEDALUS_API_KEY')
anthropic_key = os.getenv('ANTHROPIC_API_KEY')
serpapi_key = os.getenv('SERPAPI_KEY')

@dataclass
class Source:
    url: str
    title: str
    source_type: str  # 'nytimes', 'ibm', 'nature', 'arxiv', 'uspto'
    authority_score: float  # 0.0 to 1.0
    extraction_confidence: float  # 0.0 to 1.0
    timestamp: str
    raw_content: str
    language: str = 'en'

@dataclass
class Claim:
    fact: str
    value: Any
    sources: List[Source]
    confidence: float
    contradiction_note: Optional[str] = None
    human_review_needed: bool = False
    temporal_info: Optional[str] = None

@dataclass
class PersonProfile:
    name: str
    claims: List[Claim]
    timeline: List[Dict[str, Any]]
    credibility_summary: Dict[str, float]
    contradictions: List[Dict[str, Any]]
    last_updated: str

class RateLimiter:
    """Rate limiter to handle different site rate limits"""
    def __init__(self):
        self.last_request = {}
        self.min_delays = {
            'nytimes': 2.0,
            'ibm': 1.5,
            'nature': 2.0,
            'arxiv': 1.0,
            'uspto': 1.5
        }
    
    async def wait_if_needed(self, source_type: str):
        """Wait if needed to respect rate limits"""
        if source_type in self.last_request:
            elapsed = time.time() - self.last_request[source_type]
            min_delay = self.min_delays.get(source_type, 1.0)
            if elapsed < min_delay:
                await asyncio.sleep(min_delay - elapsed)
        self.last_request[source_type] = time.time()

class WebScraper:
    """Base web scraper with error handling and rate limiting"""
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.rate_limiter = RateLimiter()
        
    async def get_page(self, url: str, source_type: str, use_selenium: bool = False) -> Optional[BeautifulSoup]:
        """Get page content with error handling and rate limiting"""
        await self.rate_limiter.wait_if_needed(source_type)
        
        try:
            if use_selenium:
                return await self._get_with_selenium(url)
            else:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"    ⚠️ Error scraping {url}: {str(e)}")
            return None
    
    async def _get_with_selenium(self, url: str) -> Optional[BeautifulSoup]:
        """Get page using Selenium for JavaScript-heavy sites"""
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        driver = None
        try:
            driver = webdriver.Chrome(options=options)
            driver.get(url)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            return BeautifulSoup(driver.page_source, 'html.parser')
        except Exception as e:
            print(f"    ⚠️ Selenium error for {url}: {str(e)}")
            return None
        finally:
            if driver:
                driver.quit()

class NYTimesCrawler:
    """Crawler for NYTimes articles"""
    def __init__(self, scraper: WebScraper):
        self.scraper = scraper
        self.source_type = 'nytimes'
        self.authority_score = 0.9
    
    async def search(self, person_name: str) -> List[Source]:
        """Search NYTimes for person"""
        print(f"  📰 Searching NYTimes for: {person_name}")
        sources = []
        
        # NYTimes search URL
        search_url = f"https://www.nytimes.com/search?query={quote(person_name)}"
        
        soup = await self.scraper.get_page(search_url, self.source_type)
        if not soup:
            return sources
        
        # Find article links
        article_links = soup.find_all('a', href=True)
        for link in article_links[:5]:  # Limit to first 5 results
            href = link.get('href')
            if href and '/202' in href:  # Recent articles
                full_url = urljoin('https://www.nytimes.com', href)
                source = await self._extract_article(full_url, person_name)
                if source:
                    sources.append(source)
        
        return sources
    
    async def _extract_article(self, url: str, person_name: str) -> Optional[Source]:
        """Extract article content"""
        soup = await self.scraper.get_page(url, self.source_type)
        if not soup:
            return None
        
        try:
            title = soup.find('h1', {'data-testid': 'headline'})
            title_text = title.get_text().strip() if title else "NYTimes Article"
            
            # Extract main content
            content_div = soup.find('div', {'data-testid': 'article-body'})
            if not content_div:
                content_div = soup.find('section', {'name': 'articleBody'})
            
            content = content_div.get_text().strip() if content_div else ""
            
            return Source(
                url=url,
                title=title_text,
                source_type=self.source_type,
                authority_score=self.authority_score,
                extraction_confidence=0.8,
                timestamp=datetime.now().isoformat(),
                raw_content=content[:2000]  # Limit content length
            )
        except Exception as e:
            print(f"    ⚠️ Error extracting NYTimes article {url}: {str(e)}")
            return None

class IBMCrawler:
    """Crawler for IBM press releases and profiles"""
    def __init__(self, scraper: WebScraper):
        self.scraper = scraper
        self.source_type = 'ibm'
        self.authority_score = 0.8
    
    async def search(self, person_name: str) -> List[Source]:
        """Search IBM for person"""
        print(f"  🏢 Searching IBM for: {person_name}")
        sources = []
        
        # IBM search URL
        search_url = f"https://www.ibm.com/search?query={quote(person_name)}"
        
        soup = await self.scraper.get_page(search_url, self.source_type)
        if not soup:
            return sources
        
        # Find press release and profile links
        links = soup.find_all('a', href=True)
        for link in links[:5]:
            href = link.get('href')
            if href and ('press' in href or 'profile' in href or 'research' in href):
                full_url = urljoin('https://www.ibm.com', href)
                source = await self._extract_content(full_url, person_name)
                if source:
                    sources.append(source)
        
        return sources
    
    async def _extract_content(self, url: str, person_name: str) -> Optional[Source]:
        """Extract IBM content"""
        soup = await self.scraper.get_page(url, self.source_type)
        if not soup:
            return None
        
        try:
            title = soup.find('h1')
            title_text = title.get_text().strip() if title else "IBM Content"
            
            # Extract main content
            content_div = soup.find('div', class_='ibm-content-main')
            if not content_div:
                content_div = soup.find('main')
            
            content = content_div.get_text().strip() if content_div else ""
            
            return Source(
                url=url,
                title=title_text,
                source_type=self.source_type,
                authority_score=self.authority_score,
                extraction_confidence=0.8,
                timestamp=datetime.now().isoformat(),
                raw_content=content[:2000]
            )
        except Exception as e:
            print(f"    ⚠️ Error extracting IBM content {url}: {str(e)}")
            return None

class NatureCrawler:
    """Crawler for Nature articles"""
    def __init__(self, scraper: WebScraper):
        self.scraper = scraper
        self.source_type = 'nature'
        self.authority_score = 0.98
    
    async def search(self, person_name: str) -> List[Source]:
        """Search Nature for person"""
        print(f"  🔬 Searching Nature for: {person_name}")
        sources = []
        
        # Nature search URL
        search_url = f"https://www.nature.com/search?q={quote(person_name)}"
        
        soup = await self.scraper.get_page(search_url, self.source_type)
        if not soup:
            return sources
        
        # Find article links
        article_links = soup.find_all('a', href=True)
        for link in article_links[:5]:
            href = link.get('href')
            if href and '/articles/' in href:
                full_url = urljoin('https://www.nature.com', href)
                source = await self._extract_article(full_url, person_name)
                if source:
                    sources.append(source)
        
        return sources
    
    async def _extract_article(self, url: str, person_name: str) -> Optional[Source]:
        """Extract Nature article"""
        soup = await self.scraper.get_page(url, self.source_type)
        if not soup:
            return None
        
        try:
            title = soup.find('h1', {'data-test': 'article-title'})
            title_text = title.get_text().strip() if title else "Nature Article"
            
            # Extract abstract and content
            abstract = soup.find('div', {'data-test': 'abstract'})
            content = abstract.get_text().strip() if abstract else ""
            
            return Source(
                url=url,
                title=title_text,
                source_type=self.source_type,
                authority_score=self.authority_score,
                extraction_confidence=0.9,
                timestamp=datetime.now().isoformat(),
                raw_content=content[:2000]
            )
        except Exception as e:
            print(f"    ⚠️ Error extracting Nature article {url}: {str(e)}")
            return None

class ArxivCrawler:
    """Crawler for arXiv papers"""
    def __init__(self, scraper: WebScraper):
        self.scraper = scraper
        self.source_type = 'arxiv'
        self.authority_score = 0.85
    
    async def search(self, person_name: str) -> List[Source]:
        """Search arXiv for person"""
        print(f"  📚 Searching arXiv for: {person_name}")
        sources = []
        
        # arXiv search URL
        search_url = f"http://export.arxiv.org/api/query?search_query=au:{quote(person_name)}&start=0&max_results=5"
        
        try:
            response = requests.get(search_url, timeout=10)
            response.raise_for_status()
            
            # Parse XML response
            soup = BeautifulSoup(response.content, 'xml')
            entries = soup.find_all('entry')
            
            for entry in entries:
                source = self._extract_paper(entry, person_name)
                if source:
                    sources.append(source)
        
        except Exception as e:
            print(f"    ⚠️ Error searching arXiv: {str(e)}")
        
        return sources
    
    def _extract_paper(self, entry, person_name: str) -> Optional[Source]:
        """Extract arXiv paper data"""
        try:
            title = entry.find('title')
            title_text = title.get_text().strip() if title else "arXiv Paper"
            
            summary = entry.find('summary')
            content = summary.get_text().strip() if summary else ""
            
            link = entry.find('id')
            url = link.get_text().strip() if link else ""
            
            return Source(
                url=url,
                title=title_text,
                source_type=self.source_type,
                authority_score=self.authority_score,
                extraction_confidence=0.9,
                timestamp=datetime.now().isoformat(),
                raw_content=content[:2000]
            )
        except Exception as e:
            print(f"    ⚠️ Error extracting arXiv paper: {str(e)}")
            return None

class USPTOCrawler:
    """Crawler for USPTO patents"""
    def __init__(self, scraper: WebScraper):
        self.scraper = scraper
        self.source_type = 'uspto'
        self.authority_score = 0.88
    
    async def search(self, person_name: str) -> List[Source]:
        """Search USPTO for person's patents"""
        print(f"  🏛️ Searching USPTO for: {person_name}")
        sources = []
        
        # USPTO search URL
        search_url = f"https://patents.google.com/?q=inventor:{quote(person_name)}"
        
        soup = await self.scraper.get_page(search_url, self.source_type, use_selenium=True)
        if not soup:
            return sources
        
        # Find patent links
        patent_links = soup.find_all('a', href=True)
        for link in patent_links[:5]:
            href = link.get('href')
            if href and '/patent/' in href:
                full_url = urljoin('https://patents.google.com', href)
                source = await self._extract_patent(full_url, person_name)
                if source:
                    sources.append(source)
        
        return sources
    
    async def _extract_patent(self, url: str, person_name: str) -> Optional[Source]:
        """Extract patent information"""
        soup = await self.scraper.get_page(url, self.source_type, use_selenium=True)
        if not soup:
            return None
        
        try:
            title = soup.find('h1')
            title_text = title.get_text().strip() if title else "USPTO Patent"
            
            # Extract patent details
            abstract = soup.find('div', {'itemprop': 'abstract'})
            content = abstract.get_text().strip() if abstract else ""
            
            return Source(
                url=url,
                title=title_text,
                source_type=self.source_type,
                authority_score=self.authority_score,
                extraction_confidence=0.9,
                timestamp=datetime.now().isoformat(),
                raw_content=content[:2000]
            )
        except Exception as e:
            print(f"    ⚠️ Error extracting USPTO patent {url}: {str(e)}")
            return None

class DataExtractor:
    """Extract structured data from sources"""
    def __init__(self):
        self.client = AsyncDedalus()
        self.runner = DedalusRunner(self.client)
    
    async def extract_facts(self, sources: List[Source], person_name: str) -> List[Claim]:
        """Extract structured facts from all sources"""
        print(f"📊 Extracting facts from {len(sources)} sources...")
        
        all_claims = []
        
        for source in sources:
            try:
                claims = await self._extract_from_source(source, person_name)
                all_claims.extend(claims)
            except Exception as e:
                print(f"    ⚠️ Error extracting from {source.url}: {str(e)}")
                continue
        
        return all_claims
    
    async def _extract_from_source(self, source: Source, person_name: str) -> List[Claim]:
        """Extract facts from a single source using AI"""
        try:
            result = await self.runner.run(
                input=f"""Extract structured facts about {person_name} from this source:
                
                Source: {source.title}
                URL: {source.url}
                Type: {source.source_type}
                Content: {source.raw_content[:1500]}...
                
                Extract these specific facts:
                1. Professional role/position
                2. Company/institution affiliations
                3. Academic achievements (degrees, publications)
                4. Patents (count and titles)
                5. Awards and recognitions
                6. Research areas/interests
                7. Timeline information (dates, periods)
                
                For each fact, provide:
                - The fact statement
                - The specific value
                - Confidence level (0.0-1.0)
                - Any temporal information
                
                Format as structured data.""",
                model="openai/gpt-4.1",
                mcp_servers=["joerup/exa-mcp"]
            )
            
            # Parse the extracted facts
            facts = self._parse_extracted_facts(result.final_output, source)
            return facts
            
        except Exception as e:
            print(f"    ❌ AI extraction failed for {source.url}: {str(e)}")
            return []
    
    def _parse_extracted_facts(self, content: str, source: Source) -> List[Claim]:
        """Parse AI-extracted facts into Claim objects"""
        claims = []
        
        # Simple parsing - in production, use more sophisticated NLP
        lines = content.split('\n')
        current_claim = {}
        
        for line in lines:
            line = line.strip()
            if line.startswith('Fact:'):
                if current_claim:
                    claims.append(self._create_claim_from_data(current_claim, source))
                current_claim = {'fact': line.replace('Fact:', '').strip()}
            elif line.startswith('Value:'):
                current_claim['value'] = line.replace('Value:', '').strip()
            elif line.startswith('Confidence:'):
                try:
                    current_claim['confidence'] = float(line.replace('Confidence:', '').strip())
                except:
                    current_claim['confidence'] = 0.7
            elif line.startswith('Temporal:'):
                current_claim['temporal'] = line.replace('Temporal:', '').strip()
        
        if current_claim:
            claims.append(self._create_claim_from_data(current_claim, source))
        
        return claims
    
    def _create_claim_from_data(self, data: Dict, source: Source) -> Claim:
        """Create Claim object from extracted data"""
        return Claim(
            fact=data.get('fact', ''),
            value=data.get('value', ''),
            sources=[source],
            confidence=data.get('confidence', 0.7) * source.authority_score,
            temporal_info=data.get('temporal'),
            human_review_needed=data.get('confidence', 0.7) < 0.6
        )

class CrossValidator:
    """Cross-validate claims and resolve conflicts"""
    
    def validate_claims(self, claims: List[Claim]) -> List[Claim]:
        """Cross-validate all claims"""
        print("🔍 Cross-validating claims...")
        
        # Group similar claims
        fact_groups = self._group_similar_claims(claims)
        
        validated_claims = []
        for fact_key, group in fact_groups.items():
            if len(group) == 1:
                validated_claims.append(group[0])
            else:
                resolved_claim = self._resolve_conflict(group)
                validated_claims.append(resolved_claim)
        
        return validated_claims
    
    def _group_similar_claims(self, claims: List[Claim]) -> Dict[str, List[Claim]]:
        """Group claims by similar fact types"""
        fact_groups = {}
        
        for claim in claims:
            fact_key = self._normalize_fact_key(claim.fact)
            if fact_key not in fact_groups:
                fact_groups[fact_key] = []
            fact_groups[fact_key].append(claim)
        
        return fact_groups
    
    def _normalize_fact_key(self, fact: str) -> str:
        """Normalize fact string for grouping"""
        # Remove honorifics, normalize case
        normalized = re.sub(r'\b(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*', '', fact.lower())
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        return normalized
    
    def _resolve_conflict(self, claims: List[Claim]) -> Claim:
        """Resolve conflict between multiple claims"""
        # Sort by confidence
        claims.sort(key=lambda x: x.confidence, reverse=True)
        
        best_claim = claims[0]
        
        # Check for contradictions
        values = [claim.value for claim in claims]
        if len(set(values)) > 1:
            # Contradiction detected
            best_claim.contradiction_note = f"Sources disagree: {len(claims)} different values found"
            best_claim.human_review_needed = True
            
            # Add all sources
            all_sources = []
            for claim in claims:
                all_sources.extend(claim.sources)
            best_claim.sources = all_sources
        
        return best_claim

class ProfileComposer:
    """Compose final profile with timeline and credibility analysis"""
    
    def compose_profile(self, person_name: str, claims: List[Claim]) -> PersonProfile:
        """Compose comprehensive profile"""
        print("📝 Composing comprehensive profile...")
        
        timeline = self._create_timeline(claims)
        credibility_summary = self._calculate_credibility_summary(claims)
        contradictions = self._identify_contradictions(claims)
        
        return PersonProfile(
            name=person_name,
            claims=claims,
            timeline=timeline,
            credibility_summary=credibility_summary,
            contradictions=contradictions,
            last_updated=datetime.now().isoformat()
        )
    
    def _create_timeline(self, claims: List[Claim]) -> List[Dict[str, Any]]:
        """Create chronological timeline"""
        timeline_events = []
        
        for claim in claims:
            if claim.temporal_info:
                timeline_events.append({
                    'date': claim.temporal_info,
                    'event': claim.fact,
                    'value': claim.value,
                    'confidence': claim.confidence,
                    'sources': [s.url for s in claim.sources]
                })
        
        timeline_events.sort(key=lambda x: x['date'])
        return timeline_events
    
    def _calculate_credibility_summary(self, claims: List[Claim]) -> Dict[str, float]:
        """Calculate credibility metrics"""
        if not claims:
            return {}
        
        total_claims = len(claims)
        high_confidence = len([c for c in claims if c.confidence >= 0.8])
        needs_review = len([c for c in claims if c.human_review_needed])
        
        avg_confidence = sum(c.confidence for c in claims) / total_claims
        
        return {
            'total_claims': total_claims,
            'high_confidence_claims': high_confidence,
            'claims_needing_review': needs_review,
            'average_confidence': avg_confidence,
            'credibility_score': (high_confidence / total_claims) * avg_confidence
        }
    
    def _identify_contradictions(self, claims: List[Claim]) -> List[Dict[str, Any]]:
        """Identify contradictions in claims"""
        contradictions = []
        
        for claim in claims:
            if claim.contradiction_note:
                contradictions.append({
                    'fact': claim.fact,
                    'note': claim.contradiction_note,
                    'sources': [s.url for s in claim.sources],
                    'confidence': claim.confidence
                })
        
        return contradictions

class ModularDeepResearchAgent:
    """Main agent orchestrating all components"""
    
    def __init__(self):
        self.scraper = WebScraper()
        self.crawlers = {
            'nytimes': NYTimesCrawler(self.scraper),
            'ibm': IBMCrawler(self.scraper),
            'nature': NatureCrawler(self.scraper),
            'arxiv': ArxivCrawler(self.scraper),
            'uspto': USPTOCrawler(self.scraper)
        }
        self.extractor = DataExtractor()
        self.validator = CrossValidator()
        self.composer = ProfileComposer()
    
    async def research_person(self, person_name: str, additional_info: str = "") -> PersonProfile:
        """Main research pipeline"""
        print(f"🔍 Starting deep web research for: {person_name}")
        if additional_info:
            print(f"📝 Additional info: {additional_info}")
        print("="*60)
        
        # Step 1: Crawl all sources
        all_sources = []
        for name, crawler in self.crawlers.items():
            try:
                sources = await crawler.search(person_name)
                all_sources.extend(sources)
                print(f"  ✅ {name.upper()}: {len(sources)} sources found")
            except Exception as e:
                print(f"  ❌ {name.upper()}: Error - {str(e)}")
        
        print(f"\n📊 Total sources found: {len(all_sources)}")
        
        # Step 2: Extract facts
        claims = await self.extractor.extract_facts(all_sources, person_name)
        
        # Step 3: Cross-validate
        validated_claims = self.validator.validate_claims(claims)
        
        # Step 4: Compose profile
        profile = self.composer.compose_profile(person_name, validated_claims)
        
        return profile
    
    def display_profile(self, profile: PersonProfile):
        """Display comprehensive profile"""
        print("\n" + "="*80)
        print(f"🔍 DEEP WEB RESEARCH PROFILE: {profile.name.upper()}")
        print("="*80)
        
        # Credibility Summary
        print("\n📊 CREDIBILITY SUMMARY:")
        print(f"  Total Claims: {profile.credibility_summary.get('total_claims', 0)}")
        print(f"  High Confidence: {profile.credibility_summary.get('high_confidence_claims', 0)}")
        print(f"  Needs Review: {profile.credibility_summary.get('claims_needing_review', 0)}")
        print(f"  Average Confidence: {profile.credibility_summary.get('average_confidence', 0):.2f}")
        print(f"  Overall Credibility: {profile.credibility_summary.get('credibility_score', 0):.2f}")
        
        # Claims by source type
        print(f"\n📋 DETAILED CLAIMS BY SOURCE:")
        source_groups = {}
        for claim in profile.claims:
            for source in claim.sources:
                if source.source_type not in source_groups:
                    source_groups[source.source_type] = []
                source_groups[source.source_type].append(claim)
        
        for source_type, claims in source_groups.items():
            print(f"\n  {source_type.upper()} ({len(claims)} claims):")
            for i, claim in enumerate(claims[:3], 1):  # Show first 3 per source
                print(f"    {i}. {claim.fact}")
                print(f"       Value: {claim.value}")
                print(f"       Confidence: {claim.confidence:.2f}")
                if claim.contradiction_note:
                    print(f"       ⚠️  {claim.contradiction_note}")
        
        # Timeline
        if profile.timeline:
            print(f"\n📅 TIMELINE ({len(profile.timeline)} events):")
            for event in profile.timeline[:5]:  # Show first 5 events
                print(f"  {event['date']}: {event['event']} - {event['value']}")
        
        # Contradictions
        if profile.contradictions:
            print(f"\n⚠️  CONTRADICTIONS ({len(profile.contradictions)}):")
            for contradiction in profile.contradictions:
                print(f"  • {contradiction['fact']}")
                print(f"    {contradiction['note']}")
        
        print("\n" + "="*80)

async def main():
    """Main function"""
    agent = ModularDeepResearchAgent()
    
    print("🔍 MODULAR DEEP WEB RESEARCH AGENT")
    print("="*50)
    
    # Get person information
    person_name = input("Enter person's full name: ").strip()
    if not person_name:
        print("❌ Person name is required!")
        return
    
    additional_info = input("Enter any additional info you know (school, company, etc.): ").strip()
    
    try:
        # Run research
        profile = await agent.research_person(person_name, additional_info)
        
        # Display results
        agent.display_profile(profile)
        
    except Exception as e:
        print(f"❌ Error during research: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
