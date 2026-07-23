<template>
  <section class="settings-section">
    <div class="section-label">
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
  margin-bottom: var(--s-2xl);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  margin-bottom: var(--s-lg);
  padding-bottom: var(--s-sm);
  border-bottom: 1px solid var(--divider);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
