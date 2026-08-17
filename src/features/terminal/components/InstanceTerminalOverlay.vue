<template>
  <Teleport to="body">
    <Transition name="instance-terminal" appear>
      <div v-if="visible" class="instance-terminal-overlay" role="dialog" :aria-modal="true">
        <div class="instance-terminal-panel">
          <header class="instance-terminal-header">
            <UiIcon name="terminal" :size="16" />
            <strong>{{ title }}</strong>
            <span class="instance-terminal-grip" />
            <button class="instance-terminal-close" :title="t('terminal.close')" @click="requestClose">
              <UiIcon name="close" :size="16" />
            </button>
          </header>
          <div class="instance-terminal-body">
            <ProcessInstanceView />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { globalProcessInstances } from '../composables/useProcessInstances'
import ProcessInstanceView from './ProcessInstanceView.vue'

defineOptions({ name: 'InstanceTerminalOverlay' })

const props = withDefaults(defineProps<Props>(), { title: '' })
const emit = defineEmits<Emits>()

interface Props {
  visible: boolean
  title?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const { t } = useI18n()

function requestClose(): void {
  emit('update:visible', false)
}

/**
 * 捕获阶段拦截 Esc，阻止冒泡到下层仍处于活动状态的全屏弹窗（运行管理），确保只关闭本面板。
 */
function onKeydownCapture(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    requestClose()
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      globalProcessInstances.init()
      document.addEventListener('keydown', onKeydownCapture, true)
    } else {
      globalProcessInstances.dispose()
      document.removeEventListener('keydown', onKeydownCapture, true)
    }
  },
  { immediate: true }
)
</script>

<style src="@/styles/components/panels/InstanceTerminalOverlay.css"></style>
