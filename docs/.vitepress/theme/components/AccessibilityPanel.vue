<script setup>
import { ref, onMounted, watch } from 'vue'

const isOpen = ref(false)
const panelRef = ref(null)

const STORAGE_KEY = 'blaze-a11y-prefs'

const reducedMotion = ref(false)
const highContrast = ref(false)
const underlineLinks = ref(false)
const largeText = ref(false)

function loadPrefs() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    reducedMotion.value = saved.reducedMotion ?? false
    highContrast.value = saved.highContrast ?? false
    underlineLinks.value = saved.underlineLinks ?? false
    largeText.value = saved.largeText ?? false
  } catch { /* ignore parse errors */ }
}

function savePrefs() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    reducedMotion: reducedMotion.value,
    highContrast: highContrast.value,
    underlineLinks: underlineLinks.value,
    largeText: largeText.value,
  }))
}

function applyPrefs() {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  root.classList.toggle('a11y-reduced-motion', reducedMotion.value)
  root.classList.toggle('a11y-high-contrast', highContrast.value)
  root.classList.toggle('a11y-underline-links', underlineLinks.value)
  root.classList.toggle('a11y-large-text', largeText.value)
}

watch([reducedMotion, highContrast, underlineLinks, largeText], () => {
  applyPrefs()
  savePrefs()
})

onMounted(() => {
  loadPrefs()
  applyPrefs()
})

function togglePanel() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="a11y-panel-wrapper">
    <button
      class="a11y-toggle"
      @click="togglePanel"
      :aria-expanded="isOpen"
      aria-label="Accessibility settings"
      title="Accessibility settings"
    >
      <span aria-hidden="true">♿</span>
    </button>

    <Transition name="a11y-slide">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="a11y-panel"
        role="region"
        aria-label="Accessibility preferences"
      >
        <h4 class="a11y-panel-title" id="a11y-title">Accessibility</h4>

        <label class="a11y-option">
          <input type="checkbox" v-model="reducedMotion" />
          <span class="a11y-option-text">Reduce motion</span>
        </label>

        <label class="a11y-option">
          <input type="checkbox" v-model="highContrast" />
          <span class="a11y-option-text">High contrast</span>
        </label>

        <label class="a11y-option">
          <input type="checkbox" v-model="underlineLinks" />
          <span class="a11y-option-text">Underline links</span>
        </label>

        <label class="a11y-option">
          <input type="checkbox" v-model="largeText" />
          <span class="a11y-option-text">Large text</span>
        </label>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.a11y-panel-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.a11y-toggle {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: background 0.2s, border-color 0.2s;
}

.a11y-toggle:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.a11y-toggle:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.a11y-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 200;
}

.a11y-panel-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.a11y-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}

.a11y-option input[type="checkbox"] {
  accent-color: var(--vp-c-brand-1);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.a11y-option input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.a11y-option-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.a11y-slide-enter-active,
.a11y-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.a11y-slide-enter-from,
.a11y-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
