# Transcription and Upload Troubleshooting Guide

This guide will help you troubleshoot issues with the transcription and upload functionality in the RepSpheres application.

## Overview

The RepSpheres application allows users to upload audio files, which are then:
1. Uploaded to Supabase Storage
2. Sent to the backend for processing
3. Transcribed using OpenAI's Whisper API
4. Analyzed using OpenAI's GPT-4
5. Results are stored back in Supabase

If you're experiencing issues with this process, this guide will help you identify and fix the problems.

## Test Scripts

We've created several test scripts to help diagnose issues:

### 1. `test-transcription-upload.js`

This script tests the Supabase connection and file upload functionality:
- Checks if the Supabase client can be initialized
- Tests if the audio recordings bucket exists or can be created
- Verifies authentication status

To run this test:
```bash
node test-transcription-upload.js
```

### 2. `test-openai-integration.js`

This script tests the OpenAI integration with the backend:
- Checks if the backend server is running
- Tests if the webhook endpoint is properly handling requests
- Verifies that authentication is properly implemented

To run this test:
```bash
node test-openai-integration.js
```

### 3. `run-transcription-tests.js`

This script runs both tests and provides a comprehensive report:

To run all tests:
```bash
node run-transcription-tests.js
```

## Common Issues and Solutions

### 1. Authentication Issues

**Symptoms:**
- "Authorization header missing" error
- 401 Unauthorized responses

**Solutions:**
- Make sure you are logged in to the application
- Check if your Supabase credentials are correct in `.env`
- Verify that the Supabase authentication service is working

### 2. File Upload Issues

**Symptoms:**
- "Error uploading file" messages
- Files not appearing in Supabase storage

**Solutions:**
- Check if your Supabase storage is properly configured
- Verify that the "audiorecordings" bucket exists or can be created
- Make sure your Supabase API key has the necessary permissions
- Check if the file size is within the allowed limits (50MB)

### 3. Backend Connection Issues

**Symptoms:**
- "Failed to fetch" errors
- Network errors when calling the API

**Solutions:**
- Check if the backend server is running at the URL specified in `.env`
- Verify that the backend server has a `/health` endpoint
- Make sure there are no network issues or CORS restrictions
- Try using a CORS proxy if needed

### 4. OpenAI Integration Issues

**Symptoms:**
- Transcription not working
- Analysis not being generated

**Solutions:**
- Check if the backend server is properly configured to use OpenAI
- Verify that the OpenAI API key is set in the backend environment
- Make sure the backend server is handling the webhook endpoint correctly
- Check if there are any CORS issues preventing the request

## Adding OpenAI Integration to the Backend

If the OpenAI integration is not properly implemented in the backend, you can use the `add-openai-integration.py` script to add it:

```bash
python add-openai-integration.py
```

This script will:
1. Add the OpenAI import to the backend implementation
2. Initialize the OpenAI API key
3. Update the AudioRequest model to include transcription fields
4. Add the audio processing logic with OpenAI integration

**Important:** After running this script, make sure to set the `OPENAI_API_KEY` environment variable in your backend deployment.

## Environment Variables

Make sure the following environment variables are properly set:

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_KEY=your-supabase-key
```

### Backend
```
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key (if using Stripe)
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret (if using Stripe)
```

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
