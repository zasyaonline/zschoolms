#!/bin/bash
# Archive old documentation files
# These have been consolidated into ZSCHOOL_PROJECT_REFERENCE.md

# Create archive directory
mkdir -p docs-archive

# Move files to archive (keeping only essential ones in root)
mv API_CONNECTION_FIX.md docs-archive/ 2>/dev/null
mv API_IMPLEMENTATION_PLAN.md docs-archive/ 2>/dev/null
mv BACKEND_SETUP_GUIDE.md docs-archive/ 2>/dev/null
mv BUSINESS_LOGIC_IMPLEMENTATION_PLAN.md docs-archive/ 2>/dev/null
mv CODE_QUALITY_ASSESSMENT.md docs-archive/ 2>/dev/null
mv CONFIGURATION_SUMMARY.md docs-archive/ 2>/dev/null
mv CONTINUE_PHASE_8_PROMPT.md docs-archive/ 2>/dev/null
mv CORE_FEATURES_IMPLEMENTATION_REPORT.md docs-archive/ 2>/dev/null
mv CRITICAL_FIXES_SUMMARY.md docs-archive/ 2>/dev/null
mv CURRENT_STATE_AND_NEXT_STEPS.md docs-archive/ 2>/dev/null
mv DASHBOARD_REDESIGN_RECOMMENDATIONS.md docs-archive/ 2>/dev/null
mv DEPLOYMENT_ARCHITECTURE.md docs-archive/ 2>/dev/null
mv DEPLOYMENT_CHECKLIST.md docs-archive/ 2>/dev/null
mv DEPLOYMENT_GUIDE.md docs-archive/ 2>/dev/null
mv DEPLOYMENT_READY.md docs-archive/ 2>/dev/null
mv DEPLOY_NOW.md docs-archive/ 2>/dev/null
mv FRONTEND_API_FIXES.md docs-archive/ 2>/dev/null
mv FRONTEND_ISSUE_ROOT_CAUSE_ANALYSIS.md docs-archive/ 2>/dev/null
mv FRONTEND_SHARING_GUIDE.md docs-archive/ 2>/dev/null
mv HIGH_PRIORITY_SUMMARY.md docs-archive/ 2>/dev/null
mv IMPLEMENTATION_GUIDE.md docs-archive/ 2>/dev/null
mv IMPLEMENTATION_PLAN.md docs-archive/ 2>/dev/null
mv NODE_VERSION_FIX.md docs-archive/ 2>/dev/null
mv PAUSE_CHECKLIST.md docs-archive/ 2>/dev/null
mv PHASE_1_COMPLETION_REPORT.md docs-archive/ 2>/dev/null
mv PHASE_1_SUMMARY.md docs-archive/ 2>/dev/null
mv PHASE_1_TESTING_GUIDE.md docs-archive/ 2>/dev/null
mv PHASE_2_COMPLETE.md docs-archive/ 2>/dev/null
mv PHASE_4_COMPLETE.md docs-archive/ 2>/dev/null
mv PHASE_5_6_COMPLETE.md docs-archive/ 2>/dev/null
mv PHASE_7_8_IMPLEMENTATION.md docs-archive/ 2>/dev/null
mv PHASE_9_SUMMARY.md docs-archive/ 2>/dev/null
mv PRE_PRODUCTION_TESTING_PLAN.md docs-archive/ 2>/dev/null
mv PRE_PRODUCTION_TEST_RESULTS.md docs-archive/ 2>/dev/null
mv PRODUCTION_FIXES_REQUIRED.md docs-archive/ 2>/dev/null
mv PROJECT_HANDOFF.md docs-archive/ 2>/dev/null
mv PROJECT_STATUS.md docs-archive/ 2>/dev/null
mv QUICK_DEPLOY.md docs-archive/ 2>/dev/null
mv QUICK_REFERENCE.md docs-archive/ 2>/dev/null
mv QUICK_START_AUTH.md docs-archive/ 2>/dev/null
mv SWAGGER_DOCUMENTATION_STATUS.md docs-archive/ 2>/dev/null
mv SWAGGER_IMPLEMENTATION_COMPLETE.md docs-archive/ 2>/dev/null
mv SWAGGER_QUICK_REFERENCE.md docs-archive/ 2>/dev/null
mv TESTING_EXECUTION_REPORT.md docs-archive/ 2>/dev/null
mv TESTING_PLAN.md docs-archive/ 2>/dev/null
mv endpoint-analysis.md docs-archive/ 2>/dev/null
mv START_DEPLOYMENT.txt docs-archive/ 2>/dev/null

echo "✅ Archived $(ls docs-archive | wc -l) documentation files to docs-archive/"
echo ""
echo "Essential files kept in root:"
echo "  - README.md (brief intro)"
echo "  - ZSCHOOL_PROJECT_REFERENCE.md (comprehensive reference)"
echo "  - .github/copilot-instructions.md (AI agent instructions)"
echo ""
echo "To undo: mv docs-archive/*.md ./"
