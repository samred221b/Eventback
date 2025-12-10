// Simple API Test Script
// Run this with: node test-api.js

const testAPI = async () => {
  const urls = [
    'http://localhost:3000/api/health',
    'http://192.168.1.6:3000/api/health'
  ];

  for (const url of urls) {
    try {
      console.log(`\n🔍 Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: ${url}`);
        console.log(`📊 Response:`, data);
      } else {
        console.log(`❌ FAILED: ${url} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${url} - ${error.message}`);
    }
  }

  console.log('\n🎯 Recommendations:');
  console.log('- If localhost works: Use web version (expo start --web)');
  console.log('- If IP works: Use mobile with Expo Go');
  console.log('- If neither works: Check if backend is running');
};

testAPI();
