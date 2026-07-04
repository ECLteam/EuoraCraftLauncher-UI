<template>
  <div class="mods-page">
    <!-- 顶部搜索栏 -->
    <div class="mods-toolbar">
      <div class="search-bar">
        <UiIcon name="search" :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('versions.mods.searchPlaceholder')"
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
      <button class="btn-add-mod" @click="addMod">
        <UiIcon name="add" :size="16" />
        {{ t('versions.mods.addMod') }}
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <UiIcon name="spinner" class="spin" :size="24" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredMods.length === 0" class="empty-state">
      <UiIcon name="cube" :size="48" class="empty-icon" />
      <p class="empty-text">{{ t('versions.mods.noMods') }}</p>
      <button class="btn-primary" @click="addMod">
        <UiIcon name="add" :size="16" />
        {{ t('versions.mods.addMod') }}
      </button>
    </div>

    <!-- 模组列表 -->
    <div v-else class="mods-list" ref="listRef">
      <div
        v-for="mod in filteredMods"
        :key="mod.id"
        class="mod-item"
        @click="showModDetails(mod)"
      >
        <div class="mod-icon">
          <img v-if="mod.icon" :src="mod.icon" :alt="mod.name" />
          <UiIcon v-else name="cube" :size="20" />
        </div>

        <div class="mod-info">
          <div class="mod-name">{{ mod.name }}</div>
          <div class="mod-desc" :title="mod.description">{{ mod.description }}</div>
          <div class="mod-meta">
            <span class="mod-version-tag">{{ mod.version }}</span>
            <span class="mod-author">by {{ mod.author }}</span>
          </div>
        </div>

        <div class="mod-actions">
          <!-- 开关：非iOS风格，关闭态灰底白圆，开启态品牌底白圆 -->
          <button
            :class="['toggle-switch', { active: mod.enabled }]"
            @click.stop="mod.enabled = !mod.enabled"
            role="switch"
            :aria-checked="mod.enabled"
          >
            <span class="toggle-knob"></span>
          </button>

          <div class="mod-hover-actions">
            <button class="mod-action-btn" :title="t('common.edit')" @click.stop="showModDetails(mod)">
              <UiIcon name="settings" :size="14" />
            </button>
            <button class="mod-action-btn mod-action-delete" :title="t('common.delete')" @click.stop="removeMod(mod)">
              <UiIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'

interface Mod {
  id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
  icon?: string
}

const { t } = useI18n()
const message = useGlassMessage()
const listRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const searchQuery = ref('')

const mods = ref<Mod[]>([
  {
    id: 'jei',
    name: 'Just Enough Items',
    description: '查看物品合成表和用途的基础模组。',
    version: '11.6.0',
    author: 'mezz',
    enabled: true
  },
])

const filteredMods = computed(() => {
  if (!searchQuery.value) return mods.value
  const query = searchQuery.value.toLowerCase()
  return mods.value.filter(mod =>
    mod.name.toLowerCase().includes(query) ||
    mod.description.toLowerCase().includes(query)
  )
})

const addMod = () => {
  message.info(t('versions.mods.addModPending'))
}

const showModDetails = (mod: Mod) => {
  message.info(t('versions.mods.viewDetails', { name: mod.name }))
}

const removeMod = (mod: Mod) => {
  message.info(t('versions.mods.removePending', { name: mod.name }))
}

onMounted(() => {
  nextTick(() => {
    if (listRef.value) {
      const items = listRef.value.children
      Array.from(items).forEach((item, i) => {
        (item as HTMLElement).style.opacity = '0'
        ;(item as HTMLElement).style.transform = 'translateY(8px)'
        setTimeout(() => {
          (item as HTMLElement).style.transition = 'all 150ms ease-out'
          ;(item as HTMLElement).style.opacity = '1'
          ;(item as HTMLElement).style.transform = 'translateY(0)'
        }, i * 30)
      })
    }
  })
})
</script>

<style scoped>
.mods-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 顶部搜索栏 */
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
}

.search-input {
  width: 100%;
  height: 36px;
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

.btn-add-mod {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease-out;
}

.btn-add-mod:hover {
  background: var(--primary-hover);
}

.btn-add-mod:active {
  transform: translateY(1px);
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
  height: 64px;
  padding: 0 12px;
  gap: 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
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
  gap: 2px;
}

.mod-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
}

.mod-desc {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mod-meta {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  margin-top: 2px;
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

/* 操作区域 */
.mod-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 开关：非iOS风格，32px宽20px高 */
.toggle-switch {
  position: relative;
  width: 32px;
  height: 20px;
  border-radius: 16px;
  border: none;
  background: #D0D0D0;
  cursor: pointer;
  padding: 0;
  transition: background 150ms ease-out;
}

[data-theme="dark"] .toggle-switch {
  background: #4A4D55;
}

.toggle-switch.active {
  background: var(--primary);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #FFFFFF;
  transition: transform 150ms ease-out;
}

[data-theme="dark"] .toggle-switch:not(.active) .toggle-knob {
  background: rgba(255, 255, 255, 0.3);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(12px);
}

/* 悬停操作按钮 */
.mod-hover-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.mod-item:hover .mod-hover-actions {
  opacity: 1;
}

.mod-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.mod-action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mod-action-delete:hover {
  color: var(--error);
  background: var(--error-alpha);
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

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>