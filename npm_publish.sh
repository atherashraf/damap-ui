#!/bin/bash
set -e

echo "📦 Publishing damap v$(node -p 'require("./package.json").version')"

# Step 1: Build directly
#rm -rf dist
#npx tsc -p tsconfig.build.json
#npx tsc -p tsconfig.build.json --listEmittedFiles

#npx vite build
npm run build

# Step 2: Confirm with the user
read -p "🔒 Are you sure you want to publish to npm? (y/N) " confirm
if [[ $confirm != "y" ]]; then
  echo "❌ Publish cancelled."
  exit 1
fi

# Step 3: Publish publicly
npm publish --access=public

# Step 4: Done
echo "✅ Successfully published damap to npm!"
