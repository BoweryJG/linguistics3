// Test script to verify connection to osbackend-zl1h.onrender.com
console.log('Starting backend connection test...');

// Import API_URL from environment variables
const API_URL = process.env.VITE_API_URL || 'https://osbackend-zl1h.onrender.com';

console.log(`Testing connection to: ${API_URL}`);

// Simple function to test the connection
async function testBackendConnection() {
  try {
    console.log(`Sending GET request to ${API_URL}...`);
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Connection successful!');
      console.log('Response:', data);
      return true;
    } else {
      console.error(`Error: Server responded with status ${response.status}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Connection failed!');
    console.error('Error details:', error.message);
    return false;
  }
}

// Execute the test
testBackendConnection()
  .then(success => {
    if (success) {
      console.log('✅ Backend connection test PASSED!');
    } else {
      console.log('❌ Backend connection test FAILED!');
    }
  })
  .catch(error => {
    console.error('Test execution error:', error);
    console.log('❌ Backend connection test FAILED due to execution error!');
  });
