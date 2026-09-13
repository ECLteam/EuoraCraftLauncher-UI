<template>
  <FullscreenModal
    :visible="visible"
    :title="title"
    wrapperClass="schematic-preview-fullscreen"
    @update:visible="emit('update:visible', $event)"
    @closed="onClosed"
  >
    <section class="schematic-preview-layout">
      <header class="schematic-preview-header">
        <div>
          <strong>{{ title }}</strong
          ><span v-if="data">{{ t('schematic.size', { x: data.size[0], y: data.size[1], z: data.size[2] }) }}</span>
        </div>
        <NButton quaternary circle :title="t('common.close')" @click="emit('update:visible', false)"
          ><template #icon><UiIcon name="close" :size="18" /></template
        ></NButton>
      </header>
      <main class="schematic-preview-content">
        <NSpin :show="loading" class="schematic-preview-stage">
          <div v-if="loading" class="schematic-preview-hint">{{ loadingText }}</div>
          <div v-else-if="error" class="schematic-preview-hint schematic-error">
            <UiIcon name="warning" :size="22" />
            <p>{{ error }}</p>
            <NButton size="small" @click="load">重试</NButton>
          </div>
          <SchematicViewer3D v-else-if="data" :data="data" :assets="assets" />
        </NSpin>
        <aside v-if="data" class="schematic-preview-sidebar">
          <h4>方块材质</h4>
          <p>{{ materialCount }} 种方块 · {{ blockCount }} 个方块</p>
          <div v-if="assets?.missingBlocks.length" class="schematic-missing">
            {{ assets.missingBlocks.length }} 种方块没有可用纹理，将以回退颜色显示。
          </div>
          <div class="schematic-material-list">
            <div v-for="material in materials" :key="material.name">
              <span class="material-color" :style="{ background: material.color }" />{{ material.name
              }}<b>{{ material.count }}</b>
            </div>
          </div>
        </aside>
      </main>
    </section>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { NButton, NSpin } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import type { SchematicAssetsBundle, SchematicPreviewData } from '@/types/api'
import type { ScannedVersion } from '@/types/instances'
import { getErrorMessage } from '@/utils/error'
import SchematicViewer3D from './SchematicViewer3D.vue'

interface Props {
  visible: boolean
  version?: ScannedVersion
  resourceId?: string
  resourceName?: string
}
const props = withDefaults(defineProps<Props>(), { version: undefined, resourceId: '', resourceName: '' })
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()
const { t } = useI18n()
const message = useLauncherMessage()
const loading = ref(false)
const loadingText = ref('')
const error = ref('')
const data = ref<SchematicPreviewData | null>(null)
const assets = ref<SchematicAssetsBundle | null>(null)
const title = computed(() => props.resourceName || t('schematic.title'))
const materials = computed(() => {
  const counts = new Map<string, { name: string; count: number; color: string }>()
  for (const region of data.value?.regions ?? [])
    for (const index of region.indices) {
      const entry = region.palette[index]
      if (!entry || entry.name.endsWith(':air')) continue
      const current = counts.get(entry.name) ?? { name: entry.name, count: 0, color: `rgb(${entry.color.join(',')})` }
      current.count += 1
      counts.set(entry.name, current)
    }
  return [...counts.values()].sort((left, right) => right.count - left.count)
})
const materialCount = computed(() => materials.value.length)
const blockCount = computed(() => materials.value.reduce((total, item) => total + item.count, 0))

async function load(): Promise<void> {
  if (!props.version || !props.resourceId) return
  loading.value = true
  loadingText.value = t('schematic.loading')
  error.value = ''
  data.value = null
  assets.value = null
  try {
    const target = workspaceTarget(props.version)
    data.value = await instanceWorkspaceApi.schematicPreview(target, props.resourceId)
    loadingText.value = '正在读取游戏方块纹理…'
    const blocks = [
      ...new Set(
        data.value.regions.flatMap((region) =>
          region.palette.map((item) => item.name).filter((name) => !name.endsWith(':air'))
        )
      ),
    ]
    if (blocks.length) assets.value = await instanceWorkspaceApi.schematicAssets(target, blocks)
  } catch (cause) {
    error.value = getErrorMessage(cause, t('schematic.parseFailed'))
    message.error(error.value)
  } finally {
    loading.value = false
  }
}
watch(
  () => props.visible,
  (open) => {
    if (open) void load()
  }
)
function onClosed(): void {
  data.value = null
  assets.value = null
  error.value = ''
}
</script>

<style scoped>
.schematic-preview-layout {
  display: flex;
  height: 100%;
  flex-direction: column;
  background: var(--ecl-surface);
}
.schematic-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
}
.schematic-preview-header div {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.schematic-preview-header span,
.schematic-preview-sidebar p {
  color: var(--ecl-text-secondary);
  font-size: 12px;
}
.schematic-preview-content {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 280px;
}
.schematic-preview-stage {
  min-width: 0;
  height: 100%;
}
.schematic-preview-stage :deep(.n-spin-content) {
  height: 100%;
}
.schematic-preview-hint {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ecl-text-secondary);
}
.schematic-error {
  color: var(--error);
}
.schematic-preview-sidebar {
  overflow: auto;
  padding: 18px;
  border-left: 1px solid var(--border-color);
}
.schematic-preview-sidebar h4 {
  margin: 0;
}
.schematic-missing {
  margin: 14px 0;
  color: var(--warning);
  font-size: 12px;
}
.schematic-material-list {
  display: grid;
  gap: 4px;
}
.schematic-material-list div {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 5px;
  border-radius: 6px;
  font-size: 12px;
}
.schematic-material-list div:hover {
  background: var(--ecl-surface-hover);
}
.material-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.schematic-material-list b {
  font-variant-numeric: tabular-nums;
}
@media (max-width: 900px) {
  .schematic-preview-content {
    grid-template-columns: 1fr;
  }
  .schematic-preview-sidebar {
    display: none;
  }
}
</style>
