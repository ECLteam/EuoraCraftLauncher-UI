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

    <!-- 调试工具 -->
    <section class="section">
      <div class="section-heading">
        <h2>{{ t('dev.debugTools') }}</h2>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !debugMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.webviewDevtools') }}</div>
            <span class="mode-badge mode-badge--debug">{{ t('dev.modeDebug') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.webviewDevtoolsDesc') }}</div>
        </div>
        <div class="tool-control">
          <UiButton size="sm" variant="outline" :disabled="!debugMode" :loading="devtoolsLoading" @click="openWebviewDevTools">
            {{ t('dev.openWebviewDevtools') }}
          </UiButton>
        </div>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !devMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.vueDevtools') }}</div>
            <span class="mode-badge mode-badge--dev">{{ t('dev.modeDev') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.vueDevtoolsDesc') }}</div>
        </div>
        <div class="tool-control">
          <UiButton size="sm" variant="outline" :disabled="!devMode || !vueDevtoolsAvailable" @click="toggleVueDevTools">
            {{ vueDevtoolsOpen ? t('dev.closeVueDevtools') : t('dev.openVueDevtools') }}
          </UiButton>
        </div>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !debugMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.animationSpeed') }}</div>
            <span class="mode-badge mode-badge--debug">{{ t('dev.modeDebug') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.animationSpeedDesc') }}</div>
        </div>
        <div class="tool-control">
          <UiSlider v-model="animSpeed" :min="0.25" :max="2" :step="0.05" suffix="×" :disabled="!debugMode" />
          <UiButton size="sm" variant="outline" :disabled="!debugMode || animSpeed === 1" @click="resetAnimSpeed">
            {{ t('common.reset') }}
          </UiButton>
        </div>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !debugMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.flowDebug') }}</div>
            <span class="mode-badge mode-badge--debug">{{ t('dev.modeDebug') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.flowDebugDesc') }}</div>
        </div>
        <div class="tool-control">
          <NSwitch :value="flowDebug" :disabled="!debugMode" @update:value="handleFlowDebugChange" />
        </div>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !debugMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.showContainerBoundaries') }}</div>
            <span class="mode-badge mode-badge--debug">{{ t('dev.modeDebug') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.showContainerBoundariesDesc') }}</div>
        </div>
        <div class="tool-control">
          <NSwitch :value="showContainerBoundaries" :disabled="!debugMode" @update:value="toggleContainerBoundaries" />
        </div>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !debugMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.disableAnimations') }}</div>
            <span class="mode-badge mode-badge--debug">{{ t('dev.modeDebug') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.disableAnimationsDesc') }}</div>
        </div>
        <div class="tool-control">
          <NSwitch :value="animationsDisabled" :disabled="!debugMode" @update:value="toggleAnimations" />
        </div>
      </div>

      <div class="tool-row" :class="{ 'tool-row--disabled': !debugMode }">
        <div class="tool-info">
          <div class="tool-label-row">
            <div class="tool-label">{{ t('dev.clearCaches') }}</div>
            <span class="mode-badge mode-badge--debug">{{ t('dev.modeDebug') }}</span>
          </div>
          <div class="tool-desc">{{ t('dev.clearCachesDesc') }}</div>
        </div>
        <div class="tool-control">
          <UiButton size="sm" variant="outline" :disabled="!debugMode" :loading="clearingCaches" @click="clearAllCaches">
            {{ t('dev.clearCaches') }}
          </UiButton>
        </div>
      </div>
    </section>

    <!-- 组件调试 -->
    <section class="section">
      <div class="section-heading">
        <h2>{{ t('dev.componentDebug') }}</h2>
        <span class="mode-badge mode-badge--dev">{{ t('dev.modeDev') }}</span>
      </div>
      <p class="section-desc">{{ t('dev.componentDebugDesc') }}</p>

      <div class="component-inspector">
        <div class="inspector-block">
          <div class="inspector-title">
            {{ t('dev.routeInfo') }}
          </div>
          <div class="inspector-grid">
            <div class="inspector-item">
              <span class="inspector-label">Path</span>
              <code>{{ routeInfo.path }}</code>
            </div>
            <div class="inspector-item">
              <span class="inspector-label">Name</span>
              <code>{{ routeInfo.name }}</code>
            </div>
            <div class="inspector-item">
              <span class="inspector-label">Query</span>
              <code>{{ routeInfo.query }}</code>
            </div>
            <div class="inspector-item">
              <span class="inspector-label">Params</span>
              <code>{{ routeInfo.params }}</code>
            </div>
          </div>
        </div>

        <div class="inspector-block">
          <div class="inspector-title">
            {{ t('dev.piniaStores') }}
            <span class="inspector-count">{{ piniaStores.length }}</span>
          </div>
          <div class="tag-list">
            <span v-for="s in piniaStores" :key="s" class="tag-chip">{{ s }}</span>
            <span v-if="!piniaStores.length" class="inspector-empty">{{ t('dev.empty') }}</span>
          </div>
        </div>

        <div class="inspector-block">
          <div class="inspector-title">
            {{ t('dev.mountedComponents') }}
            <span class="inspector-count">{{ devMode ? mountedComponents.length : '-' }}</span>
            <UiButton size="sm" variant="text" :disabled="!devMode" @click="refreshComponents">
              {{ t('common.refresh') }}
            </UiButton>
          </div>
          <div v-if="devMode" class="tag-list">
            <span v-for="c in mountedComponents" :key="c" class="tag-chip">{{ c }}</span>
            <span v-if="!mountedComponents.length" class="inspector-empty">{{ t('dev.empty') }}</span>
          </div>
          <p v-else class="inspector-empty">{{ t('dev.devOnlyHint') }}</p>
        </div>
      </div>
    </section>

    <!-- 组件库测试 -->
    <section class="section">
      <div class="section-heading">
        <h2>{{ t('dev.libTest') }}</h2>
        <span class="debug-only-badge">{{ t('dev.debugOnly') }}</span>
      </div>

      <div class="sub-section">
        <h3>{{ t('dev.button') }}</h3>
        <div class="btn-group">
          <UiButton variant="primary"> Primary </UiButton>
          <UiButton variant="secondary"> Secondary </UiButton>
          <UiButton variant="outline"> Outline </UiButton>
          <UiButton variant="text"> Text </UiButton>
          <UiButton :loading="true"> Loading </UiButton>
          <UiButton :disabled="true"> Disabled </UiButton>
        </div>
      </div>

      <div class="sub-section">
        <h3>{{ t('dev.input') }}</h3>
        <div class="input-group">
          <UiInput v-model="inputValue" :placeholder="t('dev.normalInput')" />
          <UiInput v-model="inputValue" :placeholder="t('dev.withIcon')" icon="icon-search" />
          <UiInput v-model="inputValue" :placeholder="t('dev.clearable')" clearable />
          <UiInput v-model="inputValue" :placeholder="t('dev.password')" type="password" />
        </div>
      </div>

      <div class="sub-section">
        <h3>{{ t('dev.card') }}</h3>
        <div class="card-group">
          <UiCard :title="t('dev.normalCard')" icon="icon-cube">
            {{ t('dev.cardContent') }}
          </UiCard>
          <UiCard :title="t('dev.noIcon')">
            {{ t('dev.noIconCard') }}
          </UiCard>
        </div>
      </div>

      <div class="sub-section">
        <h3>{{ t('dev.modal') }}</h3>
        <div class="btn-group">
          <UiButton @click="showNormalModal = true">
            {{ t('dev.normalModal') }}
          </UiButton>
          <UiButton @click="showFullscreenModal = true">
            {{ t('dev.fullscreenModal') }}
          </UiButton>
        </div>
      </div>

      <div class="sub-section">
        <h3>{{ t('dev.message') }}</h3>
        <div class="btn-group">
          <UiButton @click="showMsg('info')"> Info </UiButton>
          <UiButton @click="showMsg('success')"> Success </UiButton>
          <UiButton @click="showMsg('warning')"> Warning </UiButton>
          <UiButton @click="showMsg('error')"> Error </UiButton>
        </div>
      </div>
    </section>

    <!-- 危险区 -->
    <section class="section danger-section">
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
    </section>

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
import { NSwitch } from 'naive-ui'
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { pinia } from '@/app/stores'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import Modal from '@/components/modals/Modal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiCard from '@/components/ui/Card.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSlider from '@/components/ui/Slider.vue'
import { useFlowDebug } from '@/composables/useFlowDebug'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { debugToolsApi } from '@/features/settings/api/debugToolsApi'

const { t } = useI18n()
const message = useLauncherMessage()
const route = useRoute()

// 调试页入口仅在启动器开启调试模式（launcher.debug）时可见，这里读取同一状态
const injectedDebugMode = inject<Readonly<Ref<boolean>>>('devMode')
const debugMode = computed(() => injectedDebugMode?.value ?? false)
// 开发模式指 Vite 开发构建（pnpm dev），控制 Vue DevTools 面板与组件收集是否可用
const devMode = import.meta.env.DEV

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

const { flowDebug, setFlowDebug } = useFlowDebug()

function handleFlowDebugChange(value: boolean): void {
  void setFlowDebug(value).catch(() => {})
}

// ── 显示容器边界：给所有元素叠加调试轮廓，便于观察布局层级 ──────────
const DEBUG_OUTLINE_CLASS = 'dev-show-outlines'
const showContainerBoundaries = ref(false)

function toggleContainerBoundaries(value: boolean): void {
  showContainerBoundaries.value = value
  document.documentElement.classList.toggle(DEBUG_OUTLINE_CLASS, value)
}

// ── 禁用所有动画：关闭全局动画与过渡，便于静止截图与定位布局 ────────
const DEBUG_NO_ANIMATION_CLASS = 'dev-no-animation'
const animationsDisabled = ref(false)

function toggleAnimations(value: boolean): void {
  animationsDisabled.value = value
  document.documentElement.classList.toggle(DEBUG_NO_ANIMATION_CLASS, value)
}

// ── 清除所有缓存：清空浏览器 Cache Storage，可能需刷新页面观察变化 ──
const clearingCaches = ref(false)

async function clearAllCaches(): Promise<void> {
  clearingCaches.value = true
  try {
    let cleared = 0
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      cleared = keys.length
    }
    message.success(t('dev.cachesCleared', { count: cleared }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('dev.clearCachesFailed'))
  } finally {
    clearingCaches.value = false
  }
}

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

// ── 网页 F12 调试窗口 ──────────────────────────────────────────────
const devtoolsLoading = ref(false)

async function openWebviewDevTools(): Promise<void> {
  devtoolsLoading.value = true
  try {
    await debugToolsApi.openDevTools()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('dev.toggleFailed'))
  } finally {
    devtoolsLoading.value = false
  }
}

// ── Vue DevTools 面板 ─────────────────────────────────────────────
const VUE_DEVTOOLS_FRAME_STATE_KEY = '__vue-devtools-frame-state__'
const vueDevtoolsAvailable = computed(
  () => devMode && typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).__VUE_DEVTOOLS_GLOBAL_HOOK__
)

const vueDevtoolsOpen = ref(false)

function readVueDevToolsOpen(): boolean {
  try {
    const raw = window.localStorage.getItem(VUE_DEVTOOLS_FRAME_STATE_KEY)
    return raw ? !!JSON.parse(raw).open : false
  } catch {
    return false
  }
}

function setVueDevToolsOpen(open: boolean): void {
  try {
    const raw = window.localStorage.getItem(VUE_DEVTOOLS_FRAME_STATE_KEY)
    const state = raw ? JSON.parse(raw) : {}
    state.open = open
    if (open) state.isFirstVisit = false
    const next = JSON.stringify(state)
    window.localStorage.setItem(VUE_DEVTOOLS_FRAME_STATE_KEY, next)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: VUE_DEVTOOLS_FRAME_STATE_KEY,
        newValue: next,
        oldValue: raw,
        storageArea: window.localStorage,
      })
    )
    vueDevtoolsOpen.value = open
  } catch {
    /* 非开发模式状态不可用时忽略 */
  }
}

function toggleVueDevTools(): void {
  if (!devMode) {
    message.warning(t('dev.vueDevtoolsNeedDev'))
    return
  }
  setVueDevToolsOpen(!vueDevtoolsOpen.value)
}

// ── 组件检查面板 ───────────────────────────────────────────────────
const routeInfo = computed(() => ({
  path: route.path,
  name: String(route.name ?? '-'),
  query: JSON.stringify(route.query),
  params: JSON.stringify(route.params),
}))

const piniaStores = computed(() => Array.from((pinia._s as Map<string, unknown>).keys()))

const mountedComponents = ref<string[]>([])

function collectMountedComponents(): string[] {
  const names = new Set<string>()
  const root = document.getElementById('app')
  if (!root) return []
  root.querySelectorAll('*').forEach((el) => {
    const parentComponent = (el as unknown as { __vueParentComponent?: { type?: { __name?: string; name?: string } } })
      .__vueParentComponent
    const compName = parentComponent?.type?.__name || parentComponent?.type?.name
    if (compName) names.add(compName)
  })
  return Array.from(names).sort()
}

function refreshComponents(): void {
  mountedComponents.value = devMode ? collectMountedComponents() : []
}

onMounted(() => {
  refreshComponents()
  if (devMode) vueDevtoolsOpen.value = readVueDevToolsOpen()
})

// ── 危险操作 ───────────────────────────────────────────────────────
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