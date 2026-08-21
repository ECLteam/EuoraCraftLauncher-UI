<template>
  <main class="theme-studio-window">
    <header class="studio-titlebar" data-tauri-drag-region @mousedown="handleDragStart">
      <div class="studio-titlebar-brand">
        <img src="/favicon.ico" alt="" class="studio-titlebar-logo" />
        <div class="studio-titlebar-copy">
          <strong>{{ windowContext.title || 'ECL Theme Studio' }}</strong>
          <span :class="['connection-status', { 'connection-status--error': startupError }]">
            {{ startupError ? '连接失败' : connected ? '已连接' : '正在连接…' }}
          </span>
        </div>
      </div>
      <div class="studio-window-controls" data-no-drag>
        <button title="最小化" aria-label="最小化主题设计控制台" @click="minimize">
          <UiIcon name="minimize" :size="15" />
        </button>
        <button class="studio-window-close" title="关闭" aria-label="关闭主题设计控制台" @click="requestClose">
          <UiIcon name="close" :size="15" />
        </button>
      </div>
    </header>
    <section v-if="startupError" class="studio-startup-error" role="alert">
      <strong>主题设计控制台未能连接</strong>
      <p>{{ startupError }}</p>
      <button @click="initialize">重试连接</button>
    </section>
    <div v-else class="studio-content">
      <ThemeStudioPanel @discarded="close" @closeRequest="requestClose" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import backend from '@/api/client'
import { desktopWindow } from '@/app/runtime/desktopWindow'
import UiIcon from '@/components/ui/Icon.vue'
import { windowApi } from '@/features/windows/api/windowApi'
import { windowContext } from '@/features/windows/model/windowContext'
import { useThemeDesignerStore } from '../stores/themeDesignerStore'
import ThemeStudioPanel from './ThemeStudioPanel.vue'

const store = useThemeDesignerStore()
const connected = ref(false)
const startupError = ref('')
let boundsTimer: number | null = null

onMounted(() => {
  void initialize()
  window.addEventListener('resize', scheduleBoundsSave)
})
onBeforeUnmount(() => window.removeEventListener('resize', scheduleBoundsSave))

async function initialize(): Promise<void> {
  connected.value = false
  startupError.value = ''
  try {
    const ready = await backend.command('frontend_ready', {
      window_type: 'theme-studio',
      session_id: windowContext.sessionId,
    })
    if (!ready.success) throw new Error(ready.message || '子窗口 IPC 注册失败')
    if (!windowContext.sessionId) throw new Error('窗口缺少主题设计会话标识')
    await store.attach(windowContext.sessionId)
    connected.value = true
  } catch (error) {
    startupError.value = error instanceof Error ? error.message : String(error)
  }
}

function scheduleBoundsSave(): void {
  if (boundsTimer !== null) window.clearTimeout(boundsTimer)
  boundsTimer = window.setTimeout(() => {
    void windowApi
      .updateBounds(windowContext.label, {
        x: window.screenX,
        y: window.screenY,
        width: Math.max(320, window.outerWidth),
        height: Math.max(240, window.outerHeight),
      })
      .catch(() => {})
  }, 300)
}

async function close(): Promise<void> {
  try {
    await windowApi.close(windowContext.label)
  } catch {
    window.close()
  }
}

async function minimize(): Promise<void> {
  await desktopWindow.minimize()
}

function handleDragStart(event: MouseEvent): void {
  if (event.button !== 0) return
  const target = event.target as HTMLElement
  if (target.closest('[data-no-drag]')) return
  void desktopWindow.startDragging()
}

async function requestClose(): Promise<void> {
  // eslint-disable-next-line no-alert -- native child-window close confirmation
  if (store.dirty && window.confirm('保存当前主题修改？')) {
    await store.commit()
    await store.discard(false)
  } else {
    // eslint-disable-next-line no-alert -- lets the user retain the recovery checkpoint
    await store.discard(store.dirty && window.confirm('保留草稿以便下次恢复？'))
  }
  await close()
}
</script>

<style scoped>
.theme-studio-window {
  width: 100vw;
  min-width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  color: var(--ecl-text, var(--text-primary));
  background: var(--ecl-canvas, var(--bg-base, #f4f6fa));
  box-shadow: inset 0 0 0 1px var(--ecl-border, rgba(127, 127, 127, 0.25));
}
.studio-titlebar {
  position: relative;
  z-index: 10;
  display: flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ecl-border, rgba(127, 127, 127, 0.22));
  background: var(--ecl-surface, var(--bg-secondary, #fff));
  box-shadow: 0 1px 3px rgba(20, 30, 55, 0.06);
  user-select: none;
  -webkit-app-region: drag;
}
.studio-titlebar-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  padding-left: 12px;
  pointer-events: none;
}
.studio-titlebar-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.studio-titlebar-copy {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}
.studio-titlebar-copy strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.connection-status {
  color: var(--success-color, #18a058);
  font-size: 10px;
  white-space: nowrap;
}
.connection-status--error {
  color: var(--error-color, #d03050);
}
.studio-window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}
.studio-window-controls button {
  display: grid;
  width: 44px;
  height: 100%;
  place-items: center;
  border: 0;
  border-radius: 0;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
}
.studio-window-controls button:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
}
.studio-window-controls .studio-window-close:hover {
  color: #fff;
  background: #d9303e;
}
.studio-content {
  width: 100%;
  height: calc(100vh - 42px);
  overflow: hidden;
}
.studio-startup-error {
  display: grid;
  width: min(360px, calc(100% - 40px));
  margin: 52px auto 0;
  gap: 10px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--error-color, #d03050) 35%, transparent);
  border-radius: var(--ecl-radius-card, 10px);
  background: var(--ecl-surface, var(--bg-secondary, #fff));
  box-shadow: var(--ecl-shadow-surface, 0 8px 24px rgba(20, 30, 55, 0.08));
}
.studio-startup-error p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.studio-startup-error button {
  justify-self: start;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--r-sm, 6px);
  color: #fff;
  background: var(--primary, #5b6ff5);
  cursor: pointer;
}
</style>
