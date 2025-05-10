#!/bin/bash

# Create a GitHub Gist with the key files
# This will bypass git issues and get your changes online quickly

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if curl is installed
if ! command_exists curl; then
  echo "Error: curl is not installed. Please install curl first."
  exit 1
fi

# Create a directory for the files to upload
mkdir -p github-upload

# Copy the essential files
cp .env github-upload/
cp src/api.js github-upload/
cp test-backend-connection.js github-upload/
cp test-api-connection.js github-upload/
cp change-summary.md github-upload/

# Create a README that explains what these files are
cat > github-upload/README.md << 'EOL'
# mUiLinguistics Frontend Files

These files connect the frontend to the backend at https://osbackend-zl1h.onrender.com.

## Files Included:

- `.env`: Environment configuration with API URL
- `api.js`: API connection configuration 
- `test-backend-connection.js`: Connection test script
- `test-api-connection.js`: API test script
- `change-summary.md`: Summary of changes made

## Connection Details

The frontend is configured to connect to https://osbackend-zl1h.onrender.com using the environment variable in `.env`.
EOL

echo "Files prepared for upload in the github-upload directory"
echo "You can now upload these files to GitHub directly via the web interface"
echo "Or use GitHub Gist to share them quickly"

# Create a zip file with all the files
zip -r github-upload.zip github-upload/

echo "Created github-upload.zip file for easy sharing"
