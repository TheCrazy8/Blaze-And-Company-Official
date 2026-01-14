// GitHub OAuth Configuration and Helper Functions
// This module handles GitHub OAuth authentication to prevent rate limiting

const GITHUB_CONFIG = {
  // For GitHub Pages deployment, we use Device Flow (no backend needed)
  // Device Flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
  
  // OAuth App credentials (set these in your GitHub App settings)
  // Get them from: https://github.com/settings/developers
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23li1xL6Hj2CflCVf2',
  
  // Device Flow URLs
  deviceCodeUrl: 'https://github.com/login/device/code',
  accessTokenUrl: 'https://github.com/login/oauth/access_token',
  
  // Scopes needed (public_repo for read-only access to public repos)
  scope: 'public_repo',
  
  // Storage keys
  tokenKey: 'github_oauth_token',
  tokenExpiryKey: 'github_oauth_expiry',
  
  // Polling interval for device flow (in seconds)
  pollInterval: 5
}

class GitHubAuth {
  constructor() {
    // Only load token on client-side
    this.token = typeof window !== 'undefined' ? this.loadToken() : null
    this.deviceCode = null
    this.pollTimer = null
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

  // Initiate Device Flow
  async login() {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not running in browser' }
    }
    
    if (!GITHUB_CONFIG.clientId) {
      console.warn('GitHub OAuth not configured. Set VITE_GITHUB_CLIENT_ID environment variable.')
      return { success: false, error: 'OAuth not configured' }
    }

    try {
      // Step 1: Request device code
      const deviceResponse = await fetch(GITHUB_CONFIG.deviceCodeUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: GITHUB_CONFIG.clientId,
          scope: GITHUB_CONFIG.scope
        })
      })

      if (!deviceResponse.ok) {
        throw new Error('Failed to get device code')
      }

      const deviceData = await deviceResponse.json()
      
      this.deviceCode = {
        device_code: deviceData.device_code,
        user_code: deviceData.user_code,
        verification_uri: deviceData.verification_uri,
        expires_in: deviceData.expires_in,
        interval: deviceData.interval || GITHUB_CONFIG.pollInterval
      }

      return {
        success: true,
        userCode: deviceData.user_code,
        verificationUri: deviceData.verification_uri,
        expiresIn: deviceData.expires_in
      }
    } catch (err) {
      console.error('Error initiating GitHub Device Flow:', err)
      return { success: false, error: err.message }
    }
  }

  // Start polling for token (call after user authorizes)
  async startPolling(onSuccess, onError) {
    if (!this.deviceCode) {
      onError('No device code available')
      return
    }

    const startTime = Date.now()
    const expiryTime = startTime + (this.deviceCode.expires_in * 1000)
    
    const poll = async () => {
      try {
        // Check if expired
        if (Date.now() > expiryTime) {
          this.stopPolling()
          onError('Device code expired. Please try again.')
          return
        }

        const response = await fetch(GITHUB_CONFIG.accessTokenUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: GITHUB_CONFIG.clientId,
            device_code: this.deviceCode.device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        })

        const data = await response.json()

        if (data.access_token) {
          // Success! Got the token
          this.stopPolling()
          this.saveToken(data.access_token, data.expires_in)
          this.deviceCode = null
          onSuccess()
        } else if (data.error === 'authorization_pending') {
          // User hasn't authorized yet, keep polling
          // Continue polling
        } else if (data.error === 'slow_down') {
          // Rate limited, increase interval
          this.deviceCode.interval += 5
        } else if (data.error === 'expired_token') {
          // Code expired
          this.stopPolling()
          this.deviceCode = null
          onError('Authorization expired. Please try again.')
        } else if (data.error === 'access_denied') {
          // User denied access
          this.stopPolling()
          this.deviceCode = null
          onError('Authorization denied.')
        } else {
          // Unknown error
          this.stopPolling()
          this.deviceCode = null
          onError(data.error_description || data.error || 'Unknown error')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    // Start polling
    this.pollTimer = setInterval(poll, this.deviceCode.interval * 1000)
    poll() // Poll immediately once
  }

  // Stop polling
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  // Logout
  logout() {
    this.stopPolling()
    this.clearToken()
    this.deviceCode = null
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
