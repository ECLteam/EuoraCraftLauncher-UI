<template>
  <div class="setting-item">
    <div class="setting-info">
      <div class="setting-label">
        {{ label }}
      </div>
      <div v-if="description" class="setting-desc">
        {{ description }}
      </div>
    </div>
    <div class="setting-control">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  description?: string
}>()
</script>

<style scoped>
.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-xl);
  margin-bottom: var(--s-xl);
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  margin-bottom: 2px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.setting-desc {
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.5;
}

.setting-control {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
}
</style>
