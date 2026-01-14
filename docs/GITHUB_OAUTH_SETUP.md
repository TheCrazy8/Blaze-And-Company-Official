# GitHub OAuth Setup Guide

## Overview

BrightOS documentation site uses GitHub's API to fetch commit history and other dynamic content. To prevent rate limiting (60 requests/hour for unauthenticated users), you can set up GitHub OAuth authentication.

## For Users

### Why Sign In?

- **Higher Rate Limits**: Authenticated users get 5,000 requests/hour vs 60 for anonymous users
- **Better Experience**: No interruptions due to rate limiting
- **Secure**: Uses OAuth 2.0 standard authentication flow

### How to Sign In

1. Look for the "Sign in with GitHub" button on pages that fetch GitHub data
2. Click the button to authorize the app
3. You'll be redirected to GitHub to grant permissions
4. After authorization, you'll be redirected back with increased rate limits

### What Permissions Are Requested?

- **`public_repo`**: Read-only access to public repository data
- No write permissions or access to private data

## For Developers/Maintainers

### Setting Up GitHub OAuth App

To enable OAuth authentication for your deployment:

#### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: BrightOS Documentation
   - **Homepage URL**: `https://yourdomain.github.io/Blaze-And-Company-Official/`
   - **Authorization callback URL**: `https://yourdomain.github.io/Blaze-And-Company-Official/`
   - **Application description**: Official documentation for BrightOS

4. Click "Register application"
5. Note your **Client ID** and generate a **Client Secret**

#### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=your_client_id_here
```

**⚠️ IMPORTANT**: Never commit the client secret to your repository!

#### 3. Set Up Token Exchange Backend

Since client secrets cannot be exposed in frontend code, you need a backend service to exchange OAuth codes for access tokens.

**Option A: Netlify Functions** (Recommended for Netlify deployments)

Create `netlify/functions/github-oauth.js`:

```javascript
exports.handler = async (event) => {
  const { code } = JSON.parse(event.body)
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    })
  })
  
  const data = await response.json()
  
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  }
}
```

**Option B: Vercel Serverless Functions**

Create `api/github-oauth.js`:

```javascript
export default async function handler(req, res) {
  const { code } = req.body
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    })
  })
  
  const data = await response.json()
  res.json(data)
}
```

**Option C: Custom Backend Proxy**

Set up your own backend service that handles the token exchange. Update `docs/.vitepress/theme/config/github-auth.js` to point to your backend endpoint.

#### 4. Update OAuth Configuration

In `docs/.vitepress/theme/config/github-auth.js`, update the token exchange URL to point to your backend:

```javascript
// Add to GitHubAuth class
async handleCallback() {
  // ... existing code ...
  
  // Call your backend to exchange code for token
  const tokenResponse = await fetch('/api/github-oauth', {  // Or your backend URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  
  const tokenData = await tokenResponse.json()
  
  if (tokenData.access_token) {
    this.saveToken(tokenData.access_token)
    return true
  }
  
  return false
}
```

#### 5. Set Environment Variables in Deployment

**For GitHub Pages with GitHub Actions:**

1. Go to your repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `GITHUB_CLIENT_ID`: Your OAuth app client ID
   - `GITHUB_CLIENT_SECRET`: Your OAuth app client secret

**For Netlify:**

1. Go to Site settings → Build & deploy → Environment
2. Add variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

**For Vercel:**

1. Go to Project settings → Environment Variables
2. Add variables for all environments

## Current Implementation Status

### ✅ Implemented
- GitHub OAuth authentication flow
- Token storage and management
- Authenticated API requests with `githubFetch`
- Rate limit detection and user feedback
- GitHubAuthButton component for sign-in UI

### ⚠️ Requires Backend Setup
- Token exchange (requires serverless function or backend)
- Token refresh mechanism

### 💡 Without Backend
The site will work without OAuth setup, but users will be limited to:
- 60 API requests per hour (unauthenticated)
- Potential rate limiting on popular pages
- Raw content fetching from GitHub (no rate limits) for plugins

## Testing OAuth Flow

1. Set `VITE_GITHUB_CLIENT_ID` in `.env`
2. Run dev server: `npm run dev`
3. Navigate to a page with GitHub data
4. Click "Sign in with GitHub"
5. Verify OAuth flow (note: token exchange won't work without backend)

## Security Considerations

- ✅ Client secret never exposed in frontend code
- ✅ CSRF protection using state parameter
- ✅ Tokens stored in localStorage with expiry
- ✅ Only requests `public_repo` scope (read-only)
- ✅ No access to private repositories or user data

## Troubleshooting

### "GitHub OAuth not configured" warning
- Set `VITE_GITHUB_CLIENT_ID` environment variable
- Rebuild the site

### OAuth callback fails
- Verify callback URL matches exactly in GitHub OAuth app settings
- Check backend token exchange is working
- Verify client secret is set correctly in backend environment

### Rate limiting still occurs
- Check if authentication token is being sent with requests
- Verify token hasn't expired (check localStorage)
- Ensure backend token exchange is working

## Alternative: Use Personal Access Token (Development Only)

For local development, you can use a Personal Access Token instead:

1. Generate a token at https://github.com/settings/tokens
2. Select `public_repo` scope
3. Manually set token in browser console:
   ```javascript
   localStorage.setItem('github_oauth_token', 'your_token_here')
   localStorage.setItem('github_oauth_expiry', new Date(Date.now() + 86400000).toISOString())
   ```

**⚠️ Never commit personal access tokens to the repository!**

## Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
