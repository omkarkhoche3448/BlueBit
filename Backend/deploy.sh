#!/bin/bash

# Deploy BlueBit Backend with Docker Compose
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

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ Warning: .env file not found!"
    echo "Creating a sample .env file. Please update it with your actual values."
    
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "DATABASE_URL=postgresql://username:password@localhost:5432/database" > .env
        echo "API_SECRET_KEY=your_secret_key" >> .env
        echo "GEMINI_API_KEY=your_gemini_api_key" >> .env
        # Add other required environment variables
    fi
    
    echo "Created .env file. Please edit it with your actual values and run this script again."
    exit 1
fi

# Ensure the resume directory exists
mkdir -p resume

# Pull latest images if they exist
echo "Pulling latest images (if any)..."
docker-compose pull || true

# Build and start the containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if both services are running
echo "Checking if services are running..."

if docker-compose ps app | grep -q "Up"; then
    echo "✅ Main app is running"
else
    echo "❌ Main app failed to start"
    docker-compose logs app
    error_exit "Failed to start main app"
fi

if docker-compose ps microservice | grep -q "Up"; then
    echo "✅ Microservice is running"
else
    echo "❌ Microservice failed to start"
    docker-compose logs microservice
    error_exit "Failed to start microservice"
fi

echo "✅ Deployment completed successfully!"
echo "Main app is running on http://localhost:8000"
echo "Microservice is running on http://localhost:5000"
echo ""
echo "To view logs:"
echo "  - Main app: docker-compose logs -f app"
echo "  - Microservice: docker-compose logs -f microservice"
echo ""
echo "To run tests: docker-compose run app tests"
echo ""
echo "To stop the services: docker-compose down"
