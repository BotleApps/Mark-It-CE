# 🚀 Automated Chrome Web Store Publishing

This document explains how to set up and use automated publishing to the Chrome Web Store using GitHub Actions.

## 🔧 Setup Instructions

### 1. Run the Setup Helper

```bash
npm run setup-webstore
```

This will guide you through the complete setup process.

### 2. Quick Setup Summary

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Chrome Web Store API

2. **Create OAuth Credentials**
   - Create OAuth 2.0 Client ID
   - Get Client ID and Client Secret

3. **Get Refresh Token**
   - Use [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Authorize Chrome Web Store API scope
   - Get refresh token

4. **Add GitHub Secrets**
   ```
   CHROME_EXTENSION_ID=your_extension_id
   CHROME_CLIENT_ID=your_oauth_client_id
   CHROME_CLIENT_SECRET=your_oauth_client_secret
   CHROME_REFRESH_TOKEN=your_refresh_token
   ```

## 📦 Publishing Workflows

### Automatic Publishing (Recommended)

1. **Create and push a version tag:**
   ```bash
   git tag v1.0.5
   git push origin v1.0.5
   ```

2. **GitHub Actions will automatically:**
   - Build the extension
   - Run tests and linting
   - Upload to Chrome Web Store
   - Create a GitHub release

### Manual Publishing

1. **Build and package locally:**
   ```bash
   npm run package
   ```

2. **Upload manually to Chrome Web Store Developer Dashboard**

### Manual Trigger

You can also trigger publishing manually from GitHub Actions:

1. Go to Actions tab in your repository
2. Select "Build and Publish Chrome Extension"
3. Click "Run workflow"
4. Choose whether to publish or just build

## 🔄 Workflows Overview

### CI Workflow (`ci.yml`)
- **Triggers:** Push to main/develop, Pull Requests
- **Actions:** Build, lint, test, version validation
- **Artifacts:** Build files for testing

### Publish Workflow (`publish-chrome-extension.yml`)
- **Triggers:** Version tags (`v*`), Manual dispatch
- **Actions:** Build, upload to Chrome Web Store, create GitHub release
- **Requirements:** GitHub secrets configured

## 📋 Version Management

### Updating Versions

1. Update version in `package.json`
2. Update version in `manifest.json`
3. Update README.md release notes
4. Commit changes
5. Create and push version tag

### Version Consistency

The CI workflow validates that versions match between:
- `package.json`
- `manifest.json`

## 🛠 Troubleshooting

### Common Issues

1. **Version Mismatch**
   - Ensure `package.json` and `manifest.json` have the same version
   - Check build output for version consistency

2. **Missing Secrets**
   - Verify all required GitHub secrets are set
   - Check secret names match exactly

3. **OAuth Issues**
   - Refresh token may have expired
   - Re-generate refresh token using OAuth playground

4. **Build Failures**
   - Check build logs for specific errors
   - Ensure all dependencies are installed
   - Verify file paths in build script

### Debug Commands

```bash
# Test local build
npm run build

# Create test package
npm run package

# Check version consistency
node -p "require('./package.json').version"
node -p "require('./dist/manifest.json').version"
```

## 📚 Resources

- [Chrome Web Store API Documentation](https://developer.chrome.com/docs/webstore/using_webstore_api/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

## 🎯 Best Practices

1. **Always test locally** before publishing
2. **Use semantic versioning** (e.g., v1.0.5)
3. **Update release notes** before tagging
4. **Test in development** before pushing tags
5. **Monitor GitHub Actions** for build status
6. **Keep secrets secure** and rotate regularly
