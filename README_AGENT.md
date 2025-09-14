# Deep Web Research Agent

A comprehensive AI-powered research agent that crawls multiple data sources, extracts structured information, cross-validates findings, and presents results through an intuitive web interface.

## Features

- **Multi-Source Crawling**: Searches across NYTimes, IBM press releases, Nature papers, arXiv, and USPTO patents
- **Intelligent Extraction**: Extracts structured information about people, roles, publications, and patents
- **Cross-Validation**: Compares information across sources with confidence scoring and credibility assessment
- **Conflict Resolution**: Handles contradictory information with provenance tracking
- **Human-in-the-Loop**: Web UI with claim cards for human review and approval
- **Temporal Reasoning**: Tracks time-varying facts like employment dates and patent counts

## Architecture

```
src/
├── agent.py                 # Main orchestrator
├── models/
│   └── data_models.py      # Pydantic models for structured data
├── crawler/
│   ├── base_crawler.py     # Abstract base crawler
│   ├── nytimes_crawler.py  # NYTimes article crawler
│   ├── ibm_crawler.py      # IBM press release crawler
│   ├── nature_crawler.py   # Nature publication crawler
│   ├── arxiv_crawler.py    # arXiv paper crawler
│   └── uspto_crawler.py    # USPTO patent crawler
├── extractor/
│   ├── base_extractor.py   # Base extraction functionality
│   └── *_extractor.py      # Source-specific extractors
├── cross_validator/
│   └── validator.py        # Cross-validation and conflict resolution
├── composer/
│   └── profile_composer.py # Profile generation and claim cards
└── ui/
    └── api.py              # FastAPI web interface
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Install ChromeDriver for Selenium (for USPTO crawling):
```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# macOS
brew install chromedriver
```

## Usage

### Command Line Example

Run the example "Dr. Jane Doe" query:

```bash
python run_example.py
```

### Web Interface

Start the web server:

```bash
python -m src.ui.api
```

Then open http://localhost:8000 in your browser.

### Programmatic Usage

```python
from src.agent import DeepResearchAgent

agent = DeepResearchAgent()
result = agent.research("Dr. Jane Doe", max_results_per_source=5)

print(f"Found {result.total_claims} claims")
print(f"High confidence: {result.high_confidence_claims}")
print(f"Conflicts: {result.conflicting_claims}")
```

## Example Output

For the query "Dr. Jane Doe", the system might return:

```
Research Results for: Dr. Jane Doe
Processing Time: 12.34 seconds
Total Claims: 8
High Confidence Claims: 6
Conflicting Claims: 1
Human Review Required: Yes

Claims:
- Dr. Jane Doe is Research Scientist at IBM (confidence: 0.90)
  Sources: IBM press release (credibility: 0.90)
  
- Dr. Jane Doe has 52 patents (confidence: 0.85)
  Sources: IBM press release (credibility: 0.90)
  ⚠️ Contradictory: USPTO records show 48 patents (confidence: 0.88)
  
- Dr. Jane Doe published "Advanced AI Methods" in Nature (confidence: 0.98)
  Sources: Nature (credibility: 0.98)
```

## Configuration

### Source Credibility Scores

The system uses the following credibility scores:

- Nature: 0.98 (highest - peer-reviewed academic journal)
- IBM Press Releases: 0.90 (high - official corporate communications)
- USPTO: 0.88 (high - official government records, but may have name variations)
- NYTimes: 0.85 (high - reputable journalism)
- arXiv: 0.80 (medium-high - preprints, not peer-reviewed)

### Confidence Calculation

Confidence scores are calculated using:
- Source authority (40%)
- Independent corroboration (30%)
- Extraction confidence (20%)
- Recency (10%)

## Testing

Run the test suite:

```bash
python -m pytest tests/
```

Run specific tests:

```bash
python -m pytest tests/test_agent.py
python -m pytest tests/test_cross_validator.py
```

## Handling Edge Cases

### Conflicting Data
- Stores all contradictory claims with provenance
- Presents both versions to users
- Uses verifier LLM prompts for resolution

### Network Issues
- Implements retry logic with exponential backoff
- Graceful degradation when sources are unavailable
- Comprehensive error logging

### Data Quality
- Name normalization and canonicalization
- Language detection and translation support
- Temporal reasoning for time-varying facts

## API Endpoints

- `GET /` - Web interface
- `POST /research` - Start research query
- `GET /results/{search_id}` - Get research results
- `POST /review-claim` - Human review of claims

## Contributing

1. Add new data sources by implementing `BaseCrawler` and `BaseExtractor`
2. Extend cross-validation logic in `CrossValidator`
3. Enhance UI components in the web interface
4. Add comprehensive tests for new functionality

## License

MIT License - see LICENSE file for details.
