#!/bin/bash

echo "🚀 Testing Simple Version Format Publishing"
echo ""

echo "📋 New Strategy: Version=1.2.3, Tag determines server routing"
echo ""

echo "1. Alpha publish (dev server with tag):"
echo "Command: VSCE_LOCAL_MODE=true node ../out/main.js publish --tag alpha --version 1.2.0 --no-verify --skip-duplicate"
VSCE_LOCAL_MODE=true node ../out/main.js publish --tag alpha --version 1.2.0 --no-verify --skip-duplicate
echo "Alpha publish completed with exit code: $?"
echo ""

echo "2. Beta publish (dev server with tag):"
echo "Command: VSCE_LOCAL_MODE=true node ../out/main.js publish --tag beta --version 1.1.5 --no-verify --skip-duplicate"
VSCE_LOCAL_MODE=true node ../out/main.js publish --tag beta --version 1.1.5 --no-verify --skip-duplicate
echo "Beta publish completed with exit code: $?"
echo ""

echo "3. Release publish (prod server without tag):"
echo "Command: VSCE_LOCAL_MODE=true node ../out/main.js publish --version 1.1.0 --no-verify --skip-duplicate"
VSCE_LOCAL_MODE=true node ../out/main.js publish --version 1.1.0 --no-verify --skip-duplicate
echo "Release publish completed with exit code: $?"
echo ""

echo "✅ All simple version tests completed!"
echo "🎯 Version format: Clean 1.2.3, Tag handles routing"