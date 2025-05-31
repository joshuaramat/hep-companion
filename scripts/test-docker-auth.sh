#!/bin/bash

# Test script for Docker auth setup
set -e

echo "Testing Docker Auth Setup..."
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo -e "\n${YELLOW}1. Checking services...${NC}"
services=("hep-companion-app" "hep-companion-db" "hep-companion-auth" "hep-companion-nginx" "hep-companion-studio" "hep-companion-mailhog")

for service in "${services[@]}"; do
    if docker ps | grep -q "$service"; then
        echo -e "   ✅ $service is running"
    else
        echo -e "   ${RED}❌ $service is not running${NC}"
        exit 1
    fi
done

# Test nginx proxy
echo -e "\n${YELLOW}2. Testing nginx proxy...${NC}"
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "   ✅ Nginx proxy is healthy"
else
    echo -e "   ${RED}❌ Nginx proxy health check failed${NC}"
    exit 1
fi

# Test auth service
echo -e "\n${YELLOW}3. Testing auth service...${NC}"
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/health)
if [ "$AUTH_RESPONSE" = "200" ]; then
    echo -e "   ✅ Auth service is responding"
else
    echo -e "   ${RED}❌ Auth service not responding (HTTP $AUTH_RESPONSE)${NC}"
    exit 1
fi

# Test database connection
echo -e "\n${YELLOW}4. Testing database...${NC}"
if docker exec hep-companion-db pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "   ✅ Database is ready"
else
    echo -e "   ${RED}❌ Database is not ready${NC}"
    exit 1
fi

# Test auth through nginx proxy
echo -e "\n${YELLOW}5. Testing auth through proxy...${NC}"
PROXY_AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/v1/health)
if [ "$PROXY_AUTH_RESPONSE" = "200" ] || [ "$PROXY_AUTH_RESPONSE" = "404" ]; then
    echo -e "   ✅ Auth proxy route is configured"
else
    echo -e "   ${YELLOW}⚠️  Auth proxy returned HTTP $PROXY_AUTH_RESPONSE${NC}"
fi

# Check email service
echo -e "\n${YELLOW}6. Testing email service...${NC}"
if curl -s http://localhost:8025/api/v2/messages | grep -q "total"; then
    echo -e "   ✅ Mailhog is working"
else
    echo -e "   ${RED}❌ Mailhog is not responding${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ All tests passed!${NC}"
echo -e "\nService URLs:"
echo "  - Application: http://localhost:3000"
echo "  - API Gateway: http://localhost:8000"
echo "  - Auth Direct: http://localhost:9999"
echo "  - Database: postgresql://localhost:5432"
echo "  - Studio: http://localhost:3002"
echo "  - Email UI: http://localhost:8025"

echo -e "\n${YELLOW}Note:${NC} Remember to update .env.docker with:"
echo "  - Your actual OpenAI API key"
echo "  - Generate a new JWT_SECRET for production"
echo "" 