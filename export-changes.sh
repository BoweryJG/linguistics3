#!/bin/bash

# Create export directory
mkdir -p mUiLinguistics-changes

# Copy key modified files
cp src/api.js mUiLinguistics-changes/
cp test-backend-connection.js mUiLinguistics-changes/
cp test-api-connection.js mUiLinguistics-changes/
cp .env mUiLinguistics-changes/
cp change-summary.md mUiLinguistics-changes/

# Create a README for the export
cat > mUiLinguistics-changes/README.md << 'EOL'
# mUiLinguistics Frontend Changes

This directory contains key files that were modified to connect the frontend to the backend at https://osbackend-zl1h.onrender.com.

## Files Included:

- `api.js`: The API connection module
- `test-backend-connection.js`: Simple connection test script
- `test-api-connection.js`: Comprehensive API test script
- `.env`: Environment configuration with API URL
- `change-summary.md`: Detailed summary of changes made

## How to Apply These Changes

1. Copy these files to their respective locations in your mUiLinguistics repository
2. Ensure the `.env` file is in the root directory
3. Run `node test-backend-connection.js` to verify connection
EOL

echo "Files exported to mUiLinguistics-changes directory"
