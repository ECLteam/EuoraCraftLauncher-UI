import { computed, onMounted } from 'vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

/**
 * 读取并切换「流程调试」开关。
 * 开启后可在阶段性界面（如联机页）自由切换前后阶段，仅在调试页提供入口。
 */
export function useFlowDebug() {
  const settingsStore = useSettingsStore()
  // Pinia setup store 返回的 ref 会被自动解包，settingsStore.ui 即普通对象
  const flowDebug = computed(() => settingsStore.ui.flowDebug === true)

  onMounted(() => {
    void settingsStore.load().catch(() => {})
  })

  async function setFlowDebug(value: boolean): Promise<void> {
    await settingsStore.patchUi({ flowDebug: value })
  }

  return { flowDebug, setFlowDebug }
}
