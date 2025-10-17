#!/bin/bash

# API Testing Script - Chrome History Sidepanel
# Tests all backend endpoints

echo "🧪 Chrome History Sidepanel - API Testing"
echo "=========================================="
echo ""

API_URL="http://localhost:8000"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "1️. Testing Health Check Endpoint"
echo "-----------------------------------"
test_endpoint "Health Check" "GET" "/health" "" "200"
echo ""

echo "2️. Testing Root Endpoint"
echo "-----------------------------------"
test_endpoint "Root Endpoint" "GET" "/" "" "200"
echo ""

echo "3️. Testing Create Visit Endpoints"
echo "-----------------------------------"

# Test creating visit for UHCprovider.com
test_endpoint "Create Visit - UHCprovider" "POST" "/api/visits" \
'{
  "url": "https://www.uhcprovider.com/en/health-plans.html",
  "link_count": 142,
  "word_count": 2450,
  "image_count": 18
}' "201"

# Test creating visit for Aetna
test_endpoint "Create Visit - Aetna" "POST" "/api/visits" \
'{
  "url": "https://www.aetna.com/health-care-professionals/clinical-policy-bulletins/ustekinumab.html",
  "link_count": 87,
  "word_count": 3200,
  "image_count": 5
}' "201"

# Test creating another visit to same URL
test_endpoint "Create Visit - Duplicate URL" "POST" "/api/visits" \
'{
  "url": "https://www.uhcprovider.com/en/health-plans.html",
  "link_count": 145,
  "word_count": 2480,
  "image_count": 19
}' "201"

echo ""

echo "4️. Testing Get Visits Endpoints"
echo "-----------------------------------"

# URL encode the test URL
ENCODED_URL=$(echo "https://www.uhcprovider.com/en/health-plans.html" | jq -sRr @uri)
test_endpoint "Get Visits by URL" "GET" "/api/visits/url/$ENCODED_URL" "" "200"

test_endpoint "Get Latest Visit" "GET" "/api/visits/url/$ENCODED_URL/latest" "" "200"

test_endpoint "Get All Visits" "GET" "/api/visits?limit=10" "" "200"

echo ""

echo "5️. Testing Error Handling"
echo "-----------------------------------"

# Test with invalid URL (should return 404)
test_endpoint "Get Non-existent URL" "GET" "/api/visits/url/https%3A%2F%2Fnonexistent-url-test.com" "" "404"

echo ""

echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi