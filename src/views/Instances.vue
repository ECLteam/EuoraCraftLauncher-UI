<template>
  <div class="instances-container">
    <div class="header">
      <h2 class="title">
        <UiIcon name="folder" />
        {{ t('instances.title') }}
      </h2>
    </div>

    <div class="content">
      <div v-if="instances.length > 0" class="instances-list">
        <div
          v-for="instance in instances"
          :key="instance.id"
          class="instance-card"
          :class="{ running: instance.isRunning }"
        >
          <div class="instance-icon">
            <UiIcon name="game-controller" />
          </div>

          <div class="instance-info">
            <div class="instance-name">{{ instance.name }}</div>
            <div class="instance-meta">
              <span class="version">{{ instance.version }}</span>
              <span class="status running">{{ t('instances.statusRunning') }}</span>
            </div>
          </div>

          <div class="instance-actions">
            <UiIconButton
              name="stop"
              variant="danger"
              @click="stopInstance(instance.id)"
              :title="t('instances.stop')"
            />
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <UiIcon name="folder-open" class="empty-icon" />
        <p>{{ t('instances.empty') }}</p>
        <p class="empty-hint">{{ t('instances.launchHint') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api/client'
import { useGlassMessage } from '@/composables/useGlassMessage'
import UiIcon from '@/components/ui/Icon.vue'
import UiIconButton from '@/components/ui/IconButton.vue'

const { t } = useI18n()
const message = useGlassMessage()

const instances = ref<any[]>([])
const loading = ref(false)

let refreshInterval: number | null = null

async function loadInstances() {
  loading.value = true
  try {
    const result = await api.getGameInstances()
    if (result.success && result.data) {
      instances.value = result.data.filter((inst: any) => inst.isRunning)
    } else {
      message.error(result.message || t('instances.loadFailed'))
    }
  } catch (e) {
    message.error(t('instances.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function stopInstance(instanceId: string) {
  try {
    const result = await api.stopInstance(instanceId)
    if (result.success) {
      message.success(t('instances.stopSuccess'))
      setTimeout(loadInstances, 500)
    } else {
      message.error(result.message || t('instances.stopFailed'))
    }
  } catch (e) {
    message.error(t('instances.stopFailed'))
  }
}

onMounted(() => {
  loadInstances()
  refreshInterval = window.setInterval(loadInstances, 2000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.instances-container {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text-primary);
}

.content {
  flex: 1;
  overflow-y: auto;
}

.instances-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.instance-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.instance-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.instance-card.running {
  border-color: var(--success-color, #52c41a);
  background: linear-gradient(90deg, var(--bg-surface) 0%, rgba(82, 196, 26, 0.05) 100%);
}

.instance-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.instance-info {
  flex: 1;
  min-width: 0;
}

.instance-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.instance-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.status.running {
  background: rgba(82, 196, 26, 0.15);
  color: var(--success-color, #52c41a);
}

.instance-actions {
  display: flex;
  gap: 8px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.instance-card:hover .instance-actions {
  opacity: 1;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  color: var(--text-disabled);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-disabled);
}
</style>
