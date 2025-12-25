#!/bin/bash

# Database Migration Runner for Production
# This script runs all migrations against your production database

echo "🗄️  ZSchool Database Migration Runner"
echo "======================================"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Database URL required"
    echo ""
    echo "Usage: ./run-migrations.sh <DATABASE_URL>"
    echo ""
    echo "Example:"
    echo "  ./run-migrations.sh 'postgresql://user:pass@host:5432/dbname'"
    echo ""
    echo "Get your DATABASE_URL from:"
    echo "  - Render: Database → Connect → External Database URL"
    echo "  - Railway: Database → Connect → PostgreSQL Connection URL"
    exit 1
fi

DATABASE_URL="$1"

echo "📋 Migrations to run:"
echo "  1. 001-add-auth-tables.sql"
echo "  2. 002-fix-audit-logs.sql"
echo "  3. 003_create_students_table.sql"
echo "  4. 004_create_sponsors_tables.sql"
echo "  5. 005_create_attendance_table.sql"
echo "  6. 006_create_marks_system.sql"
echo "  7. 007_create_report_cards.sql"
echo ""

read -p "Continue with migrations? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting migrations..."
echo ""

# Change to backend directory
cd "$(dirname "$0")/backend"

# Run each migration
MIGRATIONS=(
    "001-add-auth-tables.sql"
    "002-fix-audit-logs.sql"
    "003_create_students_table.sql"
    "004_create_sponsors_tables.sql"
    "005_create_attendance_table.sql"
    "006_create_marks_system.sql"
    "007_create_report_cards.sql"
)

FAILED=0

for migration in "${MIGRATIONS[@]}"; do
    echo "▶️  Running: $migration"
    
    if psql "$DATABASE_URL" -f "migrations/$migration" > /dev/null 2>&1; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

echo "======================================"

if [ $FAILED -eq 0 ]; then
    echo "✅ All migrations completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Create test users (see DEPLOY_NOW.md)"
    echo "  2. Test backend health endpoint"
    echo "  3. Continue with frontend deployment"
else
    echo "❌ $FAILED migration(s) failed"
    echo ""
    echo "💡 Troubleshooting:"
    echo "  - Check if DATABASE_URL is correct"
    echo "  - Verify database is accessible"
    echo "  - Check migration file syntax"
    echo "  - Review error messages above"
fi

echo ""
