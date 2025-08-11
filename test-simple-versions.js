#!/usr/bin/env node

// Test simple version format (1.0.1) with tag-based routing
process.env.VSCE_LOCAL_MODE = 'true';

const { CustomMarketplaceAPI } = require('./out/custom-marketplace-api');
const { VersionValidator } = require('./out/version-validator');

function getCustomMarketplaceConfig() {
    return {
        devServerUrl: 'http://localhost:8991',
        prodServerUrl: 'http://localhost:8992',
        timeout: 30000,
        retryAttempts: 3
    };
}

async function testSimpleVersionFormat() {
    console.log('🚀 Testing Simple Version Format with Tag Routing\n');
    
    const config = getCustomMarketplaceConfig();
    const api = new CustomMarketplaceAPI(config);
    const validator = new VersionValidator(api);
    
    try {
        console.log('📋 Simplified Version Strategy:');
        console.log('   • Version format: Always 1.2.3 (standard semver)');
        console.log('   • Tag determines server: alpha/beta → dev, release → prod');
        console.log('   • Same version 1.2.3 can exist as alpha AND beta on dev server');
        console.log('   • Release server: unique version per number\n');
        
        console.log('1. Testing Alpha (dev server WITH tag):');
        const alphaResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '1.2.0',  // Higher than server's 1.1.0
            releaseTag: 'alpha',
            allowEqual: false
        });
        
        console.log(`   Local: 1.2.0, Server: ${alphaResult.serverVersion}`);
        console.log(`   Valid: ${alphaResult.isValid}`);
        console.log(`   Message: ${alphaResult.message}`);
        console.log('');
        
        console.log('2. Testing Beta (dev server WITH tag):');
        const betaResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '1.1.0',  // Same as existing beta version
            releaseTag: 'beta', 
            allowEqual: false
        });
        
        console.log(`   Local: 1.1.0, Server: ${betaResult.serverVersion}`);
        console.log(`   Valid: ${betaResult.isValid}`);
        console.log(`   Message: ${betaResult.message}`);
        console.log('');
        
        console.log('3. Testing Release (prod server WITHOUT tag):');
        const releaseResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '1.1.0',
            releaseTag: 'release',
            allowEqual: false
        });
        
        console.log(`   Local: 1.1.0, Server: ${releaseResult.serverVersion}`);
        console.log(`   Valid: ${releaseResult.isValid}`);
        console.log(`   Message: ${releaseResult.message}`);
        console.log('');
        
        console.log('4. Testing Version Bumping:');
        const bumpedPatch = VersionValidator.bumpVersion('1.0.0', 'patch');
        const bumpedMinor = VersionValidator.bumpVersion('1.0.0', 'minor'); 
        const bumpedMajor = VersionValidator.bumpVersion('1.0.0', 'major');
        
        console.log(`   Patch bump: 1.0.0 → ${bumpedPatch}`);
        console.log(`   Minor bump: 1.0.0 → ${bumpedMinor}`);
        console.log(`   Major bump: 1.0.0 → ${bumpedMajor}`);
        console.log('');
        
        console.log('✅ Simple version format test completed!');
        console.log('🎯 Benefits of this approach:');
        console.log('   ✅ Clean version format (1.2.3)');
        console.log('   ✅ Tag parameter handles server routing');
        console.log('   ✅ Same version can exist as different tags');
        console.log('   ✅ Release server has unique versions');
        
    } catch (error) {
        console.error('❌ Version test failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

testSimpleVersionFormat();