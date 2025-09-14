"""
TRA Simple Main - FastAPI Server

A simplified version of the main orchestrator for demonstration purposes.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Talent Resolution Agent (TRA)",
    description="Multi-agent system for candidate data processing and talent assessment",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple data models for demo
class DataSource(BaseModel):
    source_id: str
    source_type: str
    url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class ProcessingRequest(BaseModel):
    sources: List[DataSource]
    processing_options: Optional[Dict[str, Any]] = None

class ProcessingResponse(BaseModel):
    request_id: str
    status: str
    message: str

class ExtraordinaryIndex(BaseModel):
    innovation: float
    adoption: float
    influence: float
    velocity: float
    selectivity: float
    overall_score: float

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Talent Resolution Agent (TRA) is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/",
            "process_candidate": "/process-candidate",
            "status": "/status/{request_id}",
            "candidates": "/candidates",
            "docs": "/docs"
        }
    }

@app.post("/process-candidate", response_model=ProcessingResponse)
async def process_candidate(request: ProcessingRequest):
    """
    Process candidate data through the multi-agent pipeline
    
    This endpoint simulates the complete workflow:
    1. Ingestion and normalization
    2. Extraction and validation
    3. Entity resolution
    4. Contradiction detection
    5. Extraordinary Index calculation
    6. Action planning
    """
    try:
        # Generate request ID
        request_id = f"req_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(request))}"
        
        logger.info(f"Processing candidate data for {len(request.sources)} sources")
        
        # Simulate processing steps
        steps = [
            "Data Ingestion",
            "Extraction & Validation", 
            "Entity Resolution",
            "Contradiction Detection",
            "Extraordinary Index Calculation",
            "Action Planning"
        ]
        
        for step in steps:
            logger.info(f"Processing step: {step}")
            # Simulate processing time
            import time
            time.sleep(0.1)
        
        logger.info(f"Processing completed for request {request_id}")
        
        return ProcessingResponse(
            request_id=request_id,
            status="completed",
            message=f"Successfully processed {len(request.sources)} data sources"
        )
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{request_id}")
async def get_processing_status(request_id: str):
    """Get the current status of a processing request"""
    return {
        "request_id": request_id,
        "status": "completed",
        "progress": 1.0,
        "current_step": "Completed",
        "started_at": datetime.now().isoformat(),
        "completed_at": datetime.now().isoformat()
    }

@app.get("/candidates")
async def get_processed_candidates():
    """Get all processed candidates (demo endpoint)"""
    return [
        {
            "candidate_id": "candidate_demo_1",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "extraordinary_index": {
                "innovation": 0.85,
                "adoption": 0.72,
                "influence": 0.91,
                "velocity": 0.68,
                "selectivity": 0.79,
                "overall_score": 0.79
            },
            "confidence_score": 0.87,
            "source_count": 4,
            "contradictions": 2
        }
    ]

@app.get("/extraordinary-index/{candidate_id}")
async def get_extraordinary_index(candidate_id: str):
    """Get Extraordinary Index for a specific candidate"""
    return ExtraordinaryIndex(
        innovation=0.85,
        adoption=0.72,
        influence=0.91,
        velocity=0.68,
        selectivity=0.79,
        overall_score=0.79
    )

@app.post("/approve-action/{request_id}")
async def approve_action(request_id: str, action_type: str):
    """Human-in-the-loop approval for generated actions"""
    logger.info(f"Action {action_type} approved for request {request_id}")
    return {"message": f"Action {action_type} approved for request {request_id}"}

@app.get("/audit-trail/{request_id}")
async def get_audit_trail(request_id: str):
    """Get complete audit trail for a processing request"""
    return {
        "request_id": request_id,
        "audit_events": [
            {
                "timestamp": datetime.now().isoformat(),
                "event": "processing_started",
                "details": "Multi-agent pipeline initiated"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "event": "processing_completed",
                "details": "All processing steps completed successfully"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Talent Resolution Agent (TRA) Server")
    print("=" * 50)
    print("📡 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/")
    print("👥 Process Candidates: POST http://localhost:8000/process-candidate")
    print("=" * 50)
    
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
