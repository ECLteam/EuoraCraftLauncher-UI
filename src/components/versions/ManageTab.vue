<template>
  <div class="manage-page">
    <!-- 统一容器：路径列表 + 版本列表 -->
    <div class="manage-container">
      <!-- 左侧路径列表 -->
      <div class="path-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <UiIcon name="folder" :size="16" />
            {{ t('versions.manage.gamePath') }}
          </h3>
          <button class="btn-add" @click="addNewPath" :title="t('common.add')">
            <UiIcon name="add" :size="16" />
          </button>
        </div>

        <div class="path-list">
          <div
            v-for="(item, index) in gamePaths"
            :key="index"
            :class="['path-item', { active: selectedPathIndex === index }]"
            @click="selectPath(index)"
          >
            <div class="path-indicator"></div>
            <UiIcon name="folder" :size="16" class="path-icon" />
            <div class="path-info">
              <div class="path-name-row">
                <span class="path-name">{{ item.name || t('versions.manage.unnamedPath') }}</span>
                <span
                  :class="['path-version-count', { 'is-empty': getPathVersionCount(item.path) === 0 }]"
                >
                  {{ t('versions.manage.versionCount', { count: getPathVersionCount(item.path) }) }}
                </span>
              </div>
              <span class="path-location" :title="item.path">{{ item.path }}</span>
            </div>
            <div v-if="!item.protected" class="path-actions">
              <button
                class="path-action-btn"
                :title="t('common.edit')"
                @click.stop="editPath(index)"
              >
                <UiIcon name="settings" :size="14" />
              </button>
              <button
                class="path-action-btn path-action-delete"
                :title="t('common.delete')"
                @click.stop="removePath(index)"
              >
                <UiIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <span class="footer-text">{{ t('versions.manage.pathCount', { count: gamePaths.length }) }}</span>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="path-divider"></div>

      <!-- 右侧版本列表 -->
      <div class="version-panel">
      <div class="panel-header">
        <div class="header-left">
          <h3 class="panel-title">
            <UiIcon name="cube" :size="16" />
            {{ currentPathName }}
          </h3>
          <span v-if="currentPathVersions.length > 0" class="version-count-badge">
            {{ t('versions.manage.versionCount', { count: currentPathVersions.length }) }}
          </span>
        </div>
        <div class="header-right">
          <button
            class="btn-refresh"
            @click="handleRefresh"
            :disabled="refreshLoading"
          >
            <UiIcon name="refresh" :size="14" />
            {{ t('common.refresh') }}
          </button>
          <button
            class="btn-install-version"
            @click="navigateToInstall"
          >
            <UiIcon name="download" :size="14" />
            {{ t('versions.download.installNew') }}
          </button>
          <div class="search-box">
            <UiIcon name="search" :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('versions.manage.searchVersion')"
              class="search-input"
            />
            <button
              v-if="searchQuery"
              class="search-clear"
              @click="searchQuery = ''"
              type="button"
            >
              <UiIcon name="close" :size="14" />
            </button>
          </div>
        </div>
      </div>

      <div class="version-content">
        <!-- 未选择路径 -->
        <div v-if="selectedPathIndex === -1" class="empty-state">
          <UiIcon name="folder" :size="48" class="empty-icon" />
          <p class="empty-text">{{ t('versions.manage.selectPathHint') }}</p>
          <p v-if="gamePaths.length === 0" class="empty-hint">{{ t('versions.manage.addPathToStart') }}</p>
          <button v-if="gamePaths.length === 0" class="btn-primary" @click="addNewPath">
            <UiIcon name="add" :size="16" />
            {{ t('common.add') }}
          </button>
        </div>

        <!-- 加载中 -->
        <div v-else-if="loading" class="loading-state">
          <UiIcon name="spinner" class="spin" :size="24" />
          <p>{{ t('versions.manage.scanning') }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="currentPathVersions.length === 0" class="empty-state">
          <UiIcon name="cube" :size="48" class="empty-icon" />
          <p class="empty-text">{{ t('versions.manage.noVersionsFound') }}</p>
          <p class="empty-hint">{{ t('versions.manage.currentPath') }}: {{ currentPath?.path }}</p>
        </div>

        <!-- 版本列表 -->
        <div v-else class="version-table">
          <div class="table-header">
            <span class="col-icon"></span>
            <span class="col-name">{{ t('versions.manage.versionName') }}</span>
            <span class="col-type">{{ t('versions.manage.loaderType') }}</span>
            <span class="col-status">{{ t('versions.manage.status') }}</span>
            <span class="col-actions"></span>
          </div>

          <div class="table-body">
            <div
              v-for="version in filteredVersions"
              :key="version.versionId"
              :class="['table-row', { selected: versionManager.selectedVersion === version.versionId }]"
              @click="handleSelectVersion(version)"
            >
              <div class="col-icon">
                <div class="version-icon">
                  <UiIcon :name="getLoaderIcon(version.primaryLoader)" :size="18" />
                </div>
              </div>
              <div class="col-name">
                <span class="version-name">{{ version.versionId }}</span>
                <span class="version-mcver">{{ version.vanillaName || t('versions.manage.unknownVersion') }}</span>
              </div>
              <div class="col-type">
                <span :class="['badge', 'badge-' + getLoaderClass(version.primaryLoader)]">
                  {{ getLoaderDisplayName(version.primaryLoader) }}
                </span>
              </div>
              <div class="col-status">
                <span :class="['badge', version.isBroken ? 'badge-error' : 'badge-success']">
                  {{ version.isBroken ? t('versions.manage.statusBroken') : t('versions.manage.statusAvailable') }}
                </span>
              </div>
              <div class="col-actions">
                <button
                  class="btn-action btn-settings"
                  :title="t('settings.title')"
                  @click.stop="handleOpenDetail(version)"
                >
                  <UiIcon name="settings" :size="14" />
                </button>
                <button
                  v-if="!version.isBroken"
                  class="btn-action btn-play"
                  :title="t('common.launch')"
                  @click.stop="handleLaunch(version)"
                >
                  <UiIcon name="play" :size="14" />
                </button>
                <button
                  class="btn-action btn-delete"
                  :title="t('common.delete')"
                  @click.stop="handleDelete(version)"
                >
                  <UiIcon name="trash" :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- 确认弹窗 -->
    <ContentModal
      v-model:visible="showConfirmModal"
      type="confirm"
      :title="confirmTitle"
      :content="confirmContent"
      danger
      show-backdrop
      @confirm="handleConfirmAction"
    />

    <!-- 添加/编辑路径弹窗 -->
    <ContentModal
      v-model:visible="showPathModal"
      :title="isEditing ? t('versions.manage.editPath') : t('versions.manage.addGamePath')"
      show-backdrop
    >
      <div class="path-form">
        <div class="form-group">
          <label>{{ t('versions.manage.pathName') }}</label>
          <UiInput
            v-model="pathForm.name"
            :placeholder="t('versions.manage.pathNamePlaceholder')"
          />
        </div>
        <div class="form-group">
          <label>{{ t('versions.manage.pathLocation') }}</label>
          <div class="input-with-button">
            <UiInput
              v-model="pathForm.path"
              :placeholder="t('versions.manage.pathLocationPlaceholder')"
              :readonly="isDefaultPath"
            />
            <UiButton
              variant="secondary"
              @click="browseForPath"
              :disabled="isDefaultPath"
            >
              {{ t('common.browse') }}
            </UiButton>
          </div>
        </div>
      </div>

      <template #footer>
        <UiButton variant="secondary" @click="showPathModal = false">{{ t('common.cancel') }}</UiButton>
        <UiButton
          variant="primary"
          @click="savePath"
          :disabled="!pathForm.name || !pathForm.path"
        >
          {{ isEditing ? t('common.save') : t('common.add') }}
        </UiButton>
      </template>
    </ContentModal>

    <!-- 版本设置全屏弹窗 -->
    <VersionDetailModal
      v-model:visible="showDetailModal"
      :version="detailVersion"
      @launch="handleDetailLaunch"
      @delete="handleDetailDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import { useVersionManager } from '@/composables/useVersionManager'
import backend from '@/api/client'
import { getLoaderIcon, getLoaderName, getLoaderClass } from '@/utils/loader'
import type { ScannedVersion } from '@/types/api'
import ContentModal from '@/components/modals/ContentModal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiInput from '@/components/ui/Input.vue'
import VersionDetailModal from '@/components/versions/VersionDetailModal.vue'

interface GamePath {
  name: string
  path: string
  protected?: boolean
}

const { t } = useI18n()
const router = useRouter()
const message = useGlassMessage()
const versionManager = useVersionManager(t)

const gamePaths = ref<GamePath[]>([])
const selectedPathIndex = ref<number>(-1)
const showPathModal = ref(false)
const isEditing = ref(false)
const editingIndex = ref(-1)

const pathForm = ref<GamePath>({ name: '', path: '' })

const loading = ref(false)
const refreshLoading = ref(false)
const searchQuery = ref('')
const scannedVersions = ref<ScannedVersion[]>([])

const showConfirmModal = ref(false)
const showDetailModal = ref(false)
const detailVersion = ref<ScannedVersion | null>(null)
const confirmTitle = ref('')
const confirmContent = ref('')
const confirmAction = ref<(() => void) | null>(null)

const openConfirm = (title: string, content: string, action: () => void) => {
  confirmTitle.value = title
  confirmContent.value = content
  confirmAction.value = action
  showConfirmModal.value = true
}

const handleConfirmAction = () => {
  confirmAction.value?.()
  confirmAction.value = null
}

const currentPath = computed(() =>
  selectedPathIndex.value >= 0 ? gamePaths.value[selectedPathIndex.value] : null
)

const currentPathName = computed(() =>
  currentPath.value?.name || t('versions.manage.versionList')
)

const currentPathVersions = computed(() => {
  if (!currentPath.value) return []
  return scannedVersions.value.filter(v => v.path === currentPath.value?.path)
})

const filteredVersions = computed(() => {
  const versions = currentPathVersions.value
  if (!searchQuery.value.trim()) return versions
  const query = searchQuery.value.toLowerCase()
  return versions.filter(v =>
    v.versionId.toLowerCase().includes(query) ||
    (v.displayName && v.displayName.toLowerCase().includes(query))
  )
})

function getPathVersionCount(path: string): number {
  return scannedVersions.value.filter(v => v.path === path).length
}

onMounted(async () => {
  await fetchGamePaths()
})

onBeforeUnmount(() => {
  showPathModal.value = false
})

const fetchGamePaths = async () => {
  try {
    const response = await backend.config.get('game')
    if (response.success && response.data) {
      const paths = response.data.minecraft_paths || []
      gamePaths.value = paths.map((p: any) => {
        if (typeof p === 'string') {
          return { name: getPathNameFromPath(p), path: p }
        }
        return p
      })
      if (gamePaths.value.length > 0 && selectedPathIndex.value === -1) {
        selectedPathIndex.value = 0
        await scanCurrentPath()
      }
    }
  } catch (error) {
    console.error(t('versions.manage.fetchConfigFailed'), error)
  }
}

const getPathNameFromPath = (path: string): string => {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || t('versions.manage.gamePath')
}

const handleSelectVersion = (version: ScannedVersion) => {
  versionManager.selectVersion(version.versionId)
}

const scanCurrentPath = async () => {
  if (!currentPath.value) return

  loading.value = true
  try {
    const response = await backend.command('scan_versions', {path: [currentPath.value.path]})
    if (response.success) {
      scannedVersions.value = (response.data || []).map((v: ScannedVersion) => ({
        ...v,
        path: currentPath.value!.path
      }))
    }
  } catch (error) {
    console.error(t('versions.manage.scanFailed'), error)
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  refreshLoading.value = true
  await scanCurrentPath()
  refreshLoading.value = false
}

const selectPath = async (index: number) => {
  selectedPathIndex.value = index
  await scanCurrentPath()
}

const addNewPath = () => {
  isEditing.value = false
  editingIndex.value = -1
  pathForm.value = { name: '', path: '' }
  showPathModal.value = true
}

const editPath = (index: number) => {
  isEditing.value = true
  editingIndex.value = index
  pathForm.value = { ...gamePaths.value[index] }
  showPathModal.value = true
}

const browseForPath = async () => {
  try {
    const response = await backend.command('select_directory')
    if (response.success && response.data?.path) {
      pathForm.value.path = response.data.path
      if (!pathForm.value.name) {
        pathForm.value.name = getPathNameFromPath(response.data.path)
      }
    }
  } catch (error) {
    console.error(t('versions.manage.selectDirFailed'), error)
  }
}

const isDefaultPath = computed(() => {
  if (!isEditing.value || editingIndex.value < 0) return false
  const path = gamePaths.value[editingIndex.value]
  return path.protected || path.path.includes('.minecraft')
})

const savePath = async () => {
  if (!pathForm.value.name || !pathForm.value.path) return

  try {
    const configResponse = await backend.config.get('game')
    if (configResponse.success && configResponse.data) {
      let updatedPaths = [...gamePaths.value]

      if (isEditing.value && editingIndex.value >= 0) {
        updatedPaths[editingIndex.value] = { ...pathForm.value }
      } else {
        updatedPaths.push({ ...pathForm.value })
      }

      gamePaths.value = updatedPaths

      await backend.config.set('game', {
        ...configResponse.data,
        minecraft_paths: updatedPaths
      })

      message.success(isEditing.value ? t('versions.manage.pathUpdated') : t('versions.manage.pathAdded'), 2000)

      if (!isEditing.value) {
        selectedPathIndex.value = updatedPaths.length - 1
        await scanCurrentPath()
      }
    }
  } catch (error) {
    console.error(t('versions.manage.saveFailed'), error)
    message.error(t('versions.manage.saveFailed'), 3000)
  }

  showPathModal.value = false
}

const removePath = async (index: number) => {
  const path = gamePaths.value[index]
  if (path.protected) {
    message.warning(t('versions.manage.protectedPath'))
    return
  }

  openConfirm(
    t('common.confirm'),
    t('versions.manage.confirmDeletePath', { name: path.name }),
    async () => {
      const removed = gamePaths.value[index]
      gamePaths.value.splice(index, 1)

      try {
        const configResponse = await backend.config.get('game')
        if (configResponse.success && configResponse.data) {
          await backend.config.set('game', {
            ...configResponse.data,
            minecraft_paths: gamePaths.value
          })
        }
      } catch (error) {
        gamePaths.value.splice(index, 0, removed)
        return
      }

      if (index === selectedPathIndex.value) {
        selectedPathIndex.value = Math.min(index, gamePaths.value.length - 1)
        await scanCurrentPath()
      } else if (index < selectedPathIndex.value) {
        selectedPathIndex.value--
      }

      message.success(t('versions.manage.pathRemoved', { name: removed.name }))
    }
  )
}

const { show: showLaunchProgress, hide: hideLaunchProgress, setProgress: setLaunchProgress } = globalLaunchProgress

const handleLaunch = async (version: ScannedVersion) => {
  if (!currentPath.value) return

  // 先跳转到游戏页面
  router.push({ name: 'game' })

  showLaunchProgress({ cancelable: true })

  // 监听启动进度事件
  const unlisten = backend.on('game:launch_progress', (payload: any) => {
    // 已取消则忽略后续事件
    if (globalLaunchProgress.progress.value.canceled) {
      unlisten()
      return
    }

    const phase = payload?.phase || ''
    const msg = payload?.message || ''
    const pct = payload?.percent

    if (phase === 'launched') {
      setLaunchProgress(100, 'success', msg)
      setTimeout(hideLaunchProgress, 1500)
      unlisten()
    } else if (phase === 'error') {
      setLaunchProgress(0, 'error', msg)
      setTimeout(hideLaunchProgress, 2000)
      unlisten()
    } else if (phase === 'downloading' && typeof pct === 'number') {
      setLaunchProgress(10 + pct * 0.38, 'downloading_assets', msg)
    } else if (phase === 'checking') {
      setLaunchProgress(5, 'checking_files', msg)
    } else if (phase === 'files_checked') {
      setLaunchProgress(50, 'files_checked', msg)
    } else if (phase === 'building_args') {
      setLaunchProgress(typeof pct === 'number' ? pct : 65, 'building_params', msg)
    } else if (phase === 'args_built') {
      setLaunchProgress(75, 'args_built', msg)
    } else if (phase === 'natives_done') {
      setLaunchProgress(85, 'natives_done', msg)
    } else if (phase === 'about_to_launch') {
      setLaunchProgress(92, 'about_to_launch', msg)
    } else if (phase === 'launching') {
      setLaunchProgress(typeof pct === 'number' ? pct : 95, 'launching', msg)
    } else {
      setLaunchProgress(2, 'prepare' as any, msg)
    }
  })

  try {
    setLaunchProgress(0, 'prepare', `正在准备启动 ${version.versionId}...`)

    const launchResult = await backend.command('launch_instance', {
      version_id: version.versionId,
      game_path: currentPath.value.path
    })

    if (!launchResult.success) {
      if (!globalLaunchProgress.progress.value.canceled) {
        setLaunchProgress(0, 'error', launchResult.message || '启动失败')
        message.error(launchResult.message || '启动失败')
      }
      setTimeout(hideLaunchProgress, 2000)
      return
    }

    if (!globalLaunchProgress.progress.value.canceled) {
      setLaunchProgress(100, 'launched', `游戏 ${version.versionId} 已启动`)
      message.success(`游戏 ${version.versionId} 已启动`)
    }
    setTimeout(hideLaunchProgress, 1500)
  } catch (e) {
    console.error('启动失败:', e)
    if (!globalLaunchProgress.progress.value.canceled) {
      setLaunchProgress(0, 'error', '启动过程中发生错误')
      message.error('启动过程中发生错误')
    }
    setTimeout(hideLaunchProgress, 2000)
  } finally {
    unlisten()
  }
}

const handleOpenDetail = (version: ScannedVersion) => {
  detailVersion.value = version
  showDetailModal.value = true
}

const handleDetailLaunch = (version: ScannedVersion) => {
  handleLaunch(version)
}

const handleDetailDelete = (version: ScannedVersion) => {
  handleDelete(version)
}

const handleDelete = async (version: ScannedVersion) => {
  if (!currentPath.value) return

  openConfirm(
    t('common.confirm'),
    t('versions.manage.confirmDeleteVersion', { name: version.versionId }),
    async () => {
      try {
        const result = await backend.command('uninstall_version', {
          version_id: version.versionId,
          game_path: currentPath.value.path
        })
        if (result.success) {
          message.success(t('versions.manage.versionDeleted', { name: version.versionId }))
          await scanCurrentPath()
        } else {
          message.error(result.message || t('versions.manage.deleteFailed'))
        }
      } catch (e) {
        console.error('删除失败:', e)
        message.error(t('versions.manage.deleteFailed'))
      }
    }
  )
}

/**
 * 获取加载器显示名称（含原版 i18n 处理）
 */
function getLoaderDisplayName(loaderType: string | null): string {
  if (!loaderType || loaderType === 'Unknown' || loaderType === 'release' || loaderType === 'snapshot' || loaderType === 'Vanilla') {
    return t('versions.manage.vanilla')
  }
  return getLoaderName(loaderType)
}

// ── 版本安装 ──

function navigateToInstall() {
  router.push('/versions/versions')
}
</script>

<style scoped>
.manage-page {
  display: flex;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

/* 统一容器：路径 + 版本在一个卡片内 */
.manage-container {
  flex: 1;
  display: flex;
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  overflow: hidden;
}

/* 左侧路径面板 */
.path-panel {
  width: 200px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.path-panel > .panel-header {
  height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--glass-divider);
}

.path-panel > .panel-header .panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  gap: 6px;
}

.path-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.path-item {
  display: flex;
  align-items: flex-start;
  height: 56px;
  padding: 8px 12px 8px 16px;
  cursor: pointer;
  position: relative;
  gap: 8px;
  transition: background 150ms ease-out;
}

.path-item:hover:not(.active) {
  background: var(--glass-item-hover);
}

/* 选中态：浅色 #F5F8FF / 深色 rgba(74,127,217,0.12) */
.path-item.active {
  background: #F5F8FF;
}

[data-theme="dark"] .path-item.active {
  background: rgba(74, 127, 217, 0.12);
}

.path-indicator {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--primary);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.path-item.active .path-indicator {
  opacity: 1;
}

.path-icon {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-top: 1px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.path-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 名称行：名称 + 版本数 */
.path-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

/* 名称 13px font-weight 500 */
.path-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 选中态名称加粗不换色 */
.path-item.active .path-name {
  font-weight: 600;
  color: var(--text-secondary);
}

/* 版本数 11px */
.path-version-count {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

/* 路径位置：超出部分 ... 截断 */
.path-location {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* "0 个版本" 用特定颜色 */
.path-version-count.is-empty {
  color: #AAAAAA;
}

[data-theme="dark"] .path-version-count.is-empty {
  color: #555860;
}

/* 浅色选中 #5C5C5C / 深色选中 #A0A3A8 */
.path-item.active .path-version-count {
  color: #5C5C5C;
}

[data-theme="dark"] .path-item.active .path-version-count {
  color: #A0A3A8;
}

.path-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 150ms ease-out;
  margin-top: 2px;
}

.path-item:hover .path-actions {
  opacity: 1;
}

.path-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.path-action-btn:hover {
  background: var(--glass-item-hover);
  color: var(--text-primary);
}

.path-action-delete:hover {
  color: var(--error);
}

/* 分隔线：加宽 + 加深颜色，增强分界感 */
.path-divider {
  width: 2px;
  background: var(--border);
  flex-shrink: 0;
  position: relative;
}

/* 上下边框延伸 */
.path-divider::before,
.path-divider::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
}

.path-divider::before {
  top: 0;
  background: var(--border);
}

.path-divider::after {
  bottom: 0;
  background: var(--border);
}

/* 右侧版本面板 */
.version-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid var(--divider);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
}

.version-count-badge {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-base-alt);
  padding: 2px 8px;
  border-radius: var(--r-xs);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 240px;
  height: 36px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  transition: border-color 150ms ease-out;
}

.search-box:focus-within {
  border-color: var(--border-hover);
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 32px 0 32px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  border-radius: var(--r-sm);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-clear {
  position: absolute;
  right: 6px;
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
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* 按钮 */
.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-add:hover {
  background: var(--primary-alpha);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-add:active {
  transform: scale(0.95);
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--s-sm);
  padding: 10px 20px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* 面板底部 */
.panel-footer {
  height: 28px;
  padding: 0 12px;
  border-top: 1px solid var(--divider);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.footer-text {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-tertiary);
}

/* 版本内容 */
.version-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-lg);
}

/* 表格 */
.version-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 36px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--divider);
  position: sticky;
  top: 0;
  background: var(--bg-elevated);
  z-index: 1;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 52px;
  border-bottom: 1px solid var(--divider);
  transition: background 150ms ease-out;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row.selected {
  background: var(--primary-alpha);
  border-left: 3px solid var(--primary);
}

.table-row:last-child {
  border-bottom: none;
}

.col-icon { width: 48px; flex-shrink: 0; }
.col-name { flex: 1; min-width: 0; }
.col-type { width: 80px; flex-shrink: 0; }
.col-status { width: 80px; flex-shrink: 0; }
.col-actions { width: 80px; flex-shrink: 0; display: flex; justify-content: flex-end; gap: 4px; }

.version-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  background: var(--primary-alpha);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}

.version-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}

.version-mcver {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 徽章 */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--r-xs);
  font-size: 11px;
  font-weight: 500;
}

.badge-vanilla { background: var(--bg-base-alt); color: var(--text-secondary); }
.badge-fabric { background: rgba(218, 190, 140, 0.15); color: #b8944a; }
.badge-forge { background: rgba(140, 130, 180, 0.15); color: #7a6eaa; }
.badge-quilt { background: rgba(140, 180, 160, 0.15); color: #5a9a72; }
.badge-success { background: var(--success-alpha); color: var(--success); }
.badge-error { background: var(--error-alpha); color: var(--error); }

/* 操作按钮 */
.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 150ms ease-out;
  opacity: 0;
}

.table-row:hover .btn-action {
  opacity: 1;
}

.btn-play {
  color: var(--primary);
}

.btn-play:hover {
  background: var(--primary-alpha);
}

.btn-delete {
  color: var(--text-tertiary);
}

.btn-delete:hover {
  color: var(--error);
  background: var(--error-alpha);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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

.empty-hint {
  font-size: 11px;
  color: var(--text-quaternary, var(--text-tertiary));
  margin: 0;
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--s-md);
  color: var(--text-secondary);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 安装按钮 */
.btn-install-version {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--r-sm);
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;
}

.btn-install-version:hover {
  background: var(--primary-hover);
}

/* 安装弹窗 */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--error);
}

.form-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--text-tertiary);
}

.version-display {
  padding: 8px 12px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.path-display {
  padding: 8px 12px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--text-secondary);
}

.loader-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loader-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms;
}

.loader-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.loader-btn.active {
  border-color: var(--primary);
  background: var(--primary-alpha);
  color: var(--primary);
}

/* 进度弹窗 */
.progress-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-md);
  padding: var(--s-xl) 0;
}

.progress-ring {
  color: var(--primary);
}

.progress-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

/* NeoForge / OptiFine 徽章 */
.badge-neoforge { background: rgba(140, 150, 200, 0.15); color: #6a7eb4; }
.badge-optifine { background: rgba(200, 180, 140, 0.15); color: #b8942a; }
</style>