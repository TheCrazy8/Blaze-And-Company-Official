// GitHub OAuth Configuration and Helper Functions
// This module handles GitHub OAuth authentication to prevent rate limiting

const GITHUB_CONFIG = {
  // OAuth App credentials (set these in your GitHub App settings)
  // Get them from: https://github.com/settings/developers
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  // Note: Client secret should NEVER be exposed in frontend code
  // We'll use a serverless function or backend proxy for token exchange
  
  // OAuth URLs
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  
  // Scopes needed (public_repo for read-only access to public repos)
  scope: 'public_repo',
  
  // Storage keys
  tokenKey: 'github_oauth_token',
  tokenExpiryKey: 'github_oauth_expiry'
}

class GitHubAuth {
  constructor() {
    // Only load token on client-side
    this.token = typeof window !== 'undefined' ? this.loadToken() : null
  }

  // Load token from localStorage
  loadToken() {
    // Skip if running on server
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null
    }
    
    try {
      const token = localStorage.getItem(GITHUB_CONFIG.tokenKey)
      const expiry = localStorage.getItem(GITHUB_CONFIG.tokenExpiryKey)
      
      if (token && expiry) {
        const expiryDate = new Date(expiry)
        if (expiryDate > new Date()) {
          return token
        } else {
          // Token expired, clear it
          this.clearToken()
        }
      }
    } catch (err) {
      console.error('Error loading GitHub token:', err)
    }
    return null
  }

  // Save token to localStorage
  saveToken(token, expiresIn = 28800) { // Default 8 hours
    // Skip if running on server
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    try {
      const expiry = new Date()
      expiry.setSeconds(expiry.getSeconds() + expiresIn)
      
      localStorage.setItem(GITHUB_CONFIG.tokenKey, token)
      localStorage.setItem(GITHUB_CONFIG.tokenExpiryKey, expiry.toISOString())
      this.token = token
    } catch (err) {
      console.error('Error saving GitHub token:', err)
    }
  }

  // Clear stored token
  clearToken() {
    // Skip if running on server
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    try {
      localStorage.removeItem(GITHUB_CONFIG.tokenKey)
      localStorage.removeItem(GITHUB_CONFIG.tokenExpiryKey)
      this.token = null
    } catch (err) {
      console.error('Error clearing GitHub token:', err)
    }
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.token
  }

  // Get current token
  getToken() {
    return this.token
  }

  // Initiate OAuth flow
  async login() {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return false
    }
    
    if (!GITHUB_CONFIG.clientId) {
      console.warn('GitHub OAuth not configured. Set VITE_GITHUB_CLIENT_ID environment variable.')
      return false
    }

    try {
      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7)
      sessionStorage.setItem('github_oauth_state', state)

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: GITHUB_CONFIG.clientId,
        scope: GITHUB_CONFIG.scope,
        state: state,
        redirect_uri: window.location.origin + window.location.pathname
      })

      // Redirect to GitHub authorization
      window.location.href = `${GITHUB_CONFIG.authorizeUrl}?${params.toString()}`
      return true
    } catch (err) {
      console.error('Error initiating GitHub OAuth:', err)
      return false
    }
  }

  // Handle OAuth callback
  async handleCallback() {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return false
    }
    
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const storedState = sessionStorage.getItem('github_oauth_state')

    if (!code || !state || state !== storedState) {
      return false
    }

    try {
      // Exchange code for token
      // NOTE: This requires a backend proxy to avoid exposing client secret
      // For now, we'll show a message that OAuth needs backend setup
      console.info('GitHub OAuth code received. Backend token exchange needed.')
      
      // Clean up URL and state
      sessionStorage.removeItem('github_oauth_state')
      window.history.replaceState({}, document.title, window.location.pathname)
      
      return false // Return false until backend is set up
    } catch (err) {
      console.error('Error handling OAuth callback:', err)
      return false
    }
  }

  // Logout
  logout() {
    this.clearToken()
  }
}

// Singleton instance
export const githubAuth = new GitHubAuth()

// Enhanced fetch wrapper that includes authentication
export async function githubFetch(url, options = {}) {
  const headers = {
    'Accept': 'application/json',
    ...options.headers
  }

  // Add authentication if available
  const token = githubAuth.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  // Handle rate limiting
  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
    const rateLimitReset = response.headers.get('X-RateLimit-Reset')
    
    if (rateLimitRemaining === '0') {
      const resetDate = new Date(parseInt(rateLimitReset) * 1000)
      const minutesUntilReset = Math.ceil((resetDate - new Date()) / 60000)
      
      throw new Error(
        `GitHub API rate limit exceeded. ` +
        `${githubAuth.isAuthenticated() ? 'Authenticated' : 'Unauthenticated'} rate limit will reset in ${minutesUntilReset} minutes. ` +
        (!githubAuth.isAuthenticated() ? 'Try signing in with GitHub for higher rate limits.' : '')
      )
    }
  }

  return response
}

// Get current rate limit status
export async function getRateLimitStatus() {
  try {
    const response = await githubFetch('https://api.github.com/rate_limit')
    if (response.ok) {
      return await response.json()
    }
  } catch (err) {
    console.error('Error fetching rate limit status:', err)
  }
  return null
}

export default {
  githubAuth,
  githubFetch,
  getRateLimitStatus,
  GITHUB_CONFIG
}
