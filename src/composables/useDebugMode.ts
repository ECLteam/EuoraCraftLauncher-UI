import { computed, onMounted } from 'vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { LauncherConfig } from '@/types/api'

type LogLevel = NonNullable<LauncherConfig['debug_log_level']>

/**
 * 读取并切换启动器全局调试模式，以及独立于调试模式的控制台日志级别。
 * 对应配置文件中 ``launcher.debug`` 与 ``launcher.debug_log_level``，修改后即时生效。
 */
export function useDebugMode() {
  const settingsStore = useSettingsStore()
  // Pinia setup store 返回的 ref 会被自动解包，settingsStore.launcher 即普通对象
  const debugMode = computed(() => settingsStore.launcher.debug === true)
  // 显示实际生效级别：开启调试模式时强制 debug，否则取独立配置的日志级别。
  const debugLogLevel = computed<LogLevel>(() =>
    debugMode.value ? 'debug' : (settingsStore.launcher.debug_log_level ?? 'info')
  )

  onMounted(() => {
    void settingsStore.load().catch(() => {})
  })

  async function setDebugMode(value: boolean): Promise<void> {
    await settingsStore.patchLauncher({ debug: value })
  }

  async function setDebugLogLevel(value: LogLevel): Promise<void> {
    await settingsStore.patchLauncher({ debug_log_level: value })
  }

  return { debugMode, setDebugMode, debugLogLevel, setDebugLogLevel }
}
