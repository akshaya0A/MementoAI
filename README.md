# Talent Resolution Agent (TRA)

A multi-agent AI system that transforms messy candidate data into actionable intelligence through intelligent orchestration, validation, and resolution.

## 🎯 Overview

TRA ingests fragmented candidate data from multiple sources (GitHub, ArXiv, patents, resumes, CRM, PDFs, social media), cleans and validates it, resolves identity conflicts, and produces a calibrated "Extraordinary Index" that drives meaningful recruitment actions.

## 🏗️ Architecture

The system follows a multi-agent architecture with the following components:

1. **Ingestion Agents** - Scrape, OCR, and normalize data from 15+ sources with PII redaction
2. **Extraction Agents** - Validate data using LLM JSON schemas + regex/unit tests
3. **Resolution Graph** - pgvector + fuzzy rules + LLM adjudicator resolve identity conflicts
4. **Contradiction Engine** - Detect and quantify data conflicts with confidence scoring
5. **Extraordinary Index** - Calibrate Innovation + Adoption + Influence + Velocity + Selectivity
6. **Action Planner** - Generate CRM upserts, outreach drafts, evidence packets, O-1 visa packs
7. **Human Console** - Provenance tracking, approve/override, abstain when uncertain

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL with pgvector extension
- Required API keys (see Environment Variables)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AgentDR
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Required API Keys
DEDALUS_API_KEY=your_dedalus_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
SERPAPI_KEY=your_serpapi_key

# Optional API Keys
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_api_key

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/tra_db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Application Settings
LOG_LEVEL=INFO
ENVIRONMENT=development
```

## 📊 API Usage

### Process a Candidate

```bash
curl -X POST "http://localhost:8000/process-candidate" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "candidate_123",
    "data_sources": ["github", "arxiv", "pdfs"],
    "include_social_media": true,
    "priority": "normal"
  }'
```

### Check Candidate Status

```bash
curl "http://localhost:8000/candidate/candidate_123/status"
```

### Approve Actions

```bash
curl -X POST "http://localhost:8000/candidate/candidate_123/approve" \
  -H "Content-Type: application/json" \
  -d '["crm_upsert", "outreach_draft"]'
```

## 🧪 Testing

Run the test suite:

```bash
pytest tests/ -v
```

Run with coverage:

```bash
pytest tests/ --cov=services --cov=schemas
```

## 📈 Extraordinary Index

The Extraordinary Index quantifies candidate potential across five dimensions:

- **Innovation Score (25%)** - Novel contributions and breakthrough work
- **Adoption Score (20%)** - Technology adoption and market impact  
- **Influence Score (25%)** - Community impact and thought leadership
- **Velocity Score (15%)** - Growth trajectory and momentum
- **Selectivity Score (15%)** - Quality over quantity metrics

## 🔍 Data Sources

TRA supports ingestion from multiple data sources:

- **GitHub** - Code repositories, contributions, stars
- **ArXiv** - Research papers, citations, collaborations
- **Patents** - Patent filings, inventors, citations
- **Resumes** - PDF/Word documents, structured data
- **CRM Systems** - Existing candidate records
- **PDFs** - Various document formats
- **Social Media** - Professional profiles, activity

## 🛡️ Privacy & Security

- PII redaction for privacy compliance
- Full audit trail for all decisions
- Human-in-the-loop for high-impact decisions
- Configurable data retention policies

## 🔧 Development

### Code Style

The project uses:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking

Run formatting:

```bash
black .
isort .
flake8 .
mypy .
```

### Adding New Data Sources

1. Create a new ingestion agent in `services/ingestion.py`
2. Implement the `BaseIngestionAgent` interface
3. Add the source to the `DataSource` enum in `schemas/candidate.py`
4. Update the orchestrator to include the new agent

### Adding New Validation Rules

1. Create a new validation agent in `services/extraction.py`
2. Implement the `BaseValidationAgent` interface
3. Add the agent to the extraction orchestrator
4. Update validation configuration as needed

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive API docs
- [Architecture Diagram](TRA_Architecture_Diagram.md) - System architecture
- [Executive Summary](TRA_Executive_Summary.md) - High-level overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/docs`

## 🎯 Roadmap

- [ ] Additional data source integrations
- [ ] Advanced ML models for scoring
- [ ] Real-time data streaming
- [ ] Enterprise SSO integration
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] API rate limiting and quotas
- [ ] Multi-tenant support
