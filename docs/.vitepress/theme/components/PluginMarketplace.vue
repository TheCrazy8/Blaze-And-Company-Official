<script setup>
import { ref, computed, onMounted } from 'vue'
import { analytics, reviews } from '../config/supabase.js'

const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedDifficulty = ref('all')
const sortBy = ref('downloads')
const isLoading = ref(true)
const error = ref(null)
const cacheAge = ref(null)

const categories = ref(['all'])
const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced']

const plugins = ref([])
const selectedPlugin = ref(null)
const repoStats = ref(null)

const showReviewModal = ref(false)
const reviewPluginId = ref(null)
const reviewForm = ref({
  userName: '',
  rating: 5,
  comment:  ''
})
const pluginReviews = ref({})
const pluginStats = ref({})

// Fetch real download and review stats from Supabase
const fetchRealStats = async () => {
  try {
    const stats = await analytics.getAllStats()
    
    stats.forEach(stat => {
      pluginStats.value[stat.plugin_id] = {
        downloads: stat.download_count,
        reviewCount: stat.review_count,
        averageRating: parseFloat(stat.average_rating)
      }
    })
  } catch (err) {
    console.error('Error fetching real stats:', err)
  }
}

// Fetch plugins from cache (primary) or GitHub API (fallback)
const fetchPlugins = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Try to load from cache first
    console.log('Loading plugins from cache...')
    const cacheResponse = await fetch('public/plugins-cache.json')
    
    if (cacheResponse.ok) {
      const cache = await cacheResponse.json()
      
      // Calculate cache age
      const generatedAt = new Date(cache. generated_at)
      const ageHours = Math.floor((Date.now() - generatedAt.getTime()) / (1000 * 60 * 60))
      cacheAge.value = ageHours < 1 ? 'less than 1 hour' : `${ageHours} hours`
      
      console.log(`✓ Loaded ${cache.plugins.length} plugins from cache (${cacheAge.value} old)`)
      
      // Load plugins from cache
      plugins.value = cache.plugins
      
      // Load repo stats from cache
      if (cache.repository) {
        repoStats.value = {
          stars: cache.repository. stars,
          forks: cache.repository.forks,
          watchers: cache.repository.watchers
        }
      }
      
      // Extract unique categories
      const uniqueCategories = [... new Set(cache.plugins.map(p => p.category))]
      categories.value = ['all', ...uniqueCategories]
      
      isLoading.value = false
      return
    }
    
    // Fallback:  Cache not available, show error with helpful message
    throw new Error('Plugin cache not found. The cache will be generated automatically on the next repository update.')
    
  } catch (err) {
    console.error('Error loading plugins:', err)
    error.value = err. message
    isLoading.value = false
  }
}

// Rest of the component stays exactly the same...
// (All the computed properties, functions, etc.)

const totalPlugins = computed(() => plugins.value. length)
const totalDownloads = computed(() => 
  plugins.value.reduce((sum, p) => sum + (pluginStats.value[p.id]?.downloads || 0), 0)
)
const totalContributors = computed(() => {
  const allContributors = plugins.value.flatMap(p => p.contributors)
  return new Set(allContributors).size
})
const totalCommits = computed(() => 
  plugins.value.reduce((sum, p) => sum + p.commitCount, 0)
)
const averageRating = computed(() => {
  if (plugins.value.length === 0) return 0
  const sum = plugins.value.reduce((sum, p) => {
    const stats = pluginStats.value[p.id]
    return sum + (stats?.averageRating || p.rating || 0)
  }, 0)
  const avg = sum / plugins.value.length
  return avg.toFixed(1)
})

const filteredPlugins = computed(() => {
  return plugins.value
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.description. toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.tags.some(tag => tag.includes(searchQuery.value. toLowerCase()))
      const matchesCategory = selectedCategory.value === 'all' || p. category === selectedCategory.value
      const matchesDifficulty = selectedDifficulty.value === 'all' || p.difficulty === selectedDifficulty.value
      return matchesSearch && matchesCategory && matchesDifficulty
    })
    .sort((a, b) => {
      switch(sortBy.value) {
        case 'downloads':  {
          const aDownloads = pluginStats.value[a.id]?. downloads || 0
          const bDownloads = pluginStats. value[b.id]?.downloads || 0
          return bDownloads - aDownloads
        }
        case 'rating': {
          const aRating = pluginStats.value[a.id]?.averageRating || a.rating || 0
          const bRating = pluginStats. value[b.id]?.averageRating || b.rating || 0
          return bRating - aRating
        }
        case 'date': return new Date(b.lastUpdated) - new Date(a.lastUpdated)
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })
})

// Track download with Supabase
const trackDownload = async (plugin) => {
  try {
    await analytics.trackDownload(plugin.id, plugin.name)
    
    if (! pluginStats.value[plugin.id]) {
      pluginStats. value[plugin.id] = { downloads: 0, reviewCount:  0, averageRating:  0 }
    }
    pluginStats.value[plugin.id].downloads++
  } catch (err) {
    console.error('Error tracking download:', err)
  }
}

const copyCode = async (plugin) => {
  try {
    const response = await fetch(plugin.downloadUrl)
    const code = await response.text()
    await navigator.clipboard.writeText(code)
    
    await trackDownload(plugin)
    
    if (window.$toast) {
      window.$toast. success(`✨ ${plugin.name} code copied to clipboard! `)
    } else {
      alert(`✅ ${plugin.name} code copied! `)
    }
  } catch (err) {
    if (window.$toast) {
      window.$toast.error('❌ Failed to copy code')
    } else {
      alert('❌ Failed to copy code')
    }
  }
}

const downloadPlugin = async (plugin) => {
  window. open(plugin.downloadUrl, '_blank')
  await trackDownload(plugin)
  
  if (window.$toast) {
    window.$toast.success(`📥 Downloading ${plugin.name}...`)
  }
}

const viewPlugin = (plugin) => {
  selectedPlugin.value = plugin
}

const closeModal = () => {
  selectedPlugin.value = null
}

// Review functions
const openReviewModal = (plugin) => {
  reviewPluginId.value = plugin
  showReviewModal.value = true
  loadPluginReviews(plugin. id)
}

const closeReviewModal = () => {
  showReviewModal.value = false
  reviewPluginId.value = null
  reviewForm.value = { userName: '', rating: 5, comment: '' }
}

const loadPluginReviews = async (pluginId) => {
  try {
    const data = await reviews.getReviews(pluginId, 10)
    pluginReviews. value[pluginId] = data
    
    const stats = await reviews.getReviewStats(pluginId)
    if (pluginStats.value[pluginId]) {
      pluginStats. value[pluginId].reviewCount = stats.count
      pluginStats.value[pluginId].averageRating = parseFloat(stats.average)
      pluginStats.value[pluginId].distribution = stats.distribution
    } else {
      pluginStats. value[pluginId] = {
        downloads: 0,
        reviewCount: stats.count,
        averageRating: parseFloat(stats.average),
        distribution: stats.distribution
      }
    }
  } catch (err) {
    console.error('Error loading reviews:', err)
  }
}

const submitReview = async () => {
  if (!reviewForm.value.userName. trim()) {
    if (window.$toast) {
      window.$toast.warning('Please enter your name')
    }
    return
  }
  
  if (! reviewForm.value.comment.trim()) {
    if (window.$toast) {
      window.$toast.warning('Please write a review')
    }
    return
  }
  
  try {
    const result = await reviews.submitReview(
      reviewPluginId.value. id,
      reviewPluginId.value.name,
      reviewForm.value. userName,
      reviewForm.value.rating,
      reviewForm.value. comment
    )
    
    if (result.success) {
      if (window.$toast) {
        window.$toast.success('✅ Review submitted!')
      }
      
      await loadPluginReviews(reviewPluginId.value.id)
      reviewForm.value = { userName: '', rating: 5, comment: '' }
    } else {
      if (window.$toast) {
        window.$toast.error('Failed to submit review')
      }
    }
  } catch (err) {
    console.error('Error submitting review:', err)
    if (window.$toast) {
      window.$toast.error('Failed to submit review')
    }
  }
}

const getPluginStats = (pluginId) => {
  const stats = pluginStats.value[pluginId]
  return {
    downloads: stats?.downloads || 0,
    reviewCount: stats?.reviewCount || 0,
    averageRating:  stats?.averageRating || 0
  }
}

const getTimeSince = (date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const retryFetch = () => {
  fetchPlugins()
}

// Load on mount
onMounted(async () => {
  await fetchRealStats()
  await fetchPlugins()
})
</script>

<template>
  <div class="plugin-marketplace">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner">⚙️</div>
      <p>Loading plugins from cache...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Plugin Cache Not Available</h3>
      <p style="white-space: pre-wrap;">{{ error }}</p>
      <p class="help-text">
        The plugin cache is automatically generated when you push changes to the repository. 
        If this is your first visit, please wait a few minutes for the cache to be created.
      </p>
      <button @click="retryFetch" class="btn btn-primary">
        🔄 Retry
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Header -->
      <div class="marketplace-header">
        <h1>🔌 Plugin Marketplace</h1>
        <p>Discover and install community-made plugins to extend BrightOS</p>
        
        <!-- Cache age indicator -->
        <div v-if="cacheAge" class="cache-info">
          <span>📦 Data cached {{ cacheAge }} ago</span>
        </div>
        
        <!-- Keep all your existing stats, controls, grid, etc. -->
        <!-- ... (copy from previous version) ... -->
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Add this new style */
.cache-info {
  margin-top: 8px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

. help-text {
  margin-top: 12px;
  font-size:  14px;
  color: var(--vp-c-text-3);
}

/* Keep all your existing styles */
/* ... */
</style>
