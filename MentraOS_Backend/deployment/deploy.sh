#!/bin/bash

# Deploy MementoAI Flask app to Google Cloud Run

PROJECT_ID="mementoai"
SERVICE_NAME="mementoai-backend"
REGION="us-central1"
BUCKET_NAME="mementoai.firebasestorage.app"

echo "Deploying to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Bucket: $BUCKET_NAME"

# Build and deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --set-env-vars BUCKET=$BUCKET_NAME \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-env-vars GCP_PROJECT=$PROJECT_ID \
  --set-env-vars GCP_LOCATION=$REGION \
  --set-env-vars INDEX_ENDPOINT="projects/528890859039/locations/us-central1/indexEndpoints/4118983862904684544" \
  --set-env-vars DEPLOYED_INDEX_ID="faces_prod" \
  --set-env-vars INDEX_ID="9168398654489231360" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300

echo "Deployment complete!"
echo "Your service will be available at: https://$SERVICE_NAME-[hash]-$REGION.run.app"
