<template>
  <FullscreenModal :visible="visible" :title="pluginTitle" :showFooter="false" :closable="true" @close="close">
    <div class="plugin-settings">
      <NSpin :show="loading">
        <NEmpty v-if="!loading && !schema.length" :description="t('plugins.noSettings')" />
        <NList v-else bordered>
          <NListItem v-for="item in schema" :key="item.key">
            <NThing :title="item.description || item.key" :description="item.key" />
            <template #suffix>
              <NSwitch
                v-if="item.type === 'bool'"
                :value="Boolean(values[item.key])"
                @update:value="updateSetting(item.key, $event)"
              />
              <NInputNumber
                v-else-if="item.type === 'number'"
                class="setting-control"
                :value="numberValue(values[item.key])"
                @update:value="updateSetting(item.key, $event)"
              />
              <NSelect
                v-else-if="item.type === 'select'"
                class="setting-control"
                :value="stringValue(values[item.key])"
                :options="selectOptions(item)"
                @update:value="updateSetting(item.key, $event)"
              />
              <NInput
                v-else
                class="setting-control"
                :value="stringValue(values[item.key])"
                @change="updateSetting(item.key, $event)"
              />
            </template>
          </NListItem>
        </NList>
      </NSpin>

      <Transition name="fade">
        <NAlert v-if="savedHint" class="saved-hint" type="success" :showIcon="false">
          {{ t('plugins.settingSaved') }}
        </NAlert>
      </Transition>
    </div>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { NAlert, NEmpty, NInput, NInputNumber, NList, NListItem, NSelect, NSpin, NSwitch, NThing } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import { usePluginStore } from '@/features/plugins/stores/pluginStore'
import type { PluginInfo, PluginSettingSchema } from '@/types/plugins'

const props = defineProps<{
  visible: boolean
  plugin: PluginInfo | null
}>()

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const store = usePluginStore()
const loading = ref(false)
const schema = ref<PluginSettingSchema[]>([])
const values = ref<Record<string, unknown>>({})
const savedHint = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | null = null

const pluginTitle = computed(() =>
  props.plugin ? `${t('plugins.settings')} - ${props.plugin.title || props.plugin.name}` : ''
)

function close() {
  emit('close')
}

function stringValue(value: unknown): string {
  return value == null ? '' : String(value)
}

function numberValue(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function selectOptions(item: PluginSettingSchema) {
  const options = Array.isArray(item.default) ? item.default : []
  return options.map((option) => ({ label: String(option), value: String(option) }))
}

async function updateSetting(key: string, value: unknown) {
  if (!props.plugin) return
  values.value = { ...values.value, [key]: value }
  await store.updateSetting(props.plugin.name, key, value)
  savedHint.value = true
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    savedHint.value = false
  }, 1500)
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
  position: relative;
  max-width: 720px;
  min-height: 240px;
  margin: 0 auto;
  padding: 20px;
}

.setting-control {
  width: 180px;
}

.saved-hint {
  position: sticky;
  bottom: 12px;
  width: fit-content;
  margin: 12px auto 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
