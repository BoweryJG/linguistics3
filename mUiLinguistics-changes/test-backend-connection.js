// Simple script to test connection to the backend
const API_URL = 'https://osbackend-zl1h.onrender.com';

async function testConnection() {
  try {
    console.log(`Testing connection to backend at: ${API_URL}`);
    
    // Get server information - HEAD request to see if server is responding at all
    console.log('\nChecking if server is responding...');
    try {
      const headResponse = await fetch(API_URL, {
        method: 'HEAD'
      });
      console.log(`Server responded with status: ${headResponse.status}`);
      console.log(`Server headers:`, Object.fromEntries([...headResponse.headers]));
    } catch (headError) {
      console.error('Error sending HEAD request:', headError.message);
    }
    
    // Try various potential endpoints, including common API patterns
    const endpoints = [
      '/', 
      '/api', 
      '/api/webhook',
      '/api/v1/webhook',
      '/api/user/usage',
      '/api/v1/user/usage',
      '/task',
      '/api/task',
      '/analyze',
      '/api/analyze'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTrying endpoint: ${endpoint}`);
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: endpoint === '/webhook' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: endpoint === '/webhook' ? JSON.stringify({ filename: 'test.mp3' }) : undefined
        });
        
        console.log(`${endpoint} status: ${response.status}`);
        
        let responseData;
        try {
          responseData = await response.json();
          console.log(`Response data:`, responseData);
        } catch (parseError) {
          const text = await response.text();
          console.log(`Response (not JSON):`, text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        }
      } catch (endpointError) {
        console.error(`Error with ${endpoint}:`, endpointError.message);
      }
    }
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
