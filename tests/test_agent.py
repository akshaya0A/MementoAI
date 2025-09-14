import unittest
from unittest.mock import Mock, patch
from datetime import datetime

from src.agent import DeepResearchAgent
from src.models.data_models import SourceType, Source, Claim

class TestDeepResearchAgent(unittest.TestCase):
    def setUp(self):
        self.agent = DeepResearchAgent()
    
    def test_agent_initialization(self):
        self.assertIsNotNone(self.agent.crawlers)
        self.assertIsNotNone(self.agent.extractors)
        self.assertIsNotNone(self.agent.cross_validator)
        self.assertIsNotNone(self.agent.composer)
        
        for source_type in SourceType:
            self.assertIn(source_type, self.agent.crawlers)
            self.assertIn(source_type, self.agent.extractors)
    
    @patch('src.crawler.nytimes_crawler.NYTimesCrawler.crawl')
    @patch('src.crawler.ibm_crawler.IBMCrawler.crawl')
    @patch('src.crawler.nature_crawler.NatureCrawler.crawl')
    @patch('src.crawler.arxiv_crawler.ArxivCrawler.crawl')
    @patch('src.crawler.uspto_crawler.USPTOCrawler.crawl')
    def test_research_pipeline(self, mock_uspto, mock_arxiv, mock_nature, mock_ibm, mock_nytimes):
        mock_result = {
            'url': 'https://example.com/test',
            'title': 'Test Article',
            'content': 'Dr. Jane Doe is a Research Scientist at IBM with 52 patents.',
            'raw_html': '<html>test</html>'
        }
        
        mock_nytimes.return_value = [mock_result]
        mock_ibm.return_value = [mock_result]
        mock_nature.return_value = [mock_result]
        mock_arxiv.return_value = [mock_result]
        mock_uspto.return_value = [mock_result]
        
        result = self.agent.research("Dr. Jane Doe", max_results_per_source=1)
        
        self.assertIsNotNone(result)
        self.assertEqual(result.query, "Dr. Jane Doe")
        self.assertGreater(result.processing_time, 0)
        self.assertIsInstance(result.sources_searched, list)
        
        mock_nytimes.assert_called_once()
        mock_ibm.assert_called_once()
        mock_nature.assert_called_once()
        mock_arxiv.assert_called_once()
        mock_uspto.assert_called_once()
    
    def test_source_credibility_scores(self):
        expected_scores = {
            SourceType.NATURE: 0.98,
            SourceType.IBM: 0.9,
            SourceType.USPTO: 0.88,
            SourceType.NYTIMES: 0.85,
            SourceType.ARXIV: 0.8
        }
        
        for source_type, expected_score in expected_scores.items():
            self.assertEqual(self.agent.source_credibility[source_type], expected_score)

if __name__ == '__main__':
    unittest.main()
