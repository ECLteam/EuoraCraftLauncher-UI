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
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ecl-border);
}

.setting-item:last-child {
  border-bottom: 0;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  margin-bottom: 2px;
  color: var(--ecl-text);
  font-size: 13px;
  font-weight: 600;
}

.setting-desc {
  color: var(--ecl-text-secondary);
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
