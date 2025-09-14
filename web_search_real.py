"""
TRA Real Web Search - Actually searches the web for person information

This version performs real web searches and extracts actual information.
"""

import requests
import json
import re
from datetime import datetime
from urllib.parse import quote_plus
import time
from bs4 import BeautifulSoup

class RealWebSearcher:
    """Real web searcher that actually searches for person information"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def search_person(self, name: str) -> dict:
        """Search for person information across multiple sources"""
        print(f"🔍 Searching for: {name}")
        print("=" * 40)
        
        person_info = {
            "name": name,
            "email": None,
            "company": None,
            "title": None,
            "location": None,
            "bio": None,
            "social_media": {},
            "sources_found": [],
            "search_results": []
        }
        
        # Search queries to try
        search_queries = [
            f'"{name}" email contact',
            f'"{name}" bio about',
            f'"{name}" company job title',
            f'"{name}" location address',
            f'"{name}" linkedin profile',
            f'"{name}" twitter profile',
            f'"{name}" github profile'
        ]
        
        for query in search_queries:
            try:
                print(f"🔍 Searching: {query}")
                results = self._search_google(query)
                person_info["search_results"].extend(results)
                
                # Extract information from search results
                for result in results:
                    extracted_info = self._extract_info_from_result(result, name)
                    if extracted_info:
                        person_info.update(extracted_info)
                        person_info["sources_found"].append(result.get("url", ""))
                
                time.sleep(1)  # Be respectful to search engines
                
            except Exception as e:
                print(f"❌ Error searching '{query}': {str(e)}")
        
        # Try specific sites
        self._search_specific_sites(name, person_info)
        
        return person_info
    
    def _search_google(self, query: str) -> list:
        """Search Google for the query"""
        try:
            # Use a simple search approach
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            response = self.session.get(search_url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                # Extract search results
                for result in soup.find_all('div', class_='g')[:5]:  # Top 5 results
                    title_elem = result.find('h3')
                    link_elem = result.find('a')
                    snippet_elem = result.find('span', class_='st')
                    
                    if title_elem and link_elem:
                        results.append({
                            "title": title_elem.get_text(),
                            "url": link_elem.get('href', ''),
                            "snippet": snippet_elem.get_text() if snippet_elem else ""
                        })
                
                return results
            else:
                print(f"❌ Google search failed: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Error searching Google: {str(e)}")
            return []
    
    def _search_specific_sites(self, name: str, person_info: dict):
        """Search specific sites for person information"""
        sites = [
            f"https://github.com/{name.lower().replace(' ', '')}",
            f"https://linkedin.com/in/{name.lower().replace(' ', '-')}",
            f"https://twitter.com/{name.lower().replace(' ', '')}",
            f"https://instagram.com/{name.lower().replace(' ', '')}"
        ]
        
        for site in sites:
            try:
                print(f"🔍 Checking: {site}")
                response = self.session.get(site, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    extracted_info = self._extract_info_from_page(soup, site, name)
                    if extracted_info:
                        person_info.update(extracted_info)
                        person_info["sources_found"].append(site)
                
                time.sleep(1)
                
            except Exception as e:
                print(f"❌ Error checking {site}: {str(e)}")
    
    def _extract_info_from_result(self, result: dict, name: str) -> dict:
        """Extract information from a search result"""
        info = {}
        text = f"{result.get('title', '')} {result.get('snippet', '')}".lower()
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match and not info.get("email"):
            info["email"] = email_match.group()
        
        # Extract bio/description
        if "bio" in text or "about" in text:
            info["bio"] = result.get("snippet", "")
        
        # Extract company
        company_keywords = ["works at", "company", "ceo", "founder", "director", "manager"]
        for keyword in company_keywords:
            if keyword in text:
                # Try to extract company name
                parts = text.split(keyword)
                if len(parts) > 1:
                    potential_company = parts[1].split()[0:3]  # First few words after keyword
                    if potential_company:
                        info["company"] = " ".join(potential_company)
                        break
        
        return info
    
    def _extract_info_from_page(self, soup: BeautifulSoup, url: str, name: str) -> dict:
        """Extract information from a specific page"""
        info = {}
        
        if "github.com" in url:
            # GitHub specific extraction
            bio_elem = soup.find('div', class_='p-note')
            if bio_elem:
                info["bio"] = bio_elem.get_text().strip()
            
            location_elem = soup.find('span', class_='p-label')
            if location_elem:
                info["location"] = location_elem.get_text().strip()
            
            company_elem = soup.find('span', class_='p-org')
            if company_elem:
                info["company"] = company_elem.get_text().strip()
        
        elif "linkedin.com" in url:
            # LinkedIn specific extraction
            title_elem = soup.find('h1', class_='text-heading-xlarge')
            if title_elem:
                info["title"] = title_elem.get_text().strip()
            
            location_elem = soup.find('span', class_='text-body-small')
            if location_elem:
                info["location"] = location_elem.get_text().strip()
        
        # Extract email from any page
        page_text = soup.get_text()
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, page_text)
        if email_match and not info.get("email"):
            info["email"] = email_match.group()
        
        return info

def test_real_search():
    """Test the real web search functionality"""
    print("🚀 TRA Real Web Search Test")
    print("=" * 40)
    
    searcher = RealWebSearcher()
    
    # Test with a real person
    name = input("👤 Enter person's name to search: ").strip()
    if not name:
        name = "Taylor Swift"
        print(f"Using default: {name}")
    
    print(f"\n🔍 Searching for real information about: {name}")
    print("⏳ This may take a few moments...")
    
    person_info = searcher.search_person(name)
    
    print("\n📊 SEARCH RESULTS")
    print("=" * 30)
    print(f"👤 Name: {person_info['name']}")
    print(f"📧 Email: {person_info['email'] or 'Not found'}")
    print(f"🏢 Company: {person_info['company'] or 'Not found'}")
    print(f"💼 Title: {person_info['title'] or 'Not found'}")
    print(f"📍 Location: {person_info['location'] or 'Not found'}")
    print(f"📝 Bio: {person_info['bio'] or 'Not found'}")
    
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
    test_real_search()
