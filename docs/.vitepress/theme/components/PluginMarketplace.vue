<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedDifficulty = ref('all')
const sortBy = ref('downloads')

const categories = ['all', 'Motor Control', 'Sensors', 'Display', 'Communication', 'Utilities']
const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced']

// Mock plugin data (replace with actual data from GitHub API or JSON file)
const plugins = ref([
  {
    id: 1,
    name:  'MotorController',
    version: '1.2.0',
    author: 'TheCrazy8',
    description: 'Control servos, DC motors, and steppers with ease',
    longDescription: 'A comprehensive motor control plugin supporting multiple motor types with advanced features like ramping, sweeping, and position tracking.',
    downloads: 1,
    rating: 4.5,
    reviews: 12,
    category: 'Motor Control',
    difficulty: 'Intermediate',
    tags: ['motor', 'servo', 'dc-motor', 'stepper'],
    hardware: ['Arduino Uno R4 WiFi', 'Arduino Mega'],
    dependencies: ['telemetrix-uno-r4-wifi'],
    lastUpdated: '2025-01-10',
    downloadUrl: 'https://raw.githubusercontent.com/TheCrazy8/Blaze-And-Company-Official/main/community%20made%20plugins/motor_controller_plugin.py',
    changelog: [
      { version: '1.2.0', date: '2025-01-10', changes: 'Added stepper motor support' },
      { version: '1.1.0', date: '2025-01-05', changes: 'Fixed servo angle bug' }
    ]
  }
])

const selectedPlugin = ref(null)

const filteredPlugins = computed(() => {
  return plugins.value
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.description. toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           p.tags.some(tag => tag.includes(searchQuery.value. toLowerCase()))
      const matchesCategory = selectedCategory.value === 'all' || p.category === selectedCategory.value
      const matchesDifficulty = selectedDifficulty.value === 'all' || p.difficulty === selectedDifficulty.value
      return matchesSearch && matchesCategory && matchesDifficulty
    })
    .sort((a, b) => {
      switch(sortBy.value) {
        case 'downloads':  return b.downloads - a.downloads
        case 'rating': return b.rating - a.rating
        case 'date': return new Date(b.lastUpdated) - new Date(a.lastUpdated)
        case 'name': return a.name.localeCompare(b. name)
        default: return 0
      }
    })
})

const copyCode = async (plugin) => {
  try {
    const response = await fetch(plugin.downloadUrl)
    const code = await response.text()
    await navigator.clipboard.writeText(code)
    if (window.$toast) {
      window.$toast. success('✨ Plugin code copied to clipboard!')
    } else {
      alert('✅ Plugin code copied to clipboard!')
    }
  } catch (err) {
    if (window.$toast) {
      window.$toast.error('❌ Failed to copy code. Please try again.')
    } else {
      alert('❌ Failed to copy code')
    }
  }
}

const downloadPlugin = (plugin) => {
  window. open(plugin.downloadUrl, '_blank')
  if (window.$toast) {
    window.$toast.success(`📥 Downloaded ${plugin.name}! `)
  }
}

const viewPlugin = (plugin) => {
  selectedPlugin.value = plugin
}

const closeModal = () => {
  selectedPlugin.value = null
}

const getTimeSince = (date) => {
  const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}
</script>

<template>
  <div class="plugin-marketplace">
    <!-- Header -->
    <div class="marketplace-header">
      <h1>🔌 Plugin Marketplace</h1>
      <p>Discover and install community-made plugins to extend BrightOS</p>
      
      <div class="stats">
        <div class="stat">
          <strong>{{ plugins.length }}</strong>
          <span>Plugins</span>
        </div>
        <div class="stat">
          <strong>{{ plugins.reduce((sum, p) => sum + p.downloads, 0) }}</strong>
          <span>Downloads</span>
        </div>
        <div class="stat">
          <strong>{{ new Set(plugins.map(p => p.author)).size }}</strong>
          <span>Contributors</span>
        </div>
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
          <option value="all">All Categories</option>
          <option v-for="cat in categories. slice(1)" :key="cat" :value="cat">
            {{ cat }}
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
            <span class="rating-value">{{ plugin.rating }}</span>
            <span class="review-count">({{ plugin.reviews }})</span>
          </div>
        </div>

        <div class="plugin-meta">
          <span class="author">👤 {{ plugin.author }}</span>
          <span class="downloads">📥 {{ plugin.downloads }}</span>
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
            📖 View Details
          </button>
          <button @click="copyCode(plugin)" class="btn btn-secondary">
            📋 Copy Code
          </button>
          <button @click="downloadPlugin(plugin)" class="btn btn-secondary">
            💾 Download
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
          <span>📥 {{ selectedPlugin.downloads }} downloads</span>
          <span>⭐ {{ selectedPlugin.rating }} ({{ selectedPlugin.reviews }} reviews)</span>
        </div>

        <div class="modal-section">
          <h3>Description</h3>
          <p>{{ selectedPlugin.longDescription }}</p>
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
            <li v-for="dep in selectedPlugin.dependencies" :key="dep">
              📦 {{ dep }}
            </li>
          </ul>
        </div>

        <div class="modal-section">
          <h3>Changelog</h3>
          <div v-for="entry in selectedPlugin.changelog" :key="entry.version" class="changelog-entry">
            <strong>v{{ entry.version }}</strong> - {{ entry.date }}
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plugin-marketplace {
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
  justify-content:  center;
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
}

.stat span {
  color: var(--vp-c-text-2);
  font-size: 14px;
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
  font-size:  18px;
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

.plugin-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 24px rgba(255, 69, 0, 0.15);
  transform: translateY(-4px);
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items:  flex-start;
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
  color:  var(--vp-c-text-2);
  line-height: 1.6;
}

.plugin-tags {
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
  font-size:  12px;
  font-weight: 600;
}

.badge.category {
  background: #3b82f6;
  color: white;
}

.badge.difficulty {
  color: white;
}

.badge.difficulty.beginner {
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
}

.btn {
  flex: 1;
  padding:  10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor:  pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-primary:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  overflow-y:  auto;
  padding: 32px;
  position: relative;
}

. modal-close {
  position:  absolute;
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
  padding:  0;
}

.modal-section li {
  padding: 8px 0;
  border-bottom: 1px solid var(--vp-c-divider);
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

.changelog-entry p {
  margin: 8px 0 0 0;
  color: var(--vp-c-text-2);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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
}
</style>
