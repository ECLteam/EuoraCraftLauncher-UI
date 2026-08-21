<template>
  <div class="preset-library" data-theme-component="preset-library" data-theme-node="settings.theme-library">
    <div class="preset-toolbar">
      <NButton size="small" @click="importPreset">导入 .ecltheme</NButton>
      <span>支持 PNG、WebP、安全 SVG 与 WOFF2 资源</span>
    </div>
    <div class="preset-grid">
      <article v-for="preset in presets" :key="preset.id" :class="['preset-item', { active: preset.id === activeId }]">
        <div class="preset-swatch" :style="{ background: previewColor(preset.id) }" />
        <div class="preset-info">
          <strong>{{ preset.name }}</strong>
          <small>{{ preset.author || preset.source }} · {{ preset.id }}</small>
        </div>
        <NButton v-if="preset.id !== activeId" size="tiny" @click="activate(preset.id)">应用</NButton>
        <span v-else class="active-label">使用中</span>
        <NButton size="tiny" @click="exportPreset(preset.id)">导出</NButton>
        <NButton
          v-if="!preset.readonly && preset.id !== activeId"
          size="tiny"
          quaternary
          type="error"
          @click="remove(preset.id)"
          >删除</NButton
        >
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import backend from '@/api/client'
import type { ThemePresetSummary } from '@/types/api'
import { themeApi } from '../api/themeApi'
import { useThemeDesignerStore } from '../stores/themeDesignerStore'

const designer = useThemeDesignerStore()
const presets = ref<ThemePresetSummary[]>([])
const swatches = ref<Record<string, string>>({})
const activeId = computed(() => designer.activePreset?.id)

async function refresh(): Promise<void> {
  presets.value = await themeApi.list()
  for (const summary of presets.value) {
    try {
      const response = await backend.command('theme_get', { preset_id: summary.id })
      if (response.success && response.data && typeof response.data.tokens.primary === 'string')
        swatches.value[summary.id] = response.data.tokens.primary
    } catch {
      /* 单个插件主题失效不阻塞主题库 */
    }
  }
}
function previewColor(id: string): string {
  return swatches.value[id] || 'var(--primary)'
}
async function activate(id: string): Promise<void> {
  designer.activePreset = await themeApi.activate(id)
  await designer.initialize()
}
async function importPreset(): Promise<void> {
  const selection = await backend.command('select_file', { purpose: 'theme-preset' })
  const path = selection.success ? selection.data?.path : null
  if (!path) return
  await themeApi.import(path)
  await refresh()
}
async function exportPreset(id: string): Promise<void> {
  const selection = await backend.command('select_save_file', {
    purpose: 'theme-preset',
    default_name: `${id}.ecltheme`,
  })
  const path = selection.success ? selection.data?.path : null
  if (!path) return
  // eslint-disable-next-line no-alert -- privacy-sensitive export choice
  const includeInstances = window.confirm(
    '是否包含实例级覆盖？这可能暴露本机实例名称或标识。\n选择“取消”将安全地仅导出通用主题。'
  )
  await themeApi.export(id, path, includeInstances)
}
async function remove(id: string): Promise<void> {
  // eslint-disable-next-line no-alert -- deleting a local preset requires confirmation
  if (!window.confirm('确定删除这个用户主题？')) return
  await themeApi.remove(id)
  await refresh()
}
onMounted(() => void refresh())
</script>

<style scoped>
.preset-library {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
.preset-toolbar,
.preset-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preset-toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 11px;
}
.preset-grid {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.preset-item {
  min-width: 0;
  flex-wrap: wrap;
  padding: 7px;
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-control);
  background: var(--ecl-surface-muted);
}
.preset-item.active {
  border-color: var(--primary);
}
.preset-swatch {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 7px;
}
.preset-info {
  min-width: 120px;
  flex: 1;
}
.preset-info strong,
.preset-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preset-info small {
  color: var(--text-secondary);
  font-size: 10px;
}
.active-label {
  color: var(--primary);
  font-size: 11px;
}
</style>
