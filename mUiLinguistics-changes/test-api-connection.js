// Test script to verify the connection to the osbackend
const API_URL = 'https://osbackend-zl1h.onrender.com';

async function testApiConnection() {
  console.log('Testing connection to backend API...');
  console.log('Backend URL:', API_URL);
  
  try {
    // Test the webhook endpoint
    console.log('\n1. Testing /webhook endpoint:');
    try {
      const response = await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: 'test-file.mp3' }),
        mode: 'cors'
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Webhook response:', JSON.stringify(data, null, 2));
      } else {
        console.log('Response not OK:', await response.text());
      }
    } catch (webhookError) {
      console.error('Webhook endpoint error:', webhookError.message);
    }
    
    // Test the user/usage endpoint
    console.log('\n2. Testing /user/usage endpoint:');
    try {
      const response = await fetch(`${API_URL}/user/usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Usage response:', JSON.stringify(data, null, 2));
      } else {
        console.log('Response not OK:', await response.text());
      }
    } catch (usageError) {
      console.error('Usage endpoint error:', usageError.message);
    }
    
    // Try with CORS proxy as a fallback
    console.log('\n3. Testing with CORS proxy:');
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`${API_URL}/webhook`)}`;
      console.log(`Proxy URL: ${proxyUrl}`);
      
      const proxyResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: 'test-file.mp3' }),
        mode: 'cors'
      });
      
      console.log(`Proxy Status: ${proxyResponse.status}`);
      
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        console.log('Proxy response:', JSON.stringify(proxyData, null, 2));
      } else {
        console.log('Proxy response not OK:', await proxyResponse.text());
      }
    } catch (proxyError) {
      console.error('Proxy request error:', proxyError.message);
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testApiConnection();
