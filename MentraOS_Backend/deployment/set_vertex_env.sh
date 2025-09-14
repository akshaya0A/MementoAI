#!/bin/bash

# Vertex AI Vector Search Environment Configuration
# Run this script to set up environment variables for your MementoAI backend

export GCP_PROJECT="mementoai"
export GCP_LOCATION="us-central1"
export INDEX_ENDPOINT="projects/528890859039/locations/us-central1/indexEndpoints/4118983862904684544"
export DEPLOYED_INDEX_ID="faces_streaming_v2"

# Also set the standard environment variables
export GOOGLE_CLOUD_PROJECT="mementoai"
export LOCATION="us-central1"
export PROJECT_ID="mementoai"

# Index and endpoint IDs for reference (updated for streaming index)
export INDEX_ID="7462097345669234688"
export ENDPOINT_ID="4118983862904684544"

# Firebase/Firestore configuration
export BUCKET="mementoai.firebasestorage.app"

echo "Vertex AI Vector Search environment variables set:"
echo "  GCP_PROJECT: $GCP_PROJECT"
echo "  GCP_LOCATION: $GCP_LOCATION"
echo "  INDEX_ENDPOINT: $INDEX_ENDPOINT"
echo "  DEPLOYED_INDEX_ID: $DEPLOYED_INDEX_ID"
echo ""
echo "To use these variables, run: source set_vertex_env.sh"
