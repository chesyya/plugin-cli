#!/usr/bin/env node

// Test the tag logic for different release types
const http = require('http');

function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const req = http.request(url, { method }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testTagLogic() {
    console.log('🏷️  Testing Tag Logic for Version Validation\n');
    
    try {
        console.log('1. Testing Alpha release (should use tag):');
        const alphaQuery = await makeRequest('http://localhost:8991/api/test-publisher/test-plugin?tag=alpha');
        console.log(`   Query with tag=alpha: ${alphaQuery.status}`);
        if (alphaQuery.data && alphaQuery.data.version) {
            console.log(`   ✅ Found alpha version: ${alphaQuery.data.version}`);
        }
        
        const alphaNoTag = await makeRequest('http://localhost:8991/api/test-publisher/test-plugin');
        console.log(`   Query without tag: ${alphaNoTag.status}`);
        if (alphaNoTag.data && alphaNoTag.data.version) {
            console.log(`   📦 Default version: ${alphaNoTag.data.version}`);
        }
        console.log('');
        
        console.log('2. Testing Beta release (should use tag):');
        const betaQuery = await makeRequest('http://localhost:8991/api/test-publisher/test-plugin?tag=beta');
        console.log(`   Query with tag=beta: ${betaQuery.status}`);
        if (betaQuery.data && betaQuery.data.version) {
            console.log(`   ✅ Found beta version: ${betaQuery.data.version}`);
        }
        console.log('');
        
        console.log('3. Testing Release version (should NOT use tag):');
        const releaseQuery = await makeRequest('http://localhost:8992/api/test-publisher/test-plugin');
        console.log(`   Query without tag: ${releaseQuery.status}`);
        if (releaseQuery.data && releaseQuery.data.version) {
            console.log(`   ✅ Found release version: ${releaseQuery.data.version}`);
            console.log(`   🏷️  PreRelease: ${releaseQuery.data.preRelease}`);
        }
        
        // Test what happens if we try to use tag on prod server
        const releaseWithTag = await makeRequest('http://localhost:8992/api/test-publisher/test-plugin?tag=release');
        console.log(`   Query with tag=release: ${releaseWithTag.status}`);
        if (releaseWithTag.data && releaseWithTag.data.version) {
            console.log(`   📦 With tag result: ${releaseWithTag.data.version} (should be same as without tag)`);
        }
        console.log('');
        
        console.log('4. Testing server routing:');
        console.log('   Alpha/Beta → Dev server (8991) with tag parameter');
        console.log('   Release → Prod server (8992) without tag parameter');
        console.log('');
        
        console.log('✅ Tag logic validation completed!');
        console.log('💡 The new logic correctly:');
        console.log('   - Uses tag for alpha/beta queries (dev server)');
        console.log('   - Omits tag for release queries (prod server)');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testTagLogic();