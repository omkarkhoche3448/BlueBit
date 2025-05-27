#!/bin/bash

# Check health of BlueBit services
set -e

# Function to display error message and exit
error_exit() {
    echo "❌ ERROR: $1"
    exit 1
}

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    error_exit "Docker is not installed. Please install Docker first."
fi

if ! docker info &> /dev/null; then
    error_exit "Docker is not running. Please start Docker daemon first."
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    error_exit "docker-compose is not installed. Please install docker-compose first."
fi

# Check if services are running
echo "Checking if services are running..."

if docker-compose ps app | grep -q "Up"; then
    echo "✅ Main app is running"
    
    # Check health endpoint
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "   Health check: OK"
    else
        echo "   Health check: FAILED"
    fi
else
    echo "❌ Main app is not running"
fi

if docker-compose ps microservice | grep -q "Up"; then
    echo "✅ Microservice is running"
    
    # Check health endpoint
    if curl -s http://localhost:5000/health > /dev/null; then
        echo "   Health check: OK"
    else
        echo "   Health check: FAILED"
    fi
else
    echo "❌ Microservice is not running"
fi

# Show container resource usage
echo ""
echo "Resource usage:"
docker stats --no-stream $(docker-compose ps -q)
