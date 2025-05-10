#!/bin/bash

# Script to create multiple commits to test GitHub repository

echo "Creating multiple commits and pushing to GitHub..."

# Create a directory for test files if it doesn't exist
mkdir -p test-commits

# Number of commits to make
COMMIT_COUNT=100

for i in $(seq 1 $COMMIT_COUNT)
do
  # Create a unique file for each commit
  echo "Test file $i - created at $(date)" > test-commits/test-file-$i.txt
  
  # Add and commit
  git add test-commits/test-file-$i.txt
  git commit -m "Test commit $i of $COMMIT_COUNT"
  
  echo "Created commit $i of $COMMIT_COUNT"
  
  # Push every 10 commits to avoid overwhelming GitHub
  if (( i % 10 == 0 )); then
    echo "Pushing batch of commits to GitHub..."
    git push origin main
  fi
done

# Final push to make sure all commits are pushed
git push origin main

echo "Done! Created and pushed $COMMIT_COUNT commits to GitHub."
