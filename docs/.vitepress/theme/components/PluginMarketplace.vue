<script setup>
import { ref, computed, onMounted } from 'vue'
import { analytics, reviews } from '../config/supabase. js'

const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedDifficulty = ref('all')
const sortBy = ref('downloads')
const isLoading = ref(true)
const error = ref(null)

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
  comment: ''
})
const pluginReviews = ref({})
const pluginStats = ref({})

// GitHub API configuration
const GITHUB_API = 'https://api.github.com'
const REPO_OWNER = 'TheCrazy8'
const REPO_NAME = 'Blaze-And-Company-Official'
const PLUGINS_PATH = 'community%20made%20plugins'

// GitHub Token - Replace with your token or use environment variable
// Get token from: https://github.com/settings/tokens
// Only needs 'public_repo' scope
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''

// Helper to create authenticated GitHub requests
const createGitHubRequest = (url) => {
  const headers = {
    'User-Agent': 'BrightOS-Marketplace',
    'Accept': 'application/vnd. github.v3+json'
  }
  
  // Add authentication if token is available
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }
  
  return { headers }
}

// Check rate limit status
const checkRateLimit = async () => {
  try {
    const response = await fetch(`${GITHUB_API}/rate_limit`, createGitHubRequest(`${GITHUB_API}/rate_limit`))
    
    if (response.ok) {
      const data = await response.json()
      const core = data.resources.core
      
      console.log(`GitHub API Rate Limit: ${core.remaining}/${core.limit}`)
      
      if (core.remaining < 10) {
        const resetDate = new Date(core.reset * 1000)
        console.warn(`⚠️ Low rate limit.  Resets at ${resetDate. toLocaleTimeString()}`)
      }
      
      return core
    }
  } catch (err) {
    console.error('Could not check rate limit:', err)
  }
  return null
}

// Fetch real GitHub repository statistics
const fetchRepoStats = async () => {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}`,
      createGitHubRequest(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}`)
    )
    
    if (response.ok) {
      const data = await response.json()
      repoStats.value = {
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.watchers_count,
        openIssues: data.open_issues_count,
        size: data.size,
        createdAt: data.created_at,
        updatedAt: data. updated_at,
        pushedAt: data.pushed_at
      }
    }
  } catch (err) {
    console.error('Error fetching repo stats:', err)
  }
}

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

// Fetch commit activity for each plugin file
const fetchFileCommits = async (filepath) => {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits? path=${filepath}&per_page=100`,
      createGitHubRequest(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits? path=${filepath}&per_page=100`)
    )
    
    if (response.ok) {
      const commits = await response.json()
      return {
        commitCount: commits.length,
        lastCommit: commits[0],
        contributors: [... new Set(commits.map(c => c.author?. login).filter(Boolean))]
      }
    }
  } catch (err) {
    console.error(`Error fetching commits for ${filepath}:`, err)
  }
  return { commitCount: 0, lastCommit: null, contributors: [] }
}

// Fetch plugins from GitHub with authentication
const fetchPlugins = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Check rate limit first
    await checkRateLimit()
    
    // Fetch repo stats
    await fetchRepoStats()
    
    // Fetch directory contents with authentication
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PLUGINS_PATH}`,
      createGitHubRequest(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PLUGINS_PATH}`)
    )
    
    if (! response.ok) {
      if (response.status === 403) {
        const remaining = response.headers.get('X-RateLimit-Remaining')
        const reset = response.headers.get('X-RateLimit-Reset')
        
        let errorMsg = 'GitHub API rate limit exceeded. '
        
        if (reset) {
          const resetDate = new Date(parseInt(reset) * 1000)
          errorMsg += `Rate limit resets at ${resetDate. toLocaleTimeString()}. `
        }
        
        if (! GITHUB_TOKEN) {
          errorMsg += '\n\n💡 To fix this:  Add a GitHub Personal Access Token to increase rate limit from 60 to 5,000 requests/hour.'
        }
        
        throw new Error(errorMsg)
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const files = await response.json()
    
    // Filter only .py files
    const pluginFiles = files.filter(file => 
      file.name.endsWith('.py') && file.type === 'file'
    )
    
    // Fetch content and analytics for each plugin
    const pluginPromises = pluginFiles. map(async (file) => {
      try {
        // Fetch file content
        const contentResponse = await fetch(file.download_url)
        const content = await contentResponse.text()
        
        // Fetch commit history for this file
        const commitData = await fetchFileCommits(`${PLUGINS_PATH}/${file.name}`)
        
        // Parse plugin metadata (initially with 0 downloads/reviews)
        const metadata = parsePluginMetadata(file.name, content, file, commitData)
        
        // Merge REAL stats from Supabase
        const stats = pluginStats.value[metadata.id]
        if (stats) {
          metadata. downloads = stats.downloads || 0
          metadata.rating = stats.averageRating || metadata.rating
          metadata.reviews = stats.reviewCount || 0
        }
        
        return metadata
      } catch (err) {
        console.error(`Error loading ${file.name}:`, err)
        return null
      }
    })
    
    const loadedPlugins = (await Promise.all(pluginPromises)).filter(p => p !== null)
    plugins.value = loadedPlugins
    
    // Extract unique categories
    const uniqueCategories = [...new Set(loadedPlugins.map(p => p.category))]
    categories.value = ['all', ...uniqueCategories]
    
    isLoading.value = false
  } catch (err) {
    console.error('Error fetching plugins:', err)
    error.value = err.message
    isLoading.value = false
  }
}

// Parse plugin metadata with REAL data only (no random values)
const parsePluginMetadata = (filename, content, githubFile, commitData) => {
  // Extract class name
  const classMatch = content.match(/class\s+(\w+)\s*\(/i)
  const className = classMatch ? classMatch[1] :  filename.replace('. py', '')
  
  // Extract docstring
  const docstringMatch = content.match(/"""([\s\S]*?)"""/m)
  const docstring = docstringMatch ? docstringMatch[1]. trim() : ''
  
  // Extract short description
  const descriptionLines = docstring.split('\n').filter(line => line.trim())
  const shortDescription = descriptionLines[0] || 'No description available'
  
  // Extract functions
  const functions = []
  const functionRegex = /def\s+(\w+)\s*\([^)]*\):/g
  let match
  while ((match = functionRegex.exec(content)) !== null) {
    if (! match[1]. startsWith('_')) {
      functions.push(match[1])
    }
  }
  
  // Determine category
  const contentLower = content.toLowerCase()
  let category = 'Utilities'
  if (contentLower.includes('motor') || contentLower.includes('servo')) {
    category = 'Motor Control'
  } else if (contentLower.includes('sensor')) {
    category = 'Sensors'
  } else if (contentLower.includes('display') || contentLower.includes('led')) {
    category = 'Display'
  } else if (contentLower.includes('serial') || contentLower.includes('communication')) {
    category = 'Communication'
  }
  
  // Determine difficulty
  const lineCount = content.split('\n').length
  let difficulty = 'Beginner'
  if (lineCount > 200) {
    difficulty = 'Advanced'
  } else if (lineCount > 100) {
    difficulty = 'Intermediate'
  }
  
  // Extract tags
  const tags = []
  if (contentLower.includes('servo')) tags.push('servo')
  if (contentLower.includes('motor')) tags.push('motor')
  if (contentLower.includes('dc motor') || contentLower.includes('dc-motor')) tags.push('dc-motor')
  if (contentLower.includes('stepper')) tags.push('stepper')
  if (contentLower.includes('sensor')) tags.push('sensor')
  if (contentLower.includes('pwm')) tags.push('pwm')
  
  // Hardware requirements
  const hardware = []
  if (content.includes('TelemetrixUnoR4WiFi')) hardware.push('Arduino Uno R4 WiFi')
  if (content.includes('Uno') && ! hardware.includes('Arduino Uno R4 WiFi')) hardware.push('Arduino Uno')
  if (content.includes('Mega')) hardware.push('Arduino Mega')
  if (hardware.length === 0) hardware.push('Any Arduino')
  
  // Dependencies
  const dependencies = []
  if (content.includes('telemetrix')) dependencies.push('telemetrix-uno-r4-wifi')
  if (content.includes('simple_plugin_loader')) dependencies.push('simple-plugin-loader')
  
  // Calculate REAL quality-based rating (no random)
  const qualityScore = calculateQualityScore(content, commitData, functions. length)
  const rating = (3. 5 + (qualityScore / 100) * 1.5).toFixed(1)
  
  // Extract version from code or use commit count
  const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/i) ||
                       content.match(/@version\s+([^\s]+)/i) ||
                       content.match(/__version__\s*=\s*['"]([^'"]+)['"]/i)
  const version = versionMatch ?  versionMatch[1] : `1.${commitData.commitCount}. 0`
  
  // Get last update date from actual commit
  const lastUpdated = commitData.lastCommit?.commit?.author?.date 
    ? new Date(commitData.lastCommit.commit.author.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  
  return {
    id: githubFile.sha,
    name: className,
    filename,
    version,
    author: commitData.contributors[0] || REPO_OWNER,
    contributors: commitData.contributors,
    description: shortDescription,
    longDescription: docstring,
    downloads: 0,  // Will be populated from Supabase real data
    rating:  parseFloat(rating),
    reviews: 0,  // Will be populated from Supabase real data
    category,
    difficulty,
    tags:  tags. slice(0, 5),
    hardware,
    dependencies,
    functions,
    lastUpdated,
    downloadUrl: githubFile.download_url,
    githubUrl: githubFile.html_url,
    size: githubFile.size,
    commitCount: commitData.commitCount,
    lineCount,
    changelog: generateChangelog(commitData)
  }
}

// Calculate quality score from real code metrics
const calculateQualityScore = (content, commitData, functionCount) => {
  let score = 0
  
  // Documentation quality (0-30 points)
  const hasDocstring = content.includes('"""')
  const hasExamples = content.toLowerCase().includes('example')
  const hasTypeHints = content.includes(':  ') && content.includes('->')
  if (hasDocstring) score += 15
  if (hasExamples) score += 10
  if (hasTypeHints) score += 5
  
  // Code quality (0-30 points)
  const hasErrorHandling = content.includes('try:') || content.includes('except')
  const hasLogging = content.includes('print') || content.includes('log')
  const lineCount = content.split('\n').length
  if (hasErrorHandling) score += 15
  if (hasLogging) score += 5
  if (lineCount > 50 && lineCount < 500) score += 10
  
  // Community engagement (0-40 points)
  const commitBonus = Math.min(commitData.commitCount * 2, 20)
  const contributorBonus = Math.min(commitData.contributors.length * 10, 20)
  score += commitBonus + contributorBonus
  
  return Math.min(score, 100)
}

// Generate real changelog from commits
const generateChangelog = (commitData) => {
  if (!commitData.lastCommit) {
    return [{ version: '1.0.0', date: new Date().toISOString().split('T')[0], changes: 'Initial release' }]
  }
  
  const changelog = []
  const lastCommit = commitData.lastCommit
  
  changelog.push({
    version: `1.${commitData.commitCount}.0`,
    date: new Date(lastCommit.commit. author.date).toISOString().split('T')[0],
    changes: lastCommit.commit.message,
    author: lastCommit. commit.author.name
  })
  
  return changelog
}

// Computed stats with REAL data
const totalPlugins = computed(() => plugins.value.length)
const totalDownloads = computed(() => 
  plugins.value.reduce((sum, p) => sum + (pluginStats.value[p.id]?.downloads || 0), 0)
)
const totalContributors = computed(() => {
  const allContributors = plugins.value. flatMap(p => p.contributors)
  return new Set(allContributors).size
})
const totalCommits = computed(() => 
  plugins.value.reduce((sum, p) => sum + p.commitCount, 0)
)
const averageRating = computed(() => {
  if (plugins.value.length === 0) return 0
  const sum = plugins.value.reduce((sum, p) => {
    const stats = pluginStats.value[p.id]
    return sum + (stats?.averageRating || 0)
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
          const aRating = pluginStats.value[a.id]?.averageRating || 0
          const bRating = pluginStats.value[b.id]?. averageRating || 0
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
    await analytics.trackDownload(plugin. id, plugin.name)
    
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
      window.$toast. success(`✨ ${plugin.name} code copied to clipboard!`)
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
    pluginReviews.value[pluginId] = data
    
    const stats = await reviews.getReviewStats(pluginId)
    if (pluginStats.value[pluginId]) {
      pluginStats.value[pluginId].reviewCount = stats.count
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
      reviewForm. value.comment
    )
    
    if (result.success) {
      if (window.$toast) {
        window.$toast. success('✅ Review submitted!')
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
  const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
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
      <p>Loading plugins from GitHub...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Failed to Load Plugins</h3>
      <p style="white-space: pre-wrap;">{{ error }}</p>
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
        
        <div class="stats">
          <div class="stat">
            <strong>{{ totalPlugins }}</strong>
            <span>Plugin{{ totalPlugins !== 1 ? 's' :  '' }}</span>
          </div>
          <div class="stat">
            <strong>{{ totalDownloads }}</strong>
            <span>Downloads</span>
          </div>
          <div class="stat">
            <strong>{{ totalContributors }}</strong>
            <span>Contributor{{ totalContributors !== 1 ? 's' : '' }}</span>
          </div>
          <div class="stat">
            <strong>{{ totalCommits }}</strong>
            <span>Commits</span>
          </div>
          <div class="stat">
            <strong>⭐ {{ averageRating }}</strong>
            <span>Avg Rating</span>
          </div>
        </div>

        <!-- Repo Stats -->
        <div v-if="repoStats" class="repo-stats">
          <span>⭐ {{ repoStats. stars }} stars</span>
          <span>🍴 {{ repoStats.forks }} forks</span>
          <span>👀 {{ repoStats.watchers }} watchers</span>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="controls">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Search plugins..."
            class="search-input"
          />
        </div>

        <div class="filters">
          <select v-model="selectedCategory" class="filter-select">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat === 'all' ? 'All Categories' : cat }}
            </option>
          </select>

          <select v-model="selectedDifficulty" class="filter-select">
            <option value="all">All Levels</option>
            <option v-for="diff in difficulties. slice(1)" :key="diff" :value="diff">
              {{ diff }}
            </option>
          </select>

          <select v-model="sortBy" class="filter-select">
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
            <option value="date">Recently Updated</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        <div class="results-count">
          {{ filteredPlugins.length }} plugin{{ filteredPlugins.length !== 1 ? 's' :  '' }} found
        </div>
      </div>

      <!-- Plugin Grid -->
      <div class="plugin-grid">
        <div 
          v-for="plugin in filteredPlugins" 
          :key="plugin.id"
          class="plugin-card"
        >
          <div class="plugin-header">
            <div class="plugin-title">
              <h3>{{ plugin.name }}</h3>
              <span class="version-badge">v{{ plugin.version }}</span>
            </div>
            <div class="plugin-rating">
              <span class="stars">⭐</span>
              <span class="rating-value">{{ getPluginStats(plugin.id).averageRating || plugin.rating }}</span>
              <span class="review-count">({{ getPluginStats(plugin.id).reviewCount }})</span>
            </div>
          </div>

          <div class="plugin-meta">
            <span class="author">👤 {{ plugin.author }}</span>
            <span class="downloads">📥 {{ getPluginStats(plugin.id).downloads }}</span>
            <span class="commits">💾 {{ plugin.commitCount }} commits</span>
            <span class="updated">🕒 {{ getTimeSince(plugin.lastUpdated) }}</span>
          </div>

          <p class="plugin-description">{{ plugin.description }}</p>

          <div class="plugin-tags">
            <span v-for="tag in plugin.tags. slice(0, 3)" :key="tag" class="tag">
              #{{ tag }}
            </span>
          </div>

          <div class="plugin-badges">
            <span class="badge category">{{ plugin.category }}</span>
            <span class="badge difficulty" :class="plugin.difficulty. toLowerCase()">
              {{ plugin. difficulty }}
            </span>
          </div>

          <div class="plugin-actions">
            <button @click="viewPlugin(plugin)" class="btn btn-primary">
              📖 Details
            </button>
            <button @click="copyCode(plugin)" class="btn btn-secondary">
              📋 Copy
            </button>
            <button @click="downloadPlugin(plugin)" class="btn btn-secondary">
              💾 Download
            </button>
            <button @click="openReviewModal(plugin)" class="btn btn-secondary">
              ⭐ Review
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPlugins. length === 0" class="empty-state">
        <p>😕 No plugins match your search</p>
        <button @click="searchQuery = ''; selectedCategory = 'all'; selectedDifficulty = 'all'" class="btn">
          Clear Filters
        </button>
      </div>

      <!-- Plugin Detail Modal -->
      <div v-if="selectedPlugin" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="closeModal">×</button>
          
          <div class="modal-header">
            <h2>{{ selectedPlugin.name }}</h2>
            <span class="version-badge">v{{ selectedPlugin.version }}</span>
          </div>

          <div class="modal-meta">
            <span>👤 By {{ selectedPlugin.author }}</span>
            <span>📥 {{ getPluginStats(selectedPlugin.id).downloads }} downloads</span>
            <span>⭐ {{ getPluginStats(selectedPlugin.id).averageRating || selectedPlugin.rating }} ({{ getPluginStats(selectedPlugin.id).reviewCount }} reviews)</span>
            <span>📦 {{ (selectedPlugin.size / 1024).toFixed(1) }} KB</span>
            <span>💾 {{ selectedPlugin.commitCount }} commits</span>
            <span>📝 {{ selectedPlugin.lineCount }} lines</span>
          </div>

          <div class="modal-section">
            <h3>Description</h3>
            <p style="white-space: pre-wrap;">{{ selectedPlugin.longDescription }}</p>
          </div>

          <div class="modal-section" v-if="selectedPlugin.functions.length > 0">
            <h3>Available Functions ({{ selectedPlugin.functions.length }})</h3>
            <ul>
              <li v-for="func in selectedPlugin.functions" : key="func">
                <code>{{ func }}()</code>
              </li>
            </ul>
          </div>

          <div class="modal-section">
            <h3>Hardware Requirements</h3>
            <ul>
              <li v-for="hw in selectedPlugin.hardware" :key="hw">✅ {{ hw }}</li>
            </ul>
          </div>

          <div class="modal-section">
            <h3>Dependencies</h3>
            <div v-if="selectedPlugin.dependencies.length === 0">
              <p>✅ No dependencies required</p>
            </div>
            <ul v-else>
              <li v-for="dep in selectedPlugin. dependencies" :key="dep">
                📦 {{ dep }}
              </li>
            </ul>
          </div>

          <div class="modal-section" v-if="selectedPlugin.contributors.length > 0">
            <h3>Contributors ({{ selectedPlugin.contributors.length }})</h3>
            <div class="contributors">
              <span v-for="contributor in selectedPlugin.contributors" :key="contributor" class="contributor-badge">
                👤 {{ contributor }}
              </span>
            </div>
          </div>

          <div class="modal-section">
            <h3>Changelog</h3>
            <div v-for="entry in selectedPlugin.changelog" :key="entry. version" class="changelog-entry">
              <strong>v{{ entry.version }}</strong> - {{ entry.date }}
              <span v-if="entry.author" class="changelog-author">by {{ entry.author }}</span>
              <p>{{ entry.changes }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="copyCode(selectedPlugin)" class="btn btn-primary">
              📋 Copy Code
            </button>
            <button @click="downloadPlugin(selectedPlugin)" class="btn btn-primary">
              💾 Download
            </button>
            <a : href="selectedPlugin.githubUrl" target="_blank" class="btn btn-secondary">
              🔗 View on GitHub
            </a>
          </div>
        </div>
      </div>

      <!-- Review Modal -->
      <div v-if="showReviewModal" class="modal-overlay" @click="closeReviewModal">
        <div class="modal-content review-modal" @click.stop>
          <button class="modal-close" @click="closeReviewModal">×</button>
          
          <div class="modal-header">
            <h2>Reviews for {{ reviewPluginId?. name }}</h2>
          </div>

          <!-- Review Stats -->
          <div class="review-stats" v-if="pluginStats[reviewPluginId?. id]">
            <div class="stat-summary">
              <div class="avg-rating">
                <strong>{{ pluginStats[reviewPluginId. id].averageRating || 0 }}</strong>
                <div class="stars-display">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(pluginStats[reviewPluginId.id].averageRating || 0) }">
                    ⭐
                  </span>
                </div>
                <span class="total-reviews">{{ pluginStats[reviewPluginId.id].reviewCount }} reviews</span>
              </div>
              
              <div class="rating-distribution" v-if="pluginStats[reviewPluginId.id].distribution">
                <div v-for="rating in [5, 4, 3, 2, 1]" : key="rating" class="distribution-bar">
                  <span class="rating-label">{{ rating }}⭐</span>
                  <div class="bar-container">
                    <div class="bar" :style="{ width:  (pluginStats[reviewPluginId.id].distribution[rating] / pluginStats[reviewPluginId. id].reviewCount * 100) + '%' }"></div>
                  </div>
                  <span class="count">{{ pluginStats[reviewPluginId.id].distribution[rating] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Write Review Form -->
          <div class="write-review">
            <h3>Write a Review</h3>
            <form @submit.prevent="submitReview">
              <div class="form-group">
                <label>Your Name</label>
                <input v-model="reviewForm. userName" type="text" placeholder="Enter your name" required />
              </div>

              <div class="form-group">
                <label>Rating</label>
                <div class="rating-input">
                  <button 
                    v-for="i in 5" 
                    :key="i"
                    type="button"
                    @click="reviewForm.rating = i"
                    :class="{ active: i <= reviewForm.rating }"
                    class="star-button"
                  >
                    ⭐
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Review</label>
                <textarea v-model="reviewForm.comment" rows="4" placeholder="Share your experience with this plugin..." required></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block">
                Submit Review
              </button>
            </form>
          </div>

          <!-- Existing Reviews -->
          <div class="reviews-list">
            <h3>User Reviews</h3>
            <div v-if="! pluginReviews[reviewPluginId?.id] || pluginReviews[reviewPluginId. id].length === 0" class="no-reviews">
              <p>No reviews yet. Be the first to review! </p>
            </div>
            <div v-else>
              <div v-for="review in pluginReviews[reviewPluginId.id]" :key="review.id" class="review-item">
                <div class="review-header">
                  <div class="reviewer-info">
                    <strong>{{ review.user_name }}</strong>
                    <div class="stars-display">
                      <span v-for="i in 5" :key="i" : class="{ filled: i <= review.rating }">⭐</span>
                    </div>
                  </div>
                  <span class="review-date">{{ getTimeSince(review.created_at) }}</span>
                </div>
                <p class="review-comment">{{ review.comment }}</p>
                <div class="review-actions">
                  <button class="helpful-btn">
                    👍 Helpful ({{ review.helpful_count }})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Loading & Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 100px 20px;
}

.spinner {
  font-size: 64px;
  animation: spin 2s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 18px;
  color: var(--vp-c-text-2);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-state h3 {
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
}

.error-state p {
  color:  var(--vp-c-text-2);
  margin-bottom: 20px;
}

. plugin-marketplace {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.marketplace-header {
  text-align: center;
  margin-bottom: 40px;
}

.marketplace-header h1 {
  font-size: 48px;
  margin-bottom: 10px;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat strong {
  font-size: 32px;
  color: var(--vp-c-brand-1);
  transition: all 0.3s;
}

.stat span {
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.repo-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top:  16px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.controls {
  margin-bottom: 30px;
}

.search-box {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 16px 20px;
  font-size: 18px;
  border: 2px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  flex: 1;
  min-width: 150px;
}

.results-count {
  margin-top: 16px;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.plugin-card {
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 24px;
  background: var(--vp-c-bg-soft);
  transition: all 0.3s;
}

. plugin-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 24px rgba(255, 69, 0, 0.15);
  transform: translateY(-4px);
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.plugin-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-title h3 {
  margin: 0;
  font-size: 22px;
}

.version-badge {
  padding: 4px 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 4px;
  font-size:  12px;
  font-weight: 600;
}

.plugin-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.stars {
  color: #fbbf24;
}

.rating-value {
  font-weight: 600;
}

.review-count {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.plugin-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
}

.plugin-description {
  margin:  12px 0;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

. plugin-tags {
  display: flex;
  gap: 6px;
  flex-wrap:  wrap;
  margin:  12px 0;
}

.tag {
  padding: 4px 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.plugin-badges {
  display: flex;
  gap: 8px;
  margin:  12px 0;
}

.badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.badge. category {
  background: #3b82f6;
  color: white;
}

.badge.difficulty {
  color: white;
}

.badge.difficulty. beginner {
  background: #10b981;
}

.badge.difficulty.intermediate {
  background: #f59e0b;
}

.badge.difficulty. advanced {
  background: #ef4444;
}

.plugin-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 80px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor:  pointer;
  transition: all 0.2s;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
}

. btn-primary:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 2px solid var(--vp-c-border);
}

.btn-secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--vp-c-text-2);
}

.empty-state p {
  font-size: 20px;
  margin-bottom:  20px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom:  0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: var(--vp-c-bg);
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
}

.review-modal {
  max-width: 900px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: var(--vp-c-text-2);
}

.modal-close:hover {
  color: var(--vp-c-brand-1);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom:  16px;
}

.modal-header h2 {
  margin: 0;
}

.modal-meta {
  display: flex;
  gap: 20px;
  margin-bottom:  24px;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
}

.modal-section {
  margin-bottom: 24px;
}

.modal-section h3 {
  margin-bottom: 12px;
  color: var(--vp-c-brand-1);
}

.modal-section ul {
  list-style: none;
  padding: 0;
}

.modal-section li {
  padding: 8px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.modal-section code {
  background: var(--vp-c-bg-soft);
  padding: 2px 8px;
  border-radius:  4px;
  font-family: monospace;
}

.contributors {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.contributor-badge {
  padding: 6px 12px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 6px;
  font-size:  14px;
  font-weight:  600;
}

.changelog-entry {
  padding: 12px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin-bottom: 12px;
}

.changelog-entry strong {
  color: var(--vp-c-brand-1);
}

.changelog-author {
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-style: italic;
  margin-left: 8px;
}

.changelog-entry p {
  margin: 8px 0 0 0;
  color: var(--vp-c-text-2);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top:  24px;
}

/* Review Modal Styles */
.review-stats {
  background: var(--vp-c-bg-soft);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.stat-summary {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.avg-rating {
  text-align: center;
  min-width: 150px;
}

.avg-rating strong {
  font-size: 48px;
  color: var(--vp-c-brand-1);
  display: block;
}

.stars-display {
  margin:  8px 0;
}

. stars-display . star {
  font-size: 20px;
  opacity: 0.3;
}

.stars-display .star.filled {
  opacity: 1;
  color: #fbbf24;
}

.total-reviews {
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.rating-distribution {
  flex: 1;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom:  8px;
}

.rating-label {
  width: 40px;
  font-size: 14px;
}

.bar-container {
  flex: 1;
  height:  8px;
  background: var(--vp-c-bg);
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #fbbf24;
  transition: width 0.3s;
}

.count {
  width: 30px;
  text-align: right;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

/* Write Review Form */
.write-review {
  margin-bottom: 32px;
}

.write-review h3 {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight:  600;
  color: var(--vp-c-text-1);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline:  none;
  border-color:  var(--vp-c-brand-1);
}

.rating-input {
  display: flex;
  gap: 8px;
}

.star-button {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  opacity: 0.3;
  transition: all 0.2s;
}

.star-button. active,
.star-button:hover {
  opacity: 1;
  transform: scale(1.2);
}

.btn-block {
  width: 100%;
  padding:  14px;
}

/* Reviews List */
.reviews-list {
  border-top: 2px solid var(--vp-c-divider);
  padding-top: 24px;
}

.reviews-list h3 {
  margin-bottom: 20px;
}

.no-reviews {
  text-align: center;
  padding: 40px 20px;
  color: var(--vp-c-text-2);
}

.review-item {
  padding: 20px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  margin-bottom: 16px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reviewer-info strong {
  display: block;
  margin-bottom: 4px;
}

.review-date {
  color: var(--vp-c-text-3);
  font-size: 14px;
}

.review-comment {
  margin:  12px 0;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.review-actions {
  display: flex;
  gap:  12px;
}

.helpful-btn {
  padding: 6px 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.helpful-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .plugin-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .plugin-actions {
    flex-direction: column;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .stat-summary {
    flex-direction: column;
    align-items: center;
  }
}
</style>
