#!/bin/bash

# Deployment Preparation Script for ZSchool Management System
# This script helps generate secure secrets and prepares files for deployment

echo "🚀 ZSchool Management System - Deployment Preparation"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Generate secrets
echo "🔐 Generating secure secrets..."
echo ""

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MFA_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "📋 Copy these secrets to your deployment platform:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "MFA_SECRET=$MFA_SECRET"
echo ""

# Create secrets file
SECRETS_FILE=".deployment-secrets.txt"
cat > $SECRETS_FILE << EOF
# ZSchool Deployment Secrets
# Generated on: $(date)
# IMPORTANT: Keep this file secure and DO NOT commit to git

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
MFA_SECRET=$MFA_SECRET

# Next Steps:
# 1. Copy these secrets to your Render/Railway environment variables
# 2. Delete this file after copying: rm .deployment-secrets.txt
# 3. Never commit this file to git
EOF

echo "✅ Secrets saved to: $SECRETS_FILE"
echo "⚠️  IMPORTANT: Delete this file after copying secrets to your deployment platform!"
echo ""

# Check if .gitignore includes secrets file
if ! grep -q ".deployment-secrets.txt" .gitignore 2>/dev/null; then
    echo ".deployment-secrets.txt" >> .gitignore
    echo "✅ Added .deployment-secrets.txt to .gitignore"
fi

# Test frontend build
echo "🏗️  Testing frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed. Please fix build errors before deploying."
    exit 1
fi
cd ..

echo ""
echo "📝 Deployment Checklist:"
echo ""
echo "Backend (Render/Railway):"
echo "  1. Create PostgreSQL database"
echo "  2. Run migrations (see DEPLOYMENT_GUIDE.md)"
echo "  3. Create web service from GitHub repo"
echo "  4. Set root directory to: backend"
echo "  5. Add environment variables (copy from .env.production)"
echo "  6. Add generated secrets above"
echo "  7. Deploy and test health endpoint"
echo ""
echo "Frontend (Netlify):"
echo "  1. Create new site from GitHub repo"
echo "  2. Set base directory to: frontend"
echo "  3. Set build command to: npm run build"
echo "  4. Set publish directory to: dist"
echo "  5. Add VITE_API_BASE_URL environment variable"
echo "  6. Deploy and test site"
echo ""
echo "📚 Full guide: DEPLOYMENT_GUIDE.md"
echo "✅ Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
echo "🎉 Preparation complete! Ready to deploy."
