# 🚀 Automated Chrome Web Store Publishing

This document explains the robust CI/CD pipeline for automated versioning and publishing to the Chrome Web Store.

## 🔄 Complete Workflow Overview

### Production Pipeline (Main Branch)
1. **Pull Request to Main** → Automatic version detection & testing
2. **Merge to Main** → Auto version bump → Build → Publish → Release

### Development Pipeline  
- **Push to develop/feature branches** → Build & test only
- **Pull Requests** → Full testing + version suggestion

## 📋 Workflow Details

### 1. Pull Request Workflow
When you create a PR to `main`:

```bash
git checkout -b feature/my-new-feature
# Make your changes
git commit -m "feat: add amazing new feature"
git push origin feature/my-new-feature
# Create PR to main
```

**What happens:**
- ✅ Code is tested and built
- 🔍 Commits are analyzed for version bump type
- 💬 Bot comments on PR with proposed version
- 📊 Version suggestion based on commit messages

### 2. Production Deployment
When PR is merged to `main`:

```bash
# After PR merge, GitHub Actions automatically:
# 1. Detects version bump type from commits
# 2. Bumps version in package.json & manifest.json  
# 3. Creates git tag
# 4. Builds extension
# 5. Publishes to Chrome Web Store
# 6. Creates GitHub release
```

## 🏷️ Automatic Version Detection

### Commit Message Rules
- **Major** (1.0.0 → 2.0.0): `BREAKING`, `major`, `Major`, `MAJOR`
- **Minor** (1.0.0 → 1.1.0): `feat`, `feature`, `Feature`, `FEATURE`, `minor`
- **Patch** (1.0.0 → 1.0.1): Everything else (fixes, docs, refactor, etc.)

### Examples
```bash
# These create MAJOR version bump:
git commit -m "BREAKING: remove deprecated API"
git commit -m "major: complete UI redesign"

# These create MINOR version bump:  
git commit -m "feat: add quick save popup"
git commit -m "feature: implement auto-sync"

# These create PATCH version bump:
git commit -m "fix: resolve bookmark import bug"
git commit -m "docs: update README"
git commit -m "refactor: optimize performance"
```

## 🛠 Manual Version Control

### Local Version Bumping
```bash
# Auto-detect bump type from recent commits
npm run bump

# Or specify explicitly:
npm run bump:major    # 1.0.0 → 2.0.0
npm run bump:minor    # 1.0.0 → 1.1.0  
npm run bump:patch    # 1.0.0 → 1.0.1
```

### Manual Deployment Trigger
```bash
# In GitHub Actions tab, manually trigger "Production Deploy"
# Choose version bump type and whether to skip publishing
```

## 🔧 Setup Instructions

### 1. One-time Setup
```bash
# Run the setup helper for Chrome Web Store API
npm run setup-webstore
```

### 2. Required GitHub Secrets
Add these in GitHub repo → Settings → Secrets:
```
CHROME_EXTENSION_ID=your_extension_id
CHROME_CLIENT_ID=your_oauth_client_id  
CHROME_CLIENT_SECRET=your_oauth_client_secret
CHROME_REFRESH_TOKEN=your_refresh_token
```

## � Branch Strategy

```
main (production)     ←── Auto-deploy on merge
 ↑
develop (staging)     ←── Feature integration  
 ↑
feature/* (dev)       ←── Individual features
```

### Recommended Flow
1. **Feature Development**: Create branch from `develop`
2. **Integration**: PR feature → `develop` for testing
3. **Production**: PR develop → `main` for deployment

## 🎯 Publishing Triggers

### Automatic Publishing
- ✅ **Merge to main**: Auto-detects version, publishes automatically
- ✅ **Version consistency**: Ensures package.json and manifest.json match

### Manual Publishing  
- 🔧 **GitHub Actions**: Manual trigger with custom bump type
- 📦 **Local package**: `npm run package` for manual upload

### Skip Publishing
- 🚫 Set `skip-publish: true` in manual workflow dispatch
- 🏗️ Builds and tags version without Chrome Web Store upload

## � Monitoring & Debugging

### Check Workflow Status
1. Go to **Actions** tab in GitHub
2. View **Production Deploy** or **CI** workflows
3. Check logs for any failures

### Version Consistency Check
```bash
# Verify versions match
node -p "require('./package.json').version"
node -p "require('./manifest.json').version"  
node -p "require('./dist/manifest.json').version"
```

### Common Issues
1. **Version Mismatch**: Ensure package.json and manifest.json are synchronized
2. **Missing Secrets**: Check all 4 Chrome Web Store secrets are set
3. **Build Failures**: Review build logs for specific errors
4. **OAuth Expired**: Regenerate refresh token if publishing fails

## 📈 Best Practices

### Commit Messages
- ✅ Use clear, descriptive commit messages
- ✅ Include type prefixes (`feat:`, `fix:`, `docs:`)
- ✅ Reference issues when applicable
- ✅ Use conventional commits format

### Version Management
- ✅ Let automation handle version bumping
- ✅ Use semantic versioning principles
- ✅ Test thoroughly before merging to main
- ✅ Keep changelog updated in README

### Release Process
- ✅ Test locally before creating PR
- ✅ Review automated version suggestions
- ✅ Monitor deployment pipeline
- ✅ Verify Chrome Web Store publication

## 🚨 Emergency Procedures

### Rollback Release
```bash
# If need to rollback:
git revert <commit-hash>
git push origin main

# Or manually publish previous version:
# 1. Checkout previous tag
# 2. Run manual workflow dispatch
# 3. Upload to Chrome Web Store manually
```

### Hotfix Process
```bash
git checkout main
git checkout -b hotfix/critical-fix
# Make urgent fix
git commit -m "fix: critical security issue"
# PR directly to main (will auto-deploy)
```

This robust pipeline ensures reliable, automated publishing while maintaining full control and visibility over the release process! 🎉
