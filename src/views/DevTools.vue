<template>
  <div class="dev-page">
    <div class="dev-header">
      <div>
        <h1>{{ t('dev.title') }}</h1>
        <p class="desc">
          {{ t('dev.desc') }}
        </p>
      </div>
      <div class="dev-actions">
        <UiButton variant="primary" size="sm" @click="$router.push('/')">
          {{ t('common.close') }}
        </UiButton>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.modal') }}</h2>
      <div class="btn-group">
        <UiButton @click="showNormalModal = true">
          {{ t('dev.normalModal') }}
        </UiButton>
        <UiButton @click="showFullscreenModal = true">
          {{ t('dev.fullscreenModal') }}
        </UiButton>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.button') }}</h2>
      <div class="btn-group">
        <UiButton variant="primary"> Primary </UiButton>
        <UiButton variant="secondary"> Secondary </UiButton>
        <UiButton variant="outline"> Outline </UiButton>
        <UiButton variant="text"> Text </UiButton>
        <UiButton :loading="true"> Loading </UiButton>
        <UiButton :disabled="true"> Disabled </UiButton>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.input') }}</h2>
      <div class="input-group">
        <UiInput v-model="inputValue" :placeholder="t('dev.normalInput')" />
        <UiInput v-model="inputValue" :placeholder="t('dev.withIcon')" icon="icon-search" />
        <UiInput v-model="inputValue" :placeholder="t('dev.clearable')" clearable />
        <UiInput v-model="inputValue" :placeholder="t('dev.password')" type="password" />
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.card') }}</h2>
      <div class="card-group">
        <UiCard :title="t('dev.normalCard')" icon="icon-cube">
          {{ t('dev.cardContent') }}
        </UiCard>
        <UiCard :title="t('dev.noIcon')">
          {{ t('dev.noIconCard') }}
        </UiCard>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.message') }}</h2>
      <div class="btn-group">
        <UiButton @click="showMsg('info')"> Info </UiButton>
        <UiButton @click="showMsg('success')"> Success </UiButton>
        <UiButton @click="showMsg('warning')"> Warning </UiButton>
        <UiButton @click="showMsg('error')"> Error </UiButton>
      </div>
    </div>

    <div class="section debug-settings-section">
      <div class="debug-settings-heading">
        <h2>{{ t('dev.debugSettings') }}</h2>
        <span class="debug-only-badge">{{ t('dev.debugOnly') }}</span>
      </div>

      <div class="debug-setting-row">
        <div class="debug-setting-info">
          <div class="debug-setting-label">{{ t('dev.animationSpeed') }}</div>
          <div class="debug-setting-desc">{{ t('dev.animationSpeedDesc') }}</div>
        </div>
        <div class="debug-setting-control">
          <UiSlider v-model="animSpeed" :min="0.25" :max="2" :step="0.05" suffix="×" />
          <UiButton size="sm" variant="outline" :disabled="animSpeed === 1" @click="resetAnimSpeed">
            {{ t('common.reset') }}
          </UiButton>
        </div>
      </div>
    </div>

    <div class="section danger-section">
      <div class="danger-section-heading">
        <div>
          <h2>{{ t('dev.dangerZone') }}</h2>
          <p>{{ t('dev.dangerZoneDesc') }}</p>
        </div>
        <span class="debug-only-badge">{{ t('dev.debugOnly') }}</span>
      </div>

      <div class="danger-action-grid">
        <article class="danger-action-card">
          <div>
            <h3>{{ t('dev.resetData') }}</h3>
            <p>{{ t('dev.resetDataDesc') }}</p>
            <small>{{ t('dev.resetDataScope') }}</small>
          </div>
          <UiButton
            variant="danger"
            :loading="processingAction === 'reset'"
            :disabled="processingAction !== null && processingAction !== 'reset'"
            @click="requestDangerAction('reset')"
          >
            {{ t('dev.resetData') }}
          </UiButton>
        </article>

        <article class="danger-action-card">
          <div>
            <h3>{{ t('dev.clearPlugins') }}</h3>
            <p>{{ t('dev.clearPluginsDesc') }}</p>
            <small>{{ t('dev.clearPluginsScope') }}</small>
          </div>
          <UiButton
            variant="danger"
            :loading="processingAction === 'plugins'"
            :disabled="processingAction !== null && processingAction !== 'plugins'"
            @click="requestDangerAction('plugins')"
          >
            {{ t('dev.clearPlugins') }}
          </UiButton>
        </article>
      </div>
    </div>

    <!-- 普通弹窗 -->
    <Modal v-model:visible="showNormalModal" :title="t('dev.normalModalTest')">
      <p>{{ t('dev.normalModalDesc') }}</p>
      <template #footer>
        <UiButton variant="secondary" @click="showNormalModal = false">
          {{ t('common.close') }}
        </UiButton>
        <UiButton variant="primary">
          {{ t('common.confirm') }}
        </UiButton>
      </template>
    </Modal>

    <!-- 全屏弹窗 -->
    <FullscreenModal v-model:visible="showFullscreenModal" :title="t('dev.fullscreenModalTest')">
      <div class="fullscreen-content">
        <p>{{ t('dev.fullscreenModalDesc') }}</p>
        <UiButton @click="showNestedModal = true">
          {{ t('dev.openNested') }}
        </UiButton>
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="showFullscreenModal = false">
          {{ t('common.close') }}
        </UiButton>
      </template>
    </FullscreenModal>

    <!-- 嵌套弹窗 -->
    <Modal v-model:visible="showNestedModal" :title="t('dev.nestedModal')">
      <p>{{ t('dev.nestedModalDesc') }}</p>
      <template #footer>
        <UiButton @click="showNestedModal = false">
          {{ t('common.close') }}
        </UiButton>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:visible="showDangerConfirm"
      :title="dangerActionTitle"
      :content="dangerActionContent"
      :confirmText="t('dev.confirmDangerAction')"
      :loading="processingAction !== null"
      :closeOnConfirm="false"
      danger
      @confirm="confirmDangerAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import Modal from '@/components/modals/Modal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiCard from '@/components/ui/Card.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSlider from '@/components/ui/Slider.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { debugToolsApi } from '@/features/settings/api/debugToolsApi'

const { t } = useI18n()
const message = useLauncherMessage()

const showNormalModal = ref(false)
const showFullscreenModal = ref(false)
const showNestedModal = ref(false)
const inputValue = ref('')
const showDangerConfirm = ref(false)
const pendingAction = ref<'reset' | 'plugins' | null>(null)
const processingAction = ref<'reset' | 'plugins' | null>(null)

const ANIMATION_DURATIONS: Record<string, number> = {
  '--duration-instant': 0.06,
  '--duration-fast': 0.15,
  '--duration-normal': 0.25,
  '--duration-slow': 0.35,
  '--duration-slower': 0.5,
  '--duration-slowest': 0.7,
}

const animSpeed = ref(1)

function applyAnimSpeed(speed: number): void {
  const root = document.documentElement
  if (speed === 1) {
    for (const key of Object.keys(ANIMATION_DURATIONS)) {
      root.style.removeProperty(key)
    }
    return
  }
  for (const [key, base] of Object.entries(ANIMATION_DURATIONS)) {
    root.style.setProperty(key, `${(base / speed).toFixed(3)}s`)
  }
}

watch(animSpeed, (speed) => applyAnimSpeed(speed), { immediate: true })

function resetAnimSpeed(): void {
  animSpeed.value = 1
  applyAnimSpeed(1)
}

const dangerActionTitle = computed(() =>
  pendingAction.value === 'plugins' ? t('dev.clearPluginsConfirmTitle') : t('dev.resetDataConfirmTitle')
)
const dangerActionContent = computed(() =>
  pendingAction.value === 'plugins' ? t('dev.clearPluginsConfirmContent') : t('dev.resetDataConfirmContent')
)

const showMsg = (type: 'info' | 'success' | 'warning' | 'error') => {
  const messages: Record<string, string> = {
    info: t('common.info'),
    success: t('common.success'),
    warning: t('common.warning'),
    error: t('common.error'),
  }
  message[type](messages[type] ?? '')
}

function requestDangerAction(action: 'reset' | 'plugins'): void {
  if (processingAction.value) return
  pendingAction.value = action
  showDangerConfirm.value = true
}

async function confirmDangerAction(): Promise<void> {
  const action = pendingAction.value
  if (!action || processingAction.value) return
  processingAction.value = action

  try {
    const result = action === 'reset' ? await debugToolsApi.resetLauncherData() : await debugToolsApi.clearPlugins()
    showDangerConfirm.value = false
    pendingAction.value = null
    message.success(t('dev.maintenanceScheduled', { path: result.backup_root }), 10000)
  } catch (error) {
    const detail = error instanceof Error ? error.message : t('common.error')
    message.error(t('dev.maintenanceFailed', { detail }), 10000)
  } finally {
    processingAction.value = null
  }
}
</script>

<style scoped src="@/styles/views/DevTools.css"></style>
