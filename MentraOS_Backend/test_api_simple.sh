#!/bin/bash

# Simple API Test Script for MementoAI Backend
# Tests basic functionality without vector operations first

# Configuration
BASE_URL="https://mementoai-backend-528890859039.us-central1.run.app"
USER_ID="test-user-$(date +%s)"
SESSION="test-session-$(date +%s)"

echo "Testing MementoAI API (Simple) with:"
echo "  BASE_URL: $BASE_URL"
echo "  USER_ID: $USER_ID"
echo "  SESSION: $SESSION"
echo ""

# ----- Health Check -----
echo "== Health Check =="
curl -s "$BASE_URL/health" -H "Content-Type: text/plain"
echo; echo

# ----- Test ingestEncounter without vector (should work) -----
NOW_MS="$(python3 -c "import time; print(int(time.time()*1000))")"
echo "== Ingest encounter WITHOUT vector =="
curl -s -X POST "$BASE_URL/ingestEncounter" \
  -H "Content-Type: application/json" \
  -d '{
    "uid":"'"$USER_ID"'",
    "sessionId":"'"$SESSION"'",
    "timestamp": '"$NOW_MS"',
    "location": "HackMIT Career Fair",
    "gps": {"lat": 42.3601, "lng": -71.0942},
    "summary": "Met Paolo at TechCorp booth",
    "transcript": "Hi I am Paolo from TechCorp",
    "rawTranscript": "Hi I am Paolo from TechCorp, nice to meet you",
    "confidence": 87,
    "contactEmail": "paolo@techcorp.com",
    "name": "Paolo Rossi"
  }' | python3 -m json.tool
echo; echo

echo "Simple test completed!"
