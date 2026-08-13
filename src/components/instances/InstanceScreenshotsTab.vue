<template>
  <section class="screens-panel">
    <header class="screens-toolbar">
      <NInput v-model:value="query" clearable placeholder="搜索截图文件名" /><NSelect
        v-model:value="direction"
        :options="sortOptions"
        class="sort-select"
      /><NButton :loading="loading" @click="load">刷新</NButton><NButton @click="openFolder">打开截图目录</NButton>
    </header>
    <NSpin :show="loading">
      <section v-for="group in groups" :key="group.date" class="shot-group">
        <h3>{{ group.date }}</h3>
        <div class="shot-grid">
          <article v-for="shot in group.items" :key="shot.id" class="shot-card">
            <img :src="shot.thumbnailUrl" :alt="shot.name" loading="lazy" />
            <div>
              <strong>{{ shot.name }}</strong
              ><small>{{ shot.width }}×{{ shot.height }} · {{ formatSize(shot.size) }}</small>
            </div>
            <div class="shot-actions">
              <NButton size="tiny" @click="copy(shot)">复制</NButton
              ><NButton size="tiny" @click="saveAs(shot)">另存为</NButton
              ><NButton size="tiny" @click="cover(shot)">设为封面</NButton
              ><NButton size="tiny" @click="background(shot)">设为背景</NButton
              ><NButton size="tiny" type="error" secondary @click="remove(shot)">删除</NButton>
            </div>
          </article>
        </div>
      </section>
      <NEmpty v-if="!groups.length" description="还没有截图" />
    </NSpin>
  </section>
</template>

<script setup lang="ts">
import { NButton, NEmpty, NInput, NSelect, NSpin, useDialog } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import type { ScannedVersion, ScreenshotEntry } from '@/types/api'
const props = defineProps<{ version: ScannedVersion }>()
const emit = defineEmits<{ updated: [] }>()
const message = useLauncherMessage()
const dialog = useDialog()
const loading = ref(false)
const shots = ref<ScreenshotEntry[]>([])
const query = ref('')
const direction = ref<'desc' | 'asc'>('desc')
const target = computed(() => workspaceTarget(props.version))
const sortOptions = [
  { label: '最新在前', value: 'desc' },
  { label: '最早在前', value: 'asc' },
]
const groups = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  const values = [...shots.value]
    .filter((s) => !needle || s.name.toLocaleLowerCase().includes(needle))
    .sort((a, b) =>
      direction.value === 'desc' ? b.modifiedAt.localeCompare(a.modifiedAt) : a.modifiedAt.localeCompare(b.modifiedAt)
    )
  const map = new Map<string, ScreenshotEntry[]>()
  for (const shot of values) map.set(shot.dateGroup, [...(map.get(shot.dateGroup) || []), shot])
  return [...map].map(([date, items]) => ({ date, items }))
})
async function load() {
  loading.value = true
  try {
    shots.value = await instanceWorkspaceApi.screenshots(target.value)
    await Promise.all(
      shots.value.map(async (shot) => {
        const thumb = await instanceWorkspaceApi.thumbnail(target.value, shot.id)
        shot.thumbnailUrl = (await backend.file.toUrl(thumb.path)) || ''
      })
    )
  } finally {
    loading.value = false
  }
}
async function openFolder() {
  await instanceWorkspaceApi.folders(target.value, 'screenshots')
}
async function copy(shot: ScreenshotEntry) {
  await instanceWorkspaceApi.copyScreenshot(target.value, shot.id)
  message.success('已复制到剪贴板')
}
async function saveAs(shot: ScreenshotEntry) {
  const result = unwrapResponse(await backend.command('select_save_file', { purpose: 'screenshot' }), '选择保存位置')
  if (result.path) await instanceWorkspaceApi.saveScreenshot(target.value, shot.id, result.path)
}
async function cover(shot: ScreenshotEntry) {
  await instanceWorkspaceApi.setCover(target.value, shot.id)
  message.success('实例封面已更新')
  emit('updated')
}
async function background(shot: ScreenshotEntry) {
  await instanceWorkspaceApi.setBackground(target.value, shot.id)
  message.success('启动器背景已更新')
}
function remove(shot: ScreenshotEntry) {
  dialog.warning({
    title: '移入回收站',
    content: `删除截图 ${shot.name}？`,
    positiveText: '移入回收站',
    negativeText: '取消',
    onPositiveClick: async () => {
      await instanceWorkspaceApi.deleteScreenshot(target.value, shot.id)
      await load()
    },
  })
}
const formatSize = (size: number) =>
  size < 1024 * 1024 ? `${Math.round(size / 1024)} KiB` : `${(size / 1024 / 1024).toFixed(1)} MiB`
onMounted(load)
</script>

<style scoped>
.screens-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.screens-toolbar {
  display: flex;
  gap: 8px;
}
.screens-toolbar > .n-input {
  flex: 1;
}
.sort-select {
  width: 130px;
}
.shot-group h3 {
  margin: 12px 0 8px;
}
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.shot-card {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-bg);
}
.shot-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #111;
}
.shot-card > div {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
}
.shot-card small {
  color: var(--text-secondary);
}
.shot-actions {
  flex-direction: row !important;
  gap: 5px;
  flex-wrap: wrap;
  padding-top: 0 !important;
}
</style>
