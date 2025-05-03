#!/bin/bash

# Stop on first error
set -e

echo "📦 Publishing damap v$(node -p \"require('./package.json').version\")"

# Step 1: Run build (make sure this compiles to dist/)
npm run build

# Step 2: Confirm with the user
read -p "🔒 Are you sure you want to publish to npm? (y/N) " confirm
if [[ $confirm != "y" ]]; then
  echo "❌ Publish cancelled."
  exit 1
fi

# Step 3: Publish the package publicly
npm publish --access=public

# Optional: Confirm publish was successful
echo "✅ Successfully published damap to npm!"

# Optional: Clean up build artifacts (if needed)
# rm -rf dist
