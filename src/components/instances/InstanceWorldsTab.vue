<template>
  <section class="worlds-panel">
    <header class="worlds-toolbar">
      <NInput v-model:value="query" clearable placeholder="搜索世界名称、目录、种子或版本" />
      <NSelect v-model:value="sortKey" :options="sortOptions" class="sort-select" />
      <NButton :loading="loading" @click="load">刷新</NButton>
      <NButton @click="importWorld">导入</NButton>
      <NButton @click="openFolder">打开存档目录</NButton>
    </header>
    <NSpin :show="loading">
      <div v-if="filtered.length" class="world-grid">
        <article v-for="world in filtered" :key="world.id" class="world-card">
          <img v-if="world.iconPath" :src="iconUrls[world.id]" alt="" class="world-icon" />
          <div v-else class="world-icon fallback">🌍</div>
          <div class="world-copy">
            <strong>{{ world.name }}</strong
            ><small>{{ world.id }}</small>
            <div class="world-badges">
              <span>{{ world.gameMode || '未知模式' }}</span
              ><span>{{ world.difficulty || '未知难度' }}</span
              ><span>{{ world.version || '未知版本' }}</span>
            </div>
            <p>种子 {{ world.seed || '-' }} · 上次游玩 {{ formatDate(world.lastPlayedAt) }}</p>
            <p v-if="world.error" class="world-error">{{ world.error }}</p>
          </div>
          <div class="world-actions">
            <NButton size="tiny" type="primary" @click="quickPlay(world)">快速进入</NButton>
            <NButton size="tiny" @click="editWorld(world)">难度与作弊</NButton>
            <NButton size="tiny" @click="backup(world)">备份</NButton>
            <NButton size="tiny" @click="manageBackups(world)">恢复</NButton>
            <NButton size="tiny" @click="setIcon(world)">图标</NButton>
            <NButton size="tiny" @click="copyWorld(world)">复制</NButton>
            <NButton size="tiny" @click="exportWorld(world)">导出</NButton>
            <NButton size="tiny" @click="chunkbase(world)">Chunkbase</NButton>
            <NButton size="tiny" type="error" secondary @click="remove(world)">删除</NButton>
          </div>
        </article>
      </div>
      <NEmpty v-else description="没有找到存档" />
    </NSpin>
    <ConfirmDialog
      v-model:visible="confirmVisible"
      :title="confirmTitle"
      :content="confirmContent"
      :loading="confirmLoading"
      :danger="confirmDanger"
      :closeOnConfirm="false"
      @confirm="handleConfirm"
    />
    <Modal v-model:visible="editorVisible" title="世界设置" width="460px">
      <div class="world-editor">
        <label>难度<NSelect v-model:value="editor.difficulty" :options="difficultyOptions" /></label>
        <label><NSwitch v-model:value="editor.allowCommands" /> 允许作弊</label>
        <label><NSwitch v-model:value="editor.difficultyLocked" /> 锁定难度</label>
      </div>
      <template #footer
        ><NButton @click="editorVisible = false">取消</NButton
        ><NButton type="primary" @click="saveWorld">保存（自动备份）</NButton></template
      >
    </Modal>
    <Modal v-model:visible="backupsVisible" title="存档备份" width="660px">
      <div class="backup-list">
        <div v-for="backupItem in backups" :key="backupItem.id">
          <span
            ><strong>{{ backupItem.createdAt || backupItem.id }}</strong
            ><small
              >{{ backupItem.automatic ? '自动备份' : '手动备份' }} · {{ Math.ceil(backupItem.size / 1024) }} KiB</small
            ></span
          ><NButton size="tiny" @click="toggleBackupLock(backupItem)">{{ backupItem.locked ? '解锁' : '锁定' }}</NButton
          ><NButton size="tiny" type="primary" @click="restoreBackup(backupItem)">恢复</NButton
          ><NButton size="tiny" type="error" secondary @click="deleteBackup(backupItem)">删除</NButton>
        </div>
      </div>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { NButton, NEmpty, NInput, NSelect, NSpin, NSwitch } from 'naive-ui'
import { computed, onMounted, reactive, ref } from 'vue'
import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import Modal from '@/components/modals/Modal.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import type { ScannedVersion, WorldEntry } from '@/types/api'

const props = defineProps<{ version: ScannedVersion }>()
const emit = defineEmits<{ changed: [worlds: WorldEntry[]] }>()
const message = useLauncherMessage()
const worlds = ref<WorldEntry[]>([])
const loading = ref(false)
const query = ref('')
const sortKey = ref<'name' | 'modifiedAt' | 'lastPlayedAt' | 'createdAt'>('modifiedAt')
const iconUrls = reactive<Record<string, string>>({})
const editorVisible = ref(false)
const editing = ref<WorldEntry | null>(null)
const editor = reactive({ difficulty: 2, allowCommands: false, difficultyLocked: false })
const backupsVisible = ref(false)
const backupWorld = ref<WorldEntry | null>(null)
const backups = ref<Array<{ id: string; createdAt?: string; locked: boolean; automatic: boolean; size: number }>>([])
const target = computed(() => workspaceTarget(props.version))
const sortOptions = [
  { label: '名称', value: 'name' },
  { label: '修改时间', value: 'modifiedAt' },
  { label: '上次游玩', value: 'lastPlayedAt' },
  { label: '创建时间', value: 'createdAt' },
]
const difficultyOptions = [
  { label: '和平', value: 0 },
  { label: '简单', value: 1 },
  { label: '普通', value: 2 },
  { label: '困难', value: 3 },
]
const filtered = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  return [...worlds.value]
    .filter((w) => !needle || `${w.name} ${w.id} ${w.seed} ${w.version}`.toLocaleLowerCase().includes(needle))
    .sort((a, b) =>
      sortKey.value === 'name'
        ? a.name.localeCompare(b.name)
        : String(b[sortKey.value] || '').localeCompare(String(a[sortKey.value] || ''))
    )
})
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : '从未游玩')
async function load() {
  loading.value = true
  try {
    worlds.value = await instanceWorkspaceApi.worlds(target.value)
    emit('changed', worlds.value)
    for (const world of worlds.value) {
      if (world.iconPath) iconUrls[world.id] = (await backend.file.toUrl(world.iconPath)) || ''
    }
  } finally {
    loading.value = false
  }
}
async function openFolder() {
  await instanceWorkspaceApi.folders(target.value, 'saves')
}
async function quickPlay(world: WorldEntry) {
  try {
    await instanceWorkspaceApi.launchWorld(target.value, world.id)
    message.success(`正在进入 ${world.name}`)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '该版本不支持快速进入世界')
  }
}
function editWorld(world: WorldEntry) {
  editing.value = world
  editor.difficulty = world.difficultyId ?? 2
  editor.allowCommands = Boolean(world.allowCommands)
  editor.difficultyLocked = Boolean(world.difficultyLocked)
  editorVisible.value = true
}
async function saveWorld() {
  if (!editing.value) return
  await instanceWorkspaceApi.patchWorld(target.value, editing.value.id, {
    difficulty: editor.difficulty,
    allowCommands: editor.allowCommands,
    difficultyLocked: editor.difficultyLocked,
  })
  editorVisible.value = false
  await load()
}
async function backup(world: WorldEntry) {
  await instanceWorkspaceApi.backupWorld(target.value, world.id)
  message.success('备份已创建')
}
async function manageBackups(world: WorldEntry) {
  backupWorld.value = world
  backups.value = await instanceWorkspaceApi.worldBackups(target.value, world.id)
  backupsVisible.value = true
}
async function toggleBackupLock(item: { id: string; locked: boolean }) {
  if (!backupWorld.value) return
  await instanceWorkspaceApi.lockWorldBackup(target.value, backupWorld.value.id, item.id, !item.locked)
  await manageBackups(backupWorld.value)
}
function restoreBackup(item: { id: string }) {
  if (!backupWorld.value) return
  openConfirm('恢复存档', '恢复前会完整验证备份，当前存档仅在验证成功后被替换。', async () => {
    await instanceWorkspaceApi.restoreWorldBackup(target.value, backupWorld.value!.id, item.id)
    message.success('恢复任务已创建')
  })
}
async function deleteBackup(item: { id: string }) {
  if (!backupWorld.value) return
  await instanceWorkspaceApi.deleteWorldBackup(target.value, backupWorld.value.id, item.id)
  await manageBackups(backupWorld.value)
}
async function setIcon(world: WorldEntry) {
  const selected = unwrapResponse(await backend.command('select_image', { purpose: 'instance_icon' }), '选择世界图标')
  if (selected.path) {
    await instanceWorkspaceApi.setWorldIcon(target.value, world.id, selected.path)
    await load()
  }
}
function copyWorld(world: WorldEntry) {
  openConfirm('复制存档', `将创建 ${world.id}-copy`, async () => {
    await instanceWorkspaceApi.copyWorld(target.value, world.id, `${world.id}-copy`)
    message.success('复制任务已创建')
  })
}
async function importWorld() {
  const selected = unwrapResponse(await backend.command('select_file', { purpose: 'world-import' }), '选择存档')
  if (selected.path) {
    await instanceWorkspaceApi.importWorld(target.value, selected.path)
    message.success('导入任务已创建')
  }
}
async function exportWorld(world: WorldEntry) {
  const selected = unwrapResponse(
    await backend.command('select_save_file', { purpose: 'world-export' }),
    '选择导出位置'
  )
  if (selected.path) {
    await instanceWorkspaceApi.exportWorld(target.value, world.id, selected.path)
    message.success('导出任务已创建')
  }
}
function remove(world: WorldEntry) {
  openConfirm('移入回收站', `删除存档“${world.name}”？可从系统回收站恢复。`, async () => {
    await instanceWorkspaceApi.deleteWorld(target.value, world.id)
    await load()
  }, true)
}
async function chunkbase(world: WorldEntry) {
  const url = `https://www.chunkbase.com/apps/seed-map#seed=${encodeURIComponent(world.seed || '')}&platform=java_${encodeURIComponent(world.version || '')}`
  await backend.command('open_url', { url })
}

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmContent = ref('')
const confirmDanger = ref(false)
const confirmLoading = ref(false)
let confirmAction: (() => Promise<void>) | null = null

function openConfirm(title: string, content: string, action: () => Promise<void>, danger = false) {
  confirmTitle.value = title
  confirmContent.value = content
  confirmDanger.value = danger
  confirmAction = action
  confirmLoading.value = false
  confirmVisible.value = true
}

async function handleConfirm() {
  if (!confirmAction || confirmLoading.value) return
  confirmLoading.value = true
  try {
    await confirmAction()
    confirmVisible.value = false
    confirmAction = null
  } finally {
    confirmLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.worlds-panel {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  overflow: hidden;
  background: var(--ecl-surface);
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
  box-shadow: var(--ecl-shadow-surface);
}

.worlds-toolbar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ecl-border);
}

.worlds-toolbar > .n-input {
  flex: 1;
  min-width: 180px;
}

.sort-select {
  width: 150px;
}

.world-grid {
  display: grid;
  gap: 0;
  padding: 8px;
}

.world-card {
  display: grid;
  grid-template-columns: 64px minmax(240px, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
  transition: background 0.15s ease;
}

.world-card:last-child {
  border-bottom: 0;
}

.world-card:hover {
  background: var(--ecl-hover);
}

.world-icon {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: var(--ecl-radius-control);
}

.world-icon.fallback {
  display: grid;
  place-items: center;
  background: var(--ecl-hover);
  font-size: 30px;
}

.world-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.world-copy strong {
  overflow: hidden;
  color: var(--ecl-text);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.world-copy small,
.world-copy p {
  margin: 2px 0;
  color: var(--ecl-text-secondary);
}

.world-copy p {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.world-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.world-badges span {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ecl-hover);
  color: var(--ecl-text-secondary);
  font-size: 11px;
}

.world-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 400px;
}

.world-error {
  color: #d65c5c !important;
}

.world-editor {
  display: grid;
  gap: 18px;
}

.world-editor label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.world-editor .n-select {
  flex: 1;
}

.backup-list {
  display: grid;
  gap: 8px;
}

.backup-list > div {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
}

.backup-list span {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.backup-list small {
  color: var(--ecl-text-secondary);
}
</style>
