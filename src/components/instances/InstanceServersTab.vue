<template>
  <section class="servers-panel">
    <header class="servers-toolbar">
      <NInput v-model:value="query" clearable placeholder="搜索服务器名称、地址或 MOTD" /><NButton
        :loading="loading"
        @click="load"
        >刷新列表</NButton
      ><NButton :loading="statusLoading" @click="refreshStatus">刷新状态</NButton
      ><NButton type="primary" @click="edit()">添加服务器</NButton>
    </header>
    <NSpin :show="loading">
      <div v-if="filtered.length" class="server-list">
        <article v-for="server in filtered" :key="server.id" class="server-row">
          <div :class="['status-dot', { online: statuses[server.address]?.online }]" />
          <div class="server-copy">
            <strong>{{ server.name }} <span v-if="server.favorite">★</span></strong
            ><small>{{ server.address }}</small>
            <p>{{ statuses[server.address]?.motd || statuses[server.address]?.error || '尚未查询状态' }}</p>
          </div>
          <div class="server-stats">
            <span v-if="statuses[server.address]?.online"
              >{{ statuses[server.address]?.playersOnline }}/{{ statuses[server.address]?.playersMax }} 人</span
            ><span v-if="statuses[server.address]?.latency">{{ statuses[server.address]?.latency }} ms</span
            ><small>{{ statuses[server.address]?.version }}</small>
          </div>
          <div class="server-actions">
            <NButton size="small" type="primary" @click="connect(server)">启动并连接</NButton
            ><NButton size="small" @click="copyAddress(server)">复制地址</NButton
            ><NButton size="small" @click="edit(server)">编辑</NButton
            ><NButton size="small" type="error" secondary @click="remove(server)">删除</NButton>
          </div>
        </article>
      </div>
      <NEmpty v-else description="服务器列表为空" />
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
    <Modal v-model:visible="editorVisible" :title="form.id ? '编辑服务器' : '添加服务器'" width="480px"
      ><div class="server-form">
        <label>名称<NInput v-model:value="form.name" /></label
        ><label>地址<NInput v-model:value="form.address" placeholder="play.example.com:25565" /></label
        ><label><NSwitch v-model:value="form.favorite" /> 收藏服务器</label>
      </div>
      <template #footer
        ><NButton @click="editorVisible = false">取消</NButton
        ><NButton type="primary" @click="save">保存</NButton></template
      ></Modal
    >
  </section>
</template>

<script setup lang="ts">
import { NButton, NEmpty, NInput, NSpin, NSwitch } from 'naive-ui'
import { computed, onMounted, reactive, ref } from 'vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import Modal from '@/components/modals/Modal.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import type { ScannedVersion, ServerEntry, ServerStatus } from '@/types/api'
const props = defineProps<{ version: ScannedVersion }>()
const message = useLauncherMessage()
const servers = ref<ServerEntry[]>([])
const statuses = reactive<Record<string, ServerStatus>>({})
const loading = ref(false)
const statusLoading = ref(false)
const query = ref('')
const editorVisible = ref(false)
const form = reactive<{ id?: string; name: string; address: string; favorite: boolean }>({
  name: '',
  address: '',
  favorite: false,
})
const target = computed(() => workspaceTarget(props.version))
const filtered = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  return servers.value.filter(
    (s) => !needle || `${s.name} ${s.address} ${statuses[s.address]?.motd || ''}`.toLocaleLowerCase().includes(needle)
  )
})
async function load() {
  loading.value = true
  try {
    servers.value = await instanceWorkspaceApi.servers(target.value)
  } finally {
    loading.value = false
  }
}
async function refreshStatus() {
  statusLoading.value = true
  try {
    for (const status of await instanceWorkspaceApi.serverStatuses(servers.value.map((s) => s.address)))
      statuses[status.address] = status
  } finally {
    statusLoading.value = false
  }
}
function edit(server?: ServerEntry) {
  form.id = server?.id
  form.name = server?.name || ''
  form.address = server?.address || ''
  form.favorite = Boolean(server?.favorite)
  editorVisible.value = true
}
async function save() {
  if (!form.name.trim() || !form.address.trim()) return message.warning('请填写服务器名称和地址')
  await instanceWorkspaceApi.saveServer(target.value, { ...form })
  editorVisible.value = false
  await load()
}
async function connect(server: ServerEntry) {
  await instanceWorkspaceApi.launchServer(target.value, server.address)
  message.success(`正在连接 ${server.name}`)
}
async function copyAddress(server: ServerEntry) {
  await navigator.clipboard.writeText(server.address)
  message.success('地址已复制')
}
function remove(server: ServerEntry) {
  openConfirm(
    '删除服务器',
    `从 servers.dat 删除“${server.name}”？`,
    async () => {
      await instanceWorkspaceApi.deleteServer(target.value, server.id)
      await load()
    },
    true
  )
}
onMounted(async () => {
  await load()
  await refreshStatus()
})

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
</script>

<style scoped>
.servers-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 420px;
  overflow: hidden;
  padding: 12px;
  background: var(--ecl-surface);
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
  box-shadow: var(--ecl-shadow-surface);
}
.servers-toolbar {
  display: flex;
  gap: 8px;
}
.servers-toolbar > .n-input {
  flex: 1;
}
.server-list {
  display: grid;
  gap: 8px;
}
.server-row {
  display: grid;
  grid-template-columns: 12px minmax(260px, 1fr) 140px auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #929aa6;
}
.status-dot.online {
  background: #48b96b;
  box-shadow: 0 0 8px #48b96b;
}
.server-copy {
  display: flex;
  flex-direction: column;
}
.server-copy small,
.server-copy p,
.server-stats small {
  margin: 2px 0;
  color: var(--text-secondary);
}
.server-stats {
  display: flex;
  flex-direction: column;
}
.server-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.server-form {
  display: grid;
  gap: 14px;
}
.server-form label {
  display: flex;
  align-items: center;
  gap: 12px;
}
.server-form .n-input {
  flex: 1;
}
</style>
