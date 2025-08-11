#!/usr/bin/env node

// Test new standard semver format with tags
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

async function testNewVersionFormat() {
    console.log('🚀 Testing New Standard Semver Format with Tags\n');
    
    const config = getCustomMarketplaceConfig();
    const api = new CustomMarketplaceAPI(config);
    const validator = new VersionValidator(api);
    
    try {
        console.log('📋 New Version Strategy:');
        console.log('   • Alpha: 1.1.1-alpha.0 (standard semver prerelease)');
        console.log('   • Beta:  1.1.1-beta.0 (standard semver prerelease)'); 
        console.log('   • Release: 1.1.1 (standard semver release)');
        console.log('   • Tags distinguish server routing, not version format\n');
        
        console.log('1. Testing Alpha with standard semver prerelease:');
        const alphaResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '1.2.0-alpha.0',
            releaseTag: 'alpha',
            allowEqual: false
        });
        
        console.log(`   Local: 1.2.0-alpha.0, Server: ${alphaResult.serverVersion}`);
        console.log(`   Valid: ${alphaResult.isValid}`);
        console.log(`   Message: ${alphaResult.message}`);
        console.log('');
        
        console.log('2. Testing Beta with standard semver prerelease:');
        const betaResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '1.2.0-beta.0',
            releaseTag: 'beta', 
            allowEqual: false
        });
        
        console.log(`   Local: 1.2.0-beta.0, Server: ${betaResult.serverVersion}`);
        console.log(`   Valid: ${betaResult.isValid}`);
        console.log(`   Message: ${betaResult.message}`);
        console.log('');
        
        console.log('3. Testing Release with standard semver:');
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
        const bumpedAlpha = VersionValidator.bumpVersion('1.0.0', 'patch', 'alpha');
        const bumpedBeta = VersionValidator.bumpVersion('1.0.0', 'minor', 'beta'); 
        const bumpedRelease = VersionValidator.bumpVersion('1.0.0', 'patch');
        
        console.log(`   Patch bump with alpha: 1.0.0 → ${bumpedAlpha}`);
        console.log(`   Minor bump with beta: 1.0.0 → ${bumpedBeta}`);
        console.log(`   Patch bump release: 1.0.0 → ${bumpedRelease}`);
        console.log('');
        
        console.log('✅ New version format test completed!');
        console.log('🎯 Benefits of standard semver:');
        console.log('   ✅ Standard semver format (1.2.0-alpha.0)');
        console.log('   ✅ Tag parameter handles server routing');
        console.log('   ✅ No custom prefix parsing needed');
        console.log('   ✅ Better npm/node ecosystem compatibility');
        
    } catch (error) {
        console.error('❌ Version test failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

testNewVersionFormat();