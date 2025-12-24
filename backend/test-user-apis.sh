#!/bin/bash

# Phase 2 User Management API Testing Script
# Tests: Create, List, Update, Delete, Password Management

BASE_URL="http://localhost:5001/api"
ADMIN_EMAIL="admin@zasyaonline.com"
ADMIN_PASSWORD="admin123"

echo "========================================="
echo "Phase 2: User Management API Testing"
echo "========================================="
echo ""

# Step 1: Login as admin
echo "✅ STEP 1: Login as admin to get access token"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | python3 -m json.tool

# Extract tempToken (if MFA is required, we'd need to verify first)
TEMP_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('tempToken', ''))" 2>/dev/null)

if [ -z "$TEMP_TOKEN" ]; then
  # Try to get accessToken if MFA is disabled
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('accessToken', ''))" 2>/dev/null)
else
  echo ""
  echo "⚠️  MFA is enabled. For testing, we'll need to handle MFA verification."
  echo "   Using tempToken for now (limited access)"
  ACCESS_TOKEN="$TEMP_TOKEN"
fi

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ ERROR: Failed to get access token"
  exit 1
fi

echo ""
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Step 2: Create a new user
echo "========================================="
echo "✅ STEP 2: Create a new teacher user"
echo "========================================="
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "teacher1@zasyaonline.com",
    "password": "Teacher@123",
    "firstName": "John",
    "lastName": "Smith",
    "role": "teacher",
    "isActive": true
  }')

echo "$CREATE_RESPONSE" | python3 -m json.tool

# Extract new user ID
NEW_USER_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('id', ''))" 2>/dev/null)
echo ""
echo "New User ID: $NEW_USER_ID"
echo ""

# Step 3: Get list of users
echo "========================================="
echo "✅ STEP 3: Get list of users (paginated)"
echo "========================================="
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/users?page=1&limit=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$LIST_RESPONSE" | python3 -m json.tool
echo ""

# Step 4: Get user by ID
if [ -n "$NEW_USER_ID" ]; then
  echo "========================================="
  echo "✅ STEP 4: Get user by ID"
  echo "========================================="
  USER_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$NEW_USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  echo "$USER_RESPONSE" | python3 -m json.tool
  echo ""
fi

# Step 5: Update user
if [ -n "$NEW_USER_ID" ]; then
  echo "========================================="
  echo "✅ STEP 5: Update user information"
  echo "========================================="
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/$NEW_USER_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
      "firstName": "Jonathan",
      "lastName": "Smith-Updated"
    }')

  echo "$UPDATE_RESPONSE" | python3 -m json.tool
  echo ""
fi

# Step 6: Get user statistics
echo "========================================="
echo "✅ STEP 6: Get user statistics"
echo "========================================="
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$STATS_RESPONSE" | python3 -m json.tool
echo ""

# Step 7: Deactivate user
if [ -n "$NEW_USER_ID" ]; then
  echo "========================================="
  echo "✅ STEP 7: Deactivate user"
  echo "========================================="
  DEACTIVATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/$NEW_USER_ID/deactivate" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  echo "$DEACTIVATE_RESPONSE" | python3 -m json.tool
  echo ""
fi

# Step 8: Activate user
if [ -n "$NEW_USER_ID" ]; then
  echo "========================================="
  echo "✅ STEP 8: Activate user"
  echo "========================================="
  ACTIVATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/$NEW_USER_ID/activate" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  echo "$ACTIVATE_RESPONSE" | python3 -m json.tool
  echo ""
fi

# Step 9: Reset password
if [ -n "$NEW_USER_ID" ]; then
  echo "========================================="
  echo "✅ STEP 9: Reset user password (Admin)"
  echo "========================================="
  RESET_RESPONSE=$(curl -s -X POST "$BASE_URL/users/$NEW_USER_ID/reset-password" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{"newPassword": "NewPassword@456"}')

  echo "$RESET_RESPONSE" | python3 -m json.tool
  echo ""
fi

# Step 10: Delete user
if [ -n "$NEW_USER_ID" ]; then
  echo "========================================="
  echo "✅ STEP 10: Delete user (soft delete)"
  echo "========================================="
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/users/$NEW_USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  echo "$DELETE_RESPONSE" | python3 -m json.tool
  echo ""
fi

# Step 11: Verify audit logs
echo "========================================="
echo "✅ STEP 11: Check audit logs in database"
echo "========================================="
PGPASSWORD='P@ssw0rd' psql -h 63.250.52.24 -U zschool_user -d zschool_db -c \
  "SELECT action, entity_type, status, created_at 
   FROM audit_logs 
   WHERE action IN ('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PASSWORD_RESET')
   ORDER BY created_at DESC LIMIT 10;" 2>/dev/null

echo ""
echo "========================================="
echo "Phase 2 Testing Complete!"
echo "========================================="
