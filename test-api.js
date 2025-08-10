const { CustomMarketplaceAPI } = require('./out/custom-marketplace-api');
const { VersionValidator } = require('./out/version-validator');

async function testCustomMarketplaceAPI() {
    console.log('🔍 Testing Custom Marketplace API...\n');
    
    const config = {
        baseUrl: 'http://localhost:8991',
        timeout: 30000,
        retryAttempts: 3
    };
    
    const api = new CustomMarketplaceAPI(config);
    
    try {
        // Test health check
        console.log('1. Testing health check...');
        const isHealthy = await api.healthCheck();
        console.log(`   Health check: ${isHealthy ? '✅ Passed' : '❌ Failed'}`);
        
        // Test query extension - stable version
        console.log('\n2. Testing query extension (stable)...');
        const stableExt = await api.queryExtension({
            id: 'test-publisher.test-plugin',
            tag: 'stable'
        });
        if (stableExt) {
            console.log(`   ✅ Found stable version: ${stableExt.version} (${stableExt.releaseTag})`);
        } else {
            console.log('   ❌ No stable version found');
        }
        
        // Test query extension - alpha version
        console.log('\n3. Testing query extension (alpha)...');
        const alphaExt = await api.queryExtension({
            id: 'test-publisher.test-plugin',
            tag: 'alpha'
        });
        if (alphaExt) {
            console.log(`   ✅ Found alpha version: ${alphaExt.version} (${alphaExt.releaseTag})`);
        } else {
            console.log('   ❌ No alpha version found');
        }
        
        // Test version validation
        console.log('\n4. Testing version validation...');
        const validator = new VersionValidator(api);
        
        // Test with version lower than server (should fail)
        console.log('\n   4a. Testing with lower version (should fail)...');
        const lowerVersionResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '0.9.0',
            releaseTag: 'stable'
        });
        console.log(`   Lower version validation: ${lowerVersionResult.isValid ? '❌ Unexpectedly passed' : '✅ Correctly failed'}`);
        
        // Test with version higher than server (should pass)
        console.log('\n   4b. Testing with higher version (should pass)...');
        const higherVersionResult = await validator.validateVersion({
            extensionId: 'test-publisher.test-plugin',
            localVersion: '1.1.0',
            releaseTag: 'stable'
        });
        console.log(`   Higher version validation: ${higherVersionResult.isValid ? '✅ Correctly passed' : '❌ Unexpectedly failed'}`);
        
        // Test version bumping
        console.log('\n5. Testing version bumping...');
        const currentVersion = '1.0.0';
        const patchVersion = VersionValidator.bumpVersion(currentVersion, 'patch');
        const minorVersion = VersionValidator.bumpVersion(currentVersion, 'minor');
        const majorVersion = VersionValidator.bumpVersion(currentVersion, 'major');
        const alphaVersion = VersionValidator.bumpVersion(currentVersion, 'prerelease', 'alpha');
        
        console.log(`   Patch bump: ${currentVersion} → ${patchVersion}`);
        console.log(`   Minor bump: ${currentVersion} → ${minorVersion}`);
        console.log(`   Major bump: ${currentVersion} → ${majorVersion}`);
        console.log(`   Alpha bump: ${currentVersion} → ${alphaVersion}`);
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests if server is available
testCustomMarketplaceAPI().catch(console.error);