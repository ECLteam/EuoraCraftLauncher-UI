<template>
  <FullscreenModal
    v-model:visible="modalVisible"
    :title="t('download.title')"
    :showFooter="false"
    bodyClass="download-modal-body"
  >
    <div class="download-layout">
      <aside class="download-nav ecl-surface">
        <div class="download-nav-title">
          <UiIcon name="download" :size="18" />
          <span>{{ t('download.title') }}</span>
        </div>
        <button
          class="download-nav-item"
          :class="{ active: activeTab === 'instances' }"
          @click="activeTab = 'instances'"
        >
          <UiIcon name="cube" :size="18" />
          <span>{{ t('download.instanceDownload') }}</span>
        </button>
        <button
          class="download-nav-item"
          :class="{ active: activeTab === 'mods' }"
          @click="activeTab = 'mods'"
        >
          <UiIcon name="puzzle" :size="18" />
          <span>{{ t('download.modDownload') }}</span>
        </button>
      </aside>

      <main class="download-content">
        <InstancesTab v-if="activeTab === 'instances'" />
        <OnlineMods v-else />
      </main>
    </div>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import InstancesTab from '@/views/instances/InstancesTab.vue'
import OnlineMods from '@/views/OnlineMods.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
}>()

const { t } = useI18n()

const activeTab = ref<'instances' | 'mods'>('instances')

const modalVisible = computed({
  get: () => props.visible,
  set: (val) => {
    emit('update:visible', val)
    if (!val) emit('close')
  },
})
</script>

<style scoped>
.download-layout {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
}

.download-nav {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 6px;
}

.download-nav-title {
  display: flex;
  height: 44px;
  flex-shrink: 0;
  align-items: center;
  gap: 7px;
  padding: 0 6px;
  border-bottom: 1px solid var(--ecl-border);
  color: var(--ecl-text);
  font-size: 13px;
  font-weight: 650;
}

.download-nav-title :deep(svg) {
  color: var(--primary);
}

.download-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 36px;
  margin: 3px 0;
  padding: 0 10px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color var(--duration-fast) ease-out,
    background var(--duration-fast) ease-out;
}

.download-nav-item:hover {
  color: var(--text-primary);
  background: var(--glass-item-hover);
}

.download-nav-item.active {
  color: var(--primary);
  font-weight: 600;
  background: var(--glass-item-active-bg);
}

.download-nav-item :deep(svg) {
  opacity: 0.75;
  transition: opacity var(--duration-normal) var(--ease-exit);
}

.download-nav-item:hover :deep(svg),
.download-nav-item.active :deep(svg) {
  opacity: 1;
}

.download-content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: auto;
}

@media (max-width: 840px) {
  .download-layout {
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 10px;
  }
}
</style>