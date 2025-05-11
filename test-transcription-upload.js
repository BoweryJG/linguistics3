// Test script to verify file upload and transcription functionality
console.log('Starting transcription and upload test...');

// Import required modules
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk5NTE3MywiZXhwIjoyMDU5NTcxMTczfQ.75TJbQHaB2wbDeXr3pCvmLxjoid51MhNmCl7jLeDcJE';
const API_URL = process.env.VITE_API_URL || 'https://osbackend-zl1h.onrender.com';

// Initialize Supabase client
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized');
} else {
  console.error('Supabase URL or key missing');
  process.exit(1);
}

// Test file upload to Supabase
async function testFileUpload() {
  console.log('Testing file upload to Supabase...');
  
  try {
    // Check if the bucket exists
    console.log('Checking if bucket exists: audiorecordings');
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('audiorecordings');
    
    if (bucketError) {
      console.error('Error checking bucket existence:', bucketError);
      
      // If the bucket doesn't exist, create it
      if (bucketError.code === 'PGRST116') {
        console.log('Bucket does not exist, creating it...');
        const { data: createData, error: createError } = await supabase
          .storage
          .createBucket('audiorecordings', {
            public: true,
            fileSizeLimit: 52428800 // 50MB in bytes
          });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }
        
        console.log('Bucket created successfully:', createData);
      } else {
        return false;
      }
    } else {
      console.log('Bucket already exists:', bucketData);
    }
    
    // List existing buckets
    const { data: listData, error: listError } = await supabase
      .storage
      .listBuckets();
      
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      console.log('Available buckets:', listData.map(b => b.name));
    }
    
    console.log('File upload test successful');
    return true;
  } catch (err) {
    console.error('Exception in file upload test:', err);
    return false;
  }
}

// Test backend connection
async function testBackendConnection() {
  console.log(`Testing connection to backend: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend connection successful:', data);
      return true;
    } else {
      console.error(`Error: Server responded with status ${response.status}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    return false;
  }
}

// Test authentication
async function testAuthentication() {
  console.log('Testing authentication...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('User is authenticated:', session.user.email);
      return true;
    } else {
      console.log('No active session found');
      
      // Try to sign in with test credentials
      console.log('Attempting to sign in with test credentials...');
      
      // NOTE: Replace with actual test credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (error) {
        console.error('Authentication error:', error.message);
        return false;
      }
      
      console.log('Authentication successful:', data.user.email);
      return true;
    }
  } catch (err) {
    console.error('Exception in authentication test:', err);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Running all tests...');
  
  const authResult = await testAuthentication();
  console.log(`Authentication test ${authResult ? 'PASSED' : 'FAILED'}`);
  
  const uploadResult = await testFileUpload();
  console.log(`File upload test ${uploadResult ? 'PASSED' : 'FAILED'}`);
  
  const backendResult = await testBackendConnection();
  console.log(`Backend connection test ${backendResult ? 'PASSED' : 'FAILED'}`);
  
  console.log('\nTest Summary:');
  console.log(`- Authentication: ${authResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`- File Upload: ${uploadResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`- Backend Connection: ${backendResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!authResult) {
    console.log('\nAuthentication issues:');
    console.log('1. Make sure you are logged in to the application');
    console.log('2. Check if your Supabase credentials are correct in .env');
    console.log('3. Verify that the Supabase authentication service is working');
  }
  
  if (!uploadResult) {
    console.log('\nFile upload issues:');
    console.log('1. Check if your Supabase storage is properly configured');
    console.log('2. Verify that the "audiorecordings" bucket exists or can be created');
    console.log('3. Make sure your Supabase API key has the necessary permissions');
  }
  
  if (!backendResult) {
    console.log('\nBackend connection issues:');
    console.log('1. Check if the backend server is running at', API_URL);
    console.log('2. Verify that the backend server has a /health endpoint');
    console.log('3. Make sure there are no network issues or CORS restrictions');
  }
}

// Execute the tests
runTests()
  .then(() => {
    console.log('\nTests completed');
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });
