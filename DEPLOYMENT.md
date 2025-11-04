# GitHub Pages Deployment Instructions

## Automated Deployment (Recommended)

The project is now configured to automatically deploy to GitHub Pages whenever you push to the `main` branch.

### One-Time Setup:

1. Go to your GitHub repository: https://github.com/funvill/polarity-bullet-hell
2. Click on **Settings** → **Pages** (in the left sidebar)
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**
4. That's it! The workflow will automatically build and deploy.

### After Setup:

Simply commit and push your changes:
```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

The GitHub Action will automatically:
1. Build the Vite project (`npm run build`)
2. Deploy the `dist/` folder to GitHub Pages
3. Your game will be live at: **https://funvill.github.io/polarity-bullet-hell/**

### Checking Deployment Status:

- Go to the **Actions** tab in your GitHub repository
- You'll see the deployment workflow running
- Once complete (green checkmark), your game is live!

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build the project
npm run build

# The built files will be in the dist/ folder
# You can deploy this folder to any static hosting service
```

## Configuration Files Added:

1. `.github/workflows/deploy.yml` - GitHub Actions workflow for automated deployment
2. `vite.config.js` - Vite configuration with correct base path for GitHub Pages

## Troubleshooting:

**If the page shows a 404:**
- Make sure GitHub Pages is enabled in Settings → Pages
- Ensure "Source" is set to "GitHub Actions"
- Check the Actions tab for any build errors

**If assets don't load:**
- The `vite.config.js` sets the base path to `/polarity-bullet-hell/`
- This matches your repository name
- If you rename the repo, update the `base` value in `vite.config.js`

## Local Testing:

```bash
# Development server
npm run dev

# Build and preview
npm run build
npm run preview
```
