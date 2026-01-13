import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Note: The anon key is safe to expose publicly - it's designed for client-side use
// Row Level Security (RLS) policies protect the database
const SUPABASE_URL = 'https://rshigflhanzjrqeoynpa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaGlnZmxoYW56anJxZW95bnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDIxOTcsImV4cCI6MjA4MzkxODE5N30.49JJ_nlcby45UlkpcRFJQETTM4ocbmGX2OYGN6z7z5g'

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Analytics API
export const analyticsAPI = {
  /**
   * Track a plugin download
   * @param {string} pluginId - The plugin ID
   * @param {string} pluginName - The plugin name
   * @returns {Promise<object>} Result of the operation
   */
  async trackDownload(pluginId, pluginName) {
    try {
      const { data, error } = await supabase
        .from('plugin_downloads')
        .insert([
          {
            plugin_id: pluginId,
            plugin_name: pluginName,
            downloaded_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || null
          }
        ])

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error tracking download:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get download count for a specific plugin
   * @param {string} pluginId - The plugin ID
   * @returns {Promise<number>} Download count
   */
  async getDownloadCount(pluginId) {
    try {
      const { count, error } = await supabase
        .from('plugin_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('plugin_id', pluginId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting download count:', error)
      return 0
    }
  },

  /**
   * Get all plugin statistics
   * @returns {Promise<object>} Statistics object with plugin stats
   */
  async getAllStats() {
    try {
      const { data, error } = await supabase
        .from('plugin_stats')
        .select('*')

      if (error) throw error

      // Convert array to object keyed by plugin_id
      const stats = {}
      if (data) {
        data.forEach(stat => {
          stats[stat.plugin_id] = {
            downloads: stat.download_count || 0,
            rating: stat.avg_rating || 0,
            reviews: stat.review_count || 0
          }
        })
      }

      return stats
    } catch (error) {
      console.error('Error getting all stats:', error)
      return {}
    }
  }
}

// Reviews API
export const reviewsAPI = {
  /**
   * Submit a review for a plugin
   * @param {string} pluginId - The plugin ID
   * @param {string} pluginName - The plugin name
   * @param {string} userName - The reviewer's name
   * @param {number} rating - Rating (1-5)
   * @param {string} comment - Review comment
   * @returns {Promise<object>} Result of the operation
   */
  async submitReview(pluginId, pluginName, userName, rating, comment) {
    try {
      const { data, error } = await supabase
        .from('plugin_reviews')
        .insert([
          {
            plugin_id: pluginId,
            plugin_name: pluginName,
            user_name: userName,
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString(),
            helpful_count: 0
          }
        ])
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error submitting review:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get reviews for a specific plugin
   * @param {string} pluginId - The plugin ID
   * @param {number} limit - Number of reviews to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of reviews
   */
  async getReviews(pluginId, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('plugin_reviews')
        .select('*')
        .eq('plugin_id', pluginId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting reviews:', error)
      return []
    }
  },

  /**
   * Get review statistics for a plugin
   * @param {string} pluginId - The plugin ID
   * @returns {Promise<object>} Review statistics
   */
  async getReviewStats(pluginId) {
    try {
      const { data, error } = await supabase
        .from('plugin_reviews')
        .select('rating')
        .eq('plugin_id', pluginId)

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          avgRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      }

      // Calculate statistics
      const ratings = data.map(r => r.rating)
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

      // Calculate distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ratings.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1
      })

      return {
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: ratings.length,
        distribution
      }
    } catch (error) {
      console.error('Error getting review stats:', error)
      return {
        avgRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }
  },

  /**
   * Mark a review as helpful
   * @param {number} reviewId - The review ID
   * @returns {Promise<object>} Result of the operation
   */
  async markHelpful(reviewId) {
    try {
      const { data, error } = await supabase.rpc('increment_helpful_count', {
        review_id: reviewId
      })

      if (error) {
        // Fallback if RPC doesn't exist - use update instead
        const { data: review, error: fetchError } = await supabase
          .from('plugin_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single()

        if (fetchError) throw fetchError

        const { data: updateData, error: updateError } = await supabase
          .from('plugin_reviews')
          .update({ helpful_count: (review.helpful_count || 0) + 1 })
          .eq('id', reviewId)
          .select()

        if (updateError) throw updateError
        return { success: true, data: updateData }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error marking review as helpful:', error)
      return { success: false, error: error.message }
    }
  }
}
