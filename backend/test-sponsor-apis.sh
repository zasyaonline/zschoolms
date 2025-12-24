#!/bin/bash

# Test Sponsor Management APIs
# Phase 4: Sponsors Management

BASE_URL="http://localhost:5001"
API_BASE="$BASE_URL/api"

echo "========================================"
echo "Sponsor Management API Tests"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
  fi
}

# Function to make API calls
test_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  echo -e "\n${BLUE}Testing: $description${NC}"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method \
      -H "Authorization: Bearer $TOKEN" \
      "$API_BASE$endpoint")
  elif [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data" \
      "$API_BASE$endpoint")
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method \
      -H "Authorization: Bearer $TOKEN" \
      "$API_BASE$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  echo "Response: $body" | head -c 500
  
  if [ "$http_code" = "$expected_status" ]; then
    print_result 0 "Status code: $http_code (expected $expected_status)"
    echo "$body"
  else
    print_result 1 "Status code: $http_code (expected $expected_status)"
    echo "$body"
  fi
  
  echo ""
}

# Step 1: Login as admin
echo "========================================"
echo "Step 1: Admin Login"
echo "========================================"

LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "admin@zasyaonline.com",
    "password": "Admin@123"
  }' \
  "$API_BASE/auth/login")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get authentication token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Successfully authenticated${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create Sponsor (Individual)
echo "========================================"
echo "Step 2: Create Individual Sponsor"
echo "========================================"

SPONSOR1_DATA='{
  "name": "John Doe",
  "email": "john.doe@email.com",
  "phoneNumber": "+1234567890",
  "country": "USA",
  "sponsorshipType": "individual",
  "status": "active",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "notes": "Individual sponsor, monthly donations"
}'

test_api "POST" "/sponsors" "$SPONSOR1_DATA" "201" "Create Individual Sponsor"

SPONSOR1_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Sponsor 1 ID: $SPONSOR1_ID"
echo ""

# Step 3: Create Sponsor (Organization)
echo "========================================"
echo "Step 3: Create Organization Sponsor"
echo "========================================"

SPONSOR2_DATA='{
  "name": "Global Education Foundation",
  "email": "contact@globaledu.org",
  "phoneNumber": "+9876543210",
  "country": "UK",
  "organization": "Global Education Foundation",
  "sponsorshipType": "organization",
  "status": "active",
  "city": "London",
  "notes": "Large organization, sponsors multiple students"
}'

test_api "POST" "/sponsors" "$SPONSOR2_DATA" "201" "Create Organization Sponsor"

SPONSOR2_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Sponsor 2 ID: $SPONSOR2_ID"
echo ""

# Step 4: Get all sponsors
test_api "GET" "/sponsors?page=1&limit=10" "" "200" "Get All Sponsors"

# Step 5: Get sponsor by ID
test_api "GET" "/sponsors/$SPONSOR1_ID" "" "200" "Get Sponsor 1 by ID"

# Step 6: Get sponsor statistics
test_api "GET" "/sponsors/stats" "" "200" "Get Sponsor Statistics"

# Step 7: Update sponsor
UPDATE_SPONSOR_DATA='{
  "phoneNumber": "+1234567899",
  "notes": "Updated contact number"
}'

test_api "PUT" "/sponsors/$SPONSOR1_ID" "$UPDATE_SPONSOR_DATA" "200" "Update Sponsor"

# Step 8: Create a student for mapping
echo "========================================"
echo "Step 8: Create Test Student"
echo "========================================"

# First create user for student
USER_DATA='{
  "email": "test.student1@zschool.com",
  "password": "Test@123",
  "firstName": "Test",
  "lastName": "Student1",
  "role": "student",
  "phoneNumber": "+1111111111"
}'

USER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$USER_DATA" \
  "$API_BASE/users")

echo "User Response: $USER_RESPONSE"

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "User ID: $USER_ID"

# Create student
STUDENT_DATA="{
  \"userId\": \"$USER_ID\",
  \"dateOfBirth\": \"2010-06-15\",
  \"gender\": \"female\",
  \"bloodGroup\": \"A+\",
  \"admissionDate\": \"2025-01-01\",
  \"currentClass\": \"9\",
  \"section\": \"A\",
  \"rollNumber\": \"201\",
  \"address\": \"456 School Street\",
  \"city\": \"Boston\",
  \"state\": \"MA\",
  \"pincode\": \"02101\",
  \"emergencyContact\": \"+2222222222\",
  \"emergencyContactName\": \"Parent Name\"
}"

STUDENT_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$STUDENT_DATA" \
  "$API_BASE/students")

echo "Student Response: $STUDENT_RESPONSE"

STUDENT_ID=$(echo $STUDENT_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Student ID: $STUDENT_ID"
echo ""

# Step 9: Map sponsor to student
echo "========================================"
echo "Step 9: Map Sponsor to Student"
echo "========================================"

MAP_DATA="{
  \"studentId\": \"$STUDENT_ID\",
  \"sponsorshipType\": \"full\",
  \"startDate\": \"2025-01-01\",
  \"endDate\": \"2025-12-31\",
  \"amount\": 500.00,
  \"currency\": \"USD\",
  \"notes\": \"Full sponsorship for academic year 2025\"
}"

test_api "POST" "/sponsors/$SPONSOR1_ID/map-student" "$MAP_DATA" "201" "Map Sponsor to Student"

MAPPING_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Mapping ID: $MAPPING_ID"
echo ""

# Step 10: Get sponsor's students
test_api "GET" "/sponsors/$SPONSOR1_ID/students" "" "200" "Get Sponsor's Students"

# Step 11: Get sponsor by ID (should now show mapped student)
test_api "GET" "/sponsors/$SPONSOR1_ID" "" "200" "Get Sponsor with Mapped Students"

# Step 12: Update sponsorship mapping
UPDATE_MAPPING_DATA='{
  "amount": 600.00,
  "notes": "Increased sponsorship amount"
}'

test_api "PUT" "/sponsors/mapping/$MAPPING_ID" "$UPDATE_MAPPING_DATA" "200" "Update Sponsorship Mapping"

# Step 13: Filter sponsors by country
test_api "GET" "/sponsors?country=USA" "" "200" "Filter Sponsors by Country"

# Step 14: Search sponsors
test_api "GET" "/sponsors?search=john" "" "200" "Search Sponsors"

# Step 15: Test duplicate mapping (should fail)
echo "========================================"
echo "Step 15: Test Duplicate Mapping (Should Fail)"
echo "========================================"

test_api "POST" "/sponsors/$SPONSOR1_ID/map-student" "$MAP_DATA" "409" "Attempt Duplicate Mapping"

# Step 16: Terminate sponsorship
TERMINATE_DATA='{
  "reason": "Student graduated"
}'

test_api "POST" "/sponsors/mapping/$MAPPING_ID/terminate" "$TERMINATE_DATA" "200" "Terminate Sponsorship"

# Step 17: Try to delete sponsor with active mappings (this should work now since we terminated)
# But let's try with sponsor2 who has no mappings
test_api "DELETE" "/sponsors/$SPONSOR2_ID" "" "200" "Delete Sponsor Without Mappings"

# Final summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}✓ All Sponsor API tests completed${NC}"
echo ""
echo "Test Coverage:"
echo "  ✓ Create sponsor (individual)"
echo "  ✓ Create sponsor (organization)"
echo "  ✓ List sponsors with pagination"
echo "  ✓ Get sponsor by ID"
echo "  ✓ Update sponsor"
echo "  ✓ Map sponsor to student"
echo "  ✓ Get sponsor's students"
echo "  ✓ Update sponsorship mapping"
echo "  ✓ Filter sponsors by country"
echo "  ✓ Search sponsors"
echo "  ✓ Get sponsor statistics"
echo "  ✓ Terminate sponsorship"
echo "  ✓ Delete sponsor"
echo "  ✓ Duplicate mapping prevention"
echo ""
echo "Endpoints Tested:"
echo "  POST   /api/sponsors"
echo "  GET    /api/sponsors"
echo "  GET    /api/sponsors/stats"
echo "  GET    /api/sponsors/:id"
echo "  PUT    /api/sponsors/:id"
echo "  DELETE /api/sponsors/:id"
echo "  POST   /api/sponsors/:sponsorId/map-student"
echo "  GET    /api/sponsors/:sponsorId/students"
echo "  PUT    /api/sponsors/mapping/:mappingId"
echo "  POST   /api/sponsors/mapping/:mappingId/terminate"
echo ""
echo "Next steps:"
echo "  1. Verify audit logs in database"
echo "  2. Check sponsor student counts are auto-updated"
echo "  3. Test with different user roles"
echo "  4. Check Swagger documentation at http://localhost:5001/api-docs"
echo ""
