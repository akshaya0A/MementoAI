"""
TRA Anthropic-Powered Web Search

This version uses DuckDuckGo search (free) and Anthropic API for real web searching.
"""

import os
import json
import re
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
import anthropic
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class AnthropicWebSearcher:
    """Web searcher using DuckDuckGo and Anthropic API"""
    
    def __init__(self):
        # Initialize Anthropic client
        self.anthropic_client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        
        # HTTP client for web requests
        self.http_client = httpx.AsyncClient(
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout=30.0
        )
    
    async def search_person(self, name: str) -> Dict[str, Any]:
        """Search for person using DuckDuckGo and analyze with Anthropic"""
        print(f"🔍 Searching for: {name}")
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
        
        # Search queries
        search_queries = [
            f'"{name}" email contact',
            f'"{name}" bio biography about',
            f'"{name}" company job title',
            f'"{name}" location address',
            f'"{name}" linkedin profile',
            f'"{name}" twitter profile',
            f'"{name}" github profile'
        ]
        
        # Perform searches
        all_results = []
        for query in search_queries:
            try:
                print(f"🔍 Searching: {query}")
                results = await self._search_duckduckgo(query)
                all_results.extend(results)
                person_info["search_results"].extend(results)
                
                # Extract info with AI
                if results:
                    extracted = await self._extract_with_ai(results, name, query)
                    if extracted:
                        person_info.update(extracted)
                
                await asyncio.sleep(1)  # Be respectful
                
            except Exception as e:
                print(f"❌ Error searching '{query}': {str(e)}")
        
        # Try specific sites
        await self._search_specific_sites(name, person_info)
        
        # Final AI analysis
        if all_results:
            final_analysis = await self._final_ai_analysis(all_results, name)
            if final_analysis:
                person_info.update(final_analysis)
        
        # Calculate confidence
        person_info["confidence"] = self._calculate_confidence(person_info)
        
        return person_info
    
    async def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        """Search using DuckDuckGo"""
        try:
            # DuckDuckGo search URL
            search_url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
            
            response = await self.http_client.get(search_url)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                results = []
                
                # Extract search results
                for result in soup.find_all('div', class_='result')[:5]:
                    title_elem = result.find('a', class_='result__a')
                    snippet_elem = result.find('a', class_='result__snippet')
                    
                    if title_elem:
                        title = title_elem.get_text().strip()
                        url = title_elem.get('href', '')
                        snippet = snippet_elem.get_text().strip() if snippet_elem else ""
                        
                        results.append({
                            "title": title,
                            "url": url,
                            "snippet": snippet
                        })
                
                return results
            else:
                print(f"❌ DuckDuckGo search failed: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ DuckDuckGo search error: {str(e)}")
            return []
    
    async def _extract_with_ai(self, results: List[Dict[str, Any]], name: str, query: str) -> Dict[str, Any]:
        """Use Anthropic AI to extract information from search results"""
        if not results:
            return {}
        
        # Prepare context
        context = f"Search query: {query}\nPerson: {name}\n\nResults:\n"
        for i, result in enumerate(results[:3], 1):
            context += f"{i}. {result['title']}\nURL: {result['url']}\nSnippet: {result['snippet']}\n\n"
        
        prompt = f"""
        Analyze these search results for information about "{name}".
        
        {context}
        
        Extract ONLY factual information that is clearly stated. Return JSON:
        {{
            "email": "email if found",
            "company": "company if found",
            "title": "job title if found",
            "location": "location if found",
            "bio": "biography if found"
        }}
        
        Be conservative - only include explicitly stated information.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            ai_response = response.content[0].text
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"❌ AI extraction error: {str(e)}")
        
        return {}
    
    async def _search_specific_sites(self, name: str, person_info: Dict[str, Any]):
        """Search specific sites"""
        print("🔍 Checking specific sites...")
        
        clean_name = name.lower().replace(' ', '')
        clean_name_dash = name.lower().replace(' ', '-')
        
        sites = [
            f"https://github.com/{clean_name}",
            f"https://linkedin.com/in/{clean_name_dash}",
            f"https://twitter.com/{clean_name}",
            f"https://instagram.com/{clean_name}",
            f"https://medium.com/@{clean_name}",
            f"https://dev.to/{clean_name}"
        ]
        
        for site in sites:
            try:
                print(f"   Checking: {site}")
                response = await self.http_client.get(site)
                
                if response.status_code == 200:
                    # Use AI to analyze the page
                    page_info = await self._analyze_page_with_ai(response.text, site, name)
                    if page_info:
                        person_info.update(page_info)
                        person_info["sources_found"].append(site)
                        print(f"   ✅ Found info on {site}")
                
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"   ❌ Error checking {site}: {str(e)}")
    
    async def _analyze_page_with_ai(self, content: str, url: str, name: str) -> Dict[str, Any]:
        """Use AI to analyze a specific page"""
        # Truncate if too long
        if len(content) > 6000:
            content = content[:6000] + "..."
        
        prompt = f"""
        Analyze this webpage for information about "{name}":
        
        URL: {url}
        Content: {content}
        
        Extract factual information. Return JSON:
        {{
            "email": "email if found",
            "company": "company if found",
            "title": "job title if found",
            "location": "location if found",
            "bio": "biography if found"
        }}
        
        Only include clearly stated information.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            ai_response = response.content[0].text
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"❌ Page analysis error: {str(e)}")
        
        return {}
    
    async def _final_ai_analysis(self, all_results: List[Dict[str, Any]], name: str) -> Dict[str, Any]:
        """Final AI analysis of all collected data"""
        if not all_results:
            return {}
        
        context = f"All search results for: {name}\n\n"
        for i, result in enumerate(all_results[:8], 1):
            context += f"{i}. {result['title']}\nURL: {result['url']}\nSnippet: {result['snippet']}\n\n"
        
        prompt = f"""
        Analyze all search results to extract the most reliable information about "{name}".
        
        {context}
        
        Provide final analysis with most reliable information found. Return JSON:
        {{
            "email": "most reliable email",
            "company": "most reliable company",
            "title": "most reliable job title",
            "location": "most reliable location",
            "bio": "most reliable biography",
            "confidence_notes": "explanation of confidence and sources"
        }}
        
        Be conservative and only include information that appears reliable.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=800,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            ai_response = response.content[0].text
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"❌ Final analysis error: {str(e)}")
        
        return {}
    
    def _calculate_confidence(self, person_info: Dict[str, Any]) -> float:
        """Calculate confidence score"""
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
    
    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()

async def test_anthropic_search():
    """Test the Anthropic-powered search"""
    print("🚀 TRA Anthropic-Powered Web Search")
    print("=" * 50)
    
    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ Error: ANTHROPIC_API_KEY not found")
        print("Please set your Anthropic API key in the .env file")
        print("Get your API key from: https://console.anthropic.com/")
        return
    
    searcher = AnthropicWebSearcher()
    
    try:
        name = input("👤 Enter person's name to search: ").strip()
        if not name:
            name = "Taylor Swift"
            print(f"Using default: {name}")
        
        print(f"\n🔍 Starting real web search for: {name}")
        print("⏳ Using DuckDuckGo search + Anthropic AI analysis...")
        
        person_info = await searcher.search_person(name)
        
        print("\n📊 REAL SEARCH RESULTS")
        print("=" * 50)
        print(f"👤 Name: {person_info['name']}")
        print(f"📧 Email: {person_info['email'] or 'Not found'}")
        print(f"🏢 Company: {person_info['company'] or 'Not found'}")
        print(f"💼 Title: {person_info['title'] or 'Not found'}")
        print(f"📍 Location: {person_info['location'] or 'Not found'}")
        print(f"📝 Bio: {person_info['bio'] or 'Not found'}")
        print(f"🎯 Confidence: {person_info['confidence']:.2f}")
        
        if person_info.get('confidence_notes'):
            print(f"📋 Notes: {person_info['confidence_notes']}")
        
        print(f"\n🔗 Sources Found: {len(person_info['sources_found'])}")
        for source in person_info['sources_found']:
            print(f"   - {source}")
        
        print(f"\n📋 Search Results: {len(person_info['search_results'])}")
        for i, result in enumerate(person_info['search_results'][:3], 1):
            print(f"   {i}. {result['title']}")
            print(f"      {result['url']}")
            print(f"      {result['snippet'][:100]}...")
            print()
    
    finally:
        await searcher.close()

if __name__ == "__main__":
    asyncio.run(test_anthropic_search())
