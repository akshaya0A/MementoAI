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

# ----- Test disabled (no backend connection) -----
echo "== Backend connection disabled =="
echo "No test data will be sent to backend"
echo; echo

echo "Simple test completed!"
