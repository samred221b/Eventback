// Debug script to test backend connection
// Add this temporarily to your EventsScreen to see detailed logs

export const debugBackendConnection = async () => {
  const tests = [
    {
      name: 'Test 1: Health Check',
      url: 'http://192.168.1.6:3000/api/health',
      method: 'GET'
    },
    {
      name: 'Test 2: Get Events',
      url: 'http://192.168.1.6:3000/api/events',
      method: 'GET'
    },
    {
      name: 'Test 3: Get Events with Limit',
      url: 'http://192.168.1.6:3000/api/events?limit=5',
      method: 'GET'
    }
  ];

  // console.log('🔍 Starting Backend Connection Debug...\n');

  for (const test of tests) {
    // console.log(`\n📋 ${test.name}`);
    // console.log(`🔗 URL: ${test.url}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // console.log(`⏱️  Duration: ${duration}ms`);
      // console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        // console.log(`✅ SUCCESS`);
        // console.log(`📦 Data:`, JSON.stringify(data).substring(0, 200));
        
        if (data.data && Array.isArray(data.data)) {
          // console.log(`📝 Events count: ${data.data.length}`);
        }
      } else {
        // console.log(`❌ FAILED: HTTP ${response.status}`);
        const errorText = await response.text();
        // console.log(`❌ Error:`, errorText.substring(0, 200));
      }
    } catch (error) {
      // console.log(`❌ ERROR: ${error.message}`);
      // console.log(`❌ Error type: ${error.name}`);
      // console.log(`❌ Full error:`, error);
    }
  }
  
  // console.log('\n🏁 Debug Complete\n');
};

// Usage: Call this function from your component
// import { debugBackendConnection } from './debug-connection';
// debugBackendConnection();
