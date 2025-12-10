// Test Backend Connection
// Run this with: node test-connection.js

const testConnection = async () => {
  try {
    // Replace with your IP address
    const response = await fetch('http://YOUR_IP_ADDRESS:3000/api/health');
    const data = await response.json();
    console.log('✅ Backend connection successful:', data);
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    console.log('💡 Make sure to:');
    console.log('1. Replace YOUR_IP_ADDRESS with your actual IP');
    console.log('2. Backend server is running on port 3000');
    console.log('3. Firewall allows connections on port 3000');
  }
};

testConnection();
