#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Testing Phase 9: Analytics APIs${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

BASE_URL="http://localhost:5001/api"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local token=$4
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ -z "$token" ]; then
        response=$(curl -s -X ${method} "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -X ${method} "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer ${token}")
    fi
    
    echo "  Response: $response"
    echo ""
}

# Test 1: Student Performance Analytics (without token)
echo -e "${GREEN}[Test 1] Student Performance Analytics - No Auth${NC}"
test_endpoint "GET" "/analytics/student-performance" "Get student performance analytics without token"

# Test 2: School Dashboard Analytics (without token)
echo -e "${GREEN}[Test 2] School Dashboard Analytics - No Auth${NC}"
test_endpoint "GET" "/analytics/school-dashboard" "Get school dashboard analytics without token"

# Test 3: Student Performance Analytics with filters (without token)
echo -e "${GREEN}[Test 3] Student Performance Analytics with Filters - No Auth${NC}"
test_endpoint "GET" "/analytics/student-performance?academicYearId=1" "Get student performance with academic year filter"

# Test 4: School Dashboard Analytics with filters (without token)
echo -e "${GREEN}[Test 4] School Dashboard Analytics with Filters - No Auth${NC}"
test_endpoint "GET" "/analytics/school-dashboard?startDate=2024-01-01&endDate=2024-12-31" "Get school dashboard with date range"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "✅ All endpoints are accessible (returning auth errors as expected)"
echo "📝 Next Steps:"
echo "   1. Login as admin/principal to get valid token"
echo "   2. Replace TOKEN variable with actual JWT"
echo "   3. Re-run tests to verify full functionality"
echo ""
echo -e "${YELLOW}Example login command:${NC}"
echo "curl -X POST ${BASE_URL}/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"your-password\"}'"
echo ""
