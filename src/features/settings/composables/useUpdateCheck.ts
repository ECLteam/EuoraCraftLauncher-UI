import { readonly, ref } from 'vue'
import type { UpdateCheckResult } from '@/types/system'
import { updateApi } from '../api/updateApi'

/** 最近一次版本检测的结果，启动自动检测与手动检测共用同一份状态。 */
const lastResult = ref<UpdateCheckResult | null>(null)
const checking = ref(false)

async function checkUpdate(): Promise<UpdateCheckResult | null> {
  if (checking.value) return null
  checking.value = true
  try {
    const result = await updateApi.checkUpdate()
    if (result) lastResult.value = result
    return result
  } finally {
    checking.value = false
  }
}

export function useUpdateCheck() {
  return {
    lastResult: readonly(lastResult),
    checking: readonly(checking),
    checkUpdate,
  }
}
