<template>
  <Teleport to="body">
    <!-- 最小化：可拖动的圆形按钮 -->
    <button
      v-if="terminalMode === 'minimized'"
      class="ft-dot"
      :style="buttonStyle"
      :title="floatingLabel"
      @pointerdown="startButtonDrag($event)"
      @click="onButtonClick"
    >
      <UiIcon :name="floatingIcon" :size="22" />
      <span class="ft-dot-label">{{ floatingLabel }}</span>
      <span v-if="terminalUnread > 0" class="ft-dot-badge">{{ cappedUnread }}</span>
    </button>

    <!-- 窗口化 / 最大化 -->
    <div v-else class="ft-panel" :class="{ 'ft-panel--max': terminalMode === 'maximized' }" :style="panelStyle">
      <div class="ft-titlebar" @pointerdown="onTitlebarDown">
        <div class="ft-title">
          <UiIcon name="terminal" :size="15" />
          <span>{{ t('terminal.title') }}</span>
          <span v-if="terminalMode === 'floating'" class="ft-title-live">●</span>
        </div>

        <span v-if="terminalMode === 'floating'" class="ft-title-grip" />

        <div class="ft-controls" @pointerdown.stop>
          <button class="ft-btn" :title="t('terminal.minimize')" @click="minimize">
            <UiIcon name="minimize" :size="15" />
          </button>
          <button v-if="terminalMode === 'floating'" class="ft-btn" :title="t('terminal.maximize')" @click="maximize">
            <UiIcon name="maximize" :size="14" />
          </button>
          <button v-else class="ft-btn" :title="t('terminal.restore')" @click="restoreFromMaximized">
            <UiIcon name="restore" :size="14" />
          </button>
        </div>
      </div>

      <!-- 工具条：视图切换 / 搜索 / 级别过滤 / 自动滚底 / 清屏 / 复制 -->
      <div class="ft-toolbar">
        <div class="ft-views">
          <button
            class="ft-view"
            :class="{ 'ft-view--on': terminalView === 'log' }"
            :title="t('terminal.viewLog')"
            @click="switchTerminalView('log')"
          >
            <UiIcon name="terminal" :size="14" />
            <span>{{ t('terminal.viewLog') }}</span>
          </button>
          <button
            class="ft-view"
            :class="{ 'ft-view--on': terminalView === 'instances' }"
            :title="t('terminal.viewInstances')"
            @click="switchTerminalView('instances')"
          >
            <UiIcon name="cpu" :size="14" />
            <span>{{ t('terminal.viewInstances') }}</span>
          </button>
        </div>

        <template v-if="terminalView === 'log'">
          <div class="ft-search">
            <UiIcon name="search" :size="14" class="ft-search-icon" />
            <input v-model="terminalQuery" :placeholder="t('terminal.searchPlaceholder')" class="ft-search-input" />
          </div>

          <div class="ft-levels">
            <button
              v-for="level in TERMINAL_LEVELS"
              :key="level"
              class="ft-level"
              :class="[`ft-level--${level.toLowerCase()}`, { 'ft-level--on': terminalLevelsVisible[level] }]"
              @click="toggleLevel(level)"
            >
              [{{ level }}]
            </button>
          </div>

          <div class="ft-actions">
            <button
              class="ft-btn"
              :class="{ 'ft-btn--active': autoScrollActive }"
              :title="t('terminal.autoScroll')"
              @click="toggleAutoScroll"
            >
              <UiIcon name="auto-scroll" :size="15" />
            </button>
            <button class="ft-btn" :title="t('terminal.copy')" @click="copy">
              <UiIcon name="copy" :size="15" />
            </button>
            <button class="ft-btn" :title="t('terminal.clear')" @click="clear">
              <UiIcon name="eraser" :size="15" />
            </button>
          </div>
        </template>
      </div>

      <!-- 日志 / 实例 主体 -->
      <div class="ft-viewport">
        <div v-if="terminalView === 'log'" ref="scrollEl" class="ft-body" @scroll="onScroll">
          <div v-if="terminalVisibleLogs.length === 0" class="ft-empty">
            <UiIcon name="terminal" :size="40" class="ft-empty-icon" />
            <p>{{ t('terminal.empty') }}</p>
          </div>
          <div
            v-for="(row, index) in terminalVisibleLogs"
            :key="row.time + row.lineno + index"
            class="ft-line"
            :class="`ft-line--${row.level.toLowerCase()}`"
            @dblclick="copyLine(row)"
          >
            <span class="ft-line-time">{{ row.time }}</span>
            <span class="ft-line-level">[{{ row.level }}]</span>
            <span class="ft-line-loc">{{ row.filename }}:{{ row.lineno }}</span>
            <span class="ft-line-msg">
              <template v-for="(seg, i) in highlightSegments(row.message)" :key="i">
                <mark v-if="seg.hot" class="ft-line-mark">{{ seg.text }}</mark>
                <template v-else>{{ seg.text }}</template>
              </template>
            </span>
          </div>
        </div>
        <ProcessInstanceView v-else class="ft-viewport-inner" />
      </div>

      <!-- resizer -->
      <div v-if="terminalMode === 'floating'" class="ft-resizer" @pointerdown="startResize($event)" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { terminalApi } from '@/features/terminal/api/terminalApi'
import ProcessInstanceView from '@/features/terminal/components/ProcessInstanceView.vue'
import { globalProcessInstances } from '@/features/terminal/composables/useProcessInstances'
import { TERMINAL_LEVELS, useTerminal } from '@/features/terminal/composables/useTerminal'
import type { TerminalLogEntry } from '@/types/api'

defineOptions({ name: 'FloatingTerminal' })

withDefaults(
  defineProps<{
    floatingIcon?: string
    floatingLabel?: string
  }>(),
  {
    floatingIcon: 'terminal',
    floatingLabel: '日志',
  }
)

const { t } = useI18n()
const message = useLauncherMessage()
const {
  terminalMode,
  terminalView,
  terminalLogs,
  terminalUnread,
  terminalAutoScroll,
  terminalQuery,
  terminalVisibleLogs,
  terminalLevelsVisible,
  minimize,
  maximize,
  toggleLevel,
  switchTerminalView,
  pushLog,
  clearLogs,
} = useTerminal()

// ── 窗口持久化 ────────────────────────────────────────────────────────
const STORAGE_KEY = 'ecl.terminal.window.v1'

interface WindowState {
  x: number
  y: number
  width: number
  height: number
  bx: number
  by: number
}

const DEFAULT_WINDOW: WindowState = { x: 72, y: 72, width: 660, height: 420, bx: 24, by: 24 }

const windowState = reactive<WindowState>({ ...DEFAULT_WINDOW })

function readState(): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    Object.assign(windowState, JSON.parse(raw))
  } catch {
    /* 恢复失败时沿用默认值 */
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(windowState))
  } catch {
    /* 写入失败时忽略，仅丢失记忆 */
  }
}

const viewportW = () => window.innerWidth
const viewportH = () => window.innerHeight

const panelStyle = computed(() =>
  terminalMode.value === 'maximized'
    ? {}
    : {
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
      }
)

const buttonStyle = computed(() => ({
  left: `${windowState.bx}px`,
  top: `${windowState.by}px`,
}))

const cappedUnread = computed(() => (terminalUnread.value > 99 ? '99+' : String(terminalUnread.value)))

// ── 拖动 / 缩放 ───────────────────────────────────────────────────────
let suppressClick = false

function startDrag(getPos: () => { x: number; y: number }, setPos: (x: number, y: number) => void) {
  return (event: PointerEvent) => {
    if (event.button !== 0) return
    suppressClick = false
    const startX = event.clientX
    const startY = event.clientY
    const origin = getPos()
    const onMove = (ev: PointerEvent) => {
      const minX = -40
      const minY = -40
      const nextX = clamp(origin.x + ev.clientX - startX, minX, viewportW() - 40)
      const nextY = clamp(origin.y + ev.clientY - startY, minY, viewportH() - 40)
      setPos(nextX, nextY)
      if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) suppressClick = true
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      persist()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
}

const startPanelDrag = startDrag(
  () => ({ x: windowState.x, y: windowState.y }),
  (x, y) => {
    windowState.x = x
    windowState.y = y
  }
)

const startButtonDrag = startDrag(
  () => ({ x: windowState.bx, y: windowState.by }),
  (x, y) => {
    windowState.bx = x
    windowState.by = y
  }
)

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function onTitlebarDown(event: PointerEvent): void {
  if (terminalMode.value !== 'floating') return
  startPanelDrag(event)
}

function startResize(event: PointerEvent): void {
  if (terminalMode.value !== 'floating') return
  event.stopPropagation()
  const startX = event.clientX
  const startY = event.clientY
  const originW = windowState.width
  const originH = windowState.height
  const onMove = (ev: PointerEvent) => {
    windowState.width = clamp(originW + ev.clientX - startX, 320, viewportW() - windowState.x)
    windowState.height = clamp(originH + ev.clientY - startY, 220, viewportH() - windowState.y)
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    persist()
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// ── 交互动作 ─────────────────────────────────────────────────────────
function onButtonClick(): void {
  if (suppressClick) return
  terminalMode.value = 'floating'
  terminalUnread.value = 0
}

function restoreFromMaximized(): void {
  terminalMode.value = 'floating'
}

function toggleAutoScroll(): void {
  terminalAutoScroll.value = !terminalAutoScroll.value
  if (terminalAutoScroll.value) scrollToBottom()
}

const autoScrollActive = computed(() => terminalAutoScroll.value)

function clear(): void {
  clearLogs()
}

async function copy(): Promise<void> {
  const text = buildLogText(terminalVisibleLogs.value)
  if (!text) return
  await copyText(text)
  message.success(t('terminal.copied', { count: terminalVisibleLogs.value.length }))
}

function copyLine(row: { message: string; time: string; level: string }): void {
  void copyText(`${row.time} [${row.level}] ${row.message}`)
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* 剪贴板不可用时静默失败 */
  }
}

function buildLogText(rows: { time: string; level: string; message: string }[]): string {
  return rows.map((row) => `${row.time} [${row.level}] ${row.message}`).join('\n')
}

// ── 搜索高亮 ─────────────────────────────────────────────────────────
interface HighlightSegment {
  text: string
  hot: boolean
}

function highlightSegments(text: string): HighlightSegment[] {
  const keyword = terminalQuery.value.trim()
  if (!keyword) return [{ text, hot: false }]
  const lower = text.toLowerCase()
  const needle = keyword.toLowerCase()
  const segments: HighlightSegment[] = []
  let cursor = 0
  let index = lower.indexOf(needle)
  while (index !== -1) {
    if (index > cursor) segments.push({ text: text.slice(cursor, index), hot: false })
    segments.push({ text: text.slice(index, index + keyword.length), hot: true })
    cursor = index + keyword.length
    index = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), hot: false })
  return segments
}

// ── 滚动 / 日志流 ─────────────────────────────────────────────────────
const scrollEl = ref<HTMLElement | null>(null)

function onScroll(): void {
  const el = scrollEl.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 12
  if (terminalAutoScroll.value !== atBottom) {
    if (atBottom) terminalAutoScroll.value = true
    else if (terminalAutoScroll.value) terminalAutoScroll.value = false
  }
}

function scrollToBottom(): void {
  const el = scrollEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

watch(
  () => terminalVisibleLogs.value.length,
  () => {
    if (terminalAutoScroll.value) {
      window.requestAnimationFrame(() => scrollToBottom())
    }
  }
)

// ── 生命周期 ─────────────────────────────────────────────────────────
onMounted(() => {
  readState()
  globalProcessInstances.init()
  void terminalApi
    .getLogHistory()
    .then((entries) => {
      const current = terminalLogs.value
      // 仅当缓冲为空时以历史填充，避免与已推送的实时日志重复
      if (current.length === 0) pushLogs(entries)
    })
    .catch(() => {
      /* 历史拉取失败不影响实时日志 */
    })
  offLog = backend.on('launcher:log', pushLog)
})

let offLog: (() => void) | null = null

function pushLogs(entries: TerminalLogEntry[]): void {
  for (const entry of entries) pushLog(entry)
}

onUnmounted(() => {
  if (offLog) {
    offLog()
    offLog = null
  }
  globalProcessInstances.dispose()
})
</script>

<style src="@/styles/components/panels/FloatingTerminal.css"></style>
