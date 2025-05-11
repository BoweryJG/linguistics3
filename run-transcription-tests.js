// Script to run all transcription and upload tests
console.log('Starting comprehensive transcription and upload tests...');

// Import the test scripts
import './test-transcription-upload.js';
import './test-openai-integration.js';

// This script will execute both test files and provide a comprehensive report
console.log('\n=== Comprehensive Test Report ===');
console.log('1. First, the Supabase connection and file upload functionality is tested');
console.log('2. Then, the OpenAI integration with the backend is tested');
console.log('\nCheck the output above for detailed test results and recommendations');
console.log('\nIf you encounter issues, here are some common troubleshooting steps:');
console.log('1. Verify your Supabase credentials in .env');
console.log('2. Check if the backend server is running and accessible');
console.log('3. Ensure your OpenAI API key is valid and has sufficient credits');
console.log('4. Verify that CORS is properly configured on the backend');
console.log('5. Check if the Supabase storage bucket is properly configured');
console.log('6. Make sure you are authenticated when making API calls');
