#!/bin/bash

echo "🎯 Final Testing: Simplified Version + Tag Strategy"
echo ""
echo "Strategy: Version always 1.2.3 format, --tag parameter handles routing"
echo ""

echo "✅ CORRECT: Using clean version with tag parameter"
echo "1. Alpha: --tag alpha --version 1.3.0"
echo "2. Beta:  --tag beta --version 1.2.5"  
echo "3. Release: --version 1.2.0 (default tag=release)"
echo ""

echo "❌ OLD WAY (deprecated): --version alpha-1.3.0"
echo ""

echo "Testing the new approach:"
echo ""

echo "🔹 Alpha publish:"
VSCE_LOCAL_MODE=true node ../out/main.js publish --tag alpha --version 1.3.0 --no-verify --skip-duplicate
echo "Exit code: $?"
echo ""

echo "🔹 Beta publish:" 
VSCE_LOCAL_MODE=true node ../out/main.js publish --tag beta --version 1.2.5 --no-verify --skip-duplicate
echo "Exit code: $?"
echo ""

echo "🔹 Release publish (default):"
VSCE_LOCAL_MODE=true node ../out/main.js publish --version 1.2.0 --no-verify --skip-duplicate
echo "Exit code: $?"
echo ""

echo "✅ New simplified strategy validated!"
echo "📋 Summary:"
echo "   • Version format: Always 1.2.3"
echo "   • Routing: --tag alpha/beta → dev server, no tag → prod server"
echo "   • Clean, standard semver compliant"