<template>
  <div class="manage-page">
    <div
      id="plugin-slot-versions-manage-top"
      class="plugin-slot-container"
    />
    <!-- 统一容器：路径列表 + 版本列表 -->
    <div class="manage-container">
      <!-- 左侧路径列表 -->
      <div class="path-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <UiIcon
              name="folder"
              :size="16"
            />
            {{ t('versions.manage.gamePath') }}
          </h3>
          <button
            class="btn-add"
            :title="t('common.add')"
            @click="addNewPath"
          >
            <UiIcon
              name="add"
              :size="16"
            />
          </button>
        </div>

        <div class="path-list">
          <div
            v-for="(item, index) in gamePaths"
            :key="index"
            :class="['path-item', { active: selectedPathIndex === index }]"
            @click="selectPath(index)"
          >
            <div class="path-indicator" />
            <UiIcon
              name="folder"
              :size="16"
              class="path-icon"
            />
            <div class="path-info">
              <div class="path-name-row">
                <span class="path-name">{{ item.name || t('versions.manage.unnamedPath') }}</span>
                <span
                  :class="['path-version-count', { 'is-empty': getPathVersionCount(item.path) === 0 }]"
                >
                  {{ t('versions.manage.versionCount', { count: getPathVersionCount(item.path) }) }}
                </span>
              </div>
              <span
                class="path-location"
                :title="item.path"
              >{{ item.path }}</span>
            </div>
            <div
              v-if="!item.protected"
              class="path-actions"
            >
              <button
                class="path-action-btn"
                :title="t('common.edit')"
                @click.stop="editPath(index)"
              >
                <UiIcon
                  name="settings"
                  :size="14"
                />
              </button>
              <button
                class="path-action-btn path-action-delete"
                :title="t('common.delete')"
                @click.stop="removePath(index)"
              >
                <UiIcon
                  name="trash"
                  :size="14"
                />
              </button>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <span class="footer-text">{{ t('versions.manage.pathCount', { count: gamePaths.length }) }}</span>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="path-divider" />

      <!-- 右侧版本列表 -->
      <div class="version-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3 class="panel-title">
              <UiIcon
                name="cube"
                :size="16"
              />
              {{ currentPathName }}
            </h3>
            <span
              v-if="currentPathVersions.length > 0"
              class="version-count-badge"
            >
              {{ t('versions.manage.versionCount', { count: currentPathVersions.length }) }}
            </span>
          </div>
          <div class="header-right">
            <button
              class="btn-refresh"
              :disabled="refreshLoading"
              @click="handleRefresh"
            >
              <UiIcon
                name="refresh"
                :size="14"
              />
              {{ t('common.refresh') }}
            </button>
            <button
              class="btn-install-version"
              @click="navigateToInstall"
            >
              <UiIcon
                name="download"
                :size="14"
              />
              {{ t('versions.download.installNew') }}
            </button>
            <div class="search-box">
              <UiIcon
                name="search"
                :size="16"
                class="search-icon"
              />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('versions.manage.searchVersion')"
                class="search-input"
              >
              <button
                v-if="searchQuery"
                class="search-clear"
                type="button"
                @click="searchQuery = ''"
              >
                <UiIcon
                  name="close"
                  :size="14"
                />
              </button>
            </div>
          </div>
        </div>

        <div class="version-content">
          <!-- 未选择路径 -->
          <div
            v-if="selectedPathIndex === -1"
            class="empty-state"
          >
            <UiIcon
              name="folder"
              :size="48"
              class="empty-icon"
            />
            <p class="empty-text">
              {{ t('versions.manage.selectPathHint') }}
            </p>
            <p
              v-if="gamePaths.length === 0"
              class="empty-hint"
            >
              {{ t('versions.manage.addPathToStart') }}
            </p>
            <button
              v-if="gamePaths.length === 0"
              class="btn-primary"
              @click="addNewPath"
            >
              <UiIcon
                name="add"
                :size="16"
              />
              {{ t('common.add') }}
            </button>
          </div>

          <!-- 加载中 -->
          <div
            v-else-if="loading"
            class="loading-state"
          >
            <UiIcon
              name="spinner"
              class="spin"
              :size="24"
            />
            <p>{{ t('versions.manage.scanning') }}</p>
          </div>

          <!-- 空状态 -->
          <div
            v-else-if="currentPathVersions.length === 0"
            class="empty-state"
          >
            <UiIcon
              name="cube"
              :size="48"
              class="empty-icon"
            />
            <p class="empty-text">
              {{ t('versions.manage.noVersionsFound') }}
            </p>
            <p class="empty-hint">
              {{ t('versions.manage.currentPath') }}: {{ currentPath?.path }}
            </p>
          </div>

          <!-- 版本列表 -->
          <div
            v-else
            class="version-table"
          >
            <div class="table-header">
              <span class="col-icon" />
              <span class="col-name">{{ t('versions.manage.versionName') }}</span>
              <span class="col-type">{{ t('versions.manage.loaderType') }}</span>
              <span class="col-status">{{ t('versions.manage.status') }}</span>
              <span class="col-actions" />
            </div>

            <div class="table-body">
              <div
                v-for="version in filteredVersions"
                :key="version.versionId"
                :class="['table-row', { selected: versionManager.selectedVersion === version.versionId }]"
                @click="handleSelectVersion(version)"
              >
                <div class="col-icon">
                  <div
                    class="version-icon"
                    :class="[
                      getVersionTypeClass(version),
                      { 'has-image': Boolean(getManageVersionImage(version)) },
                    ]"
                  >
                    <img
                      v-if="getManageVersionImage(version)"
                      :src="getManageVersionImage(version)"
                      alt=""
                      class="version-icon-img"
                    >
                    <UiIcon
                      v-else
                      :name="getManageVersionIcon(version.primaryLoader)"
                      :size="18"
                    />
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
                    <UiIcon
                      name="settings"
                      :size="14"
                    />
                  </button>
                  <button
                    v-if="!version.isBroken"
                    class="btn-action btn-play"
                    :title="t('common.launch')"
                    @click.stop="handleLaunch(version)"
                  >
                    <UiIcon
                      name="play"
                      :size="14"
                    />
                  </button>
                  <button
                    class="btn-action btn-delete"
                    :title="t('common.delete')"
                    @click.stop="handleDelete(version)"
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
      </div>
    </div>

    <!-- 确认弹窗 -->
    <Modal
      v-model:visible="showConfirmModal"
      type="confirm"
      :title="confirmTitle"
      :content="confirmContent"
      danger
      @confirm="handleConfirmAction"
    />

    <!-- 添加/编辑路径弹窗 -->
    <Modal
      v-model:visible="showPathModal"
      :title="isEditing ? t('versions.manage.editPath') : t('versions.manage.addGamePath')"
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
              :disabled="isDefaultPath"
              @click="browseForPath"
            >
              {{ t('common.browse') }}
            </UiButton>
          </div>
        </div>
      </div>

      <template #footer>
        <UiButton
          variant="secondary"
          @click="showPathModal = false"
        >
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton
          variant="primary"
          :disabled="!pathForm.name || !pathForm.path"
          @click="savePath"
        >
          {{ isEditing ? t('common.save') : t('common.add') }}
        </UiButton>
      </template>
    </Modal>

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
import backend from '@/api/client'
import Modal from '@/components/modals/Modal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiInput from '@/components/ui/Input.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import { useVersionManager } from '@/composables/useVersionManager'
import {
  LAUNCH_PROGRESS,
  DOWNLOAD_BASE_PROGRESS,
  DOWNLOAD_PROGRESS_SCALE,
  LAUNCH_SUCCESS_HIDE_DELAY,
  LAUNCH_ERROR_HIDE_DELAY,
} from '@/config/game'
import { getVersionImage } from '@/config/version'
import { getLoaderIcon, getLoaderImage, getLoaderName, getLoaderClass } from '@/utils/loader'
import VersionDetailModal from '@/views/versions/VersionDetailModal.vue'
import type { GameConfig, LaunchProgress, MinecraftPathEntry, ScannedVersion } from '@/types/api'

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
    const response = await backend.config.get<GameConfig>('game')
    if (response.success && response.data) {
      const paths = response.data.minecraft_paths || []
      gamePaths.value = paths.map((p: MinecraftPathEntry) => {
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
  versionManager.selectVersion(version.versionId, currentPath.value?.path)
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
  const path = gamePaths.value[index]
  if (!path) return
  isEditing.value = true
  editingIndex.value = index
  pathForm.value = { ...path }
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
  return path?.protected || path?.path.includes('.minecraft') || false
})

const savePath = async () => {
  if (!pathForm.value.name || !pathForm.value.path) return

  try {
    const configResponse = await backend.config.get<GameConfig>('game')
    if (configResponse.success && configResponse.data) {
      const updatedPaths = [...gamePaths.value]

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
  if (!path) return
  if (path.protected) {
    message.warning(t('versions.manage.protectedPath'))
    return
  }

  openConfirm(
    t('common.confirm'),
    t('versions.manage.confirmDeletePath', { name: path.name }),
    async () => {
      const removed = gamePaths.value[index]
      if (!removed) return
      gamePaths.value.splice(index, 1)

      try {
        const configResponse = await backend.config.get<GameConfig>('game')
        if (configResponse.success && configResponse.data) {
          await backend.config.set('game', {
            ...configResponse.data,
            minecraft_paths: gamePaths.value
          })
        }
      } catch {
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
  const unlisten = backend.on('game:launch_progress', (payload: LaunchProgress) => {
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
      setTimeout(hideLaunchProgress, LAUNCH_SUCCESS_HIDE_DELAY)
      unlisten()
    } else if (phase === 'error') {
      setLaunchProgress(0, 'error', msg)
      setTimeout(hideLaunchProgress, LAUNCH_ERROR_HIDE_DELAY)
      unlisten()
    } else if (phase === 'downloading' && typeof pct === 'number') {
      setLaunchProgress(DOWNLOAD_BASE_PROGRESS + pct * DOWNLOAD_PROGRESS_SCALE, 'downloading_assets', msg)
    } else if (phase === 'checking') {
      setLaunchProgress(LAUNCH_PROGRESS.checking!, 'checking_files', msg)
    } else if (phase === 'files_checked') {
      setLaunchProgress(LAUNCH_PROGRESS.files_checked!, 'files_checked', msg)
    } else if (phase === 'building_args') {
      setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.building_args!, 'building_params', msg)
    } else if (phase === 'args_built') {
      setLaunchProgress(LAUNCH_PROGRESS.args_built!, 'args_built', msg)
    } else if (phase === 'natives_done') {
      setLaunchProgress(LAUNCH_PROGRESS.natives_done!, 'natives_done', msg)
    } else if (phase === 'about_to_launch') {
      setLaunchProgress(LAUNCH_PROGRESS.about_to_launch!, 'about_to_launch', msg)
    } else if (phase === 'launching') {
      setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.launching!, 'launching', msg)
    } else {
      setLaunchProgress(2, 'prepare', msg)
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
  const gamePath = currentPath.value.path

  openConfirm(
    t('common.confirm'),
    t('versions.manage.confirmDeleteVersion', { name: version.versionId }),
    async () => {
      try {
        const result = await backend.command('uninstall_version', {
          version_id: version.versionId,
          game_path: gamePath
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

/**
 * 获取版本类型 CSS 类（匹配版本下载页）
 */
function getVersionTypeClass(version: ScannedVersion): string {
  return version.versionType
}

/**
 * 获取版本管理页的版本图标（匹配版本下载页风格）
 */
function getManageVersionIcon(loader: string | null | undefined): string {
  return getLoaderIcon(loader)
}

function getManageVersionImage(version: ScannedVersion): string {
  return getLoaderImage(version.primaryLoader) || getVersionImage(version.versionType)
}

// ── 版本安装 ──

function navigateToInstall() {
  router.push('/versions/versions')
}
</script>

<style scoped src="@/styles/views/versions/ManageTab.css"></style>
