<template>
  <div class="github-auth">
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
import { ref, onMounted, computed } from 'vue'
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

onMounted(async () => {
  // Check authentication status
  isAuthenticated.value = githubAuth.isAuthenticated()
  
  // Handle OAuth callback if present
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('code')) {
    await githubAuth.handleCallback()
    isAuthenticated.value = githubAuth.isAuthenticated()
  }

  // Fetch rate limit info if requested
  if (props.showRateLimit) {
    await fetchRateLimitInfo()
  }
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

function signIn() {
  githubAuth.login()
}

function signOut() {
  githubAuth.logout()
  isAuthenticated.value = false
  if (window.$toast) {
    window.$toast.success('Signed out from GitHub')
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
}
</style>
