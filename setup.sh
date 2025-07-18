#!/bin/bash

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
    echo "LANGSMITH_API_KEY=your_langsmith_api_key_here" >> .env
    echo "TAVILY_API_KEY=your_tavily_api_key_here" >> .env
    echo ".env file created - please edit and add your API keys"
fi

# Build and start services
echo "Building and starting services..."
docker-compose build
docker-compose up -d

echo "Services started:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  Agent:    http://localhost:2024"