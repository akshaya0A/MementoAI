from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import asyncio
from datetime import datetime

from ..agent import DeepResearchAgent
from ..models import ResearchResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Deep Web Research Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

research_agent = DeepResearchAgent()

class ResearchRequest(BaseModel):
    query: str
    max_results_per_source: int = 5
    sources: Optional[List[str]] = None

class ClaimReviewRequest(BaseModel):
    claim_id: str
    approved: bool
    notes: Optional[str] = None

research_results: Dict[str, ResearchResult] = {}
active_searches: Dict[str, bool] = {}

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Deep Web Research Agent</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .search-box { margin: 20px 0; }
            .search-box input { width: 300px; padding: 10px; }
            .search-box button { padding: 10px 20px; margin-left: 10px; }
            .result { border: 1px solid #ddd; margin: 20px 0; padding: 20px; }
            .claim-card { border: 1px solid #eee; margin: 10px 0; padding: 15px; background: #f9f9f9; }
            .confidence { font-weight: bold; }
            .high-confidence { color: green; }
            .medium-confidence { color: orange; }
            .low-confidence { color: red; }
            .sources { margin-top: 10px; }
            .source { margin: 5px 0; }
            .review-buttons { margin-top: 10px; }
            .review-buttons button { margin-right: 10px; padding: 5px 15px; }
            .approve { background: green; color: white; }
            .reject { background: red; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Deep Web Research Agent</h1>
            <p>Enter a person's name to research their background across multiple sources.</p>
            
            <div class="search-box">
                <input type="text" id="query" placeholder="Enter person name (e.g., Dr. Jane Doe)" />
                <button onclick="startResearch()">Research</button>
            </div>
            
            <div id="status"></div>
            <div id="results"></div>
        </div>
        
        <script>
            async function startResearch() {
                const query = document.getElementById('query').value;
                if (!query) return;
                
                document.getElementById('status').innerHTML = 'Searching...';
                document.getElementById('results').innerHTML = '';
                
                try {
                    const response = await fetch('/research', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: query })
                    });
                    
                    const result = await response.json();
                    
                    if (result.search_id) {
                        pollResults(result.search_id);
                    }
                } catch (error) {
                    document.getElementById('status').innerHTML = 'Error: ' + error.message;
                }
            }
            
            async function pollResults(searchId) {
                try {
                    const response = await fetch(`/results/${searchId}`);
                    const result = await response.json();
                    
                    if (result.status === 'completed') {
                        displayResults(result.data);
                    } else if (result.status === 'running') {
                        document.getElementById('status').innerHTML = 'Processing...';
                        setTimeout(() => pollResults(searchId), 2000);
                    } else {
                        document.getElementById('status').innerHTML = 'Search failed';
                    }
                } catch (error) {
                    document.getElementById('status').innerHTML = 'Error: ' + error.message;
                }
            }
            
            function displayResults(data) {
                document.getElementById('status').innerHTML = 'Search completed';
                
                const resultsDiv = document.getElementById('results');
                
                let html = `
                    <div class="result">
                        <h2>Research Results for: ${data.query}</h2>
                        <p><strong>Processing Time:</strong> ${data.processing_time.toFixed(2)} seconds</p>
                        <p><strong>Total Claims:</strong> ${data.total_claims}</p>
                        <p><strong>High Confidence Claims:</strong> ${data.high_confidence_claims}</p>
                        <p><strong>Conflicting Claims:</strong> ${data.conflicting_claims}</p>
                        <p><strong>Human Review Required:</strong> ${data.human_review_required ? 'Yes' : 'No'}</p>
                        
                        <h3>Claims:</h3>
                `;
                
                // Display claim cards
                data.person.all_claims.forEach(claim => {
                    const confidenceClass = claim.confidence_score >= 0.8 ? 'high-confidence' : 
                                          claim.confidence_score >= 0.6 ? 'medium-confidence' : 'low-confidence';
                    
                    html += `
                        <div class="claim-card">
                            <p><strong>${claim.claim_text}</strong></p>
                            <p class="confidence ${confidenceClass}">Confidence: ${(claim.confidence_score * 100).toFixed(1)}%</p>
                            
                            <div class="sources">
                                <strong>Sources:</strong>
                                ${claim.sources.map(source => `
                                    <div class="source">
                                        <a href="${source.url}" target="_blank">${source.title}</a> 
                                        (${source.source_type}, credibility: ${(source.credibility_score * 100).toFixed(1)}%)
                                    </div>
                                `).join('')}
                            </div>
                            
                            ${claim.supporting_snippets.length > 0 ? `
                                <details>
                                    <summary>Supporting Evidence</summary>
                                    ${claim.supporting_snippets.map(snippet => `<p><em>"${snippet}"</em></p>`).join('')}
                                </details>
                            ` : ''}
                            
                            ${claim.contradictory_claims.length > 0 ? `
                                <div style="background: #ffe6e6; padding: 10px; margin-top: 10px;">
                                    <strong>Contradictory Claims:</strong>
                                    ${claim.contradictory_claims.map(cc => `
                                        <p>${cc.claim_text} (confidence: ${(cc.confidence_score * 100).toFixed(1)}%)</p>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="review-buttons">
                                <button class="approve" onclick="reviewClaim('${claim.claim_text}', true)">Approve</button>
                                <button class="reject" onclick="reviewClaim('${claim.claim_text}', false)">Reject</button>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                resultsDiv.innerHTML = html;
            }
            
            async function reviewClaim(claimId, approved) {
                try {
                    await fetch('/review-claim', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ claim_id: claimId, approved: approved })
                    });
                    
                    alert(approved ? 'Claim approved' : 'Claim rejected');
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
        </script>
    </body>
    </html>
    """

@app.post("/research")
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks):
    search_id = f"search_{datetime.now().timestamp()}"
    active_searches[search_id] = True
    
    background_tasks.add_task(run_research, search_id, request)
    
    return {"search_id": search_id, "status": "started"}

@app.get("/results/{search_id}")
async def get_results(search_id: str):
    if search_id in research_results:
        return {"status": "completed", "data": research_results[search_id]}
    elif search_id in active_searches:
        return {"status": "running"}
    else:
        raise HTTPException(status_code=404, detail="Search not found")

@app.post("/review-claim")
async def review_claim(request: ClaimReviewRequest):
    logger.info(f"Claim {request.claim_id} {'approved' if request.approved else 'rejected'}")
    return {"status": "success"}

async def run_research(search_id: str, request: ResearchRequest):
    try:
        logger.info(f"Starting research for query: {request.query}")
        
        result = await asyncio.to_thread(
            research_agent.research,
            request.query,
            request.max_results_per_source,
            request.sources
        )
        
        research_results[search_id] = result
        
        if search_id in active_searches:
            del active_searches[search_id]
        
        logger.info(f"Research completed for query: {request.query}")
        
    except Exception as e:
        logger.error(f"Research failed for query {request.query}: {e}")
        if search_id in active_searches:
            del active_searches[search_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
