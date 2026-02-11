<script setup>
</script>

<template>
  <a href="#VPContent" class="skip-to-content" aria-label="Skip to main content">
    Skip to content
  </a>
</template>

<style scoped>
.skip-to-content {
  position: fixed;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff4500, #ff6b35);
  color: white;
  font-weight: 700;
  font-size: 14px;
  border-radius: 0 0 8px 8px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
  transition: top 0.2s ease;
}

.skip-to-content:focus {
  top: 0;
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>
