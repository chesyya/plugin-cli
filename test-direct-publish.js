#!/usr/bin/env node

// Direct test of publish function
process.env.VSCE_LOCAL_MODE = 'true';

const { publish } = require('./out/publish');

async function testDirectPublish() {
    console.log('🚀 Testing direct publish function...');
    
    try {
        process.chdir('/root/vscode-vsce/test-plugin');
        
        const result = await publish({
            version: 'alpha-1.2.0',
            releaseTag: 'alpha',
            noVerify: true,
            skipDuplicate: true
        });
        
        console.log('✅ Publish completed:', result);
        
    } catch (error) {
        console.error('❌ Publish failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

testDirectPublish();