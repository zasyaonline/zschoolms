#!/bin/bash
# Test authentication APIs

BASE_URL="http://localhost:5001"

echo "=== Test 1: Health Check ==="
curl -s "$BASE_URL/api/health" | python3 -m json.tool

echo -e "\n\n=== Test 2: Login with Admin ==="
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "admin@zasyaonline.com", "password": "admin123"}')
echo "$RESPONSE" | python3 -m json.tool

# Extract tempToken if MFA is required
TEMP_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('tempToken', ''))" 2>/dev/null)

if [ -n "$TEMP_TOKEN" ]; then
  echo -e "\n\n=== MFA Required - Temp Token: $TEMP_TOKEN ==="
  echo "Check your email for the verification code"
  echo "To test MFA verification, run:"
  echo "curl -X POST $BASE_URL/api/auth/mfa-verify -H 'Content-Type: application/json' -d '{\"tempToken\": \"$TEMP_TOKEN\", \"code\": \"YOUR_CODE_HERE\"}'"
fi
