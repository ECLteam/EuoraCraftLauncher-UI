<template>
  <div class="running-instances-page">
    <section class="running-instances-library ecl-surface">
      <header class="running-instances-toolbar">
        <div class="running-instances-heading">
          <div class="running-instances-heading-icon">
            <UiIcon name="game" :size="19" />
          </div>
          <div>
            <strong>{{ t('versions.running.title') }}</strong>
            <span>{{ t('versions.running.description') }}</span>
          </div>
        </div>
        <div class="running-instances-toolbar-actions">
          <span class="running-instances-count">
            <i></i>
            {{ t('versions.running.count', { count: instances.length }) }}
          </span>
          <NButton
            quaternary
            circle
            size="small"
            :title="t('versions.running.refresh')"
            :loading="loading"
            @click="loadInstances"
          >
            <template #icon><UiIcon name="refresh" :size="15" /></template>
          </NButton>
        </div>
      </header>

      <NSpin :show="loading" class="running-instances-content">
        <TransitionGroup v-if="instances.length" name="running-card" tag="div" class="running-instance-grid">
          <article v-for="instance in instances" :key="instance.id" class="running-instance-card">
            <div class="running-instance-visual">
              <div class="running-instance-art">
                <img :src="minecraftIcon" alt="" />
              </div>
              <span class="running-instance-status">
                <i></i>
                {{ t('versions.running.running') }}
              </span>
            </div>

            <div class="running-instance-body">
              <div class="running-instance-identity">
                <strong :title="instance.name || instance.versionId">
                  {{ instance.name || instance.versionId }}
                </strong>
                <span>{{ t('versions.running.instanceType') }}</span>
              </div>

              <dl class="running-instance-metadata">
                <div>
                  <dt>{{ t('versions.running.versionLabel') }}</dt>
                  <dd>{{ instance.versionId || instance.version || '-' }}</dd>
                </div>
                <div>
                  <dt>{{ t('versions.running.pathLabel') }}</dt>
                  <dd :title="instance.gamePath">{{ instance.gamePath || t('versions.running.unknownPath') }}</dd>
                </div>
              </dl>
            </div>

            <footer class="running-instance-footer">
              <span class="running-instance-session">
                <UiIcon name="shield" :size="13" />
                {{ t('versions.running.sessionManaged') }}
              </span>
              <NButton
                type="error"
                secondary
                size="small"
                :loading="stoppingIds.has(instance.id)"
                :disabled="stoppingIds.size > 0 && !stoppingIds.has(instance.id)"
                @click="confirmStop(instance)"
              >
                <template #icon><UiIcon name="stop" :size="14" /></template>
                {{ t('versions.running.stop') }}
              </NButton>
            </footer>
          </article>
        </TransitionGroup>

        <div v-else-if="!loading" class="running-empty">
          <div class="running-empty-icon">
            <UiIcon name="game" :size="38" />
          </div>
          <strong>{{ t('versions.running.empty') }}</strong>
          <span>{{ t('versions.running.emptyHint') }}</span>
          <NButton secondary size="small" @click="loadInstances">
            <template #icon><UiIcon name="refresh" :size="14" /></template>
            {{ t('versions.running.refresh') }}
          </NButton>
        </div>
      </NSpin>
    </section>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSpin, useDialog } from 'naive-ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { instanceRuntimeApi } from '@/features/instances/api/instanceRuntimeApi'
import type { GameInstance } from '@/types/api'

const { t } = useI18n()
const dialog = useDialog()
const message = useGlassMessage()
const minecraftIcon = '/img/item/grass.png'
const instances = ref<GameInstance[]>([])
const loading = ref(false)
const stoppingIds = ref(new Set<string>())
let requestId = 0
let stopListening: (() => void) | null = null

async function loadInstances(): Promise<void> {
  const currentRequest = ++requestId
  loading.value = true
  try {
    const result = await instanceRuntimeApi.list()
    if (currentRequest === requestId) instances.value = result.filter((instance) => instance.isRunning)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.running.loadFailed'))
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

function confirmStop(instance: GameInstance): void {
  dialog.warning({
    title: t('versions.running.stopTitle'),
    content: t('versions.running.stopConfirm', { name: instance.name || instance.versionId }),
    positiveText: t('versions.running.stop'),
    negativeText: t('common.cancel'),
    onPositiveClick: () => stopInstance(instance),
  })
}

async function stopInstance(instance: GameInstance): Promise<void> {
  const next = new Set(stoppingIds.value)
  next.add(instance.id)
  stoppingIds.value = next
  try {
    await instanceRuntimeApi.stop(instance.id)
    instances.value = instances.value.filter((item) => item.id !== instance.id)
    message.success(t('versions.running.stopped', { name: instance.name || instance.versionId }))
    await loadInstances()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.running.stopFailed'))
  } finally {
    const remaining = new Set(stoppingIds.value)
    remaining.delete(instance.id)
    stoppingIds.value = remaining
  }
}

onMounted(() => {
  stopListening = instanceRuntimeApi.onChanged(() => {
    void loadInstances()
  })
  void loadInstances()
})

onBeforeUnmount(() => {
  requestId += 1
  stopListening?.()
})
</script>

<style scoped>
.running-instances-page {
  min-width: 0;
  height: 100%;
  padding: var(--s-md);
  overflow: hidden;
}

.running-instances-library {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--r-lg);
}

.running-instances-toolbar {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-md);
  padding: 10px var(--s-md);
  border-bottom: 1px solid var(--divider);
}

.running-instances-heading,
.running-instances-toolbar-actions {
  display: flex;
  align-items: center;
}

.running-instances-heading {
  min-width: 0;
  gap: 10px;
}

.running-instances-heading-icon {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--r-sm);
  background: var(--primary-alpha);
  color: var(--primary);
}

.running-instances-heading > div:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.running-instances-heading strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
}

.running-instances-heading span {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.running-instances-toolbar-actions {
  flex: 0 0 auto;
  gap: var(--s-xs);
}

.running-instances-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--r-full);
  background: var(--success-alpha);
  color: var(--success);
  font-size: 11px;
  font-weight: 600;
}

.running-instances-count i,
.running-instance-status i {
  width: 6px;
  height: 6px;
  background: currentcolor;
  border-radius: 50%;
  box-shadow: 0 0 7px currentcolor;
}

.running-instances-content {
  flex: 1;
  min-height: 220px;
  overflow: hidden;
}

.running-instances-content :deep(.n-spin-content) {
  height: 100%;
}

.running-instance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  align-content: start;
  gap: var(--s-md);
  height: 100%;
  padding: var(--s-md);
  overflow: auto;
}

.running-instance-card {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-elevated);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition:
    border-color var(--duration-fast) var(--ease-smooth),
    box-shadow var(--duration-fast) var(--ease-smooth),
    transform var(--duration-fast) var(--ease-smooth);
}

.running-instance-card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 8px 22px rgba(21, 31, 52, 0.09);
  transform: translateY(-2px);
}

.running-instance-visual {
  position: relative;
  display: grid;
  height: 116px;
  place-items: center;
  overflow: hidden;
  border-bottom: 1px solid var(--divider);
  background:
    radial-gradient(circle at 50% 85%, var(--primary-alpha-strong), transparent 48%),
    linear-gradient(145deg, var(--bg-base-alt), var(--bg-elevated));
}

.running-instance-visual::before,
.running-instance-visual::after {
  position: absolute;
  width: 70px;
  height: 70px;
  border: 1px solid color-mix(in srgb, var(--primary) 12%, transparent);
  border-radius: 18px;
  content: '';
  transform: rotate(24deg);
}

.running-instance-visual::before {
  top: -34px;
  left: -18px;
}

.running-instance-visual::after {
  right: -20px;
  bottom: -44px;
}

.running-instance-art {
  z-index: 1;
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--bg-elevated) 78%, transparent);
  box-shadow: 0 10px 26px rgba(21, 31, 52, 0.1);
}

.running-instance-art img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.running-instance-status {
  position: absolute;
  z-index: 2;
  top: 9px;
  right: 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--success) 20%, transparent);
  border-radius: var(--r-full);
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
  color: var(--success);
  font-size: 10px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.running-instance-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--s-md);
  padding: var(--s-md);
}

.running-instance-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.running-instance-identity strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.running-instance-identity span {
  color: var(--text-secondary);
  font-size: 11px;
}

.running-instance-metadata {
  display: flex;
  min-width: 0;
  margin: 0;
  flex-direction: column;
  gap: 7px;
}

.running-instance-metadata > div {
  display: grid;
  min-width: 0;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: var(--s-sm);
}

.running-instance-metadata dt,
.running-instance-metadata dd {
  margin: 0;
  font-size: 11px;
}

.running-instance-metadata dt {
  color: var(--text-tertiary);
}

.running-instance-metadata dd {
  overflow: hidden;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.running-instance-footer {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-sm);
  margin-top: auto;
  padding: 8px var(--s-md);
  border-top: 1px solid var(--divider);
  background: color-mix(in srgb, var(--bg-base-alt) 42%, transparent);
}

.running-instance-session {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  color: var(--text-tertiary);
  font-size: 10px;
}

.running-instance-session :deep(svg) {
  color: var(--primary);
}

.running-empty {
  display: flex;
  height: 100%;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--s-sm);
  padding: var(--s-xl);
  text-align: center;
}

.running-empty-icon {
  display: grid;
  width: 72px;
  height: 72px;
  margin-bottom: var(--s-xs);
  place-items: center;
  border-radius: var(--r-lg);
  background: var(--bg-base-alt);
  color: var(--text-tertiary);
}

.running-empty strong {
  color: var(--text-primary);
  font-size: 14px;
}

.running-empty > span {
  max-width: 360px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.6;
}

.running-card-enter-active,
.running-card-leave-active {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.running-card-enter-from,
.running-card-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 760px) {
  .running-instances-heading span {
    display: none;
  }

  .running-instance-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .running-instances-page {
    padding: var(--s-sm);
  }

  .running-instances-count {
    padding: 3px 6px;
  }

  .running-instance-visual {
    height: 96px;
  }

  .running-instance-art {
    width: 64px;
    height: 64px;
  }

  .running-instance-art img {
    width: 50px;
    height: 50px;
  }
}
</style>
