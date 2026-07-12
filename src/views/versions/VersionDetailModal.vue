<template>
  <ContentModal
    v-model:visible="visible"
    :title="title"
    fullscreen
    :show-footer="false"
    :show-close-btn="false"
    :show-backdrop="false"
    body-class="vdm-body"
  >
    <div class="vdm-container">
      <!-- 左侧导航 -->
      <div class="vdm-nav">
        <div class="vdm-nav-header">
          <div class="vdm-version-badge">
            <UiIcon :name="getLoaderIcon(version?.primaryLoader || 'vanilla')" :size="20" />
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
            <UiIcon :name="tab.icon" :size="17" />
            <span class="vdm-nav-label">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="vdm-content">
        <!-- 总览 -->
        <div v-if="activeTab === 'overview'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">版本信息</div>
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
            <div class="section-label">快速操作</div>
            <div class="quick-actions">
              <button class="btn-action-card" @click="handleLaunch">
                <UiIcon name="play" :size="20" />
                <span>启动游戏</span>
              </button>
              <button class="btn-action-card" @click="handleOpenFolder">
                <UiIcon name="folder" :size="20" />
                <span>打开文件夹</span>
              </button>
              <button class="btn-action-card" @click="handleDelete">
                <UiIcon name="trash" :size="20" />
                <span>删除版本</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Mod 管理 -->
        <div v-if="activeTab === 'mods'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">Mod 管理</div>
            <p class="placeholder-text">Mod 管理功能即将推出</p>
          </div>
        </div>

        <!-- 版本设置 -->
        <div v-if="activeTab === 'settings'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">启动选项</div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">版本隔离</div>
                <div class="setting-desc">为此版本使用独立的游戏目录</div>
              </div>
              <div class="setting-control">
                <button
                  :class="['toggle-switch', { active: versionSettings.isolated }]"
                  @click="versionSettings.isolated = !versionSettings.isolated"
                >
                  <span class="toggle-knob"></span>
                </button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">内存分配</div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">自定义内存</div>
                <div class="setting-desc">为此版本单独设置内存大小</div>
              </div>
              <div class="setting-control">
                <button
                  :class="['toggle-switch', { active: versionSettings.customMemory }]"
                  @click="versionSettings.customMemory = !versionSettings.customMemory"
                >
                  <span class="toggle-knob"></span>
                </button>
              </div>
            </div>
            <div v-if="versionSettings.customMemory" class="setting-item">
              <div class="setting-info">
                <div class="setting-label">内存大小 (MB)</div>
              </div>
              <div class="setting-control">
                <input
                  v-model.number="versionSettings.memory"
                  type="number"
                  min="512"
                  step="256"
                  class="text-input"
                  style="width: 108px;"
                />
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">Java 运行时</div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">自定义 Java</div>
                <div class="setting-desc">为此版本单独指定 Java 路径</div>
              </div>
              <div class="setting-control">
                <button
                  :class="['toggle-switch', { active: versionSettings.customJava }]"
                  @click="versionSettings.customJava = !versionSettings.customJava"
                >
                  <span class="toggle-knob"></span>
                </button>
              </div>
            </div>
            <div v-if="versionSettings.customJava" class="setting-item">
              <div class="setting-info">
                <div class="setting-label">Java 路径</div>
              </div>
              <div class="setting-control">
                <input
                  v-model="versionSettings.javaPath"
                  type="text"
                  class="text-input"
                  style="width: 270px;"
                  placeholder="选择 Java 可执行文件..."
                />
                <button class="btn-ghost" style="margin-left: 7px;">浏览</button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">JVM 参数</div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">自定义 JVM 参数</div>
                <div class="setting-desc">追加到启动命令的 JVM 参数</div>
              </div>
            </div>
            <textarea
              v-model="versionSettings.jvmArgs"
              class="text-input"
              style="width: 100%; height: 72px; resize: vertical;"
              placeholder="例如：-XX:+UseG1GC -XX:+ParallelRefProcEnabled"
            ></textarea>
          </div>

          <div class="settings-section">
            <div class="section-label">游戏参数</div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">自定义游戏参数</div>
                <div class="setting-desc">追加到游戏进程的启动参数</div>
              </div>
            </div>
            <textarea
              v-model="versionSettings.gameArgs"
              class="text-input"
              style="width: 100%; height: 54px; resize: vertical;"
              placeholder="例如：--server 127.0.0.1 --port 25565"
            ></textarea>
          </div>
        </div>

        <!-- 存档管理 -->
        <div v-if="activeTab === 'saves'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">存档管理</div>
            <p class="placeholder-text">存档管理功能即将推出</p>
          </div>
        </div>
      </div>
    </div>
  </ContentModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ContentModal from '@/components/modals/ContentModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useVersionManager } from '@/composables/useVersionManager'
import { getLoaderIcon, getLoaderName } from '@/utils/loader'
import backend from '@/api/client'

interface ScannedVersion {
  versionId: string
  id: string
  primaryLoader: string
  vanillaName?: string
  isBroken: boolean
  hasForge: boolean
  hasNeoForge: boolean
  hasFabric: boolean
  hasQuilt: boolean
  jsonPath: string
  path?: string
}

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
const versionManager = useVersionManager()

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

<style scoped>
.vdm-body {
  padding: 0 !important;
  overflow: hidden !important;
}

.vdm-container {
  display: flex;
  height: 100%;
  gap: 0;
}

/* 左侧导航 */
.vdm-nav {
  width: 180px;
  min-width: 180px;
  background: var(--card-bg);
  border-right: 1px solid var(--divider);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vdm-nav-header {
  padding: 14px;
  border-bottom: 1px solid var(--divider);
}

.vdm-version-badge {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 11px;
  background: var(--bg-elevated);
  border-radius: var(--r-sm);
}

.vdm-version-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vdm-nav-list {
  flex: 1;
  padding: 7px;
  overflow-y: auto;
}

.vdm-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 150ms, background 150ms;
}

.vdm-nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.vdm-nav-item.active {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 600;
}

.vdm-nav-label {
  white-space: nowrap;
}

/* 右侧内容 */
.vdm-content {
  flex: 1;
  min-width: 0;
  padding: 22px 29px;
  overflow-y: auto;
  background: var(--bg-base);
}

.vdm-tab {
  max-width: 774px;
}

/* 复用 settings 样式 */
.settings-section {
  margin-bottom: var(--s-2xl);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--s-lg);
  padding-bottom: var(--s-sm);
  border-bottom: 1px solid var(--divider);
}

.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-xl);
  margin-bottom: var(--s-xl);
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.setting-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px;
  background: var(--card-bg);
  border-radius: var(--r-sm);
}

.info-label {
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 快速操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
}

.btn-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 18px;
  border: 1px solid var(--divider);
  border-radius: var(--r-sm);
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}

.btn-action-card:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
}

/* 开关 */
.toggle-switch {
  width: 29px;
  height: 16px;
  border-radius: 8px;
  border: none;
  background: var(--bg-base-alt);
  cursor: pointer;
  position: relative;
  transition: background 150ms;
  padding: 0;
}

.toggle-switch.active {
  background: var(--primary);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: white;
  transition: transform 150ms;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(13px);
}

/* 徽章 */
.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 9px;
}

.badge-success {
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
}

.badge-error {
  background: rgba(229, 92, 92, 0.15);
  color: #E55C5C;
}

/* 文本框 */
.text-input {
  padding: 5px 9px;
  border: 1px solid var(--divider);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  transition: border-color 150ms;
}

.text-input:focus {
  border-color: var(--primary);
}

.btn-ghost {
  padding: 4px 11px;
  border: 1px solid var(--divider);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: color 150ms, border-color 150ms;
}

.btn-ghost:hover {
  color: var(--primary);
  border-color: var(--primary);
}

.placeholder-text {
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 18px 0;
  text-align: center;
}
</style>