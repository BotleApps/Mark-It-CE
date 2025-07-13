#!/bin/bash

# Manual Extension Packaging Script
# Creates a zip file ready for Chrome Web Store upload

set -e

echo "📦 Building Mark-It-CE Extension Package"
echo "========================================"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📋 Version: $VERSION"

# Clean and build
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -f extension-*.zip

echo "🔨 Building extension..."
npm run build

# Verify build
echo "✅ Verifying build output..."
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ Error: manifest.json not found in dist/"
    exit 1
fi

if [ ! -f "dist/popup.html" ]; then
    echo "❌ Error: popup.html not found in dist/"
    exit 1
fi

if [ ! -f "dist/popup.js" ]; then
    echo "❌ Error: popup.js not found in dist/"
    exit 1
fi

# Check version consistency
MANIFEST_VERSION=$(node -p "require('./dist/manifest.json').version")
if [ "$VERSION" != "$MANIFEST_VERSION" ]; then
    echo "❌ Error: Version mismatch!"
    echo "   package.json: $VERSION"
    echo "   manifest.json: $MANIFEST_VERSION"
    exit 1
fi

echo "✅ Version consistency check passed"

# Create package
PACKAGE_NAME="extension-v$VERSION.zip"
echo "📦 Creating package: $PACKAGE_NAME"

cd dist
zip -r "../$PACKAGE_NAME" . -x "*.DS_Store" "*/.*"
cd ..

# Display package info
echo ""
echo "🎉 Package created successfully!"
echo "📁 File: $PACKAGE_NAME"
echo "📊 Size: $(du -h "$PACKAGE_NAME" | cut -f1)"
echo ""
echo "📋 Package contents:"
unzip -l "$PACKAGE_NAME"
echo ""
echo "🚀 Ready for Chrome Web Store upload!"
echo "💡 You can also use the GitHub Actions workflow by creating a git tag:"
echo "   git tag v$VERSION"
echo "   git push origin v$VERSION"
