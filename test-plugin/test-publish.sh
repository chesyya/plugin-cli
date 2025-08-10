#!/bin/bash

echo "🚀 Testing vsce publish in test-plugin directory"
echo ""

echo "1. Testing Alpha version publish:"
echo "Command: VSCE_LOCAL_MODE=true node ../out/main.js publish --tag alpha --version alpha-1.3.0 --no-verify --skip-duplicate"
VSCE_LOCAL_MODE=true node ../out/main.js publish --tag alpha --version alpha-1.3.0 --no-verify --skip-duplicate
echo "Alpha test completed with exit code: $?"
echo ""

echo "2. Testing Beta version publish:"
echo "Command: VSCE_LOCAL_MODE=true node ../out/main.js publish --tag beta --version beta-1.2.0 --no-verify --skip-duplicate"
VSCE_LOCAL_MODE=true node ../out/main.js publish --tag beta --version beta-1.2.0 --no-verify --skip-duplicate
echo "Beta test completed with exit code: $?"
echo ""

echo "3. Testing Release version publish:"
echo "Command: VSCE_LOCAL_MODE=true node ../out/main.js publish --version 1.1.0 --no-verify --skip-duplicate"
VSCE_LOCAL_MODE=true node ../out/main.js publish --version 1.1.0 --no-verify --skip-duplicate
echo "Release test completed with exit code: $?"
echo ""

echo "✅ All tests completed!"