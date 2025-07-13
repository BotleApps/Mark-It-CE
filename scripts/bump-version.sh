#!/bin/bash

# Automatic Version Management Script
# Automatically bumps version based on commit messages or manual input

set -e

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Function to bump version
bump_version() {
    local bump_type=$1
    local new_version
    
    case $bump_type in
        "major")
            new_version=$(npm version major --no-git-tag-version)
            ;;
        "minor")
            new_version=$(npm version minor --no-git-tag-version)
            ;;
        "patch")
            new_version=$(npm version patch --no-git-tag-version)
            ;;
        *)
            echo "❌ Invalid bump type: $bump_type"
            echo "Use: major, minor, or patch"
            exit 1
            ;;
    esac
    
    echo "🚀 Version bumped to: $new_version"
    
    # Update manifest.json to match package.json
    NEW_VERSION_NUMBER=$(echo $new_version | sed 's/v//')
    node -e "
        const fs = require('fs');
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        manifest.version = '$NEW_VERSION_NUMBER';
        fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
        console.log('✅ Updated manifest.json to version $NEW_VERSION_NUMBER');
    "
    
    return 0
}

# Auto-detect version bump type from commit messages
detect_bump_type() {
    local commits=$(git log --oneline --no-merges $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")..HEAD 2>/dev/null || git log --oneline --no-merges -10)
    
    echo "📝 Recent commits:"
    echo "$commits"
    echo ""
    
    # Check for breaking changes (major)
    if echo "$commits" | grep -qE "(BREAKING|major|Major|MAJOR)"; then
        echo "major"
        return
    fi
    
    # Check for features (minor)
    if echo "$commits" | grep -qE "(feat|feature|Feature|FEATURE|minor|Minor|MINOR)"; then
        echo "minor"
        return
    fi
    
    # Default to patch
    echo "patch"
}

# Main logic
if [ "$1" ]; then
    # Manual bump type provided
    BUMP_TYPE=$1
else
    # Auto-detect bump type
    BUMP_TYPE=$(detect_bump_type)
    echo "🔍 Auto-detected bump type: $BUMP_TYPE"
fi

echo "⚡ Bumping version ($BUMP_TYPE)..."
bump_version $BUMP_TYPE

NEW_VERSION=$(node -p "require('./package.json').version")
echo ""
echo "✅ Version management complete!"
echo "📦 New version: $NEW_VERSION"
echo ""
echo "💡 Next steps:"
echo "   git add package.json manifest.json"
echo "   git commit -m 'chore: bump version to $NEW_VERSION'"
echo "   git tag v$NEW_VERSION"
echo "   git push origin main --tags"
