#!/bin/bash
# Comprehensive Authentication Test Script

BASE_URL="http://localhost:5001"
DB_PASS="P@ssw0rd"
DB_HOST="63.250.52.24"
DB_PORT="5432"
DB_USER="zschool_user"
DB_NAME="zschool_db"

echo "========================================="
echo "   ZSchool Authentication Flow Test"
echo "========================================="

echo -e "\n✅ STEP 1: Login with Admin Credentials"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "admin@zasyaonline.com", "password": "admin123"}')
echo "$RESPONSE" | python3 -m json.tool

TEMP_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('tempToken', ''))" 2>/dev/null)

if [ -z "$TEMP_TOKEN" ]; then
  echo "❌ ERROR: No tempToken received. Login failed!"
  exit 1
fi

echo -e "\n✅ STEP 2: Check MFA Code in Database"
MFA_DATA=$(PGPASSWORD="$DB_PASS" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  -t -c "SELECT mfa_code, mfa_expires_at FROM users WHERE email='admin@zasyaonline.com';")
echo "MFA Code & Expiry: $MFA_DATA"

MFA_CODE=$(echo "$MFA_DATA" | awk '{print $1}')

if [ -z "$MFA_CODE" ] || [ "$MFA_CODE" == "" ]; then
  echo "❌ ERROR: MFA code not found in database!"
  exit 1
fi

echo -e "\n✅ STEP 3: Verify MFA Code"
MFA_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/mfa-verify" \
  -H "Content-Type: application/json" \
  -d "{\"tempToken\": \"$TEMP_TOKEN\", \"code\": \"$MFA_CODE\"}")
echo "$MFA_RESPONSE" | python3 -m json.tool

ACCESS_TOKEN=$(echo "$MFA_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('accessToken', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ ERROR: No access token received. MFA verification failed!"
  exit 1
fi

echo -e "\n✅ STEP 4: Test Access Token with /api/auth/me"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$MFA_RESPONSE" | python3 -m json.tool

echo -e "\n✅ STEP 5: Check Audit Logs"
PGPASSWORD="$DB_PASS" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  -c "SELECT action, entity_type, status, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5;"

echo -e "\n========================================="
echo "   ✅ Authentication Flow Test Complete!"
echo "=========================================\n"
