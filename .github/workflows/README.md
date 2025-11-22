# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the create-net project.

## Workflows

### CI (`ci.yml`)

Runs on every push to `main` and on all pull requests.

**What it does:**
- Tests the package on multiple Node.js versions (14, 16, 18, 20)
- Runs the test suite (`npm test`)
- Verifies the CLI script is executable

### Publish to npm (`publish.yml`)

Runs automatically when a new GitHub release is created.

**What it does:**
- Installs dependencies
- Runs tests to ensure quality
- Publishes the package to npm

## Publishing to npm

To publish a new version:

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. Push the changes and tags:
   ```bash
   git push && git push --tags
   ```

3. Create a GitHub release:
   - Go to https://github.com/ServiceStack/create-net/releases/new
   - Select the version tag you just pushed
   - Add release notes describing the changes
   - Click "Publish release"

4. The `publish.yml` workflow will automatically:
   - Run tests
   - Publish to npm if tests pass

## Required Secrets

For the publish workflow to work, you need to add an `NPM_TOKEN` secret to your GitHub repository:

1. Generate an npm token:
   - Log in to https://www.npmjs.com
   - Go to Account Settings → Access Tokens
   - Generate a new "Automation" token

2. Add the token to GitHub:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token
   - Click "Add secret"

## Manual Publishing

If you prefer to publish manually:

```bash
npm login
npm publish
```
