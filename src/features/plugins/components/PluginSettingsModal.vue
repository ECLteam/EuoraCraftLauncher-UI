<template>
  <FullscreenModal
    :visible="visible"
    :title="pluginTitle"
    :show-footer="false"
    :closable="true"
    @close="close"
  >
    <div class="plugin-settings">
      <!-- 加载中 -->
      <div v-if="loading" class="settings-loading">
        <UiIcon name="loading" :size="20" class="spin" />
        <span>{{ t('app.loading') }}</span>
      </div>

      <!-- 无设置项 -->
      <div v-else-if="!schema.length" class="settings-empty">
        <UiIcon name="settings" :size="36" class="empty-icon" />
        <p class="empty-text">{{ t('plugins.noSettings') }}</p>
      </div>

      <!-- 设置项列表 -->
      <div v-else class="settings-list">
        <div v-for="item in schema" :key="item.key" class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ item.description || item.key }}</span>
            <span class="setting-key">{{ item.key }}</span>
          </div>
          <div class="setting-control">
            <!-- 布尔 -->
            <button
              v-if="item.type === 'bool'"
              :class="['toggle-switch', { active: !!values[item.key] }]"
              role="switch"
              :aria-checked="!!values[item.key]"
              @click="onToggle(item.key, !values[item.key])"
            >
              <span class="toggle-knob" />
            </button>
            <!-- 数字 -->
            <input
              v-else-if="item.type === 'number'"
              type="number"
              class="setting-input"
              :value="values[item.key]"
              @change="onChange(item.key, $event)"
            />
            <!-- 下拉 -->
            <div v-else-if="item.type === 'select'" class="select-wrapper">
              <select
                class="setting-select"
                :value="values[item.key]"
                @change="onChange(item.key, $event)"
              >
                <option v-for="opt in (item.default as any[])" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
              <UiIcon name="chevron-down" :size="12" class="select-arrow" />
            </div>
            <!-- 文本（默认） -->
            <input
              v-else
              type="text"
              class="setting-input"
              :value="values[item.key]"
              @change="onChange(item.key, $event)"
            />
          </div>
        </div>
      </div>

      <!-- 保存提示 -->
      <Transition name="fade">
        <div v-if="savedHint" class="saved-hint">{{ t('plugins.settingSaved') }}</div>
      </Transition>
    </div>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import { usePluginStore } from '@/features/plugins/stores/pluginStore'
import type { PluginInfo, PluginSettingSchema } from '@/types/api'

const props = defineProps<{
  visible: boolean
  plugin: PluginInfo | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const store = usePluginStore()

const loading = ref(false)
const schema = ref<PluginSettingSchema[]>([])
const values = ref<Record<string, unknown>>({})
const savedHint = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | null = null

const pluginTitle = computed(() => {
  if (!props.plugin) return ''
  return `${t('plugins.settings')} - ${props.plugin.title || props.plugin.name}`
})

const close = () => emit('close')

function showSavedHint() {
  savedHint.value = true
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    savedHint.value = false
  }, 1500)
}

async function onToggle(key: string, value: unknown) {
  if (!props.plugin) return
  values.value = { ...values.value, [key]: value }
  await store.updateSetting(props.plugin.name, key, value)
  showSavedHint()
}

async function onChange(key: string, event: Event) {
  if (!props.plugin) return
  const target = event.target as HTMLInputElement | HTMLSelectElement
  let value: unknown = target.value
  const item = schema.value.find((s) => s.key === key)
  if (item?.type === 'number') {
    value = Number(value)
  }
  values.value = { ...values.value, [key]: value }
  await store.updateSetting(props.plugin.name, key, value)
  showSavedHint()
}

watch(
  () => [props.visible, props.plugin] as const,
  async ([visible, plugin]) => {
    if (!visible || !plugin) return
    loading.value = true
    try {
      const data = await store.getSettings(plugin.name)
      schema.value = data.schema || []
      values.value = { ...data.values }
    } finally {
      loading.value = false
    }
  }
)
</script>

<style scoped>
.plugin-settings {
  padding: var(--s-lg) var(--s-xl);
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  min-height: 200px;
}

.settings-loading,
.settings-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-md);
  padding: 48px 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.settings-empty .empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.settings-empty .empty-text {
  color: var(--text-secondary);
  margin: 0;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-xl);
  padding: var(--s-md) 0;
  border-bottom: 1px solid var(--divider);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
}

.setting-key {
  color: var(--text-tertiary);
  font-size: 10px;
  font-family: var(--font-mono);
}

.setting-control {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-width: 140px;
  justify-content: flex-end;
}

.toggle-switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: var(--bg-hover);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
  padding: 0;
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
  background: #fff;
  transition: transform var(--duration-fast) ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(16px);
}

.setting-input {
  width: 140px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  transition: border-color var(--duration-fast) ease;
}

.setting-input:focus {
  border-color: var(--primary);
}

.setting-input[type='number'] {
  width: 90px;
  -moz-appearance: textfield;
}

.setting-input[type='number']::-webkit-inner-spin-button,
.setting-input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.select-wrapper {
  position: relative;
  width: 140px;
}

.setting-select {
  width: 100%;
  height: 30px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color var(--duration-fast) ease;
}

.setting-select:focus {
  border-color: var(--primary);
}

.select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.saved-hint {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: var(--r-sm);
  background: var(--success);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  z-index: 200;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>