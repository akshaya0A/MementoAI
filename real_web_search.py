"""
TRA Real Web Search with Open Web Search and Anthropic API

This version uses proper web search APIs and AI to extract real person information.
"""

import os
import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import anthropic
from open_web_search import OpenWebSearch
import asyncio
import httpx

class RealWebSearcher:
    """Real web searcher using Open Web Search and Anthropic API"""
    
    def __init__(self):
        # Initialize Anthropic client
        self.anthropic_client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        
        # Initialize Open Web Search
        self.web_search = OpenWebSearch()
        
        # HTTP client for additional requests
        self.http_client = httpx.AsyncClient(
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
    
    async def search_person_comprehensive(self, name: str) -> Dict[str, Any]:
        """Comprehensive search for person information using real web search"""
        print(f"🔍 Real web search for: {name}")
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
            "confidence": 0.0,
            "raw_data": []
        }
        
        # Search queries for comprehensive coverage
        search_queries = [
            f'"{name}" email contact information',
            f'"{name}" bio biography about',
            f'"{name}" company job title occupation',
            f'"{name}" location address where',
            f'"{name}" linkedin profile',
            f'"{name}" twitter profile social media',
            f'"{name}" github profile developer',
            f'"{name}" news articles interviews',
            f'"{name}" professional background career'
        ]
        
        # Perform web searches
        all_search_results = []
        for query in search_queries:
            try:
                print(f"🔍 Searching: {query}")
                results = await self._perform_web_search(query)
                all_search_results.extend(results)
                person_info["raw_data"].extend(results)
                
                # Extract information using AI
                extracted_info = await self._extract_info_with_ai(results, name, query)
                if extracted_info:
                    person_info.update(extracted_info)
                
                # Small delay between searches
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"❌ Error searching '{query}': {str(e)}")
        
        # Try specific site searches
        await self._search_specific_sites(name, person_info)
        
        # Use AI to analyze all collected data
        final_analysis = await self._analyze_with_ai(all_search_results, name)
        if final_analysis:
            person_info.update(final_analysis)
        
        # Calculate confidence
        person_info["confidence"] = self._calculate_confidence(person_info)
        
        return person_info
    
    async def _perform_web_search(self, query: str) -> List[Dict[str, Any]]:
        """Perform web search using Open Web Search"""
        try:
            # Use Open Web Search for real search results
            search_results = self.web_search.search(query, num_results=5)
            
            formatted_results = []
            for result in search_results:
                formatted_results.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("snippet", ""),
                    "content": result.get("content", "")
                })
            
            return formatted_results
            
        except Exception as e:
            print(f"❌ Web search error: {str(e)}")
            return []
    
    async def _extract_info_with_ai(self, search_results: List[Dict[str, Any]], name: str, query: str) -> Dict[str, Any]:
        """Use Anthropic AI to extract information from search results"""
        if not search_results:
            return {}
        
        # Prepare context for AI
        context = f"Search query: {query}\nPerson: {name}\n\nSearch results:\n"
        for i, result in enumerate(search_results[:3], 1):  # Use top 3 results
            context += f"{i}. {result['title']}\nURL: {result['url']}\nSnippet: {result['snippet']}\n\n"
        
        prompt = f"""
        You are a data extraction expert. Analyze the following search results for information about "{name}".
        
        {context}
        
        Extract ONLY factual information that is clearly stated in the search results. Do not make assumptions or infer information.
        
        Return a JSON object with the following fields (use null if not found):
        {{
            "email": "extracted email if found",
            "company": "company name if found", 
            "title": "job title or occupation if found",
            "location": "location or address if found",
            "bio": "biography or description if found",
            "social_media": {{
                "linkedin": "linkedin profile if found",
                "twitter": "twitter profile if found", 
                "github": "github profile if found"
            }}
        }}
        
        Be very conservative - only include information that is explicitly stated in the search results.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            # Parse AI response
            ai_response = response.content[0].text
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                extracted_data = json.loads(json_match.group())
                return extracted_data
            
        except Exception as e:
            print(f"❌ AI extraction error: {str(e)}")
        
        return {}
    
    async def _search_specific_sites(self, name: str, person_info: Dict[str, Any]):
        """Search specific sites for person information"""
        print("🔍 Searching specific sites...")
        
        # Clean name for URLs
        clean_name = name.lower().replace(' ', '')
        clean_name_dash = name.lower().replace(' ', '-')
        
        sites_to_check = [
            f"https://github.com/{clean_name}",
            f"https://linkedin.com/in/{clean_name_dash}",
            f"https://twitter.com/{clean_name}",
            f"https://instagram.com/{clean_name}",
            f"https://medium.com/@{clean_name}",
            f"https://dev.to/{clean_name}",
            f"https://stackoverflow.com/users/{clean_name}"
        ]
        
        for site in sites_to_check:
            try:
                print(f"   Checking: {site}")
                response = await self.http_client.get(site, timeout=10)
                
                if response.status_code == 200:
                    # Use AI to extract info from the page
                    page_analysis = await self._analyze_page_with_ai(response.text, site, name)
                    if page_analysis:
                        person_info.update(page_analysis)
                        person_info["sources_found"].append(site)
                        print(f"   ✅ Found information on {site}")
                
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"   ❌ Error checking {site}: {str(e)}")
    
    async def _analyze_page_with_ai(self, page_content: str, url: str, name: str) -> Dict[str, Any]:
        """Use AI to analyze a specific page"""
        # Truncate content if too long
        if len(page_content) > 8000:
            page_content = page_content[:8000] + "..."
        
        prompt = f"""
        Analyze this webpage content for information about "{name}":
        
        URL: {url}
        Content: {page_content}
        
        Extract factual information about this person. Return JSON:
        {{
            "email": "email if found",
            "company": "company if found",
            "title": "job title if found", 
            "location": "location if found",
            "bio": "biography if found"
        }}
        
        Only include information that is clearly stated on this page.
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
    
    async def _analyze_with_ai(self, all_results: List[Dict[str, Any]], name: str) -> Dict[str, Any]:
        """Use AI to analyze all collected data"""
        if not all_results:
            return {}
        
        # Prepare comprehensive context
        context = f"Comprehensive search results for: {name}\n\n"
        for i, result in enumerate(all_results[:10], 1):  # Use top 10 results
            context += f"{i}. {result['title']}\nURL: {result['url']}\nSnippet: {result['snippet']}\n\n"
        
        prompt = f"""
        Analyze all the search results below to extract comprehensive information about "{name}".
        
        {context}
        
        Provide a final analysis with the most reliable information found across all sources.
        Return JSON:
        {{
            "email": "most reliable email found",
            "company": "most reliable company found",
            "title": "most reliable job title found",
            "location": "most reliable location found", 
            "bio": "most reliable biography found",
            "social_media": {{
                "linkedin": "linkedin profile if found",
                "twitter": "twitter profile if found",
                "github": "github profile if found"
            }},
            "confidence_notes": "explanation of confidence level and sources"
        }}
        
        Be conservative and only include information that appears reliable across multiple sources.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
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
    
    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()

async def test_real_search():
    """Test the real web search with AI"""
    print("🚀 TRA Real Web Search with AI")
    print("=" * 40)
    
    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ Error: ANTHROPIC_API_KEY not found in environment variables")
        print("Please set your Anthropic API key in the .env file")
        return
    
    searcher = RealWebSearcher()
    
    try:
        name = input("👤 Enter person's name to search: ").strip()
        if not name:
            name = "Taylor Swift"
            print(f"Using default: {name}")
        
        print(f"\n🔍 Starting real web search for: {name}")
        print("⏳ This will take a few minutes to search and analyze...")
        
        person_info = await searcher.search_person_comprehensive(name)
        
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
    asyncio.run(test_real_search())
