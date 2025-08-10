# Chrome Web Store API Setup

To enable automatic publishing to the Chrome Web Store, you need to configure API credentials in your GitHub repository secrets.

## Required GitHub Secrets

Add these secrets in your repository settings (Settings → Secrets and variables → Actions):

### 1. CHROME_EXTENSION_ID
- Your Chrome extension ID from the Chrome Web Store Developer Dashboard
- Format: `abcdefghijklmnopqrstuvwxyz123456`

### 2. CHROME_CLIENT_ID
- OAuth 2.0 client ID from Google Cloud Console
- Format: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`

### 3. CHROME_CLIENT_SECRET
- OAuth 2.0 client secret from Google Cloud Console
- Format: `GOCSPX-abcdefghijklmnopqrstuvwxyz123456`

### 4. CHROME_REFRESH_TOKEN
- OAuth 2.0 refresh token
- Format: `1//abcdefghijklmnopqrstuvwxyz123456789`

## How to Get These Credentials

### Step 1: Chrome Web Store Developer Dashboard
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Find your extension and note the Extension ID

### Step 2: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Chrome Web Store API
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Create credentials → OAuth 2.0 Client ID
   - Application type: Desktop application
   - Note the Client ID and Client Secret

### Step 3: Get Refresh Token
Use the script in your project:
```bash
./scripts/setup-chrome-webstore-api.sh
```

Or manually using curl:
```bash
# Get authorization code (replace CLIENT_ID)
https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob

# Exchange code for refresh token (replace CLIENT_ID, CLIENT_SECRET, and AUTH_CODE)
curl "https://accounts.google.com/o/oauth2/token" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"
```

## Troubleshooting

### 401 Unauthorized Error
- Check that all secrets are correctly set
- Verify the refresh token hasn't expired
- Ensure the OAuth client has Chrome Web Store API permissions

### Version Mismatch Error
- Ensure your build process updates both `package.json` and `manifest.json`
- Check that the workflow has the latest code after version bump

### Missing Files Error
- Verify your build script creates all required files in `dist/`
- Check the build command in `package.json`

## Manual Upload Alternative

If automatic upload fails, you can:
1. Download the extension zip from GitHub Releases
2. Upload manually to Chrome Web Store Developer Dashboard
3. Set `skip-publish: true` in workflow dispatch to skip automatic upload
