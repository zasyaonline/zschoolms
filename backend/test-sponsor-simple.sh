#!/bin/bash

BASE_URL="http://localhost:5001/api"

# Login as admin with MFA
echo "Step 1: Login as admin (this will trigger MFA)"
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "admin@zasyaonline.com",
    "password": "Admin@123"
  }' \
  "$BASE_URL/auth/login")

echo "Login response: $LOGIN_RESPONSE"

# Extract temp token
TEMP_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"tempToken":"[^"]*' | cut -d'"' -f4)
echo "Temp token: ${TEMP_TOKEN:0:30}..."

# We need MFA code from database
echo ""
echo "Step 2: Getting MFA code from database"
MFA_CODE=$(PGPASSWORD='P@ssw0rd' psql -h 63.250.52.24 -U zschool_user -d zschool_db -t -c "SELECT mfa_code FROM users WHERE email = 'admin@zasyaonline.com'")
MFA_CODE=$(echo $MFA_CODE | tr -d ' ')
echo "MFA Code: $MFA_CODE"

# Verify MFA
echo ""
echo "Step 3: Verify MFA"
MFA_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"tempToken\": \"$TEMP_TOKEN\",
    \"code\": \"$MFA_CODE\"
  }" \
  "$BASE_URL/auth/mfa-verify")

echo "MFA response: $MFA_RESPONSE"

# Extract real token
TOKEN=$(echo $MFA_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Access Token: ${TOKEN:0:30}..."

# Test sponsor creation
echo ""
echo "Step 4: Create sponsor"
SPONSOR_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john.doe.test@email.com",
    "phoneNumber": "+1234567890",
    "country": "USA",
    "sponsorshipType": "individual",
    "status": "active"
  }' \
  "$BASE_URL/sponsors")

echo "Sponsor response: $SPONSOR_RESPONSE"

# Test get sponsors
echo ""
echo "Step 5: Get all sponsors"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/sponsors"

echo ""
echo "Done!"
