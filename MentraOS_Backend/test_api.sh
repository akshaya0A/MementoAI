#!/bin/bash

# API Test Script for MementoAI Backend
# Tests the face recognition and encounter ingestion workflow

# Configuration
BASE_URL="https://mementoai-backend-528890859039.us-central1.run.app"
USER_ID="test-user-$(date +%s)"
SESSION="test-session-$(date +%s)"
THRESHOLD="0.55"

# No authentication headers needed for this deployment
AUTH_HDR=()

echo "Testing MementoAI API with:"
echo "  BASE_URL: $BASE_URL"
echo "  USER_ID: $USER_ID"
echo "  SESSION: $SESSION"
echo "  THRESHOLD: $THRESHOLD"
echo ""

# ----- Health -----
echo "== Health =="
curl -s "$BASE_URL/health" -H "Content-Type: text/plain" "${AUTH_HDR[@]}"; echo; echo

# ----- Make a dummy 128-dim vector -----
VEC="$(python3 -c "
import random; random.seed(42)
print('[' + ','.join(str(round(random.uniform(-1,1),6)) for _ in range(128)) + ']')
")"
echo "Vector len = $(python3 -c "
import json
vec = $VEC
print(len(vec))
")"

# ----- 1) Identify-only (should be unknown on first run) -----
echo "== Identify (expect unknown first) =="
curl -s -X POST "$BASE_URL/identifyEmbedding" \
  -H "Content-Type: application/json" "${AUTH_HDR[@]/#/-H }" \
  -d '{"uid":"'"$USER_ID"'","vector":'"$VEC"',"k":5,"threshold":'"$THRESHOLD"'}' \
  | sed 's/},{/},\n{/g'; echo; echo

# ----- 2) Ingest an encounter + enroll (with contactEmail) -----
NOW_MS="$(python3 -c "
import time; print(int(time.time()*1000))
")"
echo "== Ingest encounter (will upsert vector & create/link person) =="
curl -s -X POST "$BASE_URL/ingestEncounter" \
  -H "Content-Type: application/json" "${AUTH_HDR[@]/#/-H }" \
  -d '{
    "uid":"'"$USER_ID"'",
    "sessionId":"'"$SESSION"'",
    "timestamp": '"$NOW_MS"',
    "location": "HackMIT Career Fair",
    "gps": {"lat": 42.3601, "lng": -71.0942},
    "summary": "Met Paolo at TechCorp booth",
    "transcript": "Hi I am Paolo...",
    "rawTranscript": "(full transcript here)",
    "confidence": 87,
    "vector": '"$VEC"',
    "contactEmail": "paolo@techcorp.com",
    "name": "Paolo Rossi"
  }' | sed 's/},{/},\n{/g'; echo; echo

# ----- 3) Identify again (should be recognized now) -----
echo "== Identify (expect recognized now) =="
curl -s -X POST "$BASE_URL/identifyEmbedding" \
  -H "Content-Type: application/json" "${AUTH_HDR[@]/#/-H }" \
  -d '{"uid":"'"$USER_ID"'","vector":'"$VEC"',"k":5,"threshold":'"$THRESHOLD"'}' \
  | sed 's/},{/},\n{/g'; echo

echo ""
echo "Test completed!"
