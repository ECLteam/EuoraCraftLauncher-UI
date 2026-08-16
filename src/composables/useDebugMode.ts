import { computed, onMounted } from 'vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

/**
 * 读取并切换启动器全局调试模式。
 * 对应配置文件中 ``launcher.debug``，需重启启动器后完全生效。
 */
export function useDebugMode() {
  const settingsStore = useSettingsStore()
  // Pinia setup store 返回的 ref 会被自动解包，settingsStore.launcher 即普通对象
  const debugMode = computed(() => settingsStore.launcher.debug === true)

  onMounted(() => {
    void settingsStore.load().catch(() => {})
  })

  async function setDebugMode(value: boolean): Promise<void> {
    await settingsStore.patchLauncher({ debug: value })
  }

  return { debugMode, setDebugMode }
}