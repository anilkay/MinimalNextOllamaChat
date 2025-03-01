#!/bin/bash

DOCKERFILE_PATH=${1:-Dockerfile}  
TAG=${2:-latest}  

echo "Building Docker image from $DOCKERFILE_PATH with tag: $TAG"

docker build -f "$DOCKERFILE_PATH" -t aanilkay/minimalnextollamachat:$TAG .

docker push aanilkay/minimalnextollamachat:$TAG