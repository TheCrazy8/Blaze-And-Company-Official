<template>
  <div class="github-auth">
    <!-- Device Flow Modal -->
    <Transition name="modal-fade">
      <div v-if="showDeviceModal" class="modal-overlay" @click="closeDeviceModal">
        <div class="modal-content" @click.stop>
          <button @click="closeDeviceModal" class="modal-close" aria-label="Close">×</button>
          
          <div class="device-flow-content">
            <div class="device-icon">🔐</div>
            <h3>Sign in with GitHub</h3>
            
            <div v-if="deviceFlowStep === 'loading'" class="loading-state">
              <div class="spinner"></div>
              <p>Requesting authorization code...</p>
            </div>
            
            <div v-else-if="deviceFlowStep === 'code'" class="code-state">
              <p class="instruction">Copy this code and click the button below to authorize:</p>
              <div class="user-code">
                <code>{{ deviceUserCode }}</code>
                <button @click="copyCode" class="copy-btn" :title="codeCopied ? 'Copied!' : 'Copy code'">
                  {{ codeCopied ? '✓' : '📋' }}
                </button>
              </div>
              <a :href="deviceVerificationUri" target="_blank" class="verify-btn" @click="startPolling">
                Open GitHub to Authorize
              </a>
              <p class="waiting-text">Waiting for authorization...</p>
              <div class="spinner-small"></div>
              <p class="help-text">Paste the code on GitHub and authorize this app</p>
            </div>
            
            <div v-else-if="deviceFlowStep === 'success'" class="success-state">
              <div class="success-icon">✅</div>
              <h4>Successfully signed in!</h4>
              <p>You now have higher API rate limits</p>
              <button @click="closeDeviceModal" class="done-btn">Done</button>
            </div>
            
            <div v-else-if="deviceFlowStep === 'error'" class="error-state">
              <div class="error-icon">❌</div>
              <h4>Authorization failed</h4>
              <p>{{ deviceError }}</p>
              <button @click="retryAuth" class="retry-btn">Try Again</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Authenticated State -->
    <div v-if="isAuthenticated" class="auth-status authenticated">
      <span class="status-icon">✅</span>
      <span class="status-text">Signed in with GitHub</span>
      <button @click="signOut" class="auth-button sign-out">
        Sign Out
      </button>
    </div>

    <!-- Unauthenticated State -->
    <div v-else class="auth-status unauthenticated">
      <span class="status-icon">ℹ️</span>
      <span class="status-text">{{ message }}</span>
      <button v-if="showSignIn" @click="signIn" class="auth-button sign-in">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        Sign in with GitHub
      </button>
    </div>

    <!-- Rate Limit Info -->
    <div v-if="rateLimitInfo && showRateLimit" class="rate-limit-info">
      <span class="rate-limit-text">
        API Calls: {{ rateLimitInfo.remaining }} / {{ rateLimitInfo.limit }} remaining
      </span>
      <span v-if="rateLimitInfo.remaining < rateLimitInfo.limit" class="rate-limit-reset">
        (resets {{ formatResetTime(rateLimitInfo.reset) }})
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { githubAuth, getRateLimitStatus } from '../config/github-auth.js'

const props = defineProps({
  message: {
    type: String,
    default: 'Sign in to avoid rate limits'
  },
  showSignIn: {
    type: Boolean,
    default: true
  },
  showRateLimit: {
    type: Boolean,
    default: false
  }
})

const isAuthenticated = ref(false)
const rateLimitInfo = ref(null)
const showDeviceModal = ref(false)
const deviceFlowStep = ref('loading') // loading, code, success, error
const deviceUserCode = ref('')
const deviceVerificationUri = ref('')
const deviceError = ref('')
const codeCopied = ref(false)

onMounted(async () => {
  // Check authentication status
  isAuthenticated.value = githubAuth.isAuthenticated()

  // Fetch rate limit info if requested
  if (props.showRateLimit) {
    await fetchRateLimitInfo()
  }
})

onUnmounted(() => {
  // Stop polling if modal is closed
  githubAuth.stopPolling()
})

async function fetchRateLimitInfo() {
  try {
    const data = await getRateLimitStatus()
    if (data && data.rate) {
      rateLimitInfo.value = {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: data.rate.reset
      }
    }
  } catch (err) {
    console.error('Error fetching rate limit:', err)
  }
}

async function signIn() {
  showDeviceModal.value = true
  deviceFlowStep.value = 'loading'
  
  const result = await githubAuth.login()
  
  if (result.success) {
    deviceFlowStep.value = 'code'
    deviceUserCode.value = result.userCode
    deviceVerificationUri.value = result.verificationUri
  } else {
    deviceFlowStep.value = 'error'
    deviceError.value = result.error || 'Failed to initiate sign in'
  }
}

function startPolling() {
  // Start polling for token after user clicks to authorize
  githubAuth.startPolling(
    // onSuccess
    () => {
      deviceFlowStep.value = 'success'
      isAuthenticated.value = true
      if (window.$toast) {
        window.$toast.success('✅ Successfully signed in with GitHub!')
      }
      setTimeout(() => {
        closeDeviceModal()
        if (props.showRateLimit) {
          fetchRateLimitInfo()
        }
      }, 2000)
    },
    // onError
    (error) => {
      deviceFlowStep.value = 'error'
      deviceError.value = error
    }
  )
}

function signOut() {
  githubAuth.logout()
  isAuthenticated.value = false
  if (window.$toast) {
    window.$toast.success('Signed out from GitHub')
  }
  if (props.showRateLimit) {
    fetchRateLimitInfo()
  }
}

function closeDeviceModal() {
  githubAuth.stopPolling()
  showDeviceModal.value = false
  deviceFlowStep.value = 'loading'
  codeCopied.value = false
}

function retryAuth() {
  deviceFlowStep.value = 'loading'
  signIn()
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(deviceUserCode.value)
    codeCopied.value = true
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

function formatResetTime(resetTimestamp) {
  const resetDate = new Date(resetTimestamp * 1000)
  const now = new Date()
  const diffMinutes = Math.ceil((resetDate - now) / 60000)
  
  if (diffMinutes < 60) {
    return `in ${diffMinutes} min`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `in ${hours}h ${minutes}m`
  }
}
</script>

<style scoped>
.github-auth {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.auth-status.authenticated {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.auth-status.unauthenticated {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.status-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.status-text {
  flex: 1;
  color: var(--vp-c-text-1);
}

.auth-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-button.sign-in {
  background: #24292e;
  color: white;
}

.auth-button.sign-in:hover {
  background: #1b1f23;
  transform: translateY(-1px);
}

.auth-button.sign-out {
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.auth-button.sign-out:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.rate-limit-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.rate-limit-reset {
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: var(--vp-c-bg);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  padding: 2rem;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--vp-c-text-3);
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--vp-c-text-1);
}

.device-flow-content {
  text-align: center;
}

.device-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.device-flow-content h3 {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-1);
}

.loading-state, .code-state, .success-state, .error-state {
  padding: 1rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 1rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.instruction {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1rem;
}

.user-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.user-code code {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 8px;
  letter-spacing: 0.5em;
  color: var(--vp-c-brand-1);
}

.copy-btn {
  padding: 0.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--vp-c-bg-mute);
}

.verify-btn, .done-btn, .retry-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand-1);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  margin: 1rem 0;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.verify-btn:hover, .done-btn:hover, .retry-btn:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-2px);
}

.waiting-text {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 1.5rem;
}

.help-text {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  margin-top: 0.5rem;
}

.success-icon, .error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-state h4, .error-state h4 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
}

.success-state p, .error-state p {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .auth-status {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .auth-button {
    width: 100%;
    justify-content: center;
  }
  
  .rate-limit-info {
    flex-direction: column;
    text-align: center;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .user-code code {
    font-size: 1.2rem;
    padding: 0.5rem 1rem;
  }
}
</style>
