from typing import List, Dict, Any, Optional
import re
from urllib.parse import urljoin
from .base_crawler import BaseCrawler
from ..models import SourceType
import logging

logger = logging.getLogger(__name__)

class IBMCrawler(BaseCrawler):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_url = "https://newsroom.ibm.com"
        self.search_url = "https://newsroom.ibm.com/search"
        
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        search_params = {
            'q': query,
            'type': 'press-release'
        }
        
        response = self._make_request(self.search_url, params=search_params)
        if not response:
            return []
        
        soup = self._parse_html(response.text)
        results = []
        
        article_links = soup.find_all('a', href=re.compile(r'/news/'))
        
        for link in article_links[:max_results]:
            href = link.get('href')
            if href:
                full_url = urljoin(self.base_url, href)
                title_elem = link.find(['h2', 'h3', 'h4']) or link
                title = title_elem.get_text(strip=True) if title_elem else "No title"
                
                results.append({
                    'url': full_url,
                    'title': title,
                    'source_type': SourceType.IBM
                })
        
        return results
    
    def extract_content(self, url: str) -> Optional[Dict[str, Any]]:
        response = self._make_request(url)
        if not response:
            return None
        
        soup = self._parse_html(response.text)
        
        title = ""
        title_elem = soup.find('h1') or soup.find(['h2', 'h3'], class_=re.compile(r'title|headline'))
        if title_elem:
            title = title_elem.get_text(strip=True)
        
        content_sections = soup.find_all(['p', 'div'], class_=re.compile(r'content|body|text'))
        content_text = ""
        for section in content_sections:
            content_text += section.get_text(strip=True) + " "
        
        date_elem = soup.find('time') or soup.find(['span', 'div'], class_=re.compile(r'date|published'))
        pub_date = ""
        if date_elem:
            pub_date = date_elem.get('datetime') or date_elem.get_text(strip=True)
        
        location = ""
        location_elem = soup.find(['span', 'div'], class_=re.compile(r'location|dateline'))
        if location_elem:
            location = location_elem.get_text(strip=True)
        
        return {
            'title': title,
            'content': content_text.strip(),
            'publication_date': pub_date,
            'location': location,
            'raw_html': response.text
        }
