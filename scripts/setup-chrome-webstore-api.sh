#!/bin/bash

# Chrome Web Store API Setup Helper
# This script helps you set up the necessary credentials for automated publishing

echo "🚀 Chrome Web Store API Setup Helper"
echo "======================================"
echo ""

echo "📋 Step 1: Create Google Cloud Project"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Create a new project or select existing one"
echo "3. Enable the Chrome Web Store API"
echo ""

echo "🔑 Step 2: Create OAuth 2.0 Credentials"
echo "1. Go to APIs & Services > Credentials"
echo "2. Click 'Create Credentials' > 'OAuth client ID'"
echo "3. Choose 'Web application'"
echo "4. Add authorized redirect URI: https://oauth2.googleapis.com/oauth2/v1/authorize"
echo "5. Note down Client ID and Client Secret"
echo ""

echo "🎫 Step 3: Get Refresh Token"
echo "1. Go to https://developers.google.com/oauthplayground/"
echo "2. Click the gear icon (settings) in top right"
echo "3. Check 'Use your own OAuth credentials'"
echo "4. Enter your Client ID and Client Secret"
echo "5. In the left panel, find 'Chrome Web Store API v1.1'"
echo "6. Select scope: https://www.googleapis.com/auth/chromewebstore"
echo "7. Click 'Authorize APIs'"
echo "8. Complete the OAuth flow"
echo "9. Click 'Exchange authorization code for tokens'"
echo "10. Copy the refresh_token value"
echo ""

echo "🏪 Step 4: Get Extension ID"
echo "Your extension ID can be found in the Chrome Web Store URL:"
echo "https://chromewebstore.google.com/detail/mark-it-memory-manager/YOUR_EXTENSION_ID"
echo ""

echo "🔐 Step 5: Add GitHub Secrets"
echo "Go to your GitHub repository > Settings > Secrets and variables > Actions"
echo "Add these repository secrets:"
echo ""
echo "CHROME_EXTENSION_ID=your_extension_id_here"
echo "CHROME_CLIENT_ID=your_client_id_here"
echo "CHROME_CLIENT_SECRET=your_client_secret_here"
echo "CHROME_REFRESH_TOKEN=your_refresh_token_here"
echo ""

echo "✅ Step 6: Test the Workflow"
echo "Create and push a git tag to trigger publishing:"
echo "git tag v1.0.5"
echo "git push origin v1.0.5"
echo ""

echo "📚 Useful Resources:"
echo "- Chrome Web Store API: https://developer.chrome.com/docs/webstore/using_webstore_api/"
echo "- OAuth 2.0 Playground: https://developers.google.com/oauthplayground/"
echo "- GitHub Actions: https://docs.github.com/en/actions"
echo ""

echo "🎉 Setup complete! Your repository is now ready for automated publishing."
