import type { UpdateCheckResult } from '@/types/system'

/** 已阅读的自动更新提示所对应的最新版本。 */
export const SEEN_UPDATE_VERSION_STORAGE_KEY = 'euoracraft-seen-update-version'

function getAvailableVersion(result: UpdateCheckResult | null | undefined): string | null {
  if (result?.status !== 'update_available') return null
  const version = result.latest_version?.trim()
  return version || null
}

/** 只有发现未读的新版本时，才在启动后自动打开更新说明。 */
export function shouldShowStartupUpdate(
  result: UpdateCheckResult | null | undefined,
  storage: Storage = localStorage
): boolean {
  const version = getAvailableVersion(result)
  if (!version) return false
  try {
    return storage.getItem(SEEN_UPDATE_VERSION_STORAGE_KEY) !== version
  } catch {
    // 存储不可用时仍展示，避免因浏览器隐私策略静默丢失更新提示。
    return true
  }
}

/** 用户关闭更新说明后，记录已阅读的版本；手动检查仍可随时重新打开说明。 */
export function rememberShownUpdate(
  result: UpdateCheckResult | null | undefined,
  storage: Storage = localStorage
): void {
  const version = getAvailableVersion(result)
  if (!version) return
  try {
    storage.setItem(SEEN_UPDATE_VERSION_STORAGE_KEY, version)
  } catch {
    // 存储不可用时仅影响下次启动是否再次提醒，不影响当前更新流程。
  }
}
