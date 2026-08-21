<template>
  <div
    v-if="store.isDesigning && highlight"
    class="theme-node-highlight"
    :class="{ paused: !store.isPicking }"
    :style="highlightStyle"
    aria-hidden="true"
  >
    <span>{{ highlight.label }}</span>
  </div>
  <div v-if="store.isDesigning && store.showSlots" class="theme-slot-layer" aria-hidden="true">
    <div
      v-for="marker in slotMarkers"
      :key="marker.key"
      class="theme-slot-marker"
      :class="{ occupied: marker.occupied, below: marker.labelBelow }"
      :style="marker.style"
    >
      <span>{{ marker.label }}</span>
    </div>
  </div>
  <nav v-if="store.isDesigning" class="theme-canvas-toolbar" aria-label="主题画布工具">
    <span>{{ store.isPicking ? '点选模式' : '浏览模式' }}</span>
    <button type="button" :aria-pressed="store.isPicking" @click="store.setPicking(!store.isPicking)">
      {{ store.isPicking ? '暂停点选' : '继续点选' }}
    </button>
    <button type="button" :aria-pressed="store.showSlots" @click="store.setShowSlots(!store.showSlots)">
      {{ store.showSlots ? '隐藏插槽' : '显示插槽' }}
    </button>
    <small>Esc 暂停</small>
  </nav>
  <aside v-if="store.studioEmbedded" class="embedded-studio">
    <ThemeStudioPanel @discarded="store.studioEmbedded = false" @closeRequest="closeEmbedded" />
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { pluginSlotDescriptors, usePluginSlotRegistry } from '@/features/plugins/slots/slotRegistry'
import { useThemeDesignerStore } from '../stores/themeDesignerStore'
import ThemeStudioPanel from './ThemeStudioPanel.vue'

const store = useThemeDesignerStore()
const route = useRoute()
const { registrations } = usePluginSlotRegistry()
const highlight = ref<{ top: number; left: number; width: number; height: number; label: string } | null>(null)
const slotMarkers = ref<
  Array<{
    key: string
    label: string
    occupied: boolean
    labelBelow: boolean
    style: Record<string, string>
  }>
>([])
let trackedElement: HTMLElement | null = null
let trackingFrame: number | null = null
let slotTrackingFrame: number | null = null
let slotMarkerSignature = ''
let syncedSlotInventorySignature = ''
const highlightStyle = computed(() =>
  highlight.value
    ? {
        top: `${highlight.value.top}px`,
        left: `${highlight.value.left}px`,
        width: `${highlight.value.width}px`,
        height: `${highlight.value.height}px`,
      }
    : {}
)

watch(
  () => store.showSlots,
  (visible) => {
    document.documentElement.classList.toggle('theme-slot-visualization', visible)
    if (visible) {
      void nextTick(() => {
        if (slotTrackingFrame === null) slotTrackingFrame = window.requestAnimationFrame(trackSlotMarkers)
      })
    } else {
      if (slotTrackingFrame !== null) window.cancelAnimationFrame(slotTrackingFrame)
      slotTrackingFrame = null
      slotMarkerSignature = ''
      slotMarkers.value = []
    }
  },
  { immediate: true }
)

watch(
  [
    () => store.session?.sessionId,
    () => registrations.value.map((registration) => registration.key).sort().join('|'),
  ],
  () => void nextTick(syncSlotInventory),
  { immediate: true }
)

function trackSlotMarkers(): void {
  slotTrackingFrame = null
  if (!store.isDesigning || !store.showSlots) return
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const markers = registrations.value.flatMap((registration) => {
    const element = registration.element
    if (!element.isConnected) return []
    const computedStyle = window.getComputedStyle(element)
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return []
    const rect = element.getBoundingClientRect()
    // display:none 的祖先会让所有值归零；不要把这些非活动页面/弹窗堆到左上角。
    if (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0) return []
    if (rect.bottom < 0 || rect.right < 0 || rect.top > viewportHeight || rect.left > viewportWidth) return []
    const left = Math.max(2, Math.min(rect.left, viewportWidth - 14))
    const top = Math.max(2, Math.min(rect.top, viewportHeight - 14))
    const width = Math.max(12, Math.min(rect.width, viewportWidth - left - 2))
    const height = Math.max(10, Math.min(rect.height, viewportHeight - top - 2))
    const descriptor = pluginSlotDescriptors.find((item) => item.id === registration.slotId)
    const context = registration.contextKey ? ` · ${registration.contextKey}` : ''
    return [
      {
        key: registration.key,
        label: `${descriptor?.purpose || '插件插槽'} · ${registration.slotId}${context}`,
        occupied: element.childElementCount > 0,
        labelBelow: top < 34,
        style: {
          top: `${Math.round(top * 10) / 10}px`,
          left: `${Math.round(left * 10) / 10}px`,
          width: `${Math.round(width * 10) / 10}px`,
          height: `${Math.round(height * 10) / 10}px`,
        },
      },
    ]
  })
  syncSlotInventory()
  const signature = markers
    .map(
      (marker) =>
        `${marker.key}:${marker.label}:${marker.occupied}:${marker.style.top}:${marker.style.left}:${marker.style.width}:${marker.style.height}`
    )
    .join('|')
  if (signature !== slotMarkerSignature) {
    slotMarkerSignature = signature
    slotMarkers.value = markers
  }
  slotTrackingFrame = window.requestAnimationFrame(trackSlotMarkers)
}

function syncSlotInventory(): void {
  if (!store.session) {
    syncedSlotInventorySignature = ''
    return
  }
  const slotHosts = registrations.value
    .filter((registration) => registration.element.isConnected)
    .map((registration) => ({
      slotId: registration.slotId,
      contextKey: registration.contextKey,
      occupied: registration.element.childElementCount > 0,
    }))
  const signature = `${store.session.sessionId}|${slotHosts
    .map((host) => `${host.slotId}:${host.contextKey || ''}:${host.occupied}`)
    .sort()
    .join('|')}`
  if (signature === syncedSlotInventorySignature) return
  syncedSlotInventorySignature = signature
  void store.syncSlotHosts(slotHosts)
}

function updateHighlight(element: HTMLElement): void {
  const rect = element.getBoundingClientRect()
  const canvas = element.closest('#main-content') as HTMLElement | null
  const canvasRect = canvas?.getBoundingClientRect()
  const top = canvasRect ? Math.max(rect.top, canvasRect.top) : rect.top
  const left = canvasRect ? Math.max(rect.left, canvasRect.left) : rect.left
  const right = canvasRect ? Math.min(rect.right, canvasRect.right) : rect.right
  const bottom = canvasRect ? Math.min(rect.bottom, canvasRect.bottom) : rect.bottom
  if (right <= left || bottom <= top) {
    highlight.value = null
    return
  }
  const next = {
    top,
    left,
    width: right - left,
    height: bottom - top,
    label: element.dataset.themeNode || element.dataset.themeComponent || 'theme-node',
  }
  const current = highlight.value
  if (
    !current ||
    current.label !== next.label ||
    Math.abs(current.top - next.top) > 0.1 ||
    Math.abs(current.left - next.left) > 0.1 ||
    Math.abs(current.width - next.width) > 0.1 ||
    Math.abs(current.height - next.height) > 0.1
  )
    highlight.value = next
}

function trackHighlight(): void {
  trackingFrame = null
  if (!store.isDesigning || !trackedElement?.isConnected) {
    if (!trackedElement?.isConnected) {
      trackedElement = null
      highlight.value = null
    }
    return
  }
  updateHighlight(trackedElement)
  trackingFrame = window.requestAnimationFrame(trackHighlight)
}

function selectTrackedElement(element: HTMLElement): void {
  trackedElement = element
  updateHighlight(element)
  if (trackingFrame === null) trackingFrame = window.requestAnimationFrame(trackHighlight)
}

function handlePointer(event: MouseEvent): void {
  if (
    !store.isDesigning ||
    !store.isPicking ||
    (event.target as Element).closest('.embedded-studio, .theme-canvas-toolbar')
  )
    return
  const element = (event.target as Element).closest<HTMLElement>('[data-theme-node], [data-theme-component]')
  if (!element) return
  event.preventDefault()
  event.stopPropagation()
  selectTrackedElement(element)
  const nodeId = element.dataset.themeNode || `${route.path}:${stableDomPath(element)}`
  void store.select({
    nodeId,
    page: route.path,
    componentType: element.dataset.themeComponent,
    instanceKey: element.dataset.themeInstance,
    scope: store.selected?.scope || 'node',
    path: [route.meta.title?.toString() || route.name?.toString() || route.path, nodeId],
  })
}

function handleKeyboard(event: KeyboardEvent): void {
  if (event.key === 'Escape' && store.isPicking) store.setPicking(false)
}

function stableDomPath(element: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = element
  while (current && current.id !== 'main-content' && parts.length < 6) {
    const parent: HTMLElement | null = current.parentElement
    const siblings = parent ? Array.from(parent.children).filter((item) => item.tagName === current!.tagName) : []
    const index = Math.max(0, siblings.indexOf(current)) + 1
    parts.unshift(`${current.dataset.themeComponent || current.tagName.toLowerCase()}:nth-${index}`)
    current = parent
  }
  return parts.join('/')
}

async function closeEmbedded(): Promise<void> {
  // eslint-disable-next-line no-alert -- mirrors native close confirmation
  if (store.dirty && window.confirm('保存当前主题修改？')) {
    await store.commit()
    await store.discard(false)
  } else {
    // eslint-disable-next-line no-alert -- lets the user retain the recovery checkpoint
    await store.discard(store.dirty && window.confirm('保留草稿以便下次恢复？'))
  }
  store.studioEmbedded = false
}

onMounted(() => {
  document.addEventListener('click', handlePointer, true)
  document.addEventListener('keydown', handleKeyboard, true)
  syncSlotInventory()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handlePointer, true)
  document.removeEventListener('keydown', handleKeyboard, true)
  document.documentElement.classList.remove('theme-slot-visualization')
  if (trackingFrame !== null) window.cancelAnimationFrame(trackingFrame)
  if (slotTrackingFrame !== null) window.cancelAnimationFrame(slotTrackingFrame)
  trackingFrame = null
  slotTrackingFrame = null
  trackedElement = null
})
</script>

<style scoped>
.theme-node-highlight {
  position: fixed;
  z-index: 900;
  border: 2px solid var(--primary);
  border-radius: 5px;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent);
  pointer-events: none;
  will-change: top, left, width, height;
  transition: opacity 0.12s ease;
}
.theme-node-highlight.paused {
  opacity: 0.45;
}
.theme-node-highlight span {
  position: absolute;
  top: 2px;
  left: 2px;
  max-width: 260px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  background: var(--primary);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.theme-slot-layer {
  position: fixed;
  z-index: 880;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.theme-slot-marker {
  position: fixed;
  border: 1px dashed color-mix(in srgb, var(--primary) 78%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--primary) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 10%, transparent);
}
.theme-slot-marker.occupied {
  border-style: solid;
  background: color-mix(in srgb, var(--success, #18a058) 9%, transparent);
}
.theme-slot-marker span {
  position: absolute;
  bottom: calc(100% + 3px);
  left: -1px;
  max-width: min(340px, calc(100vw - 8px));
  overflow: hidden;
  padding: 3px 6px;
  border: 1px solid color-mix(in srgb, var(--primary) 65%, transparent);
  border-radius: 4px;
  color: #fff;
  background: color-mix(in srgb, var(--primary) 92%, #27305d);
  box-shadow: 0 3px 9px rgba(20, 30, 55, 0.16);
  font: 10px/1.35 var(--font-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.theme-slot-marker.below span {
  top: calc(100% + 3px);
  bottom: auto;
}
.theme-slot-marker.occupied span {
  border-color: color-mix(in srgb, var(--success, #18a058) 70%, transparent);
  background: color-mix(in srgb, var(--success, #18a058) 90%, #164d37);
}
.embedded-studio {
  position: fixed;
  z-index: 1200;
  top: var(--titlebar-h);
  right: 0;
  bottom: 0;
  width: min(460px, 92vw);
  border-left: 1px solid var(--border-color);
  box-shadow: -16px 0 40px rgba(0, 0, 0, 0.18);
  overflow: auto;
}
.theme-canvas-toolbar {
  position: fixed;
  z-index: 1100;
  left: calc(var(--sidebar-w, 76px) + 14px);
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
  border: 1px solid color-mix(in srgb, var(--primary) 45%, var(--border-color));
  border-radius: var(--r-md, 10px);
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}
.theme-canvas-toolbar span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 650;
}
.theme-canvas-toolbar button {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--r-sm);
  color: inherit;
  background: var(--bg-surface);
  cursor: pointer;
}
.theme-canvas-toolbar small {
  color: var(--text-secondary);
}
@media (prefers-reduced-motion: reduce) {
  .theme-node-highlight {
    transition: none;
  }
}
</style>
