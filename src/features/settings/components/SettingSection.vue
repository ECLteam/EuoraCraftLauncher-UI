<template>
  <section class="settings-section ecl-surface" data-theme-component="settings-section">
    <div class="settings-section__header">
      {{ title }}
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.settings-section {
  overflow: hidden;
  margin-bottom: 16px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section__header {
  padding: 13px 16px;
  border-bottom: 1px solid var(--ecl-border);
  color: var(--ecl-text);
  font-size: 13px;
  font-weight: 650;
}
</style>
