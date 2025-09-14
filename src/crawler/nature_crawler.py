from typing import List, Dict, Any, Optional
import re
from urllib.parse import urljoin, quote
from .base_crawler import BaseCrawler
from ..models import SourceType
import logging

logger = logging.getLogger(__name__)

class NatureCrawler(BaseCrawler):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_url = "https://www.nature.com"
        self.search_url = "https://www.nature.com/search"
        
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        search_params = {
            'q': query,
            'order': 'relevance'
        }
        
        response = self._make_request(self.search_url, params=search_params)
        if not response:
            return []
        
        soup = self._parse_html(response.text)
        results = []
        
        article_links = soup.find_all('a', href=re.compile(r'/articles/'))
        
        for link in article_links[:max_results]:
            href = link.get('href')
            if href:
                full_url = urljoin(self.base_url, href)
                title_elem = link.find(['h2', 'h3', 'h4']) or link
                title = title_elem.get_text(strip=True) if title_elem else "No title"
                
                results.append({
                    'url': full_url,
                    'title': title,
                    'source_type': SourceType.NATURE
                })
        
        return results
    
    def extract_content(self, url: str) -> Optional[Dict[str, Any]]:
        response = self._make_request(url)
        if not response:
            return None
        
        soup = self._parse_html(response.text)
        
        title = ""
        title_elem = soup.find('h1', class_=re.compile(r'title|headline'))
        if title_elem:
            title = title_elem.get_text(strip=True)
        
        authors = []
        author_elems = soup.find_all(['span', 'a'], class_=re.compile(r'author'))
        for author_elem in author_elems:
            author_name = author_elem.get_text(strip=True)
            if author_name and author_name not in authors:
                authors.append(author_name)
        
        abstract = ""
        abstract_elem = soup.find(['div', 'section'], class_=re.compile(r'abstract'))
        if abstract_elem:
            abstract = abstract_elem.get_text(strip=True)
        
        date_elem = soup.find('time') or soup.find(['span', 'div'], class_=re.compile(r'date|published'))
        pub_date = ""
        if date_elem:
            pub_date = date_elem.get('datetime') or date_elem.get_text(strip=True)
        
        doi = ""
        doi_elem = soup.find(['span', 'a'], class_=re.compile(r'doi'))
        if doi_elem:
            doi = doi_elem.get_text(strip=True)
        
        journal = "Nature"
        journal_elem = soup.find(['span', 'a'], class_=re.compile(r'journal'))
        if journal_elem:
            journal = journal_elem.get_text(strip=True)
        
        return {
            'title': title,
            'authors': authors,
            'abstract': abstract,
            'publication_date': pub_date,
            'doi': doi,
            'journal': journal,
            'raw_html': response.text
        }
