// GitHub OAuth Device Flow client utilities — modified to use backend device-flow server
// Server endpoints expected:
//   GET  /device/start   -> returns { device_code, user_code, verification_uri, expires_in, interval }
//   POST /device/poll    -> body { device_code, max_wait } -> returns { token: { access_token, token_type, scope }, user }
// If your backend runs on a different origin, set BACKEND_BASE to that origin (including scheme).
const BACKEND_BASE = (typeof window !== 'undefined' && window.__BACKEND_BASE__) || ''

const GITHUB_CONFIG = {
  // Public client ID (kept for informational / legacy). Device flow works through backend.
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23li1xL6Hj2CflCVf2',

  // Backend endpoints (relative by default). If backend is on separate origin, set window.__BACKEND_BASE__ in template.
  deviceCodeUrl: `${BACKEND_BASE}/device/start`,
  accessTokenUrl: `${BACKEND_BASE}/device/poll`,

  // Scope requested (backend will forward to GitHub during device start)
  scope: import.meta.env.VITE_GITHUB_OAUTH_SCOPE || 'public_repo',

  // Storage keys
  tokenKey: 'github_oauth_token',
  tokenExpiryKey: 'github_oauth_expiry',

  // Polling interval fallback (seconds). Backend returns recommended interval; frontend does not call GitHub directly.
  pollInterval: 5
}

class GitHubAuth {
  constructor() {
    this.token = typeof window !== 'undefined' ? this.loadToken() : null
    this.deviceInfo = null
    this.pollAbortController = null
  }

  loadToken() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
    try {
      const token = localStorage.getItem(GITHUB_CONFIG.tokenKey)
      const expiry = localStorage.getItem(GITHUB_CONFIG.tokenExpiryKey)
      if (token && expiry) {
        const expiryDate = new Date(expiry)
        if (expiryDate > new Date()) {
          return token
        } else {
          this.clearToken()
        }
      }
    } catch (err) {
      // ignore
      console.error('Error loading GitHub token:', err)
    }
    return null
  }

  saveToken(token, expiresIn = 28800) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
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

  clearToken() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(GITHUB_CONFIG.tokenKey)
      localStorage.removeItem(GITHUB_CONFIG.tokenExpiryKey)
      this.token = null
    } catch (err) {
      console.error('Error clearing GitHub token:', err)
    }
  }

  isAuthenticated() {
    return !!this.token
  }

  getToken() {
    return this.token
  }

  // Start device flow via backend
  async startDeviceFlow() {
    const url = new URL(GITHUB_CONFIG.deviceCodeUrl, window.location.origin).toString()
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `startDeviceFlow failed: ${res.status}`)
    }
    const data = await res.json()
    // data should include: device_code, user_code, verification_uri, expires_in, interval
    this.deviceInfo = data
    return data
  }

  // Poll for token by asking backend to poll GitHub on our behalf
  // maxWait in seconds
  async pollForToken(deviceCode, maxWait = 300) {
    const url = new URL(GITHUB_CONFIG.accessTokenUrl, window.location.origin).toString()
    // allow cancellation
    this.pollAbortController = new AbortController()
    const signal = this.pollAbortController.signal

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode, max_wait: maxWait }),
      signal
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `pollForToken failed: ${res.status}`)
    }
    const body = await res.json()
    if (body && body.token && body.token.access_token) {
      // Optionally, backend may return token expiry or we assume default
      // Save token locally (frontend storage). It's recommended to create a server session instead.
      this.saveToken(body.token.access_token)
      return body
    }
    throw new Error('pollForToken succeeded but no token was returned')
  }

  cancelPolling() {
    try {
      if (this.pollAbortController) this.pollAbortController.abort()
    } catch (e) {
      // ignore
    } finally {
      this.pollAbortController = null
    }
  }

  // High-level login: start device flow then poll. Returns { token, user }
  async login({ maxWait = 300, openVerificationInNewTab = false } = {}) {
    if (typeof window === 'undefined') return { success: false, error: 'Not running in browser' }
    try {
      const info = await this.startDeviceFlow()
      if (openVerificationInNewTab && info.verification_uri) {
        try { window.open(info.verification_uri, '_blank') } catch (e) {}
      }
      const result = await this.pollForToken(info.device_code, maxWait)
      return { success: true, token: result.token, user: result.user }
    } catch (err) {
      return { success: false, error: err.message || String(err) }
    }
  }
}

// Export a singleton instance for easy import
const githubAuth = new GitHubAuth()
export default githubAuth
export { GITHUB_CONFIG, GitHubAuth }
