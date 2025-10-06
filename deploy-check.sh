#!/bin/bash

# Vercel Deployment Verification Script
# This script helps verify your Vercel deployment status

echo "🔍 Checking LeaveBot Deployment Status..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📋 Current API Files (should be 6 + shared):"
find api -name "*.js" -not -path "*/shared/*" | sort
echo ""

echo "📊 Function count (should be ≤ 10):"
FUNC_COUNT=$(find api -name "*.js" -not -path "*/shared/*" | wc -l | xargs)
echo "   Found: $FUNC_COUNT functions"

if [ "$FUNC_COUNT" -le 10 ]; then
    echo "   ✅ Under Vercel Hobby limit (10)"
else
    echo "   ❌ EXCEEDS Vercel Hobby limit (10)"
fi

echo ""
echo "🔄 Latest Git Commits:"
git log --oneline -3

echo ""
echo "📡 Checking if code is pushed to GitHub:"
git status | head -2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYMENT OPTIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Auto-Deploy (wait 5 minutes)"
echo "   → Vercel should auto-deploy from GitHub"
echo "   → Check: https://vercel.com/dashboard"
echo ""
echo "Option 2: Manual Deploy (immediate)"
echo "   → Run: vercel --prod"
echo "   → This will deploy immediately"
echo ""
echo "Option 3: Dashboard Redeploy"
echo "   → Go to Vercel dashboard"
echo "   → Click latest deployment → Redeploy"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Deploy now with 'vercel --prod'"
echo "2) Just check status (exit)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Vercel production..."
        vercel --prod
        ;;
    2)
        echo ""
        echo "👋 Check https://vercel.com/dashboard for deployment status"
        ;;
    *)
        echo "Invalid choice. Exiting."
        ;;
esac
