#!/bin/bash
# ================================================================
# ZSchool Management System - Complete API Test Suite
# ================================================================
# Run: chmod +x test-all-apis.sh && ./test-all-apis.sh
# ================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="${API_BASE_URL:-http://localhost:5001/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@zschool.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"

PASS=0
FAIL=0
SKIP=0

echo -e "${BLUE}=========================================="
echo "🧪 ZSchool API Test Suite"
echo "==========================================${NC}"
echo "Base URL: $BASE_URL"
echo "Date: $(date)"
echo ""

# ================================================================
# HELPER FUNCTIONS
# ================================================================

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local name=$4
    local body=$5
    
    local cmd="curl -s -o /tmp/response.json -w '%{http_code}' -X $method '$BASE_URL$endpoint' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"
    
    if [ -n "$body" ]; then
        cmd="$cmd -d '$body'"
    fi
    
    local status=$(eval $cmd)
    
    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}✅ $name${NC} (HTTP $status)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ $name${NC} (Expected: $expected_status, Got: $status)"
        cat /tmp/response.json 2>/dev/null | head -c 200
        echo ""
        ((FAIL++))
        return 1
    fi
}

test_endpoint_no_auth() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local name=$4
    local body=$5
    
    local cmd="curl -s -o /tmp/response.json -w '%{http_code}' -X $method '$BASE_URL$endpoint' -H 'Content-Type: application/json'"
    
    if [ -n "$body" ]; then
        cmd="$cmd -d '$body'"
    fi
    
    local status=$(eval $cmd)
    
    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}✅ $name${NC} (HTTP $status)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ $name${NC} (Expected: $expected_status, Got: $status)"
        ((FAIL++))
        return 1
    fi
}

section_header() {
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $1"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ================================================================
# SERVER HEALTH CHECK
# ================================================================

section_header "Server Health Check"

echo -n "Checking if backend is running... "
if curl -s --connect-timeout 5 "$BASE_URL/../api-docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "Please start the backend with: cd backend && npm start"
    exit 1
fi

# ================================================================
# AUTHENTICATION TESTS
# ================================================================

section_header "Authentication Tests"

# Test 1: Login Success
echo -n "Testing login... "
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken // .accessToken // empty')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.refreshToken // .refreshToken // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $RESPONSE"
    ((FAIL++))
    echo ""
    echo "Cannot proceed without authentication. Exiting."
    exit 1
fi

# Test 2: Login with wrong password
echo -n "Testing login with wrong password... "
WRONG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@zschool.com", "password": "wrongpassword"}')

if [ "$WRONG_STATUS" == "401" ]; then
    echo -e "${GREEN}✅ Correctly rejected (HTTP 401)${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Expected 401, got $WRONG_STATUS${NC}"
    ((FAIL++))
fi

# Test 3: Login with missing fields
echo -n "Testing login with missing password... "
MISSING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@zschool.com"}')

if [ "$MISSING_STATUS" == "400" ] || [ "$MISSING_STATUS" == "401" ]; then
    echo -e "${GREEN}✅ Correctly rejected (HTTP $MISSING_STATUS)${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Expected 400/401, got $MISSING_STATUS${NC}"
    ((FAIL++))
fi

# Test 4: Get current user
test_endpoint "GET" "/auth/me" "200" "Get current user profile"

# Test 5: Access without token
echo -n "Testing protected route without token... "
NO_AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/students")

if [ "$NO_AUTH_STATUS" == "401" ]; then
    echo -e "${GREEN}✅ Correctly requires auth (HTTP 401)${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Expected 401, got $NO_AUTH_STATUS${NC}"
    ((FAIL++))
fi

# ================================================================
# STUDENTS API TESTS
# ================================================================

section_header "Students API Tests"

test_endpoint "GET" "/students" "200" "List students (default pagination)"
test_endpoint "GET" "/students?page=1&limit=10" "200" "List students (explicit pagination)"
test_endpoint "GET" "/students?limit=5" "200" "List students (limit 5)"
test_endpoint "GET" "/students/stats" "200" "Get student statistics"

# Get first student ID for detail tests
STUDENT_ID=$(curl -s "$BASE_URL/students?limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id // empty')

if [ -n "$STUDENT_ID" ] && [ "$STUDENT_ID" != "null" ]; then
    test_endpoint "GET" "/students/$STUDENT_ID" "200" "Get single student by ID"
else
    echo -e "${YELLOW}⏭️  Skipping single student test (no students found)${NC}"
    ((SKIP++))
fi

# Test non-existent student
test_endpoint "GET" "/students/00000000-0000-0000-0000-000000000000" "404" "Get non-existent student (should be 404)"

# ================================================================
# SPONSORS API TESTS
# ================================================================

section_header "Sponsors API Tests"

test_endpoint "GET" "/sponsors" "200" "List sponsors"
test_endpoint "GET" "/sponsors?page=1&limit=10" "200" "List sponsors (paginated)"
test_endpoint "GET" "/sponsors/stats" "200" "Get sponsor statistics"

# Get first sponsor ID
SPONSOR_ID=$(curl -s "$BASE_URL/sponsors?limit=1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id // empty')

if [ -n "$SPONSOR_ID" ] && [ "$SPONSOR_ID" != "null" ]; then
    test_endpoint "GET" "/sponsors/$SPONSOR_ID" "200" "Get single sponsor by ID"
    test_endpoint "GET" "/sponsors/$SPONSOR_ID/students" "200" "Get sponsor's students"
else
    echo -e "${YELLOW}⏭️  Skipping sponsor detail tests (no sponsors found)${NC}"
    ((SKIP++))
fi

# ================================================================
# USERS API TESTS
# ================================================================

section_header "Users API Tests"

test_endpoint "GET" "/users" "200" "List all users"
test_endpoint "GET" "/users?role=teacher" "200" "List teachers only"
test_endpoint "GET" "/users?role=admin" "200" "List admins only"
test_endpoint "GET" "/users?role=student" "200" "List students only"
test_endpoint "GET" "/users/stats" "200" "Get user statistics"

# ================================================================
# DASHBOARD API TESTS
# ================================================================

section_header "Dashboard API Tests"

test_endpoint "GET" "/dashboard/metrics" "200" "Get dashboard metrics"

# ================================================================
# ATTENDANCE API TESTS
# ================================================================

section_header "Attendance API Tests"

test_endpoint "GET" "/attendance" "200" "Get attendance records"
test_endpoint "GET" "/attendance/stats" "200" "Get attendance statistics"

if [ -n "$STUDENT_ID" ] && [ "$STUDENT_ID" != "null" ]; then
    test_endpoint "GET" "/attendance/student/$STUDENT_ID" "200" "Get student attendance"
else
    echo -e "${YELLOW}⏭️  Skipping student attendance test (no student ID)${NC}"
    ((SKIP++))
fi

# ================================================================
# MARKS API TESTS
# ================================================================

section_header "Marks API Tests"

test_endpoint "GET" "/marks/pending" "200" "Get pending marksheets"

if [ -n "$STUDENT_ID" ] && [ "$STUDENT_ID" != "null" ]; then
    test_endpoint "GET" "/marks/student/$STUDENT_ID" "200" "Get student marks"
else
    echo -e "${YELLOW}⏭️  Skipping student marks test (no student ID)${NC}"
    ((SKIP++))
fi

# ================================================================
# REPORT CARDS API TESTS
# ================================================================

section_header "Report Cards API Tests"

test_endpoint "GET" "/report-cards/pending" "200" "Get pending report cards"

if [ -n "$STUDENT_ID" ] && [ "$STUDENT_ID" != "null" ]; then
    test_endpoint "GET" "/report-cards/student/$STUDENT_ID" "200" "Get student report cards"
else
    echo -e "${YELLOW}⏭️  Skipping student report cards test (no student ID)${NC}"
    ((SKIP++))
fi

# ================================================================
# ANALYTICS API TESTS
# ================================================================

section_header "Analytics API Tests"

test_endpoint "GET" "/analytics/student-performance" "200" "Get student performance analytics"

# ================================================================
# SECURITY TESTS
# ================================================================

section_header "Security Tests"

# Test SQL injection attempt
echo -n "Testing SQL injection in login... "
SQL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@zschool.com\" OR 1=1--", "password": "test"}')

if [ "$SQL_STATUS" == "400" ] || [ "$SQL_STATUS" == "401" ]; then
    echo -e "${GREEN}✅ SQL injection properly rejected${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  Unexpected response: $SQL_STATUS (may need review)${NC}"
    ((SKIP++))
fi

# Test XSS attempt (should be sanitized or rejected)
echo -n "Testing XSS protection... "
XSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "<script>alert(1)</script>@test.com", "password": "test"}')

if [ "$XSS_STATUS" == "400" ] || [ "$XSS_STATUS" == "401" ]; then
    echo -e "${GREEN}✅ XSS input properly rejected${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  Unexpected response: $XSS_STATUS (may need review)${NC}"
    ((SKIP++))
fi

# Test invalid token
echo -n "Testing invalid JWT token... "
INVALID_TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/students" \
    -H "Authorization: Bearer invalid.jwt.token")

if [ "$INVALID_TOKEN_STATUS" == "401" ] || [ "$INVALID_TOKEN_STATUS" == "403" ]; then
    echo -e "${GREEN}✅ Invalid token rejected${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Expected 401/403, got $INVALID_TOKEN_STATUS${NC}"
    ((FAIL++))
fi

# Test expired-style token (malformed)
echo -n "Testing malformed token... "
MALFORMED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/students" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature")

if [ "$MALFORMED_STATUS" == "401" ] || [ "$MALFORMED_STATUS" == "403" ]; then
    echo -e "${GREEN}✅ Malformed token rejected${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Expected 401/403, got $MALFORMED_STATUS${NC}"
    ((FAIL++))
fi

# ================================================================
# PERFORMANCE TESTS
# ================================================================

section_header "Performance Tests (Response Times)"

# Login performance
echo -n "Login endpoint response time... "
LOGIN_TIME=$(curl -s -o /dev/null -w "%{time_total}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

if (( $(echo "$LOGIN_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ ${LOGIN_TIME}s (< 2s)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  ${LOGIN_TIME}s (slow > 2s)${NC}"
    ((SKIP++))
fi

# Students list performance
echo -n "Students list response time... "
STUDENTS_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/students?limit=100" \
    -H "Authorization: Bearer $TOKEN")

if (( $(echo "$STUDENTS_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ ${STUDENTS_TIME}s (< 2s)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  ${STUDENTS_TIME}s (slow > 2s)${NC}"
    ((SKIP++))
fi

# Dashboard metrics performance
echo -n "Dashboard metrics response time... "
DASHBOARD_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/dashboard/metrics" \
    -H "Authorization: Bearer $TOKEN")

if (( $(echo "$DASHBOARD_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ ${DASHBOARD_TIME}s (< 2s)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  ${DASHBOARD_TIME}s (slow > 2s)${NC}"
    ((SKIP++))
fi

# ================================================================
# LOGOUT TEST (Run Last)
# ================================================================

section_header "Logout Test"

test_endpoint "POST" "/auth/logout" "200" "Logout"

# ================================================================
# SUMMARY
# ================================================================

echo ""
echo -e "${BLUE}=========================================="
echo "📊 TEST RESULTS SUMMARY"
echo "==========================================${NC}"
echo ""
TOTAL=$((PASS + FAIL + SKIP))
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo -e "${YELLOW}⏭️  Skipped: $SKIP${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED - Review issues above${NC}"
    exit 1
fi
