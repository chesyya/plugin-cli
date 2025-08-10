#!/usr/bin/env node

// Test validation functionality
const { CustomMarketplaceAPI } = require('./out/custom-marketplace-api');
const { VersionValidator } = require('./out/version-validator');
const fs = require('fs');
const path = require('path');

async function testValidation() {
    console.log('🔍 Testing Version Validation System\n');
    
    // Read test-plugin package.json
    const packagePath = path.join(__dirname, 'test-plugin', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const config = {
        baseUrl: 'http://localhost:8991',
        timeout: 30000,
        retryAttempts: 3
    };
    
    const api = new CustomMarketplaceAPI(config);
    const validator = new VersionValidator(api);
    
    const extensionId = `${packageJson.publisher}.${packageJson.name}`;
    const localVersion = packageJson.version;
    
    console.log(`📦 Extension ID: ${extensionId}`);
    console.log(`📊 Local version: ${localVersion}`);
    console.log('');
    
    try {
        // Test validation for different tags
        const tags = ['stable', 'alpha', 'beta'];
        
        for (const tag of tags) {
            console.log(`🏷️  Testing ${tag.toUpperCase()} tag:`);
            
            // Query server version
            const serverExt = await api.queryExtension({ id: extensionId, tag });
            if (serverExt) {
                console.log(`   Server version: ${serverExt.version}`);
            } else {
                console.log(`   Server version: Not found`);
            }
            
            // Validate version
            const result = await validator.validateVersion({
                extensionId,
                localVersion,
                releaseTag: tag,
                allowEqual: false
            });
            
            console.log(`   Validation result: ${result.isValid ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`   Message: ${result.message}`);
            
            if (result.recommendation) {
                console.log(`   Recommendation: ${result.recommendation.split('\n')[0]}...`);
            }
            console.log('');
        }
        
        // Test version bumping
        console.log('🔢 Testing Version Bumping:');
        const baseVersion = '1.0.0';
        console.log(`   Base version: ${baseVersion}`);
        console.log(`   Patch bump: ${VersionValidator.bumpVersion(baseVersion, 'patch')}`);
        console.log(`   Minor bump: ${VersionValidator.bumpVersion(baseVersion, 'minor')}`);
        console.log(`   Major bump: ${VersionValidator.bumpVersion(baseVersion, 'major')}`);
        console.log(`   Alpha prerelease: ${VersionValidator.bumpVersion(baseVersion, 'prerelease', 'alpha')}`);
        console.log(`   Beta prerelease: ${VersionValidator.bumpVersion(baseVersion, 'prerelease', 'beta')}`);
        
        console.log('\n🎉 Validation tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testValidation();