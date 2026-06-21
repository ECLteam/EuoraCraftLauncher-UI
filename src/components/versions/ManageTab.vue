<template>
  <div class="tab-pane">
    <div class="management-layout">
      <!-- 左侧路径列表 -->
      <div class="panel paths-panel">
        <div class="panel-header">
          <h3>
            <UiIcon name="folder" />
            {{ t('versions.manage.gamePath') }}
          </h3>
          <UiButton
            variant="primary"
            size="sm"
            icon="add"
            class="add-path-btn compact"
            @click="addNewPath"
          >
            {{ t('common.add') }}
          </UiButton>
        </div>
        
        <div class="panel-content paths-list">
          <div
            v-for="(item, index) in gamePaths"
            :key="index"
            :class="['path-item', { active: selectedPathIndex === index }]"
            @click="selectPath(index)"
          >
            <div class="path-info">
              <UiIcon name="folder" />
              <div class="path-text-wrapper">
                <span class="path-name">{{ item.name || t('versions.manage.unnamedPath') }}</span>
                <span class="path-location" :title="item.path">{{ item.path }}</span>
              </div>
            </div>
            <div class="path-actions">
              <UiButton 
                v-if="!item.protected" 
                variant="ghost"
                shape="circle"
                size="sm"
                icon="settings"
                :title="t('common.edit')"
                @click.stop="editPath(index)"
              />
              <UiButton 
                v-if="!item.protected && !item.path.includes('.minecraft')" 
                variant="ghost"
                shape="circle"
                size="sm"
                icon="trash"
                :title="t('common.delete')"
                @click.stop="removePath(index)"
              />
              <span v-if="item.protected" class="protected-badge">
                <UiIcon name="lock" />
              </span>
            </div>
          </div>
        </div>
        
        <div class="panel-footer">
          {{ t('versions.manage.pathCount', { count: gamePaths.length }) }}
        </div>
      </div>
      
      <!-- 右侧版本列表 -->
      <div class="panel versions-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>
              <UiIcon name="cube" />
              {{ currentPathName }}
            </h3>
            <span v-if="currentPathVersions.length > 0" class="version-count">
              {{ t('versions.manage.versionCount', { count: currentPathVersions.length }) }}
            </span>
          </div>
          <div class="toolbar-right">
            <UiButton
              variant="secondary"
              size="sm"
              :icon="refreshLoading ? 'icon-spinner spin' : 'icon-refresh'"
              @click="handleRefresh"
              :disabled="refreshLoading"
            >
              {{ t('common.refresh') }}
            </UiButton>
            <UiInput
              v-model="searchQuery"
              :placeholder="t('versions.manage.searchVersion')"
              icon="search"
              clearable
              class="search-input"
            />
          </div>
        </div>
        
        <div class="panel-content">
          <!-- 未选择路径 -->
          <div v-if="selectedPathIndex === -1" class="empty-state">
            <UiIcon name="folder" />
            <p>{{ t('versions.manage.selectPathHint') }}</p>
          </div>
          
          <!-- 加载中 -->
          <div v-else-if="loading" class="loading-container">
            <UiIcon name="spinner" class="spin" style="font-size: 32px;" />
            <p>{{ t('versions.manage.scanning') }}</p>
          </div>

          <!-- 空状态 -->
          <div v-else-if="currentPathVersions.length === 0" class="empty-state">
            <UiIcon name="cube" />
            <p>{{ t('versions.manage.noVersionsFound') }}</p>
            <p class="hint">{{ t('versions.manage.currentPath') }}: {{ currentPath?.path }}</p>
          </div>

          <!-- 版本列表 -->
          <div v-else class="versions-strip">
            <div
              v-for="version in filteredVersions"
              :key="version.versionId"
              class="version-strip-item"
              :class="{
                'strip-success': !version.isBroken,
                'strip-failure': version.isBroken
              }"
            >
              <div class="strip-icon">
                <UiIcon :name="getLoaderIcon(version.primaryLoader)" />
              </div>
              <span class="strip-name">{{ version.versionId }}</span>
              <span class="strip-mcver">{{ version.vanillaName || t('versions.manage.unknownVersion') }}</span>
              <span class="badge" :class="'badge-' + getLoaderClass(version.primaryLoader)">
                {{ getLoaderName(version.primaryLoader) }}
              </span>
              <span class="badge" :class="version.isBroken ? 'badge-error' : 'badge-success'">
                {{ version.isBroken ? t('versions.manage.statusBroken') : t('versions.manage.statusAvailable') }}
              </span>
              <div v-if="version.error" class="strip-error" :title="version.error">
                <UiIcon name="warning" />
              </div>
              <div class="strip-actions">
                <UiButton
                  v-if="!version.isBroken"
                  variant="primary"
                  size="sm"
                  icon="play"
                  @click="handleLaunch(version)"
                >
                  {{ t('common.launch') }}
                </UiButton>
                <UiButton
                  variant="ghost"
                  shape="circle"
                  size="sm"
                  icon="icon-trash"
                  :title="t('common.delete')"
                  @click="handleDelete(version)"
                />
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

    <!-- 添加/编辑路径对话框 -->
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
              :class="{ 'disabled-input': isDefaultPath }"
            />
            <UiButton 
              variant="secondary" 
              @click="browseForPath"
              :disabled="isDefaultPath"
            >
              {{ t('common.browse') }}
            </UiButton>
          </div>
          <div v-if="isDefaultPath" class="path-tip">
            <UiIcon name="info" size="14" />
            {{ t('versions.manage.defaultPathTip') }}
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <UiButton variant="secondary" @click="showPathModal = false">{{ t('common.cancel') }}</UiButton>
          <UiButton 
            variant="primary" 
            @click="savePath"
            :disabled="!pathForm.name || !pathForm.path"
          >
            {{ isEditing ? t('common.save') : t('common.add') }}
          </UiButton>
        </div>
      </template>
    </ContentModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import backend from '@/api/client'
import type { ScannedVersion } from '@/types/api'
import ContentModal from '@/components/modals/ContentModal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiInput from '@/components/ui/Input.vue'

interface GamePath {
  name: string
  path: string
  protected?: boolean
}

const { t } = useI18n()
const message = useGlassMessage()

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

// 通用确认弹窗状态
const showConfirmModal = ref(false)
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
    v.folder.toLowerCase().includes(query) ||
    (v.version && v.version.toLowerCase().includes(query))
  )
})

onMounted(async () => {
  await fetchGamePaths()
})

// 离开页面时关闭弹窗
onBeforeUnmount(() => {
  showPathModal.value = false
})

const fetchGamePaths = async () => {
  try {
    const response = await backend.config.get('game')
    if (response.success && response.data) {
      const paths = response.data.minecraft_paths || []
      // 兼容旧格式（字符串数组）
      gamePaths.value = paths.map((p: any) => {
        if (typeof p === 'string') {
          return { name: getPathNameFromPath(p), path: p }
        }
        return p
      })
      // 默认选中第一个
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

const scanCurrentPath = async () => {
  if (!currentPath.value) return
  
  loading.value = true
  try {
    const response = await backend.command('scan_versions', {paths: [currentPath.value.path]})
    if (response.success) {
      // 为每个版本标记所属路径
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
      // 如果名称未填写，自动生成
      if (!pathForm.value.name) {
        pathForm.value.name = getPathNameFromPath(response.data.path)
      }
    }
  } catch (error) {
    console.error(t('versions.manage.selectDirFailed'), error)
  }
}

// 检查是否为默认路径
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
        // 编辑模式
        const originalPath = gamePaths.value[editingIndex.value]
        // 如果是默认路径，保持原路径不变，只更新名称
        if (isDefaultPath.value) {
          updatedPaths[editingIndex.value] = {
            ...originalPath,
            name: pathForm.value.name
          }
        } else {
          updatedPaths[editingIndex.value] = { ...pathForm.value }
        }
      } else {
        // 添加模式
        updatedPaths.push({ ...pathForm.value })
      }
      
      gamePaths.value = updatedPaths
      
      // 保存到后端
      await backend.config.set('game', { 
        ...configResponse.data, 
        minecraft_paths: updatedPaths 
      })
      
      message.success(isEditing.value ? t('versions.manage.pathUpdated') : t('versions.manage.pathAdded'), 2000)
      
      // 如果是新添加的，选中它
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

  // 检查是否是受保护路径（默认路径）
  if (path.protected) {
    message.warning(t('versions.manage.protectedPath'))
    return
  }

  // 确认删除
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
        console.error(t('versions.manage.updateConfigFailed'), error)
        // 恢复删除
        gamePaths.value.splice(index, 0, removed)
        return
      }

      // 调整选中索引
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

  showLaunchProgress({ cancelable: true })

  try {
    const launchResult = await backend.command('launch_instance', {
      version: version.versionId,
      gamePath: currentPath.value.path
    })

    if (!launchResult.success || !launchResult.data?.taskId) {
      setLaunchProgress(0, 'error', launchResult.message || '启动失败')
      message.error(launchResult.message || '启动失败')
      setTimeout(hideLaunchProgress, 1500)
      return
    }

    const taskId = launchResult.data.taskId

    // 真实轮询后端进度
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await backend.command('get_launch_status', taskId)
        if (!statusRes.success || !statusRes.data) {
          return
        }

        const status = statusRes.data
        setLaunchProgress(status.percent, status.stage as any, status.message)

        if (status.error) {
          clearInterval(pollInterval)
          setLaunchProgress(status.percent, 'error', status.error)
          message.error(status.error)
          setTimeout(hideLaunchProgress, 1500)
          return
        }

        if (status.completed) {
          clearInterval(pollInterval)
          setLaunchProgress(100, 'success', '启动成功')
          message.success(`正在启动 ${version.versionId}`)
          setTimeout(hideLaunchProgress, 800)
        }
      } catch (pollErr) {
        console.warn('[Launch] 轮询异常:', pollErr)
      }
    }, 500)
  } catch (e) {
    console.error('启动失败:', e)
    setLaunchProgress(0, 'error', '启动过程中发生错误')
    message.error('启动过程中发生错误')
    setTimeout(hideLaunchProgress, 1500)
  }
}

const handleDelete = async (version: ScannedVersion) => {
  if (!currentPath.value) return

  openConfirm(
    t('common.confirm'),
    t('versions.manage.confirmDeleteVersion', { name: version.versionId }),
    async () => {
      try {
        // 调用后端删除版本
        const result = await backend.command('uninstall_version', {version_id: version.versionId})
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

const getLoaderIcon = (loaderType: string | null) => {
  switch (loaderType?.toLowerCase()) {
    case 'fabric': return 'lab'
    case 'forge': return 'fire'
    case 'quilt': return 'grid'
    default: return 'cube'
  }
}

const getLoaderName = (loaderType: string | null) => {
  if (!loaderType || loaderType === 'Unknown' || loaderType === 'release' || loaderType === 'snapshot' || loaderType === 'Vanilla') {
    return t('versions.manage.vanilla')
  }
  return loaderType.charAt(0).toUpperCase() + loaderType.slice(1)
}

const getLoaderClass = (loaderType: string | null) => {
  switch (loaderType?.toLowerCase()) {
    case 'fabric': return 'fabric';
    case 'forge': return 'forge';
    case 'quilt': return 'quilt';
    default: return 'vanilla';
  }
}
</script>
<style scoped src="@/styles/ManageTab.css"></style>