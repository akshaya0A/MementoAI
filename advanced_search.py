"""
TRA Advanced Web Search - Multiple search engines and better extraction

This version uses multiple search approaches and better information extraction.
"""

import requests
import json
import re
from datetime import datetime
from urllib.parse import quote_plus, urljoin
import time
from bs4 import BeautifulSoup
import random

class AdvancedWebSearcher:
    """Advanced web searcher with multiple search engines and better extraction"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
    
    def search_person_comprehensive(self, name: str) -> dict:
        """Comprehensive search for person information"""
        print(f"🔍 Comprehensive search for: {name}")
        print("=" * 50)
        
        person_info = {
            "name": name,
            "email": None,
            "company": None,
            "title": None,
            "location": None,
            "bio": None,
            "social_media": {},
            "sources_found": [],
            "search_results": [],
            "confidence": 0.0
        }
        
        # Multiple search strategies
        search_strategies = [
            self._search_direct_sites,
            self._search_news_articles,
            self._search_social_media,
            self._search_professional_sites
        ]
        
        for strategy in search_strategies:
            try:
                strategy(name, person_info)
                time.sleep(random.uniform(1, 3))  # Random delay
            except Exception as e:
                print(f"❌ Error in search strategy: {str(e)}")
        
        # Calculate confidence based on found information
        person_info["confidence"] = self._calculate_confidence(person_info)
        
        return person_info
    
    def _search_direct_sites(self, name: str, person_info: dict):
        """Search direct sites like GitHub, LinkedIn, etc."""
        print("🔍 Searching direct sites...")
        
        # Clean name for URLs
        clean_name = name.lower().replace(' ', '')
        clean_name_dash = name.lower().replace(' ', '-')
        
        sites_to_check = [
            f"https://github.com/{clean_name}",
            f"https://linkedin.com/in/{clean_name_dash}",
            f"https://twitter.com/{clean_name}",
            f"https://instagram.com/{clean_name}",
            f"https://facebook.com/{clean_name}",
            f"https://tiktok.com/@{clean_name}",
            f"https://youtube.com/@{clean_name}",
            f"https://medium.com/@{clean_name}",
            f"https://dev.to/{clean_name}",
            f"https://stackoverflow.com/users/{clean_name}",
            f"https://reddit.com/user/{clean_name}",
            f"https://quora.com/profile/{clean_name}"
        ]
        
        for site in sites_to_check:
            try:
                print(f"   Checking: {site}")
                response = self.session.get(site, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    extracted_info = self._extract_comprehensive_info(soup, site, name)
                    
                    if extracted_info:
                        person_info.update(extracted_info)
                        person_info["sources_found"].append(site)
                        print(f"   ✅ Found information on {site}")
                
                time.sleep(random.uniform(0.5, 1.5))
                
            except Exception as e:
                print(f"   ❌ Error checking {site}: {str(e)}")
    
    def _search_news_articles(self, name: str, person_info: dict):
        """Search news articles and press releases"""
        print("🔍 Searching news articles...")
        
        news_queries = [
            f'"{name}" interview',
            f'"{name}" biography',
            f'"{name}" profile',
            f'"{name}" about',
            f'"{name}" contact',
            f'"{name}" email',
            f'"{name}" company',
            f'"{name}" job title'
        ]
        
        for query in news_queries:
            try:
                # Try different search engines
                results = self._search_duckduckgo(query)
                for result in results:
                    extracted_info = self._extract_from_article(result, name)
                    if extracted_info:
                        person_info.update(extracted_info)
                        person_info["search_results"].append(result)
                
                time.sleep(random.uniform(1, 2))
                
            except Exception as e:
                print(f"   ❌ Error searching news: {str(e)}")
    
    def _search_social_media(self, name: str, person_info: dict):
        """Search social media platforms"""
        print("🔍 Searching social media...")
        
        # Try to find social media profiles
        social_platforms = [
            "twitter.com",
            "instagram.com", 
            "linkedin.com",
            "facebook.com",
            "tiktok.com",
            "youtube.com",
            "medium.com",
            "dev.to"
        ]
        
        for platform in social_platforms:
            try:
                # Search for the person on each platform
                search_url = f"https://{platform}/search?q={quote_plus(name)}"
                response = self.session.get(search_url, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    profiles = self._extract_social_profiles(soup, platform, name)
                    
                    for profile in profiles:
                        person_info["social_media"][platform] = profile
                        person_info["sources_found"].append(profile.get("url", ""))
                
                time.sleep(random.uniform(1, 2))
                
            except Exception as e:
                print(f"   ❌ Error searching {platform}: {str(e)}")
    
    def _search_professional_sites(self, name: str, person_info: dict):
        """Search professional and business sites"""
        print("🔍 Searching professional sites...")
        
        professional_sites = [
            "crunchbase.com",
            "bloomberg.com",
            "forbes.com",
            "techcrunch.com",
            "wired.com",
            "theverge.com",
            "arstechnica.com"
        ]
        
        for site in professional_sites:
            try:
                search_url = f"https://{site}/search?q={quote_plus(name)}"
                response = self.session.get(search_url, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    extracted_info = self._extract_professional_info(soup, site, name)
                    
                    if extracted_info:
                        person_info.update(extracted_info)
                        person_info["sources_found"].append(site)
                
                time.sleep(random.uniform(1, 2))
                
            except Exception as e:
                print(f"   ❌ Error searching {site}: {str(e)}")
    
    def _search_duckduckgo(self, query: str) -> list:
        """Search using DuckDuckGo"""
        try:
            search_url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
            response = self.session.get(search_url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                for result in soup.find_all('div', class_='result')[:5]:
                    title_elem = result.find('a', class_='result__a')
                    snippet_elem = result.find('a', class_='result__snippet')
                    
                    if title_elem:
                        results.append({
                            "title": title_elem.get_text(),
                            "url": title_elem.get('href', ''),
                            "snippet": snippet_elem.get_text() if snippet_elem else ""
                        })
                
                return results
            else:
                return []
                
        except Exception as e:
            print(f"   ❌ DuckDuckGo search error: {str(e)}")
            return []
    
    def _extract_comprehensive_info(self, soup: BeautifulSoup, url: str, name: str) -> dict:
        """Extract comprehensive information from a page"""
        info = {}
        page_text = soup.get_text().lower()
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, page_text)
        if email_match and not info.get("email"):
            info["email"] = email_match.group()
        
        # Extract bio/description
        bio_selectors = [
            'meta[name="description"]',
            'meta[property="og:description"]',
            '.bio', '.about', '.description', '.summary',
            '[data-testid="UserDescription"]',
            '.user-bio', '.profile-bio'
        ]
        
        for selector in bio_selectors:
            bio_elem = soup.select_one(selector)
            if bio_elem:
                bio_text = bio_elem.get_text().strip()
                if bio_text and len(bio_text) > 10:
                    info["bio"] = bio_text
                    break
        
        # Extract location
        location_patterns = [
            r'location[:\s]+([^,\n]+)',
            r'based in[:\s]+([^,\n]+)',
            r'from[:\s]+([^,\n]+)',
            r'lives in[:\s]+([^,\n]+)'
        ]
        
        for pattern in location_patterns:
            location_match = re.search(pattern, page_text)
            if location_match and not info.get("location"):
                info["location"] = location_match.group(1).strip()
                break
        
        # Extract company/title
        if "github.com" in url:
            # GitHub specific
            name_elem = soup.find('span', class_='p-name')
            if name_elem:
                info["title"] = name_elem.get_text().strip()
            
            bio_elem = soup.find('div', class_='p-note')
            if bio_elem:
                info["bio"] = bio_elem.get_text().strip()
        
        elif "linkedin.com" in url:
            # LinkedIn specific
            title_elem = soup.find('h1', class_='text-heading-xlarge')
            if title_elem:
                info["title"] = title_elem.get_text().strip()
        
        return info
    
    def _extract_from_article(self, result: dict, name: str) -> dict:
        """Extract information from an article result"""
        info = {}
        text = f"{result.get('title', '')} {result.get('snippet', '')}".lower()
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match and not info.get("email"):
            info["email"] = email_match.group()
        
        # Extract bio
        if "bio" in text or "about" in text or "profile" in text:
            info["bio"] = result.get("snippet", "")
        
        return info
    
    def _extract_social_profiles(self, soup: BeautifulSoup, platform: str, name: str) -> list:
        """Extract social media profiles"""
        profiles = []
        # This would need platform-specific extraction logic
        return profiles
    
    def _extract_professional_info(self, soup: BeautifulSoup, site: str, name: str) -> dict:
        """Extract professional information"""
        info = {}
        # This would need site-specific extraction logic
        return info
    
    def _calculate_confidence(self, person_info: dict) -> float:
        """Calculate confidence score based on found information"""
        score = 0.0
        
        if person_info.get("email"):
            score += 0.3
        if person_info.get("bio"):
            score += 0.2
        if person_info.get("company"):
            score += 0.2
        if person_info.get("title"):
            score += 0.1
        if person_info.get("location"):
            score += 0.1
        if len(person_info.get("sources_found", [])) > 0:
            score += 0.1
        
        return min(1.0, score)

def test_advanced_search():
    """Test the advanced web search"""
    print("🚀 TRA Advanced Web Search")
    print("=" * 40)
    
    searcher = AdvancedWebSearcher()
    
    name = input("👤 Enter person's name to search: ").strip()
    if not name:
        name = "Taylor Swift"
        print(f"Using default: {name}")
    
    print(f"\n🔍 Starting comprehensive search for: {name}")
    print("⏳ This will take several minutes to search multiple sources...")
    
    person_info = searcher.search_person_comprehensive(name)
    
    print("\n📊 COMPREHENSIVE SEARCH RESULTS")
    print("=" * 50)
    print(f"👤 Name: {person_info['name']}")
    print(f"📧 Email: {person_info['email'] or 'Not found'}")
    print(f"🏢 Company: {person_info['company'] or 'Not found'}")
    print(f"💼 Title: {person_info['title'] or 'Not found'}")
    print(f"📍 Location: {person_info['location'] or 'Not found'}")
    print(f"📝 Bio: {person_info['bio'] or 'Not found'}")
    print(f"🎯 Confidence: {person_info['confidence']:.2f}")
    
    print(f"\n🔗 Sources Found: {len(person_info['sources_found'])}")
    for source in person_info['sources_found']:
        print(f"   - {source}")
    
    print(f"\n📋 Search Results: {len(person_info['search_results'])}")
    for i, result in enumerate(person_info['search_results'][:3], 1):
        print(f"   {i}. {result['title']}")
        print(f"      {result['url']}")
        print(f"      {result['snippet'][:100]}...")
        print()

if __name__ == "__main__":
    test_advanced_search()
