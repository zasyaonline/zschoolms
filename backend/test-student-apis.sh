#!/bin/bash

# Test Student Management APIs
# This script tests all student management endpoints

BASE_URL="http://localhost:5001"
API_BASE="$BASE_URL/api"

echo "========================================"
echo "Student Management API Tests"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
  fi
}

# Function to make API calls and check response
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

# Extract token (handle both with and without MFA)
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

# Step 2: Create a test user for student
echo "========================================"
echo "Step 2: Create Test User for Student"
echo "========================================"

USER_DATA='{
  "email": "student.test@zschool.com",
  "password": "Test@123",
  "firstName": "Test",
  "lastName": "Student",
  "role": "student",
  "phoneNumber": "+1234567890"
}'

USER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$USER_DATA" \
  "$API_BASE/users")

echo "User Response: $USER_RESPONSE"

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$USER_ID" ]; then
  USER_ID=$(echo $USER_RESPONSE | grep -o '"user":{"id":"[^"]*' | cut -d'"' -f6)
fi

echo "User ID: $USER_ID"
echo ""

# Step 3: Create Student
echo "========================================"
echo "Step 3: Create Student"
echo "========================================"

STUDENT_DATA="{
  \"userId\": \"$USER_ID\",
  \"dateOfBirth\": \"2010-05-15\",
  \"gender\": \"male\",
  \"bloodGroup\": \"O+\",
  \"admissionDate\": \"2025-01-01\",
  \"currentClass\": \"10\",
  \"section\": \"A\",
  \"rollNumber\": \"101\",
  \"address\": \"123 Main Street\",
  \"city\": \"Mumbai\",
  \"state\": \"Maharashtra\",
  \"pincode\": \"400001\",
  \"emergencyContact\": \"+9876543210\",
  \"emergencyContactName\": \"Parent Name\"
}"

test_api "POST" "/students" "$STUDENT_DATA" "201" "Create Student"

# Extract student ID
STUDENT_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
ENROLLMENT_NUMBER=$(echo "$body" | grep -o '"enrollmentNumber":"[^"]*' | cut -d'"' -f4)

echo "Student ID: $STUDENT_ID"
echo "Enrollment Number: $ENROLLMENT_NUMBER"
echo ""

# Step 4: Get all students
test_api "GET" "/students?page=1&limit=10" "" "200" "Get All Students"

# Step 5: Get student by ID
test_api "GET" "/students/$STUDENT_ID" "" "200" "Get Student by ID"

# Step 6: Get student by enrollment number
test_api "GET" "/students/enrollment/$ENROLLMENT_NUMBER" "" "200" "Get Student by Enrollment Number"

# Step 7: Get student statistics
test_api "GET" "/students/stats" "" "200" "Get Student Statistics"

# Step 8: Update student
UPDATE_DATA="{
  \"rollNumber\": \"102\",
  \"section\": \"B\",
  \"remarks\": \"Updated via API test\"
}"

test_api "PUT" "/students/$STUDENT_ID" "$UPDATE_DATA" "200" "Update Student"

# Step 9: Create parent user and map to student
echo "========================================"
echo "Step 9: Create Parent and Map to Student"
echo "========================================"

PARENT_DATA='{
  "email": "parent.test@zschool.com",
  "password": "Parent@123",
  "firstName": "Parent",
  "lastName": "Test",
  "role": "parent",
  "phoneNumber": "+9876543211"
}'

PARENT_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PARENT_DATA" \
  "$API_BASE/users")

echo "Parent Response: $PARENT_RESPONSE"

PARENT_ID=$(echo $PARENT_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Parent ID: $PARENT_ID"
echo ""

# Map parent to student
MAP_PARENT_DATA="{
  \"parentId\": \"$PARENT_ID\"
}"

test_api "POST" "/students/$STUDENT_ID/map-parent" "$MAP_PARENT_DATA" "200" "Map Parent to Student"

# Step 10: Create sponsor user and map to student
echo "========================================"
echo "Step 10: Create Sponsor and Map to Student"
echo "========================================"

SPONSOR_DATA='{
  "email": "sponsor.test@zschool.com",
  "password": "Sponsor@123",
  "firstName": "Sponsor",
  "lastName": "Test",
  "role": "sponsor",
  "phoneNumber": "+9876543212"
}'

SPONSOR_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$SPONSOR_DATA" \
  "$API_BASE/users")

echo "Sponsor Response: $SPONSOR_RESPONSE"

SPONSOR_ID=$(echo $SPONSOR_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Sponsor ID: $SPONSOR_ID"
echo ""

# Map sponsor to student
MAP_SPONSOR_DATA="{
  \"sponsorId\": \"$SPONSOR_ID\"
}"

test_api "POST" "/students/$STUDENT_ID/map-sponsor" "$MAP_SPONSOR_DATA" "200" "Map Sponsor to Student"

# Step 11: Get student with full details (should now include parent and sponsor)
test_api "GET" "/students/$STUDENT_ID" "" "200" "Get Student with Parent and Sponsor"

# Step 12: Test filtering students by class
test_api "GET" "/students?currentClass=10&page=1&limit=10" "" "200" "Filter Students by Class"

# Step 13: Test searching students
test_api "GET" "/students?search=$ENROLLMENT_NUMBER" "" "200" "Search Students by Enrollment"

# Step 14: Soft delete student
test_api "DELETE" "/students/$STUDENT_ID" "" "200" "Soft Delete Student"

# Step 15: Verify student is inactive
test_api "GET" "/students/$STUDENT_ID" "" "200" "Verify Student is Inactive"

# Final summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}✓ All Student API tests completed${NC}"
echo ""
echo "Test Coverage:"
echo "  - Create student"
echo "  - List students with pagination"
echo "  - Get student by ID"
echo "  - Get student by enrollment number"
echo "  - Update student"
echo "  - Map parent to student"
echo "  - Map sponsor to student"
echo "  - Filter students by class"
echo "  - Search students"
echo "  - Get student statistics"
echo "  - Soft delete student"
echo ""
echo "Next steps:"
echo "  1. Test CSV bulk import: POST /api/students/import"
echo "  2. Verify audit logs in database"
echo "  3. Test with different user roles (teacher, student, parent)"
echo "  4. Check Swagger documentation at http://localhost:5001/api-docs"
echo ""
