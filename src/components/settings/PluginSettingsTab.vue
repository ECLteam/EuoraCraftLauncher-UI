<template>
  <div class="tab-pane">
    <div v-if="loading" class="loading-state">{{ t('common.loading') }}</div>
    <div v-else-if="pluginSettingsList.length === 0" class="empty-state">
      {{ t('plugins.noSettings') }}
    </div>
    <template v-else>
      <div v-for="item in pluginSettingsList" :key="item.name" class="settings-section">
        <div class="section-label">{{ item.title || item.name }}</div>
        <div v-for="(field, key) in item.schema" :key="key" class="setting-item">
          <div class="setting-info">
            <div class="setting-label">{{ field.label || key }}</div>
            <div class="setting-desc">{{ field.description || '' }}</div>
          </div>
          <div class="setting-control">
            <!-- text -->
            <input
              v-if="field.type === 'text' || !field.type"
              type="text"
              :value="item.values[key] ?? field.default ?? ''"
              @change="(e) => handleChange(item.name, key, (e.target as HTMLInputElement).value, field.type)"
              class="text-input"
            />
            <!-- number -->
            <input
              v-else-if="field.type === 'number'"
              type="number"
              :value="item.values[key] ?? field.default ?? 0"
              :min="field.min"
              :max="field.max"
              :step="field.step ?? 1"
              @change="(e) => handleChange(item.name, key, Number((e.target as HTMLInputElement).value), field.type)"
              class="text-input"
              style="width: 100px"
            />
            <!-- boolean -->
            <button
              v-else-if="field.type === 'boolean'"
              :class="['toggle-switch', { active: item.values[key] ?? field.default ?? false }]"
              @click="handleChange(item.name, key, !(item.values[key] ?? field.default ?? false), field.type)"
              role="switch"
            >
              <span class="toggle-knob"></span>
            </button>
            <!-- select -->
            <select
              v-else-if="field.type === 'select'"
              :value="item.values[key] ?? field.default ?? ''"
              @change="(e) => handleChange(item.name, key, (e.target as HTMLSelectElement).value, field.type)"
              class="text-input"
            >
              <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                {{ opt.label || opt.value }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import backend from '@/api/client'

const { t } = useI18n()
const message = useGlassMessage()

const loading = ref(true)
const pluginSettingsList = ref<any[]>([])

const loadSettings = async () => {
  loading.value = true
  try {
    const listRes = await backend.command('plugin_list')
    if (!listRes?.success || !listRes.data) {
      pluginSettingsList.value = []
      return
    }
    const plugins = listRes.data as any[]
    const result: any[] = []
    for (const plugin of plugins) {
      const settingsRes = await backend.command('plugin_get_settings', { plugin_name: plugin.name })
      if (settingsRes?.success && settingsRes.data?.schema && Object.keys(settingsRes.data.schema).length > 0) {
        result.push({
          name: plugin.name,
          title: plugin.title || plugin.name,
          schema: settingsRes.data.schema,
          values: settingsRes.data.values || {},
        })
      }
    }
    pluginSettingsList.value = result
  } catch (e) {
    console.error('加载插件设置失败:', e)
  } finally {
    loading.value = false
  }
}

const handleChange = async (pluginName: string, key: string, value: any, type: string) => {
  try {
    const res = await backend.command('plugin_update_setting', {
      plugin_name: pluginName,
      key,
      value,
    })
    if (res?.success) {
      // 更新本地值
      const item = pluginSettingsList.value.find(p => p.name === pluginName)
      if (item) {
        item.values[key] = value
      }
      message.success(t('common.saved'))
    } else {
      message.error(res?.message || t('common.error'))
    }
  } catch (e: any) {
    message.error(e.message || t('common.error'))
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.tab-pane {
  max-width: 600px;
}

.loading-state,
.empty-state {
  padding: var(--s-2xl);
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
}

.settings-section {
  margin-bottom: var(--s-2xl);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 13px;
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
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.setting-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.text-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  width: 200px;
  transition: border-color 150ms ease-out;
}

.text-input:focus {
  border-color: var(--border-hover);
}

.toggle-switch {
  width: 32px;
  height: 20px;
  border-radius: 16px;
  border: none;
  background: #D0D0D0;
  cursor: pointer;
  position: relative;
  transition: background 150ms ease-out;
  padding: 0;
  flex-shrink: 0;
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
</style>
