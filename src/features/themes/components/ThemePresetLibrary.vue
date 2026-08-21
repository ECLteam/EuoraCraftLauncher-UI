<template>
  <div class="preset-library" data-theme-component="preset-library" data-theme-node="settings.theme-library">
    <div class="preset-toolbar">
      <NInput v-model:value="searchQuery" size="small" placeholder="搜索名称 / 作者 / ID" clearable />
      <NSelect v-model:value="sortBy" size="small" class="sort-select" :options="sortOptions" />
      <label class="favorite-filter">
        <input v-model="favoritesOnly" type="checkbox" />
        <span>仅收藏</span>
      </label>
      <NButton size="small" @click="openShareImport">分享 / 导入</NButton>
      <NButton size="small" @click="importPreset">导入 .ecltheme</NButton>
      <span class="toolbar-hint">支持 PNG、WebP、安全 SVG 与 WOFF2 资源</span>
    </div>

    <div v-if="previewing" class="preview-banner">
      <span
        >试用中：{{ previewing.meta.name }} <small v-if="previewSource === 'import'">（未保存，导入预览）</small></span
      >
      <NButton v-if="previewSource === 'import'" size="tiny" @click="savePreviewAs">另存为</NButton>
      <NButton size="tiny" type="primary" @click="applyPreview">应用</NButton>
      <NButton size="tiny" @click="cancelPreview">恢复</NButton>
    </div>

    <div class="preset-grid">
      <article
        v-for="preset in filteredPresets"
        :key="preset.id"
        :class="['preset-item', { active: preset.id === activeId, previewing: previewing?.id === preset.id }]"
      >
        <div
          :class="['preset-preview', { folia: presetsById[preset.id]?.uiSkin === 'folia' }]"
          :style="previewStyle(preset.id)"
        >
          <div class="mock-light">
            <span class="mock-bar"></span>
            <span class="mock-card"><i></i></span>
          </div>
          <div class="mock-dark">
            <span class="mock-bar"></span>
            <span class="mock-card"><i></i></span>
          </div>
        </div>
        <div class="preset-info">
          <strong>{{ preset.name }}</strong>
          <small>{{ preset.author || preset.source }} · {{ preset.id }}</small>
        </div>
        <div class="preset-actions">
          <button
            class="favorite-btn"
            :class="{ active: isFavorite(preset.id) }"
            :title="isFavorite(preset.id) ? '取消收藏' : '收藏'"
            type="button"
            @click="toggleFavorite(preset.id)"
          >
            ★
          </button>
          <NButton v-if="preset.id !== activeId" size="tiny" @click="previewPreset(preset.id)">预览</NButton>
          <span v-else class="active-label">使用中</span>
          <NButton size="tiny" @click="exportPreset(preset.id)">导出</NButton>
          <NButton size="tiny" @click="sharePreset(preset.id)">分享</NButton>
          <NButton
            v-if="!preset.readonly && preset.id !== activeId"
            size="tiny"
            quaternary
            type="error"
            @click="remove(preset.id)"
            >删除</NButton
          >
        </div>
      </article>
    </div>

    <div v-if="showShareDialog" class="share-dialog">
      <h3>分享 / 导入主题</h3>
      <p class="share-hint">
        在下方粘贴分享串，或复制当前预览的主题分享串。分享串仅包含配色与样式定义，不包含资源文件。
      </p>
      <textarea v-model="shareText" class="share-textarea" placeholder="ecltheme:v1:...." rows="5"></textarea>
      <div class="share-actions">
        <NButton size="small" @click="importShareText">导入并预览</NButton>
        <NButton size="small" @click="showShareDialog = false">关闭</NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NSelect } from 'naive-ui'
import { computed, onMounted, ref, type CSSProperties } from 'vue'
import backend from '@/api/client'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import type { ThemePresetSummary, ThemePresetV1 } from '@/types/api'
import { themeApi } from '../api/themeApi'
import { useThemeDesignerStore } from '../stores/themeDesignerStore'

const SHARE_PREFIX = 'ecltheme:v1:'
const FAVORITES_KEY = 'euoracraft-theme-favorites'

const designer = useThemeDesignerStore()
const message = useLauncherMessage()
const presets = ref<ThemePresetSummary[]>([])
const presetsById = ref<Record<string, ThemePresetV1>>({})
const activeId = computed(() => designer.activePreset?.id)
const searchQuery = ref('')
const sortBy = ref<'name' | 'source' | 'favorites'>('source')
const favoritesOnly = ref(false)
const favorites = ref<string[]>(loadFavorites())

const previewing = ref<ThemePresetV1 | null>(null)
const previewSource = ref<'library' | 'import'>('library')
const showShareDialog = ref(false)
const shareText = ref('')

const sortOptions = [
  { label: '来源排序', value: 'source' },
  { label: '按名称', value: 'name' },
  { label: '收藏优先', value: 'favorites' },
]

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function persistFavorites(): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
  } catch {
    /* 忽略存储失败 */
  }
}

function isFavorite(id: string): boolean {
  return favorites.value.includes(id)
}

function toggleFavorite(id: string): void {
  favorites.value = isFavorite(id) ? favorites.value.filter((item) => item !== id) : [...favorites.value, id]
  persistFavorites()
}

async function refresh(): Promise<void> {
  presets.value = await themeApi.list()
  for (const summary of presets.value) {
    try {
      const response = await backend.command('theme_get', { preset_id: summary.id })
      if (response.success && response.data) presetsById.value[summary.id] = response.data
    } catch {
      /* 单个插件主题失效不阻塞主题库 */
    }
  }
}

const filteredPresets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let list = presets.value.filter((preset) => {
    if (favoritesOnly.value && !isFavorite(preset.id)) return false
    if (!query) return true
    return (
      preset.name.toLowerCase().includes(query) ||
      (preset.author || '').toLowerCase().includes(query) ||
      preset.id.toLowerCase().includes(query)
    )
  })
  const favoriteRank = (id: string) => (isFavorite(id) ? 0 : 1)
  list = [...list].sort((a, b) => {
    if (sortBy.value === 'favorites') return favoriteRank(a.id) - favoriteRank(b.id)
    if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'zh-CN')
    return String(a.source).localeCompare(String(b.source), 'zh-CN')
  })
  return list
})

function previewStyle(id: string): CSSProperties {
  const preset = presetsById.value[id]
  const primary = preset && typeof preset.tokens.primary === 'string' ? preset.tokens.primary : 'var(--primary)'
  const light = preset?.schemes.light ?? {}
  const dark = preset?.schemes.dark ?? {}
  return {
    '--preview-primary': primary,
    '--preview-canvas': light.canvas ?? '#f4f6fa',
    '--preview-surface': light.surface ?? 'rgba(255,255,255,0.88)',
    '--preview-text': light.text ?? '#1d2433',
    '--preview-dark-canvas': dark.canvas ?? '#171a21',
    '--preview-dark-surface': dark.surface ?? 'rgba(34,38,48,0.88)',
    '--preview-dark-text': dark.text ?? '#f1f3f7',
  } as CSSProperties
}

function previewPreset(id: string): void {
  const preset = presetsById.value[id]
  if (!preset) return
  previewing.value = preset
  previewSource.value = 'library'
  designer.preview(preset)
}

function applyPreview(): void {
  if (!previewing.value) return
  if (previewSource.value === 'import') {
    void saveImportedPreset(previewing.value, true)
    return
  }
  void activate(previewing.value.id)
}

function cancelPreview(): void {
  previewing.value = null
  designer.restoreActive()
}

async function activate(id: string): Promise<void> {
  designer.activePreset = await themeApi.activate(id)
  await designer.initialize()
  previewing.value = null
}

async function savePreviewAs(): Promise<void> {
  if (!previewing.value) return
  await saveImportedPreset(previewing.value, false)
}

async function saveImportedPreset(preset: ThemePresetV1, activateAfter: boolean): Promise<void> {
  try {
    const saved = await themeApi.save(structuredClone(preset))
    await refresh()
    previewing.value = null
    if (activateAfter) {
      designer.activePreset = await themeApi.activate(saved.id)
      await designer.initialize()
    }
    message.success(activateAfter ? '主题已导入并应用' : '主题已另存')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '导入主题失败')
  }
}

function encodeShare(preset: ThemePresetV1): string {
  const portable = { ...preset, assets: {} }
  const bytes = new TextEncoder().encode(JSON.stringify(portable))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return SHARE_PREFIX + btoa(binary)
}

function decodeShare(text: string): ThemePresetV1 | null {
  const trimmed = text.trim()
  const payload = trimmed.startsWith(SHARE_PREFIX) ? trimmed.slice(SHARE_PREFIX.length) : trimmed
  try {
    const binary = atob(payload)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const preset = JSON.parse(new TextDecoder().decode(bytes)) as ThemePresetV1
    if (!preset || preset.schemaVersion !== 1 || !preset.meta?.name) return null
    return preset
  } catch {
    return null
  }
}

async function sharePreset(id: string): Promise<void> {
  const preset = presetsById.value[id]
  if (!preset) return
  const share = encodeShare(preset)
  try {
    await navigator.clipboard?.writeText(share)
    message.success('主题分享串已复制到剪贴板')
  } catch {
    shareText.value = share
    showShareDialog.value = true
  }
}

function openShareImport(): void {
  shareText.value = previewing.value ? encodeShare(previewing.value) : ''
  showShareDialog.value = true
}

function importShareText(): void {
  const preset = decodeShare(shareText.value)
  if (!preset) {
    message.error('无法解析分享串')
    return
  }
  previewing.value = preset
  previewSource.value = 'import'
  designer.preview(preset)
  showShareDialog.value = false
  message.success('分享主题已载入预览，可另存或应用')
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
.preset-actions,
.preset-item,
.share-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preset-toolbar {
  flex-wrap: wrap;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 11px;
}
.sort-select {
  width: 110px;
}
.favorite-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}
.toolbar-hint {
  margin-left: auto;
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
.preset-item.previewing {
  border-color: var(--warning, #d99532);
}
.preset-preview {
  display: grid;
  width: 74px;
  height: 42px;
  flex: none;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border: 1px solid var(--ecl-border);
  border-radius: 7px;
}
.preset-preview.folia {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
.preset-preview.folia .mock-light,
.preset-preview.folia .mock-dark {
  background-image:
    radial-gradient(circle at 10% 15%, color-mix(in srgb, var(--preview-primary) 22%, transparent), transparent 55%),
    radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--preview-primary) 14%, transparent), transparent 55%);
}
.preset-preview.folia .mock-card {
  border: 1px solid color-mix(in srgb, var(--preview-primary) 18%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26);
}
.mock-light,
.mock-dark {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px;
}
.mock-light {
  background: var(--preview-canvas);
}
.mock-dark {
  background: var(--preview-dark-canvas);
}
.mock-bar {
  height: 4px;
  width: 60%;
  border-radius: 2px;
  background: var(--preview-primary);
}
.mock-card {
  display: block;
  height: 14px;
  border-radius: 3px;
  background: var(--preview-surface);
}
.mock-dark .mock-card {
  background: var(--preview-dark-surface);
}
.mock-card i {
  display: block;
  width: 40%;
  height: 3px;
  margin: 4px 0 0 4px;
  border-radius: 2px;
  background: var(--preview-text);
}
.mock-dark .mock-card i {
  background: var(--preview-dark-text);
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
.preset-actions {
  flex-wrap: wrap;
}
.active-label {
  color: var(--primary);
  font-size: 11px;
}
.favorite-btn {
  min-width: 24px;
  min-height: 24px;
  padding: 0;
  border: 1px solid var(--ecl-border);
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.favorite-btn.active {
  border-color: var(--warning, #d99532);
  color: var(--warning, #d99532);
}
.preview-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 7px 9px;
  border: 1px solid var(--warning, #d99532);
  border-radius: var(--ecl-radius-control);
  background: color-mix(in srgb, var(--warning, #d99532) 12%, transparent);
  color: var(--text-primary);
  font-size: 12px;
}
.preview-banner small {
  color: var(--text-secondary);
}
.share-dialog {
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
  background: var(--ecl-surface-muted);
}
.share-dialog h3 {
  margin: 0 0 6px;
  font-size: 13px;
}
.share-hint {
  margin: 0 0 6px;
  color: var(--text-secondary);
  font-size: 11px;
}
.share-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 9px;
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-control);
  background: var(--ecl-surface);
  color: var(--text-primary);
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
}
.share-actions {
  margin-top: 8px;
}
</style>
