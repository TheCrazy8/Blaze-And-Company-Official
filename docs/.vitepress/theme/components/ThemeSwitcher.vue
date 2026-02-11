<script setup>
import { ref, onMounted } from 'vue'

const themes = [
  { name:  'Fire', colors: { primary: '#ff4500', secondary:  '#ff6b35' } },
  { name: 'Ice', colors: { primary: '#00d4ff', secondary: '#66e5ff' } },
  { name: 'Forest', colors: { primary: '#10b981', secondary: '#34d399' } },
  { name: 'Purple', colors: { primary: '#8b5cf6', secondary: '#a78bfa' } }
]

const currentTheme = ref(0)

onMounted(() => {
  const saved = localStorage.getItem('color-theme')
  if (saved) currentTheme.value = parseInt(saved)
  applyTheme()
})

function applyTheme() {
  const theme = themes[currentTheme.value]
  document.documentElement.style.setProperty('--vp-c-brand-1', theme.colors.primary)
  document.documentElement.style.setProperty('--vp-c-brand-2', theme.colors.secondary)
  localStorage.setItem('color-theme', currentTheme.value.toString())
}

function cycleTheme() {
  currentTheme.value = (currentTheme.value + 1) % themes.length
  applyTheme()
}
</script>

<template>
  <button class="theme-switcher" @click="cycleTheme" :title="`Theme: ${themes[currentTheme].name}`" :aria-label="`Change color theme. Current: ${themes[currentTheme].name}`">
    <span aria-hidden="true">🎨</span>
  </button>
</template>

<style scoped>
.theme-switcher {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s;
}

.theme-switcher:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  transform: rotate(180deg);
}
</style>