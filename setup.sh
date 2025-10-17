#!/bin/bash

# Chrome History Sidepanel - Setup Script
# This script sets up the entire development environment

set -e  # Exit on error

echo "Chrome History Sidepanel - Setup Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found. Creating from .env.example..."
    cp .env.example .env
    echo ".env file created"
else
    echo ".env file exists"
fi
echo ""

# Stop any running containers
echo "Stopping any existing containers..."
docker-compose down -v
echo ""

# Build and start services
echo "Building Docker images..."
docker-compose build
echo ""

echo "Starting services..."
docker-compose up -d
echo ""

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if services are running
echo "Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "Services are running"
else
    echo "Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
echo ""

# Run database migrations
echo "Running database migrations..."
docker-compose exec -T backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec -T backend alembic upgrade head
echo "Database migrations completed"
echo ""

# Test API health
echo "Testing API health..."
sleep 5
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "API is healthy and responding"
else
    echo "API health check returned unexpected response"
fi
echo ""

echo "=========================================="
echo "Setup Complete!"
echo ""
echo "Services running:"
echo "   - FastAPI Backend: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - View API docs: open http://localhost:8000/docs"
echo ""
echo "You're ready to start development!"