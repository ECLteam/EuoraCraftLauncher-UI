<template>
  <FullscreenModal
    v-model:visible="visible"
    :title="title"
    :showFooter="false"
    wrapperClass="version-detail-modal"
    bodyClass="version-detail-body"
  >
    <div class="vdm-container">
      <!-- 左侧导航 -->
      <div class="vdm-nav">
        <div class="vdm-nav-header">
          <div class="vdm-version-badge">
            <UiIcon
              :name="getLoaderIcon(version?.primaryLoader || 'vanilla')"
              :size="20"
            />
            <span class="vdm-version-name">{{ version?.versionId || '...' }}</span>
          </div>
        </div>
        <div class="vdm-nav-list">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['vdm-nav-item', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="nav-indicator" />
            <UiIcon
              :name="tab.icon"
              :size="17"
            />
            <span class="vdm-nav-label">{{ tab.label }}</span>
          </button>
        </div>
        <div
          id="plugin-slot-version-detail-tab"
          class="plugin-slot-container"
        />
      </div>

      <!-- 右侧内容 -->
      <div class="vdm-content">
        <!-- 总览 -->
        <div
          v-if="activeTab === 'overview'"
          class="vdm-tab"
        >
          <div class="settings-section">
            <div class="section-label">
              版本信息
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">版本 ID</span>
                <span class="info-value">{{ version?.versionId || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">加载器</span>
                <span class="info-value">{{ getLoaderName(version?.primaryLoader || 'vanilla') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">原版版本</span>
                <span class="info-value">{{ version?.vanillaName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态</span>
                <span :class="['badge', version?.isBroken ? 'badge-error' : 'badge-success']">
                  {{ version?.isBroken ? '损坏' : '正常' }}
                </span>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">
              快速操作
            </div>
            <div class="quick-actions">
              <button
                class="btn-action-card"
                @click="handleLaunch"
              >
                <UiIcon
                  name="play"
                  :size="20"
                />
                <span>启动游戏</span>
              </button>
              <button
                class="btn-action-card"
                @click="handleOpenFolder"
              >
                <UiIcon
                  name="folder"
                  :size="20"
                />
                <span>打开文件夹</span>
              </button>
              <button
                class="btn-action-card"
                @click="handleDelete"
              >
                <UiIcon
                  name="trash"
                  :size="20"
                />
                <span>删除版本</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Mod 管理 -->
        <div
          v-if="activeTab === 'mods'"
          class="vdm-tab"
        >
          <div class="settings-section">
            <div class="section-label">
              Mod 管理
            </div>
            <p class="placeholder-text">
              Mod 管理功能即将推出
            </p>
          </div>
        </div>

        <!-- 版本设置 -->
        <div
          v-if="activeTab === 'settings'"
          class="vdm-tab"
        >
          <div class="settings-section">
            <div class="section-label">
              启动选项
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">
                  版本隔离
                </div>
                <div class="setting-desc">
                  为此版本使用独立的游戏目录
                </div>
              </div>
              <div class="setting-control">
                <button
                  :class="['toggle-switch', { active: versionSettings.isolated }]"
                  @click="versionSettings.isolated = !versionSettings.isolated"
                >
                  <span class="toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">
              内存分配
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">
                  自定义内存
                </div>
                <div class="setting-desc">
                  为此版本单独设置内存大小
                </div>
              </div>
              <div class="setting-control">
                <button
                  :class="['toggle-switch', { active: versionSettings.customMemory }]"
                  @click="versionSettings.customMemory = !versionSettings.customMemory"
                >
                  <span class="toggle-knob" />
                </button>
              </div>
            </div>
            <div
              v-if="versionSettings.customMemory"
              class="setting-item"
            >
              <div class="setting-info">
                <div class="setting-label">
                  内存大小 (MB)
                </div>
              </div>
              <div class="setting-control">
                <input
                  v-model.number="versionSettings.memory"
                  type="number"
                  min="512"
                  step="256"
                  class="text-input memory-input"
                >
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">
              Java 运行时
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">
                  自定义 Java
                </div>
                <div class="setting-desc">
                  为此版本单独指定 Java 路径
                </div>
              </div>
              <div class="setting-control">
                <button
                  :class="['toggle-switch', { active: versionSettings.customJava }]"
                  @click="versionSettings.customJava = !versionSettings.customJava"
                >
                  <span class="toggle-knob" />
                </button>
              </div>
            </div>
            <div
              v-if="versionSettings.customJava"
              class="setting-item"
            >
              <div class="setting-info">
                <div class="setting-label">
                  Java 路径
                </div>
              </div>
              <div class="setting-control">
                <input
                  v-model="versionSettings.javaPath"
                  type="text"
                  class="text-input java-path-input"
                  placeholder="选择 Java 可执行文件..."
                >
                <button class="btn-ghost java-browse-btn">
                  浏览
                </button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">
              JVM 参数
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">
                  自定义 JVM 参数
                </div>
                <div class="setting-desc">
                  追加到启动命令的 JVM 参数
                </div>
              </div>
            </div>
            <textarea
              v-model="versionSettings.jvmArgs"
              class="text-input args-textarea"
              placeholder="例如：-XX:+UseG1GC -XX:+ParallelRefProcEnabled"
            />
          </div>

          <div class="settings-section">
            <div class="section-label">
              游戏参数
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">
                  自定义游戏参数
                </div>
                <div class="setting-desc">
                  追加到游戏进程的启动参数
                </div>
              </div>
            </div>
            <textarea
              v-model="versionSettings.gameArgs"
              class="text-input args-textarea"
              placeholder="例如：--server 127.0.0.1 --port 25565"
            />
          </div>
        </div>

        <!-- 存档管理 -->
        <div
          v-if="activeTab === 'saves'"
          class="vdm-tab"
        >
          <div class="settings-section">
            <div class="section-label">
              存档管理
            </div>
            <p class="placeholder-text">
              存档管理功能即将推出
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      id="plugin-slot-version-detail-footer"
      class="plugin-slot-container"
    />
  </FullscreenModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { getLoaderIcon, getLoaderName } from '@/utils/loader'
import type { ScannedVersion } from '@/types/api'

interface Props {
  visible: boolean
  version: ScannedVersion | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'launch', version: ScannedVersion): void
  (e: 'delete', version: ScannedVersion): void
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const title = computed(() => props.version?.versionId || '版本设置')

const activeTab = ref<'overview' | 'mods' | 'settings' | 'saves'>('overview')

const tabs = computed(() => [
  { id: 'overview' as const, icon: 'info', label: t('versions.detail.overview') },
  { id: 'mods' as const, icon: 'puzzle', label: t('versions.detail.mods') },
  { id: 'settings' as const, icon: 'settings', label: t('versions.detail.settings') },
  { id: 'saves' as const, icon: 'folder', label: t('versions.detail.saves') },
])

const versionSettings = reactive({
  isolated: false,
  customMemory: false,
  memory: 4096,
  customJava: false,
  javaPath: '',
  jvmArgs: '',
  gameArgs: '',
})

// 重置 activeTab 当弹窗打开时
watch(() => props.visible, (val) => {
  if (val) {
    activeTab.value = 'overview'
    // TODO: 加载版本独立设置
  }
})

function handleLaunch() {
  if (props.version) {
    emit('launch', props.version)
    visible.value = false
  }
}

function handleOpenFolder() {
  if (props.version?.jsonPath) {
    backend.command('open_folder', { path: props.version.jsonPath })
  }
}

function handleDelete() {
  if (props.version) {
    emit('delete', props.version)
    visible.value = false
  }
}
</script>

<style scoped src="@/styles/views/versions/VersionDetailModal.css"></style>
