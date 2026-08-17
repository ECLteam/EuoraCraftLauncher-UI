<template>
  <FullscreenModal
    v-model:visible="visible"
    :title="title"
    :showFooter="false"
    wrapperClass="version-detail-modal"
    bodyClass="version-detail-body"
  >
    <div class="vdm-shell">
      <aside class="vdm-nav ecl-surface">
        <div class="vdm-nav-identity">
          <button class="vdm-nav-icon-btn" title="更换实例图标" @click="iconPickerVisible = true">
            <InstanceIcon v-if="version" :version="version" :size="36" />
          </button>
          <div class="vdm-nav-copy">
            <strong>{{ version?.displayName || version?.versionId || '...' }}</strong>
            <span>{{ version?.versionId }} · {{ getLoaderName(version?.primaryLoader || 'vanilla') }}</span>
          </div>
        </div>

        <nav class="vdm-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['vdm-tab-button', { active: isTabActive(tab.id) }]"
            @click="selectTab(tab.id)"
          >
            <UiIcon :name="tab.icon" :size="15" />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
        <div id="plugin-slot-version-detail-tab" class="plugin-slot-container"></div>
      </aside>

      <main class="vdm-main">
        <div class="vdm-content">
          <div v-if="activeTab === 'overview'" class="vdm-page overview-page">
            <div class="info-card">
              <div class="info-card__header">{{ t('versions.detail.versionInfo') }}</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">{{ t('versions.detail.versionId') }}</span>
                  <span class="info-value">{{ version?.versionId || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('versions.detail.loader') }}</span>
                  <span class="info-value">{{ getLoaderName(version?.primaryLoader || 'vanilla') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('versions.detail.vanillaVersion') }}</span>
                  <span class="info-value">{{ version?.vanillaName || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <div class="info-card__header">{{ t('versions.detail.runStats') }}</div>
              <div v-if="statsLoading" class="settings-loading-state">
                <NSpin size="small" />
                <span>{{ t('versions.detail.loadingStats') }}</span>
              </div>
              <div v-else class="info-grid">
                <div class="info-item">
                  <span class="info-label">{{ t('versions.detail.launchCount') }}</span>
                  <span class="info-value">{{
                    t('versions.detail.launchCountValue', { count: runStats.launchCount })
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('versions.detail.lastRunDuration') }}</span>
                  <span class="info-value">{{ formatRunDuration(runStats.lastRunDurationSeconds) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ t('versions.detail.totalRunDuration') }}</span>
                  <span class="info-value">{{ formatRunDuration(runStats.totalRunDurationSeconds) }}</span>
                </div>
              </div>
            </div>

            <div class="actions-card">
              <div class="actions-card__header">{{ t('versions.detail.quickActions') }}</div>
              <div class="overview-actions">
                <NButton type="primary" secondary @click="handleLaunch">
                  <template #icon><UiIcon name="play" :size="15" /></template>
                  {{ t('versions.detail.launch') }}
                </NButton>
                <NButton secondary @click="handleOpenFolder">
                  <template #icon><UiIcon name="folder" :size="15" /></template>
                  {{ t('versions.detail.openFolder') }}
                </NButton>
                <NButton secondary :loading="crashAnalyzing" @click="handleAnalyzeCrash">
                  <template #icon><UiIcon name="alert-triangle" :size="15" /></template>
                  {{ t('versions.detail.analyzeCrash') }}
                </NButton>
                <NButton secondary @click="handleAction('repair')">
                  <template #icon><UiIcon name="check" :size="15" /></template>
                  校验文件
                </NButton>
                <NButton secondary @click="handleAction('clone')">
                  <template #icon><UiIcon name="copy" :size="15" /></template>
                  复制实例
                </NButton>
                <NButton secondary @click="handleAction('export')">
                  <template #icon><UiIcon name="archive" :size="15" /></template>
                  导出整合包
                </NButton>
                <NButton secondary @click="handleAction('import')">
                  <template #icon><UiIcon name="upload" :size="15" /></template>
                  导入整合包
                </NButton>
                <NButton type="error" secondary @click="handleDelete">
                  <template #icon><UiIcon name="trash" :size="15" /></template>
                  {{ t('versions.detail.delete') }}
                </NButton>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'profile'" class="vdm-page profile-page">
            <div class="info-card profile-card">
              <div class="info-card__header"><span>个性化</span></div>
              <div class="profile-form-grid">
                <label
                  ><span>实例别名</span><NInput v-model:value="profileForm.alias" maxlength="120" /><small
                    >磁盘目录仍为 {{ version?.versionId }}</small
                  ></label
                >
                <label
                  ><span>分类</span><NSelect v-model:value="profileForm.categoryId" :options="categoryOptions"
                /></label>
                <label class="profile-form-wide"
                  ><span>描述</span
                  ><NInput
                    v-model:value="profileForm.description"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    maxlength="1000"
                /></label>
                <label class="profile-form-wide"
                  ><span>标签（使用逗号分隔）</span
                  ><NInput v-model:value="profileForm.tagsText" placeholder="朋友服, 机械动力, 生存"
                /></label>
                <label
                  ><span>兼容元数据来源</span
                  ><NSelect v-model:value="profileForm.preferredExternalSource" :options="sourceOptions"
                /></label>
                <div class="profile-switches">
                  <span><NSwitch v-model:value="profileForm.favorite" />收藏</span>
                  <span><NSwitch v-model:value="profileForm.pinned" />置顶</span>
                  <span><NSwitch v-model:value="profileForm.hidden" />隐藏</span>
                </div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card__header">字段来源与恢复</div>
              <div class="field-source-list">
                <div v-for="field in profileFields" :key="field">
                  <span>{{ profileFieldLabel(field) }}</span
                  ><code>{{ version?.fieldSources?.[field] || 'auto' }}</code
                  ><NButton
                    v-if="version?.profileOverrides?.includes(field)"
                    size="tiny"
                    quaternary
                    @click="resetProfileField(field)"
                    >恢复自动</NButton
                  >
                </div>
              </div>
              <p v-for="warning in version?.sourceWarnings || []" :key="warning" class="source-warning">
                {{ warning }}
              </p>
            </div>
          </div>

          <div v-if="activeTab === 'mods'" class="vdm-page mods-page">
            <div
              class="mods-panel"
              @dragover.prevent
              @drop.prevent="handleModDrop"
              @dragenter.prevent="handleModDragEnter"
              @dragleave="handleModDragLeave"
            >
              <div v-if="modDragging" class="mods-drop-overlay">
                <UiIcon name="download" :size="22" />
                <span>{{ t('versions.mods.selectModFileHint') }}</span>
              </div>
              <div class="mods-panel-header">
                <div class="mods-panel-header-left">
                  <div class="search-box">
                    <UiIcon name="search" :size="15" class="search-icon" />
                    <input
                      v-model="modSearchQuery"
                      type="text"
                      class="search-input"
                      :placeholder="t('versions.mods.searchPlaceholder')"
                    />
                    <button v-if="modSearchQuery" class="search-clear" type="button" @click="modSearchQuery = ''">
                      <UiIcon name="close" :size="14" />
                    </button>
                  </div>
                  <div class="mods-filter-tabs">
                    <button
                      v-for="f in modFilterOptions"
                      :key="f.value"
                      :class="['mods-filter-btn', { active: modFilter === f.value }]"
                      @click="modFilter = f.value"
                    >
                      {{ f.label }}
                    </button>
                  </div>
                </div>
                <div class="mods-panel-header-right">
                  <span v-if="filteredMods.length" class="mods-count">{{
                    t('versions.mods.count', { count: filteredMods.length })
                  }}</span>
                  <NButton size="tiny" secondary @click="handleOnlineSearch">
                    <template #icon><UiIcon name="search" :size="14" /></template>
                    {{ t('versions.mods.onlineSearch') }}
                  </NButton>
                  <NButton size="tiny" secondary @click="handleAddMod">
                    <template #icon><UiIcon name="add" :size="14" /></template>
                    {{ t('versions.mods.addMod') }}
                  </NButton>
                  <NButton size="tiny" secondary @click="handleOpenModsFolder">
                    <template #icon><UiIcon name="folder" :size="14" /></template>
                    {{ t('versions.mods.openFolder') }}
                  </NButton>
                </div>
              </div>

              <div class="mods-panel-content">
                <NSpin :show="modsLoading" class="mods-spin">
                  <template v-if="filteredMods.length">
                    <div class="mods-grid">
                      <article
                        v-for="mod in filteredMods"
                        :key="mod.filename"
                        :class="['mod-card', { 'is-disabled': !mod.enabled }]"
                      >
                        <div class="mod-card-head">
                          <div class="mod-card-identity">
                            <span class="mod-card-icon"><UiIcon name="cube" :size="18" /></span>
                            <div class="mod-card-title">
                              <strong>{{ mod.name || mod.filename.replace(/\.(jar|disabled)$/, '') }}</strong>
                              <span class="mod-card-filename">{{ mod.filename }}</span>
                            </div>
                          </div>
                          <span v-if="mod.loader_type" class="badge" :class="'badge-' + mod.loader_type.toLowerCase()">
                            {{ getLoaderName(mod.loader_type) }}
                          </span>
                          <span v-else class="badge badge-vanilla">{{ t('versions.manage.vanilla') }}</span>
                        </div>

                        <div class="mod-card-meta">
                          <span class="meta-item" :title="t('versions.mods.modVersion')">
                            <UiIcon name="tags" :size="12" />
                            {{ mod.version || t('versions.mods.unknownVersion') }}
                          </span>
                          <span class="meta-item" :title="t('versions.mods.author')">
                            <UiIcon name="user" :size="12" />
                            {{ mod.author || t('versions.mods.unknownAuthor') }}
                          </span>
                          <span v-if="mod.game_version" class="meta-item" :title="t('versions.mods.gameVersion')">
                            <UiIcon name="globe" :size="12" />
                            {{ mod.game_version }}
                          </span>
                        </div>

                        <div class="mod-card-foot">
                          <div class="mod-card-info">
                            <span class="mod-size">
                              <UiIcon name="archive" :size="12" />
                              {{ formatFileSize(mod.size) }}
                            </span>
                            <span v-if="mod.dependencies.length" class="mod-deps" :title="mod.dependencies.join(', ')">
                              <UiIcon name="link" :size="12" />
                              {{ mod.dependencies.slice(0, 3).join(', ') }}{{ mod.dependencies.length > 3 ? '…' : '' }}
                            </span>
                            <span v-else class="mod-deps mod-deps-empty">
                              <UiIcon name="link" :size="12" />
                              {{ t('versions.mods.noDependencies') }}
                            </span>
                          </div>
                          <div class="mod-card-actions">
                            <button
                              v-if="mod.project_id"
                              class="btn-action"
                              :title="t('versions.mods.checkOnline')"
                              @click="handleOpenOnline(mod)"
                            >
                              <UiIcon name="external-link" :size="13" />
                            </button>
                            <button
                              class="btn-action btn-delete"
                              :title="t('common.delete')"
                              @click="handleDeleteMod(mod)"
                            >
                              <UiIcon name="trash" :size="13" />
                            </button>
                            <NSwitch :value="mod.enabled" size="small" @update:value="handleToggleMod(mod)" />
                          </div>
                        </div>
                      </article>
                    </div>
                  </template>
                  <div v-else-if="!modsLoading" class="mods-empty empty-state">
                    <UiIcon name="puzzle" :size="36" class="empty-icon" />
                    <p class="empty-text">{{ t('versions.mods.noMods') }}</p>
                    <div class="empty-actions" style="display: flex; gap: 8px; margin-top: 4px">
                      <NButton size="small" secondary @click="handleAddMod">
                        <template #icon><UiIcon name="add" :size="14" /></template>
                        {{ t('versions.mods.addMod') }}
                      </NButton>
                      <NButton size="small" secondary @click="handleOnlineSearch">
                        <template #icon><UiIcon name="search" :size="14" /></template>
                        {{ t('versions.mods.onlineSearch') }}
                      </NButton>
                    </div>
                  </div>
                </NSpin>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'settings'" class="vdm-page version-settings-page">
            <div v-if="settingsLoading" class="settings-loading-state">
              <NSpin size="small" />
              <span>{{ t('versions.detail.loadingSettings') }}</span>
            </div>
            <template v-else>
              <div class="settings-summary">
                <div class="settings-summary-copy">
                  <strong>{{
                    isCustomized ? t('versions.detail.customizedSettings') : t('versions.detail.usingGlobalSettings')
                  }}</strong>
                  <span>{{ t('versions.detail.settings') }} · {{ version?.versionId || '-' }}</span>
                </div>
                <NButton
                  size="small"
                  secondary
                  :disabled="settingsSaving || !isCustomized"
                  :loading="settingsSaving"
                  @click="resetSettings"
                >
                  {{ t('versions.detail.inheritGlobal') }}
                </NButton>
              </div>

              <SettingSection :title="t('versions.detail.launchConfig')">
                <div class="settings-subgroup">
                  <div class="settings-subgroup__title">{{ t('versions.detail.launchOptions') }}</div>
                  <SettingRow :label="t('versions.detail.isolated')" :description="t('versions.detail.isolatedDesc')">
                    <NSwitch v-model:value="versionSettings.isolated" />
                  </SettingRow>
                </div>

                <div class="settings-subgroup">
                  <div class="settings-subgroup__title">{{ t('versions.detail.memoryAllocation') }}</div>
                  <SettingRow
                    :label="t('versions.detail.customMemory')"
                    :description="t('versions.detail.customMemoryDesc')"
                  >
                    <NSwitch v-model:value="versionSettings.customMemory" />
                  </SettingRow>
                  <SettingRow v-if="versionSettings.customMemory" :label="t('versions.detail.memorySize')">
                    <NInputNumber
                      v-model:value="versionSettings.memory"
                      class="memory-number-input"
                      :min="512"
                      :max="65536"
                      :step="256"
                      :showButton="false"
                    >
                      <template #suffix>MB</template>
                    </NInputNumber>
                  </SettingRow>
                </div>

                <div class="settings-subgroup">
                  <div class="settings-subgroup__title">{{ t('versions.detail.javaRuntime') }}</div>
                  <SettingRow
                    :label="t('versions.detail.customJava')"
                    :description="t('versions.detail.customJavaDesc')"
                  >
                    <NSwitch v-model:value="versionSettings.customJava" />
                  </SettingRow>
                  <SettingRow v-if="versionSettings.customJava" :label="t('versions.detail.javaPath')">
                    <NInputGroup class="java-path-control">
                      <NInput
                        v-model:value="versionSettings.javaPath"
                        :placeholder="t('versions.detail.javaPathPlaceholder')"
                      />
                      <NButton :loading="javaSelecting" @click="selectJava">
                        {{ t('common.browse') }}
                      </NButton>
                    </NInputGroup>
                  </SettingRow>
                </div>

                <div class="settings-subgroup">
                  <div class="settings-subgroup__title">{{ t('versions.detail.jvmArgs') }}</div>
                  <SettingRow
                    :label="t('versions.detail.customJvmArgs')"
                    :description="t('versions.detail.customJvmArgsDesc')"
                  >
                    <NInput
                      v-model:value="versionSettings.jvmArgs"
                      class="argument-input"
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 5 }"
                      :placeholder="t('versions.detail.jvmArgsPlaceholder')"
                    />
                  </SettingRow>
                </div>

                <div class="settings-subgroup">
                  <div class="settings-subgroup__title">{{ t('versions.detail.gameArgs') }}</div>
                  <SettingRow
                    :label="t('versions.detail.customGameArgs')"
                    :description="t('versions.detail.customGameArgsDesc')"
                  >
                    <NInput
                      v-model:value="versionSettings.gameArgs"
                      class="argument-input"
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 5 }"
                      :placeholder="t('versions.detail.gameArgsPlaceholder')"
                    />
                  </SettingRow>
                </div>
              </SettingSection>
            </template>
          </div>

          <div v-if="activeTab === 'resourcepacks' && version" class="vdm-page workspace-page">
            <InstanceResourcesTab
              :version="version"
              :worldOptions="worldOptions"
              initialType="resourcepack"
              :allowedTypes="['resourcepack']"
            />
          </div>
          <div v-if="activeTab === 'shaderpacks' && version" class="vdm-page workspace-page">
            <InstanceResourcesTab
              :version="version"
              :worldOptions="worldOptions"
              initialType="shaderpack"
              :allowedTypes="['shaderpack']"
            />
          </div>
          <div v-if="activeTab === 'datapacks' && version" class="vdm-page workspace-page">
            <InstanceResourcesTab
              :version="version"
              :worldOptions="worldOptions"
              initialType="datapack"
              :allowedTypes="['datapack']"
            />
          </div>
          <div v-if="activeTab === 'schematics' && version" class="vdm-page workspace-page">
            <InstanceResourcesTab
              :version="version"
              :worldOptions="worldOptions"
              initialType="schematic"
              :allowedTypes="['schematic']"
            />
          </div>
          <div v-if="activeTab === 'worlds' && version" class="vdm-page workspace-page">
            <InstanceWorldsTab :version="version" @changed="handleWorldsChanged" />
          </div>
          <div v-if="activeTab === 'screenshots' && version" class="vdm-page workspace-page">
            <InstanceScreenshotsTab :version="version" @updated="emit('updated')" />
          </div>
          <div v-if="activeTab === 'servers' && version" class="vdm-page workspace-page">
            <InstanceServersTab :version="version" />
          </div>
        </div>

        <div id="plugin-slot-version-detail-footer" class="plugin-slot-container"></div>
      </main>
    </div>
  </FullscreenModal>
  <ConfirmDialog
    v-model:visible="confirmVisible"
    :title="confirmTitle"
    :content="confirmContent"
    :loading="confirmLoading"
    :danger="confirmDanger"
    :closeOnConfirm="false"
    @confirm="handleConfirm"
  />
  <Modal v-model:visible="iconPickerVisible" title="选择实例图标" width="520px">
    <div class="icon-picker-grid">
      <button @click="setProfileIcon('auto')"><UiIcon name="refresh" :size="28" /><span>自动</span></button>
      <button
        v-for="icon in iconChoices"
        :key="`${icon.type}-${icon.value}`"
        @click="setProfileIcon(icon.type, icon.value)"
      >
        <img :src="icon.image" alt="" /><span>{{ icon.label }}</span>
      </button>
      <button @click="chooseLocalProfileIcon"><UiIcon name="photo" :size="28" /><span>本地图片</span></button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { NButton, NInput, NInputGroup, NInputNumber, NSelect, NSpin, NSwitch } from 'naive-ui'
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import { launcherErrorQueue } from '@/app/runtime/errorPresentation'
import InstanceIcon from '@/components/instances/InstanceIcon.vue'
import InstanceResourcesTab from '@/components/instances/InstanceResourcesTab.vue'
import InstanceScreenshotsTab from '@/components/instances/InstanceScreenshotsTab.vue'
import InstanceServersTab from '@/components/instances/InstanceServersTab.vue'
import InstanceWorldsTab from '@/components/instances/InstanceWorldsTab.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import Modal from '@/components/modals/Modal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceInstallApi } from '@/features/instances/api/instanceInstallApi'
import { instanceProfileApi, targetFromVersion } from '@/features/instances/api/instanceProfileApi'
import { instanceRuntimeApi } from '@/features/instances/api/instanceRuntimeApi'
import { instanceSettingsApi } from '@/features/instances/api/instanceSettingsApi'
import { localModsApi } from '@/features/instances/api/localModsApi'
import { createDefaultVersionSettings, type VersionSettingsTarget } from '@/features/instances/model/instanceSettings'
import { formatRunDuration } from '@/features/instances/model/versionStats'
import { modApi } from '@/features/mods/api/modApi'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import type {
  InstanceCategory,
  InstanceExternalSource,
  ModItem,
  ScannedVersion,
  VersionRunStats,
  WorldEntry,
} from '@/types/api'
import { getLoaderName } from '@/utils/loader'

interface Props {
  visible: boolean
  version: ScannedVersion | null
  initialTab?: DetailTab
}

type DetailTab =
  | 'overview'
  | 'mods'
  | 'resourcepacks'
  | 'shaderpacks'
  | 'datapacks'
  | 'schematics'
  | 'worlds'
  | 'screenshots'
  | 'servers'
  | 'profile'
  | 'settings'

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'overview',
})
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'launch', version: ScannedVersion): void
  (e: 'delete', version: ScannedVersion): void
  (e: 'updated'): void
  (e: 'action', action: string, version: ScannedVersion): void
}>()

const { t } = useI18n()
const message = useLauncherMessage()
const router = useRouter()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const title = computed(() => props.version?.displayName || props.version?.versionId || t('versions.detail.settings'))

const activeTab = ref<DetailTab>('overview')

/** Mod 导航项对应本地模组管理视图 */
function isTabActive(id: DetailTab): boolean {
  return activeTab.value === id
}
function selectTab(id: DetailTab) {
  activeTab.value = id
}
const runStats = reactive<VersionRunStats>({
  launchCount: 0,
  lastRunDurationSeconds: 0,
  totalRunDurationSeconds: 0,
})
const statsLoading = ref(false)
const crashAnalyzing = ref(false)
let statsRequestId = 0

const tabs = computed(() => [
  { id: 'overview' as const, icon: 'info', label: t('versions.detail.overview') },
  { id: 'mods' as const, icon: 'cube', label: 'Mod' },
  { id: 'resourcepacks' as const, icon: 'package', label: '资源包' },
  { id: 'shaderpacks' as const, icon: 'sun', label: '光影包' },
  { id: 'datapacks' as const, icon: 'archive', label: '数据包' },
  { id: 'schematics' as const, icon: 'grid', label: '原理图' },
  { id: 'worlds' as const, icon: 'globe', label: '存档' },
  { id: 'screenshots' as const, icon: 'photo', label: '截图' },
  { id: 'servers' as const, icon: 'server', label: '服务器' },
  { id: 'profile' as const, icon: 'brush', label: '个性化' },
  { id: 'settings' as const, icon: 'settings', label: t('versions.detail.settings') },
])
const worldOptions = ref<Array<{ label: string; value: string }>>([])
function handleWorldsChanged(worlds: WorldEntry[]) {
  worldOptions.value = worlds.map((world) => ({ label: world.name, value: world.id }))
}

const categories = ref<InstanceCategory[]>([])
const profileSaving = ref(false)
const iconPickerVisible = ref(false)
const profileForm = reactive({
  alias: '',
  description: '',
  favorite: false,
  pinned: false,
  hidden: false,
  categoryId: 'unclassified',
  tagsText: '',
  preferredExternalSource: 'auto' as InstanceExternalSource,
})
const categoryOptions = computed(() =>
  categories.value.map((category) => ({ label: category.name, value: category.id }))
)
const sourceOptions = [
  { label: '自动（最新来源）', value: 'auto' },
  { label: 'PCL / PCL-CE', value: 'pcl' },
  { label: 'HMCL', value: 'hmcl' },
  { label: 'Qomicex', value: 'qomicex' },
]
const profileFields = ['alias', 'description', 'favorite', 'pinned', 'hidden', 'categoryId', 'tags', 'icon']
const iconChoices = [
  { type: 'builtin' as const, value: 'grass', label: '草方块', image: '/img/item/grass.png' },
  { type: 'builtin' as const, value: 'chest', label: '箱子', image: '/img/item/chest.png' },
  { type: 'builtin' as const, value: 'command', label: '命令方块', image: '/img/item/command.png' },
  { type: 'builtin' as const, value: 'coal', label: '煤炭', image: '/img/item/coal.png' },
  { type: 'builtin' as const, value: 'iron', label: '铁块', image: '/img/item/iron.png' },
  { type: 'builtin' as const, value: 'quartz', label: '石英', image: '/img/item/quartz.png' },
  { type: 'loader' as const, value: 'vanilla', label: 'Vanilla', image: '/img/item/grass.png' },
  { type: 'loader' as const, value: 'forge', label: 'Forge', image: '/img/item/forge.png' },
  { type: 'loader' as const, value: 'neoforge', label: 'NeoForge', image: '/img/item/neoforge.png' },
  { type: 'loader' as const, value: 'fabric', label: 'Fabric', image: '/img/item/fabric.png' },
  { type: 'loader' as const, value: 'quilt', label: 'Quilt', image: '/img/item/quilt.png' },
  { type: 'loader' as const, value: 'optifine', label: 'OptiFine', image: '/img/item/optifine.png' },
]

function loadProfileForm() {
  const version = props.version
  if (!version) return
  skipProfileWatch = true
  Object.assign(profileForm, {
    alias: version.displayName || version.versionId,
    description: version.description || '',
    favorite: Boolean(version.favorite),
    pinned: Boolean(version.pinned),
    hidden: Boolean(version.hidden),
    categoryId: version.categoryId || 'unclassified',
    tagsText: (version.tags || []).join(', '),
    preferredExternalSource: version.preferredExternalSource || 'auto',
  })
  savedProfileSnapshot.value = JSON.stringify(profileForm)
  void nextTick(() => {
    skipProfileWatch = false
  })
}

/** 个性化表单自动保存：防抖 + 串行化（参考设置 tab） */
let skipProfileWatch = false
let profileSaveTimer: ReturnType<typeof setTimeout> | null = null
let profileResaveQueued = false
const savedProfileSnapshot = ref('')

function profilePayload() {
  return {
    alias: profileForm.alias,
    description: profileForm.description,
    favorite: profileForm.favorite,
    pinned: profileForm.pinned,
    hidden: profileForm.hidden,
    categoryId: profileForm.categoryId,
    tags: profileForm.tagsText
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    preferredExternalSource: profileForm.preferredExternalSource,
  }
}

async function persistProfile() {
  const version = props.version
  if (!version) return
  if (profileSaving.value) {
    profileResaveQueued = true
    return
  }
  profileSaving.value = true
  try {
    await instanceProfileApi.patch(targetFromVersion(version), profilePayload())
    // 直接更新本地版本对象，避免触发全量扫描
    const v = version as unknown as Record<string, unknown>
    v.displayName = profileForm.alias
    v.description = profileForm.description
    v.favorite = profileForm.favorite
    v.pinned = profileForm.pinned
    v.hidden = profileForm.hidden
    v.categoryId = profileForm.categoryId
    v.tags = profilePayload().tags
    v.preferredExternalSource = profileForm.preferredExternalSource
    savedProfileSnapshot.value = JSON.stringify(profileForm)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.profileSaveFailed'))
  } finally {
    profileSaving.value = false
    if (profileResaveQueued) {
      profileResaveQueued = false
      void persistProfile()
    }
  }
}

function scheduleProfileSave(delay = 300) {
  if (profileSaveTimer) clearTimeout(profileSaveTimer)
  profileSaveTimer = setTimeout(() => {
    profileSaveTimer = null
    void persistProfile()
  }, delay)
}

function flushProfileSave() {
  if (profileSaveTimer) {
    clearTimeout(profileSaveTimer)
    profileSaveTimer = null
  }
  if (JSON.stringify(profileForm) !== savedProfileSnapshot.value) void persistProfile()
}

async function resetProfileField(field: string) {
  const version = props.version
  if (!version) return
  await instanceProfileApi.reset(targetFromVersion(version), [field])
  emit('updated')
}

async function setProfileIcon(type: 'auto' | 'builtin' | 'loader', value?: string) {
  const version = props.version
  if (!version) return
  await instanceProfileApi.setIcon(targetFromVersion(version), type, { value })
  iconPickerVisible.value = false
  emit('updated')
}

async function chooseLocalProfileIcon() {
  const version = props.version
  if (!version) return
  const sourcePath = await instanceProfileApi.chooseLocalIcon()
  if (!sourcePath) return
  await instanceProfileApi.setIcon(targetFromVersion(version), 'local', { sourcePath })
  iconPickerVisible.value = false
  emit('updated')
}

function profileFieldLabel(field: string): string {
  return (
    {
      alias: '别名',
      description: '描述',
      favorite: '收藏',
      pinned: '置顶',
      hidden: '隐藏',
      categoryId: '分类',
      tags: '标签',
      icon: '图标',
    }[field] || field
  )
}

// ======================== 模组管理 ========================

const mods = ref<ModItem[]>([])
const modsLoading = ref(false)
const modSearchQuery = ref('')
const modFilter = ref<'all' | 'enabled' | 'disabled'>('all')

const modFilterOptions = computed(() => [
  { label: t('versions.mods.filterAll'), value: 'all' as const },
  { label: t('versions.mods.filterEnabled'), value: 'enabled' as const },
  { label: t('versions.mods.filterDisabled'), value: 'disabled' as const },
])

const filteredMods = computed(() => {
  let list = mods.value
  // 筛选
  if (modFilter.value === 'enabled') list = list.filter((m) => m.enabled)
  else if (modFilter.value === 'disabled') list = list.filter((m) => !m.enabled)
  // 搜索
  const q = modSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((m) => m.filename.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)))
  }
  return list
})

function getGamePath(): string | null {
  return props.version?.path || props.version?.jsonPath || null
}

async function loadRunStats() {
  const version = props.version
  const gamePath = getGamePath()
  if (!version || !gamePath) return
  const requestId = ++statsRequestId
  statsLoading.value = true
  try {
    const stats = await instanceRuntimeApi.getStats(gamePath, version.versionId || version.id)
    if (requestId === statsRequestId) Object.assign(runStats, stats)
  } catch (error) {
    if (requestId === statsRequestId) {
      Object.assign(runStats, { launchCount: 0, lastRunDurationSeconds: 0, totalRunDurationSeconds: 0 })
      message.error(error instanceof Error ? error.message : t('versions.detail.loadStatsFailed'))
    }
  } finally {
    if (requestId === statsRequestId) statsLoading.value = false
  }
}

async function handleAnalyzeCrash() {
  const version = props.version
  const gamePath = getGamePath()
  if (!version || !gamePath || crashAnalyzing.value) return
  crashAnalyzing.value = true
  try {
    const selected = await backend.command('select_file', { purpose: 'crash-analysis' })
    if (!selected.success) {
      message.error(selected.message || t('versions.detail.crashAnalysisFailed'))
      return
    }
    if (!selected.data?.path) return
    const result = await instanceRuntimeApi.analyzeCrash(selected.data.path, gamePath, version.versionId || version.id)
    launcherErrorQueue.enqueue({
      error_id: result.reportId,
      title: t('error.crash.title'),
      message: t('error.crash.manualMessage', { version: result.versionId }),
      kind: 'game_crash',
      crash: result,
    })
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.crashAnalysisFailed'))
  } finally {
    crashAnalyzing.value = false
  }
}

async function loadMods() {
  const gamePath = getGamePath()
  if (!gamePath) return
  modsLoading.value = true
  try {
    mods.value = await localModsApi.list(gamePath)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  } finally {
    modsLoading.value = false
  }
}

async function handleToggleMod(mod: ModItem) {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    const result = await localModsApi.toggle(gamePath, mod.filename)
    mod.enabled = result.enabled
    const actionText = result.enabled ? t('versions.mods.toggleEnabled') : t('versions.mods.toggleDisabled')
    message.success(t('versions.mods.modToggled', { name: mod.name || mod.filename, action: actionText }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modToggleFailed'))
  }
}

function handleDeleteMod(mod: ModItem) {
  openConfirm(
    t('common.delete'),
    t('versions.mods.deleteConfirm', { name: mod.name || mod.filename }),
    async () => {
      const gamePath = getGamePath()
      if (!gamePath) return
      try {
        await localModsApi.remove(gamePath, mod.filename)
        mods.value = mods.value.filter((m) => m.filename !== mod.filename)
        message.success(t('versions.mods.modDeleted'))
      } catch (error) {
        message.error(error instanceof Error ? error.message : t('versions.mods.modDeleteFailed'))
      }
    },
    true
  )
}

async function handleAddMod() {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    const result = await backend.command('select_file')
    if (!result.success || !result.data?.path) return
    await localModsApi.add(gamePath, result.data.path)
    message.success(t('versions.mods.modAdded'))
    await loadMods()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

const modDragging = ref(false)
let modDragDepth = 0

function handleModDragEnter() {
  modDragDepth += 1
  modDragging.value = true
}

function handleModDragLeave() {
  modDragDepth = Math.max(0, modDragDepth - 1)
  if (modDragDepth === 0) modDragging.value = false
}

async function handleModDrop(event: DragEvent) {
  modDragging.value = false
  modDragDepth = 0
  const gamePath = getGamePath()
  if (!gamePath) return
  const paths = [...(event.dataTransfer?.files || [])]
    .map((file) => (file as File & { path?: string }).path)
    .filter((path): path is string => Boolean(path))
  if (!paths.length) {
    message.warning(t('versions.mods.selectModFileHint'))
    return
  }
  try {
    for (const path of paths) await localModsApi.add(gamePath, path)
    message.success(t('versions.mods.modAdded'))
    await loadMods()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

async function handleOpenModsFolder() {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    await localModsApi.openFolder(gamePath)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

function handleOnlineSearch() {
  const version = props.version
  if (!version) return
  visible.value = false
  void router.push({ name: 'download', query: { tab: 'mod', instance: `${version.path}\u0000${version.versionId}` } })
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

async function handleOpenOnline(mod: ModItem) {
  if (!mod.project_id) return
  try {
    await modApi.openUrl(`https://modrinth.com/mod/${mod.project_id}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.openOnlineFailed'))
  }
}

// ======================== 版本设置 ========================

const versionSettings = reactive(createDefaultVersionSettings())
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const javaSelecting = ref(false)
const savedSettingsSnapshot = ref(JSON.stringify(createDefaultVersionSettings()))
const settingsDirty = computed(() => JSON.stringify(versionSettings) !== savedSettingsSnapshot.value)
const isCustomized = computed(() => JSON.stringify(versionSettings) !== JSON.stringify(createDefaultVersionSettings()))

/** 加载/重置阶段跳过自动保存 watch */
let skipSettingsWatch = false
/** 300ms 防抖定时器（参考 GameTab.vue 的 debouncedSaveConfig） */
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null
/** 保存串行化：保存中再有新变更则排队重存，避免 API 读-改-写竞态 */
let resaveQueued = false

function getSettingsTarget(): VersionSettingsTarget | null {
  if (!props.version) return null
  return {
    versionId: props.version.versionId || props.version.id,
    path: props.version.path || props.version.jsonPath || '',
  }
}

async function loadSettings() {
  const target = getSettingsTarget()
  if (!target) return
  skipSettingsWatch = true
  const defaults = createDefaultVersionSettings()
  Object.assign(versionSettings, defaults)
  savedSettingsSnapshot.value = JSON.stringify(defaults)
  settingsLoading.value = true
  try {
    const settings = await instanceSettingsApi.get(target)
    Object.assign(versionSettings, settings)
    savedSettingsSnapshot.value = JSON.stringify(settings)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.loadSettingsFailed'))
  } finally {
    settingsLoading.value = false
    await nextTick()
    skipSettingsWatch = false
  }
}

// 重置 activeTab 当弹窗打开时；关闭时 flush 挂起中的自动保存
watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = props.initialTab
      loadProfileForm()
      void instanceProfileApi.categories().then((items) => (categories.value = items))
      void loadSettings()
      void loadMods()
      void loadRunStats()
    } else {
      flushSettingsSave()
      flushProfileSave()
    }
  },
  { immediate: true }
)

const stopStatsListening = instanceRuntimeApi.onChanged((payload) => {
  const version = props.version
  if (
    props.visible &&
    version &&
    payload.versionId === (version.versionId || version.id) &&
    payload.gamePath === getGamePath()
  ) {
    void loadRunStats()
  }
})

onBeforeUnmount(() => {
  statsRequestId += 1
  stopStatsListening()
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
  if (profileSaveTimer) clearTimeout(profileSaveTimer)
})

function validateSettings(): string | null {
  if (versionSettings.customMemory && (versionSettings.memory < 512 || versionSettings.memory > 65536)) {
    return t('versions.detail.invalidMemory')
  }
  if (versionSettings.customJava && !versionSettings.javaPath.trim()) {
    return t('versions.detail.javaPathRequired')
  }
  return null
}

async function persistSettings() {
  if (settingsSaving.value) {
    resaveQueued = true
    return
  }
  const target = getSettingsTarget()
  if (!target) return
  const invalid = validateSettings()
  if (invalid) {
    message.warning(invalid)
    return
  }
  settingsSaving.value = true
  try {
    await instanceSettingsApi.save(target, { ...versionSettings })
    savedSettingsSnapshot.value = JSON.stringify(versionSettings)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.saveSettingsFailed'))
  } finally {
    settingsSaving.value = false
    if (resaveQueued) {
      resaveQueued = false
      void persistSettings()
    }
  }
}

/** 修改即自动保存：300ms 防抖（参考 GameTab.vue） */
function scheduleSettingsSave(delay = 300) {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
  settingsSaveTimer = setTimeout(() => {
    settingsSaveTimer = null
    void persistSettings()
  }, delay)
}

/** 关闭弹窗时立即落盘（flush），丢弃未决定时器 */
function flushSettingsSave() {
  if (settingsSaveTimer) {
    clearTimeout(settingsSaveTimer)
    settingsSaveTimer = null
  }
  if (settingsDirty.value) void persistSettings()
}

// deep watch：用户修改自动触发保存；加载/重置阶段用 skipSettingsWatch 跳过
watch(
  versionSettings,
  () => {
    if (skipSettingsWatch) return
    scheduleSettingsSave()
  },
  { deep: true }
)

// 个性化表单：修改即自动保存（300ms 防抖）
watch(
  profileForm,
  () => {
    if (skipProfileWatch) return
    scheduleProfileSave()
  },
  { deep: true }
)

async function resetSettings() {
  const target = getSettingsTarget()
  if (!target) return
  settingsSaving.value = true
  try {
    await instanceSettingsApi.reset(target)
    skipSettingsWatch = true
    const defaults = createDefaultVersionSettings()
    Object.assign(versionSettings, defaults)
    savedSettingsSnapshot.value = JSON.stringify(defaults)
    message.success(t('versions.detail.settingsReset'))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.saveSettingsFailed'))
  } finally {
    settingsSaving.value = false
    await nextTick()
    skipSettingsWatch = false
  }
}

async function selectJava() {
  javaSelecting.value = true
  try {
    const path = await instanceSettingsApi.selectJava()
    if (path) versionSettings.javaPath = path
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.javaSelectFailed'))
  } finally {
    javaSelecting.value = false
  }
}

function handleLaunch() {
  if (props.version) {
    emit('launch', props.version)
    visible.value = false
  }
}

function handleOpenFolder() {
  if (props.version?.path) {
    void instanceInstallApi.openFolder(props.version.path)
  }
}

function handleDelete() {
  if (props.version) {
    emit('delete', props.version)
    visible.value = false
  }
}

function handleAction(action: string) {
  if (props.version) emit('action', action, props.version)
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
</script>

<style scoped src="@/styles/views/instances/InstanceDetailModal.css"></style>
