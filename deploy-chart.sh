
#! /bin/bash

PROJECT_ID=digital-ucdavis-edu
GCR_PROJECT_ID=ucdlib-pubreg

CONTAINER_NAME=casita-thermal-px-chart
DEPLOYMENT_NAME=$CONTAINER_NAME
IMAGE=gcr.io/$GCR_PROJECT_ID/$CONTAINER_NAME

npm install

cd client/public
npm install

cd ../..
npm run dist

gcloud config set project $PROJECT_ID
gcloud builds submit --tag $IMAGE

gcloud beta run deploy $DEPLOYMENT_NAME \
  --image $IMAGE \
  --platform managed \
  --memory=1Gi \
  --region=us-central1 \
  --set-env-vars=MAIN_HTML_FILE=event-chart.html