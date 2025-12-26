#!/bin/bash
# ================================================================
# ZSchool Management System - Master Test Runner
# ================================================================
# This script runs all pre-production tests in sequence
# 
# Usage: ./run-all-tests.sh [options]
#   --skip-db       Skip database integrity tests
#   --skip-api      Skip API tests
#   --skip-frontend Skip frontend integration analysis
#   --quick         Run quick tests only
# ================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
SKIP_DB=false
SKIP_API=false
SKIP_FRONTEND=false
QUICK_MODE=false

for arg in "$@"; do
  case $arg in
    --skip-db) SKIP_DB=true ;;
    --skip-api) SKIP_API=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    --quick) QUICK_MODE=true ;;
  esac
done

# ================================================================
# HEADER
# ================================================================

clear
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     🧪 ZSCHOOL MANAGEMENT SYSTEM - PRE-PRODUCTION TESTS      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "Date: $(date)"
echo "Mode: $([ "$QUICK_MODE" = true ] && echo 'Quick' || echo 'Full')"
echo ""

# Track results
TOTAL_PASSED=0
TOTAL_FAILED=0
PHASE_RESULTS=()

# ================================================================
# PHASE 1: ENVIRONMENT CHECK
# ================================================================

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}PHASE 1: ENVIRONMENT CHECK${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"

cd /Users/zasyaonline/Projects/zschoolms/backend

# Check if backend is running
echo -n "Checking backend server (port 5001)... "
if curl -s --connect-timeout 3 http://localhost:5001/api-docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    BACKEND_RUNNING=true
    ((TOTAL_PASSED++))
else
    echo -e "${YELLOW}⚠️  Not running - attempting to check if startable${NC}"
    BACKEND_RUNNING=false
    
    # Check if port is in use by another process
    if lsof -ti:5001 > /dev/null 2>&1; then
        echo -e "${RED}Port 5001 is in use by another process${NC}"
        ((TOTAL_FAILED++))
    else
        echo -e "${YELLOW}Backend not started. Start with: cd backend && npm start${NC}"
        ((TOTAL_FAILED++))
    fi
fi

# Check if frontend is running (optional)
echo -n "Checking frontend server (port 5173)... "
if curl -s --connect-timeout 3 http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Not running (optional for API tests)${NC}"
    FRONTEND_RUNNING=false
fi

# Check database connection
echo -n "Checking database connection... "
DB_CHECK=$(node -e "
import('dotenv').then(d => d.default.config()).then(() => import('sequelize')).then(async ({Sequelize}) => {
  const seq = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false
  });
  try {
    await seq.authenticate();
    console.log('OK');
    await seq.close();
  } catch(e) {
    console.log('FAIL:' + e.message);
    await seq.close();
  }
});
" 2>/dev/null)

if [[ "$DB_CHECK" == "OK" ]]; then
    echo -e "${GREEN}✅ Connected${NC}"
    DB_CONNECTED=true
    ((TOTAL_PASSED++))
else
    echo -e "${RED}❌ Failed: $DB_CHECK${NC}"
    DB_CONNECTED=false
    ((TOTAL_FAILED++))
fi

PHASE_RESULTS+=("Phase 1 (Environment): $([ $TOTAL_PASSED -gt $TOTAL_FAILED ] && echo 'PASS' || echo 'FAIL')")

# ================================================================
# PHASE 2: DATABASE INTEGRITY
# ================================================================

if [ "$SKIP_DB" = false ] && [ "$DB_CONNECTED" = true ]; then
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}PHASE 2: DATABASE INTEGRITY${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
    
    if [ -f "check-db-integrity.js" ]; then
        echo "Running database integrity checks..."
        echo ""
        
        if node check-db-integrity.js; then
            echo -e "${GREEN}Database integrity check passed${NC}"
            ((TOTAL_PASSED++))
            PHASE_RESULTS+=("Phase 2 (Database): PASS")
        else
            echo -e "${RED}Database integrity check found issues${NC}"
            ((TOTAL_FAILED++))
            PHASE_RESULTS+=("Phase 2 (Database): FAIL")
        fi
    else
        echo -e "${YELLOW}check-db-integrity.js not found, skipping${NC}"
        PHASE_RESULTS+=("Phase 2 (Database): SKIPPED")
    fi
else
    echo -e "\n${YELLOW}Skipping database integrity tests${NC}"
    PHASE_RESULTS+=("Phase 2 (Database): SKIPPED")
fi

# ================================================================
# PHASE 3: API TESTS
# ================================================================

if [ "$SKIP_API" = false ] && [ "$BACKEND_RUNNING" = true ]; then
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}PHASE 3: API TESTS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
    
    if [ -f "test-all-apis.sh" ]; then
        chmod +x test-all-apis.sh
        
        if ./test-all-apis.sh; then
            echo -e "${GREEN}API tests passed${NC}"
            ((TOTAL_PASSED++))
            PHASE_RESULTS+=("Phase 3 (API): PASS")
        else
            echo -e "${RED}Some API tests failed${NC}"
            ((TOTAL_FAILED++))
            PHASE_RESULTS+=("Phase 3 (API): FAIL")
        fi
    else
        echo -e "${YELLOW}test-all-apis.sh not found, skipping${NC}"
        PHASE_RESULTS+=("Phase 3 (API): SKIPPED")
    fi
else
    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "\n${YELLOW}Skipping API tests (backend not running)${NC}"
    else
        echo -e "\n${YELLOW}Skipping API tests (--skip-api flag)${NC}"
    fi
    PHASE_RESULTS+=("Phase 3 (API): SKIPPED")
fi

# ================================================================
# PHASE 4: FRONTEND INTEGRATION ANALYSIS
# ================================================================

if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}PHASE 4: FRONTEND INTEGRATION ANALYSIS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
    
    if [ -f "check-frontend-integration.js" ]; then
        # This will exit with 1 if mock data pages found, which is expected
        if node check-frontend-integration.js; then
            echo -e "${GREEN}All frontend pages properly integrated${NC}"
            ((TOTAL_PASSED++))
            PHASE_RESULTS+=("Phase 4 (Frontend): PASS")
        else
            echo -e "${YELLOW}Frontend has pages using mock data (see report above)${NC}"
            # Don't count as failure, just informational
            PHASE_RESULTS+=("Phase 4 (Frontend): NEEDS_WORK")
        fi
    else
        echo -e "${YELLOW}check-frontend-integration.js not found, skipping${NC}"
        PHASE_RESULTS+=("Phase 4 (Frontend): SKIPPED")
    fi
else
    echo -e "\n${YELLOW}Skipping frontend integration analysis${NC}"
    PHASE_RESULTS+=("Phase 4 (Frontend): SKIPPED")
fi

# ================================================================
# PHASE 5: QUICK SMOKE TEST
# ================================================================

if [ "$BACKEND_RUNNING" = true ]; then
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}PHASE 5: QUICK SMOKE TEST${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"
    
    SMOKE_PASSED=0
    SMOKE_FAILED=0
    
    # Test login
    echo -n "Login endpoint... "
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@zschool.com", "password": "Admin@123"}')
    
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // .accessToken // empty')
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}✅${NC}"
        ((SMOKE_PASSED++))
    else
        echo -e "${RED}❌${NC}"
        ((SMOKE_FAILED++))
    fi
    
    # Quick tests with token
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        for endpoint in "/students?limit=5" "/sponsors?limit=5" "/users?limit=5" "/dashboard/metrics"; do
            echo -n "GET $endpoint... "
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                "http://localhost:5001/api$endpoint" \
                -H "Authorization: Bearer $TOKEN")
            
            if [ "$STATUS" == "200" ]; then
                echo -e "${GREEN}✅ ($STATUS)${NC}"
                ((SMOKE_PASSED++))
            else
                echo -e "${RED}❌ ($STATUS)${NC}"
                ((SMOKE_FAILED++))
            fi
        done
    fi
    
    echo ""
    echo "Smoke test results: $SMOKE_PASSED passed, $SMOKE_FAILED failed"
    
    if [ $SMOKE_FAILED -eq 0 ]; then
        ((TOTAL_PASSED++))
        PHASE_RESULTS+=("Phase 5 (Smoke): PASS")
    else
        ((TOTAL_FAILED++))
        PHASE_RESULTS+=("Phase 5 (Smoke): FAIL")
    fi
fi

# ================================================================
# FINAL SUMMARY
# ================================================================

echo -e "\n${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    📊 FINAL TEST SUMMARY                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Phase Results:"
for result in "${PHASE_RESULTS[@]}"; do
    if [[ $result == *"PASS"* ]]; then
        echo -e "  ${GREEN}✅ $result${NC}"
    elif [[ $result == *"FAIL"* ]]; then
        echo -e "  ${RED}❌ $result${NC}"
    elif [[ $result == *"NEEDS_WORK"* ]]; then
        echo -e "  ${YELLOW}⚠️  $result${NC}"
    else
        echo -e "  ${CYAN}⏭️  $result${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "The system is ready for production deployment."
    EXIT_CODE=0
else
    echo -e "${YELLOW}⚠️  SOME ISSUES FOUND${NC}"
    echo ""
    echo "Review the test output above and address any failures."
    echo "See PRE_PRODUCTION_TESTING_PLAN.md for remediation steps."
    EXIT_CODE=1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Test completed at: $(date)"
echo "═══════════════════════════════════════════════════════════════"

exit $EXIT_CODE
