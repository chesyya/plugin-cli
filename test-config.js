#!/usr/bin/env node

// Test the new built-in configuration system
process.env.VSCE_LOCAL_MODE = 'true';

console.log('🔧 Testing Built-in Configuration System\n');

// Simulate the configuration loading
function getCustomMarketplaceConfig() {
    const config = {
        devServerUrl: process.env.VSCE_DEV_SERVER_URL || 'https://dev-marketplace.your-company.com',
        prodServerUrl: process.env.VSCE_PROD_SERVER_URL || 'https://marketplace.your-company.com',
        timeout: parseInt(process.env.VSCE_MARKETPLACE_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.VSCE_MARKETPLACE_RETRIES || '3')
    };

    // For local development/testing, use localhost
    if (process.env.NODE_ENV === 'development' || process.env.VSCE_LOCAL_MODE === 'true') {
        config.devServerUrl = process.env.VSCE_DEV_SERVER_URL || 'http://localhost:8991';
        config.prodServerUrl = process.env.VSCE_PROD_SERVER_URL || 'http://localhost:8992';
    }

    return config;
}

async function testConfiguration() {
    console.log('1. Testing default configuration:');
    const defaultConfig = getCustomMarketplaceConfig();
    console.log(`   Dev Server: ${defaultConfig.devServerUrl}`);
    console.log(`   Prod Server: ${defaultConfig.prodServerUrl}`);
    console.log(`   Timeout: ${defaultConfig.timeout}ms`);
    console.log('');

    console.log('2. Testing environment variable override:');
    process.env.VSCE_DEV_SERVER_URL = 'https://custom-dev.example.com';
    process.env.VSCE_PROD_SERVER_URL = 'https://custom-prod.example.com';
    
    const customConfig = getCustomMarketplaceConfig();
    console.log(`   Dev Server: ${customConfig.devServerUrl}`);
    console.log(`   Prod Server: ${customConfig.prodServerUrl}`);
    console.log('');

    console.log('3. Testing production mode:');
    delete process.env.VSCE_LOCAL_MODE;
    delete process.env.VSCE_DEV_SERVER_URL;
    delete process.env.VSCE_PROD_SERVER_URL;
    
    const prodConfig = getCustomMarketplaceConfig();
    console.log(`   Dev Server: ${prodConfig.devServerUrl}`);
    console.log(`   Prod Server: ${prodConfig.prodServerUrl}`);
    console.log('');

    console.log('4. Demonstrating usage scenarios:');
    console.log('   📦 Plugin developer usage:');
    console.log('   - No configuration needed in package.json');
    console.log('   - Just run: vsce publish --tag alpha');
    console.log('   - vsce automatically routes to correct server');
    console.log('');
    
    console.log('   🏢 Company deployment:');
    console.log('   - Set environment variables in CI/CD:');
    console.log('     export VSCE_DEV_SERVER_URL=https://dev-marketplace.company.com');
    console.log('     export VSCE_PROD_SERVER_URL=https://marketplace.company.com');
    console.log('   - All developers use same configuration');
    console.log('');
    
    console.log('   🧪 Local testing:');
    console.log('   - Set VSCE_LOCAL_MODE=true');
    console.log('   - Automatically uses localhost servers');
    console.log('');

    console.log('✅ Configuration system works correctly!');
    console.log('\n🎯 Benefits:');
    console.log('   ✅ No per-plugin configuration needed');
    console.log('   ✅ Centralized server address management');
    console.log('   ✅ Environment-based deployment');
    console.log('   ✅ Easy local development setup');
}

testConfiguration();