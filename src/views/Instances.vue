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
import backend from '@/api/client'
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
    const result = await backend.command('instances_list')
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
    const result = await backend.command('instance_stop', {instance_id: instanceId})
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

<style scoped src="@/styles/Instances.css"></style>
