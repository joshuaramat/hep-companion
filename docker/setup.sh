#!/bin/bash

# Docker Phase 2 Setup Script
# This script helps set up the local Supabase development environment

set -e

echo "HEP Companion Docker Setup - Phase 2: Supabase"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env.docker exists
if [ -f .env.docker ]; then
    echo ".env.docker already exists"
else
    echo "Creating .env.docker from template..."
    cp docker/env.docker.example .env.docker
    echo "Created .env.docker"
fi

# Check for OpenAI API key
if grep -q "sk-test-replace-with-your-actual-key" .env.docker; then
    echo ""
    echo "Please update your OpenAI API key in .env.docker"
    echo "   Replace 'sk-test-replace-with-your-actual-key' with your actual key"
    echo ""
    read -p "Do you want to enter your OpenAI API key now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenAI API key: " openai_key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/sk-test-replace-with-your-actual-key/$openai_key/g" .env.docker
        else
            # Linux
            sed -i "s/sk-test-replace-with-your-actual-key/$openai_key/g" .env.docker
        fi
        echo "Updated OpenAI API key"
    fi
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p docker/init-db
mkdir -p docker/kong

# Check if ports are available
echo ""
echo "Checking port availability..."
ports=(3000 5432 8000 3002 8025)
ports_in_use=()

for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        ports_in_use+=($port)
    fi
done

if [ ${#ports_in_use[@]} -gt 0 ]; then
    echo "The following ports are already in use:"
    for port in "${ports_in_use[@]}"; do
        echo "   - Port $port"
    done
    echo ""
    echo "Please stop the services using these ports or modify docker/docker-compose.yml"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start services
echo ""
echo "Starting Docker services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose --env-file .env.docker up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."
docker-compose --env-file .env.docker ps

echo ""
echo "Setup complete!"
echo ""
echo "Services available at:"
echo "   - Next.js App:     http://localhost:3000"
echo "   - Supabase Studio: http://localhost:3002"
echo "   - MailHog:         http://localhost:8025"
echo "   - API Gateway:     http://localhost:8000"
echo ""
echo "Useful commands:"
echo "   - View logs:       npm run docker:logs"
echo "   - Stop services:   npm run docker:dev:down"
echo "   - Reset database:  npm run docker:db:reset"
echo "   - Run migrations:  npm run docker:db:migrate"
echo ""
echo "Test credentials:"
echo "   - Email:    test@example.com"
echo "   - Password: password123"
echo "" 