<template>
  <Modal
    :visible="visible"
    :title="title"
    :showFooter="false"
    :width="width"
    :wrapperClass="'schematic-preview-modal'"
    @update:visible="emit('update:visible', $event)"
    @closed="onClosed"
  >
    <div class="schematic-preview-body">
      <NSpin :show="loading">
        <div v-if="loading" class="schematic-preview-hint">{{ t('schematic.loading') }}</div>
        <div v-else-if="error" class="schematic-preview-hint schematic-error">{{ error }}</div>
        <SchematicViewer3D v-else-if="data" :data="data" />
      </NSpin>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { NSpin } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/modals/Modal.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import type { SchematicPreviewData } from '@/types/api'
import type { ScannedVersion } from '@/types/instances'
import { getErrorMessage } from '@/utils/error'
import SchematicViewer3D from './SchematicViewer3D.vue'

interface Props {
  visible: boolean
  version?: ScannedVersion
  resourceId?: string
  resourceName?: string
}

const props = withDefaults(defineProps<Props>(), {
  version: undefined,
  resourceId: '',
  resourceName: '',
})

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const { t } = useI18n()
const message = useLauncherMessage()
const loading = ref(false)
const error = ref('')
const data = ref<SchematicPreviewData | null>(null)
const width = 'min(90vw, 860px)'

const title = computed(() => (props.resourceName ? `${props.resourceName}` : t('schematic.title')))

async function load(): Promise<void> {
  if (!props.version || !props.resourceId) return
  loading.value = true
  error.value = ''
  data.value = null
  try {
    data.value = await instanceWorkspaceApi.schematicPreview(workspaceTarget(props.version), props.resourceId)
  } catch (err) {
    error.value = getErrorMessage(err, t('schematic.parseFailed'))
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (open) => {
    if (open) void load()
  }
)

function onClosed(): void {
  data.value = null
  error.value = ''
}
</script>

<style scoped>
.schematic-preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 440px;
}

.schematic-preview-hint {
  color: var(--ecl-text-secondary, #999);
  font-size: 13px;
}

.schematic-error {
  color: var(--error, #e05a5a);
}
</style>
