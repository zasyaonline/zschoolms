#!/bin/bash

# Direct test of sponsor APIs by creating a test teacher user (no MFA required)

BASE_URL="http://localhost:5001/api"

echo "=========================================="
echo "Direct Sponsor API Test"
echo "=========================================="
echo ""

# Step 1: Login as admin to create a test user
echo "Step 1: Login as admin"
ADMIN_LOGIN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "admin@zasyaonline.com",
    "password": "Admin@123"
  }' \
  "$BASE_URL/auth/login")

TEMP_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"tempToken":"[^"]*' | cut -d'"' -f4)

# Get MFA code from server logs (last 20 lines)
sleep 1
echo "Getting MFA code from logs..."
cd /Users/zasyaonline/Projects/zschoolms/backend
MFA_CODE=$(tail -50 server.log | grep -o 'code: [0-9]\{6\}' | tail -1 | cut -d' ' -f2)
echo "MFA Code: $MFA_CODE"

if [ -z "$MFA_CODE" ]; then
  # Try alternative: Get from email sent message
  MFA_CODE=$(tail -100 server.log | grep -A 10 "📧 Email Content" | grep -o '[0-9]\{6\}' | head -1)
  echo "MFA Code (from email content): $MFA_CODE"
fi

#If still no code, generate a manual curl test with known token
if [ -z "$MFA_CODE" ]; then
  echo "Cannot get MFA code automatically. Using manual approach..."
  
  # Create a test endpoint to check if sponsor routes are working
  echo ""
  echo "=========================================="
  echo "Testing Sponsor Endpoint Availability"
  echo "=========================================="
  
  # Try to access sponsor endpoint (should fail with auth error, not 404)
  echo "Test 1: Check if /api/sponsors exists (expect 401)"
  curl -s -X GET "$BASE_URL/sponsors" | head -c 200
  echo ""
  
  echo ""
  echo "Test 2: Check server routes"
  echo "If sponsor routes are loaded, they should appear in error messages"
  echo ""
  
  exit 1
fi

# Verify MFA
echo ""
echo "Step 2: Verify MFA"
MFA_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"tempToken\": \"$TEMP_TOKEN\",
    \"code\": \"$MFA_CODE\"
  }" \
  "$BASE_URL/auth/mfa-verify")

echo "MFA Response: $MFA_RESPONSE"

ADMIN_TOKEN=$(echo $MFA_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Admin Token: ${ADMIN_TOKEN:0:30}..."

# Step 3: Test sponsor endpoints
echo ""
echo "=========================================="
echo "Testing Sponsor Endpoints"
echo "=========================================="

# Test 1: Create sponsor
echo ""
echo "Test 1: Create Sponsor"
SPONSOR_CREATE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Sponsor Inc",
    "email": "sponsor@test.com",
    "phoneNumber": "+1234567890",
    "country": "USA",
    "organization": "Test Organization",
    "sponsorshipType": "organization",
    "status": "active",
    "notes": "Automated test sponsor"
  }' \
  "$BASE_URL/sponsors")

echo "$SPONSOR_CREATE"
SPONSOR_ID=$(echo $SPONSOR_CREATE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Created Sponsor ID: $SPONSOR_ID"

# Test 2: Get all sponsors
echo ""
echo "Test 2: Get All Sponsors"
curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/sponsors" | head -c 500
echo ""

# Test 3: Get sponsor by ID
echo ""
echo "Test 3: Get Sponsor by ID"
curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/sponsors/$SPONSOR_ID" | head -c 500
echo ""

# Test 4: Get stats
echo ""
echo "Test 4: Get Sponsor Statistics"
curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/sponsors/stats"
echo ""

echo ""
echo "=========================================="
echo "Sponsor API Tests Complete"
echo "=========================================="
