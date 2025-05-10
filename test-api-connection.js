// Test script to verify the API connection in the frontend
console.log('Starting API connection test...');

// These need to be imported in the browser environment
// This is a script to verify the configuration, not to be executed directly with Node.js
const API_TEST = `
// This code should be pasted into the browser console on your website
// It will test the connection to the backend API

(async function() {
  try {
    // Check environment variables
    console.log('Environment Variables:');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY ? 'Exists (not shown for security)' : 'Not found');

    // Check if api.js is loaded
    if (typeof sendRequest === 'undefined') {
      console.error('The sendRequest function is not defined. Make sure api.js is properly imported.');
      return;
    }

    console.log('API functions are properly loaded.');
    
    // Test sendRequest function
    console.log('Testing API connection to backend...');
    
    try {
      // Send a test request to the health endpoint
      const testPayload = { test: true };
      const response = await sendRequest(testPayload, '/health');
      
      console.log('API Response:', response);
      console.log('✅ API connection SUCCESSFUL!');
    } catch (apiError) {
      console.error('API request failed:', apiError);
      console.log('❌ API connection FAILED!');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
})();
`;

console.log('To test the API connection:');
console.log('1. Open your application in the browser');
console.log('2. Open the browser developer console (F12 or right-click > Inspect > Console)');
console.log('3. Paste the following code into the console and press Enter:');
console.log('\n' + API_TEST + '\n');
console.log('This will test the actual API connection as it runs in the browser environment.');
