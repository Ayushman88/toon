# Publishing TOON to npm (2025 Guide)

This guide covers how to publish the TOON package to npm with modern best practices.

## Prerequisites

1. **npm account** - Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **Login to npm** - Run `npm login` in your terminal
3. **Verify package name** - Ensure `@ayushman/toon` is available (scoped packages require npm organization or your username)

## Pre-Publishing Checklist

### 1. Update Version

Update the version in `package.json`:

```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major
```

Or manually edit `package.json`:
```json
{
  "version": "1.0.0"  // Update this
}
```

### 2. Build and Test

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Verify the dist folder
ls -la dist/
```

### 3. Verify package.json

Ensure these fields are correct:
- ✅ `name`: `@ayushman/toon`
- ✅ `version`: Updated version number
- ✅ `description`: Clear and descriptive
- ✅ `author`: Your name/contact info
- ✅ `license`: MIT
- ✅ `repository`: GitHub repo URL
- ✅ `files`: Only includes what should be published

### 4. Check What Will Be Published

```bash
# See what files will be included
npm pack --dry-run
```

This shows exactly what will be published. Should include:
- `dist/` folder (compiled JavaScript)
- `README.md`
- `spec/` folder
- `LICENSE`
- `package.json`

## Publishing Steps

### Step 1: Login to npm

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- OTP (if 2FA enabled)

### Step 2: Verify You're Logged In

```bash
npm whoami
```

Should show your npm username.

### Step 3: Publish

#### First Time Publishing

```bash
# Publish public package
npm publish --access public
```

**Note**: Scoped packages (`@username/package`) are private by default. Use `--access public` to make it public.

#### Subsequent Publishes

```bash
npm publish
```

### Step 4: Verify Publication

1. Check npm: https://www.npmjs.com/package/@ayushman/toon
2. Test installation:
   ```bash
   npm install @ayushman/toon
   ```

## Post-Publishing

### 1. Create Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0`
5. Description: Release notes
6. Publish release

### 3. Update Documentation

- Update README if needed
- Announce on social media/community

## Common Issues & Solutions

### Issue: "You do not have permission to publish"

**Solution**: 
- For scoped packages, ensure you own the npm organization/scope
- Or publish as unscoped: change name from `@ayushman/toon` to `toon` (if available)

### Issue: "Package name already exists"

**Solution**: 
- Choose a different name
- Or use a scoped package: `@yourusername/toon`

### Issue: "Invalid package name"

**Solution**: 
- Package names must be lowercase
- Can contain hyphens and underscores
- Scoped packages: `@scope/package-name`

### Issue: "Version already exists"

**Solution**: 
- Update version number
- Use `npm version patch/minor/major`

## Best Practices (2025)

### 1. Use Semantic Versioning

- **MAJOR** (2.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **PATCH** (1.0.1): Bug fixes, backward compatible

### 2. Include TypeScript Types

✅ Already done - `types` field in package.json points to `.d.ts` files

### 3. Support Both ESM and CommonJS

✅ Already done - `exports` field supports both

### 4. Include Comprehensive README

✅ Already done - Detailed README with examples

### 5. Include License

✅ Already done - MIT License included

### 6. Run Tests Before Publishing

✅ Already done - `prepublishOnly` script runs tests

### 7. Use `.npmignore` or `files` Field

✅ Using `files` field in package.json (better than .npmignore)

## Automated Publishing (Optional)

### Using GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Updating the Package

1. Make your changes
2. Update version: `npm version patch`
3. Build: `npm run build`
4. Test: `npm test`
5. Publish: `npm publish`
6. Tag: `git tag v1.0.1 && git push origin v1.0.1`

## Unpublishing (Emergency Only)

⚠️ **Warning**: Only unpublish within 72 hours of publishing

```bash
npm unpublish @ayushman/toon@1.0.0
```

After 72 hours, you must deprecate instead:

```bash
npm deprecate @ayushman/toon@1.0.0 "Use version 1.0.1 instead"
```

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/v9)

