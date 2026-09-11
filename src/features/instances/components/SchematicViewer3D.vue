<template>
  <div ref="shellRef" class="schematic-viewer-shell">
    <canvas
      ref="canvasRef"
      class="schematic-viewer-canvas"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    />
    <div v-if="noBlocks" class="schematic-viewer-empty">{{ t('schematic.empty') }}</div>
    <div v-if="!noBlocks" class="schematic-viewer-info">
      {{ t('schematic.size', { x: size[0], y: size[1], z: size[2] }) }}
    </div>
    <div v-if="!noBlocks" class="schematic-viewer-toolbar">
      <NButtonGroup size="small">
        <NButton
          quaternary
          :title="t('schematic.rotateLeft')"
          data-testid="schematic-rotate-left"
          @click="rotateModel(-1)"
        >
          <template #icon><UiIcon name="rotate-left" :size="17" /></template>
        </NButton>
        <NButton
          quaternary
          :title="t('schematic.rotateRight')"
          data-testid="schematic-rotate-right"
          @click="rotateModel(1)"
        >
          <template #icon><UiIcon name="rotate-right" :size="17" /></template>
        </NButton>
        <NButton quaternary :title="t('schematic.zoomIn')" data-testid="schematic-zoom-in" @click="zoomModel(1)">
          <template #icon><UiIcon name="plus" :size="16" /></template>
        </NButton>
        <NButton quaternary :title="t('schematic.zoomOut')" data-testid="schematic-zoom-out" @click="zoomModel(-1)">
          <template #icon><UiIcon name="minus" :size="16" /></template>
        </NButton>
        <NButton quaternary :title="t('schematic.resetView')" data-testid="schematic-reset-view" @click="resetView">
          <template #icon><UiIcon name="refresh" :size="16" /></template>
        </NButton>
      </NButtonGroup>
      <div class="slice-control">
        <span class="slice-label">{{ t('schematic.sliceY') }}</span>
        <NSlider
          v-model:value="visibleLayers"
          class="slice-slider"
          size="small"
          :min="1"
          :max="Math.max(1, size[1] ?? 1)"
          :tooltip="false"
          data-testid="schematic-slice"
        />
        <NButton
          quaternary
          circle
          size="tiny"
          :title="t('schematic.showAll')"
          data-testid="schematic-show-all"
          @click="showAll"
        >
          <template #icon><UiIcon name="layers" :size="15" /></template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NButtonGroup, NSlider } from 'naive-ui'
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import type { SchematicPreviewData } from '@/types/api'

const props = defineProps<{ data: SchematicPreviewData }>()

const { t } = useI18n()
const shellRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const size = ref(props.data.size)
const visibleLayers = ref(Math.max(1, props.data.size[1] ?? 1))
const noBlocks = ref(false)
const scaleFactor = ref(1)

// 组件卸载后标记过期，阻止周期回调对已释放资源的访问。
let disposed = false
let voxels: Array<{ position: Vector3; color: Color }> = []
let renderer: WebGLRenderer | null = null
let camera: PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let scene: Scene | null = null
let root: Group | null = null
let mesh: InstancedMesh | null = null
let raycaster: Raycaster | null = null
const pointer = new Vector2()
let hovered = -1
let frame = 0
let resizeObserver: ResizeObserver | null = null
let cameraDistance = 10
const half = new Vector3()

/** 将区域内方块索引解码为 (位置, 颜色) 列表，索引 0 代表空气块，跳过不渲染。 */
function decodeVoxels(): Array<{ position: Vector3; color: Color }> {
  const out: Array<{ position: Vector3; color: Color }> = []
  for (const region of props.data.regions) {
    const sx = region.size[0] ?? 0
    const sz = region.size[2] ?? 0
    const px = region.position[0] ?? 0
    const py = region.position[1] ?? 0
    const pz = region.position[2] ?? 0
    for (let i = 0; i < region.indices.length; i += 1) {
      const paletteIndex = region.indices[i]
      if (paletteIndex === undefined || paletteIndex === 0) continue
      const rgb = region.palette[paletteIndex]
      if (!rgb) continue
      const r = rgb[0] ?? 0
      const g = rgb[1] ?? 0
      const b = rgb[2] ?? 0
      // 轴向顺序：x 快变、z 居中、y 最慢，与后端 litematic/schem 解码一致。
      const x = i % sx
      const rem = Math.floor(i / sx)
      const z = rem % sz
      const y = Math.floor(rem / sz)
      out.push({
        position: new Vector3(x + px, y + py, z + pz),
        color: new Color(r / 255, g / 255, b / 255),
      })
    }
  }
  return out
}

/** 重建可见层以下体素网格。 */
function rebuildScene(): void {
  if (!scene || !root) return
  if (mesh) {
    root.remove(mesh)
    mesh.geometry.dispose()
    const material = mesh.material
    if (!Array.isArray(material)) material.dispose()
    mesh = null
  }
  const visible = disposed ? [] : voxels.filter((v) => v.position.y < visibleLayers.value)
  if (!visible.length) {
    noBlocks.value = true
    return
  }
  noBlocks.value = false
  const geometry = new BoxGeometry(1, 1, 1)
  const material = new MeshStandardMaterial({ roughness: 0.9, metalness: 0 })
  mesh = new InstancedMesh(geometry, material, visible.length)
  const matrix = new Matrix4()
  const gap = 0.06
  visible.forEach((voxel, index) => {
    matrix.makeTranslation(voxel.position.x - half.x, voxel.position.y - half.y, voxel.position.z - half.z)
    matrix.scale(new Vector3(1 - gap, 1 - gap, 1 - gap))
    mesh!.setMatrixAt(index, matrix)
    mesh!.setColorAt(index, voxel.color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  root.add(mesh)
  mesh.scale.setScalar(scaleFactor.value)
}

function fitCamera(): void {
  if (!camera || !controls) return
  const extent = Math.max(...size.value) || 16
  cameraDistance = extent * 2.2
  camera.position.set(cameraDistance, cameraDistance * 0.7, cameraDistance)
  camera.near = cameraDistance / 200
  camera.far = cameraDistance * 200
  controls.target.set(0, 0, 0)
  controls.update()
}

function resize(): void {
  const element = shellRef.value
  const canvas = canvasRef.value
  if (!element || !canvas || !renderer || !camera) return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  renderer.setSize(rect.width, rect.height)
  camera.aspect = rect.width / rect.height
  camera.updateProjectionMatrix()
}

function animate(): void {
  if (disposed) return
  frame = requestAnimationFrame(animate)
  controls?.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function rotateModel(direction: -1 | 1): void {
  if (!root) return
  root.rotation.y += direction * (Math.PI / 8)
}

function zoomModel(direction: 1 | -1): void {
  if (!camera) return
  const factor = direction > 0 ? 1 / 1.15 : 1.15
  cameraDistance *= factor
  cameraDistance = Math.min(Math.max(cameraDistance, 2), 1000)
  camera.position.multiplyScalar(factor)
}

function resetView(): void {
  if (!camera) return
  fitCamera()
  if (root) root.rotation.set(0, 0, 0)
  scaleFactor.value = 1
  if (mesh) mesh.scale.setScalar(1)
}

function showAll(): void {
  visibleLayers.value = Math.max(1, size.value[1] ?? 1)
}

function onPointerMove(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!camera || !mesh || !canvas || !raycaster) return
  const bounds = canvas.getBoundingClientRect()
  if (!bounds.width || !bounds.height) return
  pointer.set(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1
  )
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObject(mesh)
  const hit = hits[0]
  const next = hit ? (hit.instanceId ?? -1) : -1
  if (next !== hovered) {
    clearHover()
    hovered = next
    if (hovered >= 0) {
      const color = voxelsVisible[hovered]?.color
      if (color && mesh.instanceColor) {
        const bright = new Color(Math.min(1, color.r * 1.4), Math.min(1, color.g * 1.4), Math.min(1, color.b * 1.4))
        mesh.setColorAt(hovered, bright)
        mesh.instanceColor.needsUpdate = true
      }
    }
  }
}

function onPointerLeave(): void {
  clearHover()
}

function clearHover(): void {
  if (hovered < 0 || !mesh) return
  const base = voxelsVisible[hovered]?.color
  if (base) {
    mesh.setColorAt(hovered, base)
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }
  hovered = -1
}

let voxelsVisible: Array<{ position: Vector3; color: Color }> = []

watch(visibleLayers, () => {
  voxelsVisible = voxels.filter((v) => v.position.y < visibleLayers.value)
  clearHover()
  rebuildScene()
})

function initScene(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  scene = new Scene()
  camera = new PerspectiveCamera(50, 1, 0.1, 2000)
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000, 0)

  const hemi = new DirectionalLight(0xffffff, 0.8)
  const front = new DirectionalLight(0xffffff, 0.6)
  const key = new DirectionalLight(0xffffff, 0.3)
  scene.add(hemi)
  front.position.set(1, 1.5, 1)
  scene.add(front)
  key.position.set(-1.5, 0.5, -1.5)
  scene.add(key)

  root = new Group()
  scene.add(root)
  controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  raycaster = new Raycaster()

  half.set((size.value[0] ?? 0) / 2, ((size.value[1] ?? 0) - 1) / 2, (size.value[2] ?? 0) / 2)
  voxels = decodeVoxels()
  voxelsVisible = voxels
  fitCamera()
  rebuildScene()
  resize()
  animate()
}

onMounted(() => {
  disposed = false
  initScene()
  resizeObserver = new ResizeObserver(resize)
  if (shellRef.value) resizeObserver.observe(shellRef.value)
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
})
</script>

<style scoped>
.schematic-viewer-shell {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  border-radius: var(--r-lg, 12px);
  background: var(--ecl-surface);
}

.schematic-viewer-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.schematic-viewer-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--ecl-text-secondary, #999);
  font-size: 13px;
}

.schematic-viewer-info {
  position: absolute;
  top: var(--s-md, 12px);
  left: var(--s-md, 12px);
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--border-color, #333) 75%, transparent);
  border-radius: var(--r-md, 8px);
  background: var(--ecl-surface, rgba(20, 20, 24, 0.8));
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.3));
  color: var(--ecl-text-secondary, #999);
  font-size: 11px;
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.schematic-viewer-toolbar {
  position: absolute;
  right: var(--s-md, 12px);
  bottom: var(--s-md, 12px);
  left: var(--s-md, 12px);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 4px 6px;
  border: 1px solid color-mix(in srgb, var(--border-color, #333) 75%, transparent);
  border-radius: var(--r-lg, 12px);
  background: var(--ecl-surface, rgba(20, 20, 24, 0.8));
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
  backdrop-filter: blur(10px);
}

.slice-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 180px;
}

.slice-label {
  flex-shrink: 0;
  color: var(--ecl-text-secondary, #999);
  font-size: 12px;
}

.slice-slider {
  flex: 1;
  min-width: 80px;
}
</style>
