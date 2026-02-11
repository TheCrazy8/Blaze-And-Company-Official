<script setup>
import { ref, onMounted, watch } from 'vue'

const fontSize = ref(100)
const MIN_SIZE = 80
const MAX_SIZE = 150
const STEP = 10
const STORAGE_KEY = 'blaze-font-size'

function increase() {
  if (fontSize.value < MAX_SIZE) {
    fontSize.value += STEP
  }
}

function decrease() {
  if (fontSize.value > MIN_SIZE) {
    fontSize.value -= STEP
  }
}

function reset() {
  fontSize.value = 100
}

function applyFontSize(size) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = size + '%'
  }
}

watch(fontSize, (val) => {
  applyFontSize(val)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(val))
  }
})

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (parsed >= MIN_SIZE && parsed <= MAX_SIZE) {
        fontSize.value = parsed
      }
    }
  }
  applyFontSize(fontSize.value)
})
</script>

<template>
  <div class="font-size-adjuster" role="group" aria-label="Adjust font size">
    <button
      class="font-btn"
      @click="decrease"
      :disabled="fontSize <= MIN_SIZE"
      aria-label="Decrease font size"
      title="Decrease font size"
    >A-</button>
    <span class="font-btn font-btn-reset" role="status" aria-live="polite" :aria-label="'Font size: ' + fontSize + '%'">{{ fontSize }}%</span>
    <button
      class="font-btn"
      @click="reset"
      aria-label="Reset font size to 100%"
      title="Reset font size"
    >↺</button>
    <button
      class="font-btn"
      @click="increase"
      :disabled="fontSize >= MAX_SIZE"
      aria-label="Increase font size"
      title="Increase font size"
    >A+</button>
  </div>
</template>

<style scoped>
.font-size-adjuster {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
}

.font-btn {
  padding: 4px 8px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.font-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.font-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-btn:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.font-btn-reset {
  font-variant-numeric: tabular-nums;
  min-width: 42px;
  text-align: center;
}
</style>
