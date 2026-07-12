<template>
  <div class="mods-page">
    <!-- 顶部操作栏 -->
    <div class="mods-toolbar">
      <div class="search-bar">
        <UiIcon
          name="search"
          :size="16"
          class="search-icon"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('mods.searchPlaceholder')"
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
      <NSelect
        v-model:value="filterLoader"
        :options="loaderFilterOptions"
        :placeholder="t('mods.filterLoader')"
        size="small"
        class="loader-filter"
        :consistentMenuWidth="false"
      />
      <NButton
        type="primary"
        size="small"
        @click="handleAddMod"
      >
        <template #icon>
          <UiIcon
            name="add"
            :size="16"
          />
        </template>
        {{ t('mods.add') }}
      </NButton>
      <NButton
        size="small"
        @click="handleOpenModsFolder"
      >
        <template #icon>
          <UiIcon
            name="folder"
            :size="16"
          />
        </template>
        {{ t('mods.openFolder') }}
      </NButton>
      <NButton
        type="info"
        size="small"
        @click="handleOnlineSearch"
      >
        <template #icon>
          <UiIcon
            name="cloud-download"
            :size="16"
          />
        </template>
        {{ t('mods.onlineSearch') }}
      </NButton>
    </div>

    <!-- 加载中 -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <NSpin size="medium" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="filteredMods.length === 0"
      class="empty-state"
    >
      <UiIcon
        name="cube"
        :size="48"
        class="empty-icon"
      />
      <p class="empty-text">
        {{ t('mods.empty') }}
      </p>
    </div>

    <!-- 模组列表 -->
    <div
      v-else
      class="mods-list"
    >
      <div
        v-for="mod in filteredMods"
        :key="mod.filename"
        class="mod-item"
        :style="{ opacity: mod.enabled ? 1 : 0.5 }"
      >
        <div class="mod-icon">
          <UiIcon
            name="cube"
            :size="20"
          />
        </div>

        <div class="mod-info">
          <div class="mod-name">
            {{ mod.name }}
          </div>
          <div class="mod-meta">
            <span class="mod-version-tag">{{ mod.version || '--' }}</span>
            <span
              v-if="mod.author"
              class="mod-author"
            >by {{ mod.author }}</span>
            <span :class="['loader-tag', 'loader-' + getLoaderClass(mod.loader_type)]">
              {{ getLoaderLabel(mod.loader_type) }}
            </span>
            <span
              v-if="mod.game_version"
              class="mod-game-version"
            >
              MC {{ mod.game_version }}
            </span>
          </div>
        </div>

        <div class="mod-actions">
          <NSwitch
            :value="mod.enabled"
            size="small"
            @update:value="(val: boolean) => handleToggle(mod, val)"
          />
          <NButton
            size="tiny"
            type="error"
            quaternary
            @click="handleRemove(mod)"
          >
            <template #icon>
              <UiIcon
                name="trash"
                :size="14"
              />
            </template>
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSwitch, NSpin, NSelect } from 'naive-ui'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { getLoaderClass, getLoaderLabel } from '@/utils/loader'

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

/**
 * 从后端配置读取当前游戏路径。
 * @returns 第一个已配置的游戏路径，失败时返回默认路径
 */
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
  } catch { /* 读取失败时使用默认路径 */ }
  return './.minecraft'
}

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

<style scoped src="@/styles/ModsTab.css"></style>
