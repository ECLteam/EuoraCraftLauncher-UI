<template>
  <div class="instances-page">
    <!-- 顶部操作栏 -->
    <div class="instances-toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <UiIcon
            name="search"
            :size="16"
            class="search-icon"
          />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('instances.searchInstances')"
            class="search-input"
          >
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
          >
            <UiIcon
              name="close"
              :size="14"
            />
          </button>
        </div>
        <div class="filter-group">
          <button
            v-for="f in filters"
            :key="f.key"
            :class="['filter-chip', { active: activeFilter === f.key }]"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
      <div class="toolbar-right">
        <div class="view-toggle">
          <button
            :class="['view-btn', { active: viewMode === 'grid' }]"
            :title="t('instances.gridView')"
            @click="viewMode = 'grid'"
          >
            <UiIcon
              name="grid"
              :size="16"
            />
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'list' }]"
            :title="t('instances.listView')"
            @click="viewMode = 'list'"
          >
            <UiIcon
              name="menu"
              :size="16"
            />
          </button>
        </div>
        <button
          class="btn-create"
          @click="createInstance"
        >
          <UiIcon
            name="add"
            :size="16"
          />
          <span>{{ t('instances.create') }}</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="instances-content">
      <!-- 空状态 -->
      <div
        v-if="filteredInstances.length === 0"
        class="empty-state"
      >
        <UiIcon
          name="folder"
          :size="48"
          class="empty-icon"
        />
        <p class="empty-text">
          {{ t('instances.noInstances') }}
        </p>
        <button
          class="btn-primary"
          @click="createInstance"
        >
          <UiIcon
            name="add"
            :size="16"
          />
          {{ t('instances.createFirst') }}
        </button>
      </div>

      <!-- 网格视图 -->
      <TransitionGroup
        v-else-if="viewMode === 'grid'"
        name="instance-grid"
        tag="div"
        class="grid-view"
      >
        <div
          v-for="instance in filteredInstances"
          :key="instance.id"
          :class="['instance-card', { running: instance.isRunning }]"
          @click="launchInstance(instance)"
        >
          <div class="card-cover">
            <img
              v-if="instance.coverUrl"
              :src="instance.coverUrl"
              :alt="instance.name"
              class="cover-image"
            >
            <div
              v-else
              class="cover-placeholder"
            >
              <UiIcon
                name="cube"
                :size="32"
              />
            </div>
            <div class="card-cover-overlay">
              <button
                class="overlay-btn overlay-play"
                :title="t('instances.launch')"
                @click.stop="launchInstance(instance)"
              >
                <UiIcon
                  name="play"
                  :size="18"
                />
              </button>
              <button
                class="overlay-btn overlay-edit"
                :title="t('common.edit')"
                @click.stop="editInstance(instance)"
              >
                <UiIcon
                  name="settings"
                  :size="14"
                />
              </button>
              <button
                class="overlay-btn overlay-delete"
                :title="t('common.delete')"
                @click.stop="confirmDelete(instance)"
              >
                <UiIcon
                  name="trash"
                  :size="14"
                />
              </button>
            </div>
            <span
              v-if="instance.isRunning"
              class="running-badge"
            >{{ t('instances.running') }}</span>
          </div>
          <div class="card-body">
            <div class="card-name">
              {{ instance.name }}
            </div>
            <div class="card-meta">
              <span class="card-version-tag">{{ instance.version }}</span>
              <span class="card-time">{{ instance.lastPlayed || t('instances.neverPlayed') }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
      <!-- 列表视图 -->
      <div
        v-else
        class="list-view"
      >
        <div class="list-header">
          <span class="col-name">{{ t('instances.instanceName') }}</span>
          <span class="col-version">{{ t('instances.version') }}</span>
          <span class="col-time">{{ t('instances.lastPlayed') }}</span>
          <span class="col-status">{{ t('instances.status') }}</span>
          <span class="col-actions" />
        </div>
        <div
          v-for="instance in filteredInstances"
          :key="instance.id"
          :class="['list-row', { running: instance.isRunning }]"
          @click="launchInstance(instance)"
        >
          <div class="col-name">
            <div class="list-item-icon">
              <img
                v-if="instance.coverUrl"
                :src="instance.coverUrl"
                class="item-thumb"
              >
              <UiIcon
                v-else
                name="cube"
                :size="20"
              />
            </div>
            <span class="list-item-name">{{ instance.name }}</span>
          </div>
          <div class="col-version">
            <span class="version-tag">{{ instance.version }}</span>
          </div>
          <div class="col-time">
            <span class="time-text">{{ instance.lastPlayed || t('instances.neverPlayed') }}</span>
          </div>
          <div class="col-status">
            <span :class="['status-dot', instance.isRunning ? 'status-running' : 'status-stopped']" />
            <span>{{ instance.isRunning ? t('instances.running') : t('instances.stopped') }}</span>
          </div>
          <div class="col-actions">
            <button
              class="row-action-btn"
              :title="t('instances.launch')"
              @click.stop="launchInstance(instance)"
            >
              <UiIcon
                name="play"
                :size="14"
              />
            </button>
            <button
              class="row-action-btn"
              :title="t('common.edit')"
              @click.stop="editInstance(instance)"
            >
              <UiIcon
                name="settings"
                :size="14"
              />
            </button>
            <button
              class="row-action-btn row-action-delete"
              :title="t('common.delete')"
              @click.stop="confirmDelete(instance)"
            >
              <UiIcon
                name="trash"
                :size="14"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useIntervalFn } from '@/composables/useIntervalFn'

interface Instance {
  id: string
  name: string
  version: string
  coverUrl?: string
  lastPlayed?: string
  isRunning: boolean
  gamePath?: string
}

const { t } = useI18n()
const router = useRouter()
const message = useGlassMessage()
const { run } = useAsyncAction({ showSuccess: false, showError: false })

const instances = ref<Instance[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

const filters = computed(() => [
  { key: 'all', label: t('instances.filterAll') },
  { key: 'running', label: t('instances.filterRunning') },
  { key: 'stopped', label: t('instances.filterStopped') },
])

const filteredInstances = computed(() => {
  let result = instances.value
  if (activeFilter.value === 'running') {
    result = result.filter(i => i.isRunning)
  } else if (activeFilter.value === 'stopped') {
    result = result.filter(i => !i.isRunning)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.version.toLowerCase().includes(q)
    )
  }
  return result
})

const { resume: startPolling } = useIntervalFn(loadInstances, 3000)

async function loadInstances() {
  const result = await run(async () => backend.command('instances_list'))
  if (result?.success && result.data) {
    instances.value = result.data
  } else {
    instances.value = []
  }
}

async function launchInstance(instance: Instance) {
  message.info(`${t('instances.launching')} ${instance.name}...`)
  const result = await run(
    async () => backend.command('launch_instance', {
      version_id: instance.version || instance.id,
      game_path: instance.gamePath
    }),
    {
      showSuccess: false,
      showError: true,
      errorMessage: t('instances.launchFailed'),
    }
  )
  if (result?.success) {
    await loadInstances()
  }
}

function createInstance() {
  router.push('/versions/versions')
}

function editInstance(instance: Instance) {
  message.info(`编辑实例: ${instance.name}`)
}

function confirmDelete(instance: Instance) {
  message.info(`删除实例: ${instance.name}`)
  // TODO: 实现确认弹窗
}

onMounted(() => {
  loadInstances()
  startPolling()
})
</script>

<style scoped src="@/styles/Instances.css"></style>
