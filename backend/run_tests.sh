#!/bin/bash

# Test runner script for Chrome History Sidepanel backend
# This script runs different test suites based on the argument

set -e

echo "🧪 Chrome History Sidepanel - Test Runner"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default: Run all tests
TEST_TYPE=${1:-all}

case "$TEST_TYPE" in
    "unit")
        echo -e "${YELLOW}Running unit tests only...${NC}"
        pytest tests/unit -v
        ;;
    
    "integration")
        echo -e "${YELLOW}Running integration tests only...${NC}"
        pytest tests/integration -v
        ;;
    
    "coverage")
        echo -e "${YELLOW}Running all tests with coverage report...${NC}"
        pytest --cov=app --cov-report=term-missing --cov-report=html
        echo ""
        echo -e "${GREEN}Coverage report generated in htmlcov/index.html${NC}"
        ;;
    
    "fast")
        echo -e "${YELLOW}Running fast tests only (unit tests)...${NC}"
        pytest tests/unit -v --tb=short
        ;;
    
    "verbose")
        echo -e "${YELLOW}Running all tests with verbose output...${NC}"
        pytest -vv --tb=long
        ;;
    
    "all")
        echo -e "${YELLOW}Running all tests...${NC}"
        pytest tests/ -v
        ;;
    
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Usage: ./run_tests.sh [type]"
        echo ""
        echo "Available types:"
        echo "  all          - Run all tests (default)"
        echo "  unit         - Run unit tests only"
        echo "  integration  - Run integration tests only"
        echo "  coverage     - Run all tests with coverage report"
        echo "  fast         - Run fast tests only"
        echo "  verbose      - Run all tests with verbose output"
        exit 1
        ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Check output above.${NC}"
    exit 1
fi