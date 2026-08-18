<template>
  <div class="itm">
    <header class="itm-header">
      <UiIcon name="terminal" :size="16" />
      <strong>{{ t('versions.running.terminal') }}</strong>
      <span class="itm-grip" />
      <button class="itm-back" :title="t('terminal.back')" @click="emit('back')">
        <UiIcon name="arrow-left" :size="15" />
        <span>{{ t('terminal.back') }}</span>
      </button>
    </header>
    <div class="itm-body">
      <ProcessInstanceView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { globalProcessInstances } from '../composables/useProcessInstances'
import ProcessInstanceView from './ProcessInstanceView.vue'

defineOptions({ name: 'InstanceTerminalModule' })

const emit = defineEmits<{ (e: 'back'): void }>()
const { t } = useI18n()

onMounted(() => globalProcessInstances.init())
onUnmounted(() => globalProcessInstances.dispose())
</script>

<style scoped>
.itm {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.itm-header {
  display: flex;
  flex-shrink: 0;
  height: 44px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.itm-header strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.itm-grip {
  flex: 1;
}

.itm-back {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--duration-fast) ease-out;
}

.itm-back:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.itm-body {
  flex: 1;
  min-height: 0;
}
</style>
