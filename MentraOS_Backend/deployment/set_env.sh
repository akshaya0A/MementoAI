#!/bin/bash

# Set environment variables for MementoAI backend
# Choose one of your available buckets:

# Option 1: Firebase Storage bucket (recommended for Firebase integration)
export BUCKET="mementoai.firebasestorage.app"

# Option 2: Standard GCS bucket (regional)
# export BUCKET="momentoai-bucket"

# Option 3: Standard GCS bucket (multi-region)
# export BUCKET="momentoai-bucket1"

# Set Google Cloud project
export GOOGLE_CLOUD_PROJECT="mementoai"

# Optional: Set port (defaults to 8080)
export PORT=8080

echo "Environment variables set:"
echo "BUCKET=$BUCKET"
echo "GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT"
echo "PORT=$PORT"

# Run the Flask app
python app.py
