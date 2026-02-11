<script setup>
import { ref } from 'vue'

const isOpen = ref(false)

const actions = [
  { icon: '🏠', label: 'Home', link: '/' },
  { icon: '📚', label: 'Docs', link: '/key' },
  { icon: '🔧', label: 'Build', link: '/BUILD' },
  { icon: '⚡', label: 'BrightOS', link: '/brightos-web' }
]
</script>

<template>
  <div class="fab-container" role="navigation" aria-label="Quick links">
    <transition-group name="fab-menu">
      <button
        v-for="(action, index) in actions"
        v-show="isOpen"
        :key="action.label"
        class="fab-action"
        :style="{ transitionDelay: `${index * 50}ms` }"
        @click="() => window.location.href = action.link"
        :aria-label="action.label"
      >
        <span class="fab-icon" aria-hidden="true">{{ action.icon }}</span>
        <span class="fab-label">{{ action.label }}</span>
      </button>
    </transition-group>
    
    <button class="fab-main" @click="isOpen = !isOpen" :aria-expanded="isOpen" aria-label="Quick navigation menu">
      <span class="fab-icon" aria-hidden="true">{{ isOpen ? '✕' :  '🔥' }}</span>
    </button>
  </div>
</template>

<style scoped>
.fab-container {
  position: fixed;
  bottom: 120px;
  right: 24px;
  z-index:  100;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius:  50%;
  border: none;
  background: linear-gradient(135deg, #ff4500, #ff6b35);
  color: white;
  font-size:  24px;
  cursor:  pointer;
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
  transition: all 0.3s;
}

.fab-main:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 20px rgba(255, 69, 0, 0.6);
}

.fab-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 28px;
  border: none;
  background: var(--vp-c-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.fab-action:hover {
  background: var(--vp-c-brand-soft);
  transform: translateX(-4px);
}

.fab-icon {
  font-size: 20px;
}

.fab-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all 0.3s;
}

.fab-menu-enter-from {
  opacity: 0;
  transform:  translateY(20px) scale(0.8);
}

.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

@media (max-width: 768px) {
  .fab-container {
    bottom: 80px;
    right: 16px;
  }
  
  .fab-main {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>