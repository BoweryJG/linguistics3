#!/bin/bash

# Script to run the backend connection tests

echo "====================================================="
echo "TESTING CONNECTION TO OSBACKEND-ZL1H.ONRENDER.COM"
echo "====================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install it first."
    exit 1
fi

# Run the Node.js test script
echo "Running direct backend connection test..."
node test-backend-connection.js

echo ""
echo "====================================================="
echo "BROWSER TEST INSTRUCTIONS"
echo "====================================================="
echo "To test the API connection in the browser:"
echo "1. Start your application with: npm run dev"
echo "2. Open the browser and navigate to your application"
echo "3. Open the browser console (F12 or right-click > Inspect > Console)"
echo "4. Copy and paste the code from test-api-connection.js into the console"
echo ""

# Optionally start the dev server if the user agrees
read -p "Would you like to start the development server now? (y/n) " answer
if [[ $answer =~ ^[Yy]$ ]]
then
    echo "Starting development server..."
    npm run dev
fi
