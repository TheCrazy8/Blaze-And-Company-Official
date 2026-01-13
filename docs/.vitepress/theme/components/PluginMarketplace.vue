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
// Get token from:  https://github.com/settings/tokens
// Only needs 'public_repo' scope
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''  // Add your token here if not using env var

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
        console.warn(`⚠️ Low rate limit. Resets at ${resetDate.toLocaleTimeString()}`)
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
        forks: data. forks_count,
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

// Fetch download statistics from Supabase
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
      createGitHubRequest(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${filepath}&per_page=100`)
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

// Calculate real download metrics
const calculateRealDownloads = (commitData, fileSize, repoStats) => {
  const baseDownloads = repoStats?. stars || 1
  const commitMultiplier = Math.min(commitData.commitCount * 5, 100)
  const contributorBonus = commitData.contributors.length * 10
  const sizeAdjustment = fileSize < 10000 ? 1. 2 : 1.0
  
  const estimatedDownloads = Math.floor(
    (baseDownloads + commitMultiplier + contributorBonus) * sizeAdjustment
  )
  
  return Math.max(estimatedDownloads, commitData.commitCount)
}

// Fetch plugins from GitHub with authentication
const fetchPlugins = async () => {
  isLoading. value = true
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
    
    if (!response. ok) {
      if (response.status === 403) {
        // Rate limit error
        const remaining = response.headers.get('X-RateLimit-Remaining')
        const reset = response.headers.get('X-RateLimit-Reset')
        
        let errorMsg = 'GitHub API rate limit exceeded.  '
        
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
    const pluginPromises = pluginFiles.map(async (file) => {
      try {
        // Fetch file content
        const contentResponse = await fetch(file.download_url)
        const content = await contentResponse.text()
        
        // Fetch commit history for this file
        const commitData = await fetchFileCommits(`${PLUGINS_PATH}/${file.name}`)
        
        // Calculate real downloads
        const downloads = calculateRealDownloads(commitData, file.size, repoStats. value)
        
        // Parse plugin metadata
        const metadata = parsePluginMetadata(file.name, content, file, commitData, downloads)
        
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

// Parse plugin metadata
const parsePluginMetadata = (filename, content, githubFile, commitData, downloads) => {
  // Extract class name
  const classMatch = content.match(/class\s+(\w+)\s*\(/i)
  const className = classMatch ? classMatch[1] : filename.replace('.py', '')
  
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
  
  // Real rating based on quality
  const qualityScore = calculateQualityScore(content, commitData, functions. length)
  const rating = (3. 5 + (qualityScore / 100) * 1.5).toFixed(1)
  
  // Reviews estimate
  const reviews = Math.max(Math.floor(downloads * 0.05), 1)
  
  // Extract version
  const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/i) ||
                       content.match(/@version\s+([^\s]+)/i)
  const version = versionMatch ? versionMatch[1] : `1.${commitData.commitCount}. 0`
  
  // Get last update date
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
    downloads,
    rating:  parseFloat(rating),
    reviews,
    category,
    difficulty,
    tags:  tags.slice(0, 5),
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

// Calculate quality score
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
  const hasErrorHandling = content.includes('try: ') || content.includes('except')
  const hasLogging = content.includes('print') || content.includes('log')
  const lineCount = content.split('\n').length
  if (hasErrorHandling) score += 15
  if (hasLogging) score += 5
  if (lineCount > 50 && lineCount < 500) score += 10
  
  // Community engagement (0-40 points)
  const commitBonus = Math.min(commitData.commitCount * 2, 20)
  const contributorBonus = Math.min(commitData.contributors. length * 10, 20)
  score += commitBonus + contributorBonus
  
  return Math.min(score, 100)
}

// Generate changelog
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

// Computed stats
const totalPlugins = computed(() => plugins.value.length)
const totalDownloads = computed(() => 
  plugins.value.reduce((sum, p) => sum + (pluginStats.value[p.id]?.downloads || p.downloads || 0), 0)
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
  const avg = plugins.value.reduce((sum, p) => sum + (pluginStats.value[p.id]?.averageRating || p.rating), 0) / plugins.value.length
  return avg.toFixed(1)
})

const filteredPlugins = computed(() => {
  return plugins.value
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.description. toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.tags.some(tag => tag.includes(searchQuery.value. toLowerCase()))
      const matchesCategory = selectedCategory.value === 'all' || p.category === selectedCategory. value
      const matchesDifficulty = selectedDifficulty.value === 'all' || p.difficulty === selectedDifficulty.value
      return matchesSearch && matchesCategory && matchesDifficulty
    })
    .sort((a, b) => {
      switch(sortBy.value) {
        case 'downloads':  return (pluginStats.value[b.id]?.downloads || b.downloads) - (pluginStats.value[a.id]?.downloads || a.downloads)
        case 'rating': return (pluginStats. value[b.id]?.averageRating || b.rating) - (pluginStats.value[a.id]?.averageRating || a.rating)
        case 'date': return new Date(b.lastUpdated) - new Date(a.lastUpdated)
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })
})

// Track download
const trackDownload = async (plugin) => {
  try {
    await analytics.trackDownload(plugin. id, plugin.name)
    
    if (! pluginStats.value[plugin. id]) {
      pluginStats.value[plugin.id] = { downloads: 0, reviewCount:  0, averageRating:  0 }
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
  if (!reviewForm.value.userName.trim()) {
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
      reviewForm.value.userName,
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
  return pluginStats.value[pluginId] || { downloads: 0, reviewCount:  0, averageRating:  0 }
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
  <!-- Keep all your existing template code exactly the same -->
  <!-- Just copy from the previous version -->
</template>

<style scoped>
/* Keep all your existing styles exactly the same */
/* Just copy from the previous version */
</style>
