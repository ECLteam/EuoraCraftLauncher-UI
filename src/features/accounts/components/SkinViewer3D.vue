<template>
  <div ref="containerRef" class="skin-viewer-shell">
    <canvas ref="canvasRef" class="skin-viewer-canvas" />
    <div v-if="error" class="skin-viewer-error">{{ error }}</div>
    <NButtonGroup class="skin-viewer-controls" size="small">
      <NButton quaternary :title="t('wardrobe.rotateLeft')" data-testid="rotate-left" @click="rotatePlayer(-1)">
        <template #icon><UiIcon name="rotate-left" :size="17" /></template>
      </NButton>
      <NButton
        quaternary
        :title="autoRotateEnabled ? t('wardrobe.pauseAutoRotate') : t('wardrobe.resumeAutoRotate')"
        data-testid="toggle-auto-rotate"
        @click="toggleAutoRotate"
      >
        <template #icon><UiIcon :name="autoRotateEnabled ? 'pause' : 'play'" :size="17" /></template>
      </NButton>
      <NButton quaternary :title="t('wardrobe.rotateRight')" data-testid="rotate-right" @click="rotatePlayer(1)">
        <template #icon><UiIcon name="rotate-right" :size="17" /></template>
      </NButton>
    </NButtonGroup>
  </div>
</template>

<script setup lang="ts">
import { NButton, NButtonGroup } from 'naive-ui'
import { SkinViewer } from 'skinview3d'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import type { SkinModel } from '@/types/api'

const props = withDefaults(
  defineProps<{
    skinUrl?: string
    capeUrl?: string
    model?: SkinModel
  }>(),
  { skinUrl: '', capeUrl: '', model: 'classic' }
)

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const error = ref('')
const autoRotateEnabled = ref(false)
const { t } = useI18n()
let viewer: SkinViewer | null = null
let resizeObserver: ResizeObserver | null = null

function rotatePlayer(direction: -1 | 1): void {
  if (!viewer) return
  viewer.playerObject.rotation.y += direction * (Math.PI / 8)
}

function toggleAutoRotate(): void {
  if (!viewer) return
  autoRotateEnabled.value = !autoRotateEnabled.value
  viewer.autoRotate = autoRotateEnabled.value
}

function resizeViewer(): void {
  if (!viewer || !containerRef.value) return
  viewer.width = Math.max(260, containerRef.value.clientWidth)
  viewer.height = Math.max(360, containerRef.value.clientHeight)
}

async function loadSkin(): Promise<void> {
  if (!viewer) return
  error.value = ''
  try {
    if (!props.skinUrl) {
      viewer.resetSkin()
      return
    }
    await viewer.loadSkin(props.skinUrl, { model: props.model === 'slim' ? 'slim' : 'default' })
  } catch {
    error.value = '皮肤纹理加载失败'
    viewer.resetSkin()
  }
}

async function loadCape(): Promise<void> {
  if (!viewer) return
  try {
    if (!props.capeUrl) {
      viewer.resetCape()
      return
    }
    await viewer.loadCape(props.capeUrl)
  } catch {
    error.value = error.value || '披风纹理加载失败'
    viewer.resetCape()
  }
}

onMounted(async () => {
  await nextTick()
  if (!canvasRef.value) return
  try {
    viewer = new SkinViewer({ canvas: canvasRef.value, width: 360, height: 520, zoom: 0.78 })
    autoRotateEnabled.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    viewer.autoRotate = autoRotateEnabled.value
    viewer.autoRotateSpeed = 0.5
    resizeObserver = new ResizeObserver(resizeViewer)
    if (containerRef.value) resizeObserver.observe(containerRef.value)
    resizeViewer()
    await Promise.all([loadSkin(), loadCape()])
  } catch {
    error.value = '当前设备无法初始化 3D 皮肤预览'
  }
})

watch(() => [props.skinUrl, props.model], loadSkin)
watch(() => props.capeUrl, loadCape)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  // skinview3d 持有 WebGL 纹理和动画帧，组件退出时必须显式释放。
  viewer?.dispose()
  viewer = null
})
</script>

<style scoped>
.skin-viewer-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  border-radius: var(--r-lg);
  background: color-mix(in srgb, var(--bg-card) 82%, transparent);
}

.skin-viewer-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.skin-viewer-error {
  position: absolute;
  inset: auto var(--s-md) var(--s-md);
  padding: var(--s-sm) var(--s-md);
  border-radius: var(--r-md);
  color: var(--error-color);
  background: color-mix(in srgb, var(--bg-card) 92%, transparent);
  text-align: center;
}

.skin-viewer-controls {
  position: absolute;
  right: var(--s-md);
  bottom: var(--s-md);
  z-index: 1;
  padding: 2px;
  border: 1px solid color-mix(in srgb, var(--border-color) 75%, transparent);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--bg-card) 88%, transparent);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}
</style>
