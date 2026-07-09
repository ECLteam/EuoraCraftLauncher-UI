<template>
  <div class="mods-page">
    <!-- 顶部操作栏 -->
    <div class="mods-toolbar">
      <div class="search-bar">
        <UiIcon name="search" :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('mods.searchPlaceholder')"
          class="search-input"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          @click="searchQuery = ''"
        >
          <UiIcon name="close" :size="14" />
        </button>
      </div>
      <n-select
        v-model:value="filterLoader"
        :options="loaderFilterOptions"
        :placeholder="t('mods.filterLoader')"
        size="small"
        class="loader-filter"
        :consistent-menu-width="false"
      />
      <n-button type="primary" size="small" @click="handleAddMod">
        <template #icon>
          <UiIcon name="add" :size="16" />
        </template>
        {{ t('mods.add') }}
      </n-button>
      <n-button size="small" @click="handleOpenModsFolder">
        <template #icon>
          <UiIcon name="folder" :size="16" />
        </template>
        {{ t('mods.openFolder') }}
      </n-button>
      <n-button type="info" size="small" @click="handleOnlineSearch">
        <template #icon>
          <UiIcon name="cloud-download" :size="16" />
        </template>
        {{ t('mods.onlineSearch') }}
      </n-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="medium" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredMods.length === 0" class="empty-state">
      <UiIcon name="cube" :size="48" class="empty-icon" />
      <p class="empty-text">{{ t('mods.empty') }}</p>
    </div>

    <!-- 模组列表 -->
    <div v-else class="mods-list">
      <div
        v-for="mod in filteredMods"
        :key="mod.filename"
        class="mod-item"
        :style="{ opacity: mod.enabled ? 1 : 0.5 }"
      >
        <div class="mod-icon">
          <UiIcon name="cube" :size="20" />
        </div>

        <div class="mod-info">
          <div class="mod-name">{{ mod.name }}</div>
          <div class="mod-meta">
            <span class="mod-version-tag">{{ mod.version || '--' }}</span>
            <span class="mod-author" v-if="mod.author">by {{ mod.author }}</span>
            <span :class="['loader-tag', 'loader-' + getLoaderClass(mod.loader_type)]">
              {{ getLoaderLabel(mod.loader_type) }}
            </span>
            <span class="mod-game-version" v-if="mod.game_version">
              MC {{ mod.game_version }}
            </span>
          </div>
        </div>

        <div class="mod-actions">
          <n-switch
            :value="mod.enabled"
            @update:value="(val: boolean) => handleToggle(mod, val)"
            size="small"
          />
          <n-button
            size="tiny"
            type="error"
            quaternary
            @click="handleRemove(mod)"
          >
            <template #icon>
              <UiIcon name="trash" :size="14" />
            </template>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NSwitch, NSpin, NSelect } from 'naive-ui'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { getLoaderClass, getLoaderLabel } from '@/utils/loader'
import backend from '@/api/client'

interface Mod {
  filename: string
  name: string
  version: string
  author: string
  loader_type: string
  game_version: string
  enabled: boolean
}

const { t } = useI18n()
const message = useGlassMessage()
const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const filterLoader = ref('all')

const mods = ref<Mod[]>([])

// 加载器筛选选项
const loaderFilterOptions = [
  { label: t('mods.allLoaders'), value: 'all' },
  { label: 'Forge', value: 'Forge' },
  { label: 'Fabric', value: 'Fabric' },
  { label: 'NeoForge', value: 'NeoForge' },
  { label: 'Quilt', value: 'Quilt' },
  { label: 'OptiFine', value: 'OptiFine' },
  { label: 'LiteLoader', value: 'LiteLoader' },
  { label: t('loader.unknown'), value: '未知' },
]

// 获取当前游戏路径
async function getCurrentGamePath(): Promise<string> {
  try {
    const res = await backend.config.get('game')
    if (res.success && res.data) {
      const paths = res.data.minecraft_paths || []
      if (paths.length > 0) {
        const first = paths[0]
        return typeof first === 'string' ? first : first.path
      }
    }
  } catch {}
  return './.minecraft'
}

// 加载 Mod 列表
async function loadMods() {
  loading.value = true
  try {
    const gamePath = await getCurrentGamePath()
    const result = await backend.command('get_mods', { game_path: gamePath })
    if (result.success && result.data) {
      mods.value = result.data
    } else {
      mods.value = []
    }
  } catch (e) {
    console.error('加载 Mod 列表失败:', e)
    mods.value = []
  } finally {
    loading.value = false
  }
}

// 筛选
const filteredMods = computed(() => {
  let list = mods.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(m => m.name.toLowerCase().includes(query))
  }
  if (filterLoader.value !== 'all') {
    list = list.filter(m => m.loader_type === filterLoader.value)
  }
  return list
})

// 启用/禁用 Mod
async function handleToggle(mod: Mod, enabled: boolean) {
  try {
    const gamePath = await getCurrentGamePath()
    const result = await backend.command('toggle_mod', {
      game_path: gamePath,
      filename: mod.filename,
    })
    if (result.success) {
      mod.enabled = result.data?.enabled ?? enabled
      message.success(mod.enabled ? t('mods.enabled') : t('mods.disabled'))
    } else {
      message.error(result.message || '操作失败')
    }
  } catch (e) {
    console.error('切换 Mod 状态失败:', e)
    message.error('操作失败')
  }
}

// 删除 Mod
async function handleRemove(mod: Mod) {
  try {
    const gamePath = await getCurrentGamePath()
    const result = await backend.command('remove_mod', {
      game_path: gamePath,
      filename: mod.filename,
    })
    if (result.success) {
      mods.value = mods.value.filter(m => m.filename !== mod.filename)
      message.success(t('mods.removed', { name: mod.name }))
    } else {
      message.error(result.message || '删除失败')
    }
  } catch (e) {
    console.error('删除 Mod 失败:', e)
    message.error('删除失败')
  }
}

// 添加 Mod
async function handleAddMod() {
  try {
    const fileRes = await backend.command('select_file')
    if (!fileRes.success || !fileRes.data?.path) {
      return
    }
    const gamePath = await getCurrentGamePath()
    const result = await backend.command('add_mod', {
      game_path: gamePath,
      source_path: fileRes.data.path,
    })
    if (result.success) {
      message.success(t('mods.added', { name: result.data?.filename || '' }))
      await loadMods()
    } else {
      message.error(result.message || '添加失败')
    }
  } catch (e) {
    console.error('添加 Mod 失败:', e)
    message.error('添加失败')
  }
}

// 打开 Mods 文件夹
async function handleOpenModsFolder() {
  try {
    const gamePath = await getCurrentGamePath()
    await backend.command('open_mods_folder', {
      game_path: gamePath,
    })
  } catch (e) {
    console.error('打开文件夹失败:', e)
  }
}

// 在线搜索
function handleOnlineSearch() {
  router.push('/online-mods')
}

onMounted(() => {
  loadMods()
})
</script>

<style scoped>
.mods-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 顶部操作栏 */
.mods-toolbar {
  display: flex;
  align-items: center;
  gap: var(--s-md);
  margin-bottom: var(--s-lg);
  flex-shrink: 0;
}

.search-bar {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-tertiary);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 36px 0 36px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms ease-out;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-input:focus {
  border-color: var(--border-active);
}

.search-clear {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.search-clear:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.loader-filter {
  width: 120px;
  flex-shrink: 0;
}

/* 列表 */
.mods-list {
  flex: 1;
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  overflow-y: auto;
  padding: var(--s-lg);
}

.mod-item {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 8px 12px;
  gap: 12px;
  border-radius: var(--r-sm);
  transition: background 150ms ease-out;
}

.mod-item:hover {
  background: var(--bg-hover);
}

.mod-item + .mod-item {
  margin-top: 2px;
}

/* 模组图标 */
.mod-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  background: var(--primary-alpha);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  overflow: hidden;
  flex-shrink: 0;
}

.mod-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 模组信息 */
.mod-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mod-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mod-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.mod-version-tag {
  display: inline-block;
  padding: 0 6px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.mod-author {
  font-size: 11px;
  color: var(--text-tertiary);
}

.mod-game-version {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 0 4px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
}

/* 加载器标签 */
.loader-tag {
  display: inline-block;
  padding: 0 6px;
  border-radius: var(--r-xs);
  font-size: 11px;
  font-weight: 500;
}

.loader-forge { background: rgba(140, 130, 180, 0.15); color: #7a6eaa; }
.loader-fabric { background: rgba(218, 190, 140, 0.15); color: #b8944a; }
.loader-neoforge { background: rgba(140, 150, 200, 0.15); color: #6a7eb4; }
.loader-quilt { background: rgba(140, 180, 160, 0.15); color: #5a9a72; }
.loader-optifine { background: rgba(200, 180, 140, 0.15); color: #b8942a; }
.loader-liteloader { background: rgba(160, 180, 200, 0.15); color: #5a7a9a; }
.loader-unknown { background: var(--bg-base-alt); color: var(--text-secondary); }

/* 操作区域 */
.mod-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-md);
}

.empty-icon {
  color: var(--text-tertiary);
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-md);
  color: var(--text-secondary);
}
</style>