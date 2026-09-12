import { describe, expect, it } from 'vitest'
import type { UpdateCheckResult } from '@/types/system'
import { SEEN_UPDATE_VERSION_STORAGE_KEY, rememberShownUpdate, shouldShowStartupUpdate } from './updateNotice'

function updateResult(version = '1.2.0'): UpdateCheckResult {
  return {
    status: 'update_available',
    current_version: '1.1.0',
    channel: 'release',
    latest_version: version,
    latest_url: 'https://example.com/releases/1.2.0',
    latest_notes: '修复启动问题',
    message: null,
  }
}

describe('update startup notice', () => {
  it('shows an unseen available version once and remembers it after closing', () => {
    const result = updateResult()

    expect(shouldShowStartupUpdate(result)).toBe(true)
    rememberShownUpdate(result)

    expect(localStorage.getItem(SEEN_UPDATE_VERSION_STORAGE_KEY)).toBe('1.2.0')
    expect(shouldShowStartupUpdate(result)).toBe(false)
  })

  it('shows the dialog again when a newer version is found', () => {
    rememberShownUpdate(updateResult('1.2.0'))

    expect(shouldShowStartupUpdate(updateResult('1.3.0'))).toBe(true)
  })

  it('never auto-opens for non-update results or an invalid latest version', () => {
    expect(
      shouldShowStartupUpdate({
        ...updateResult(),
        status: 'up_to_date',
        latest_version: null,
      })
    ).toBe(false)
    expect(shouldShowStartupUpdate(updateResult('   '))).toBe(false)
  })
})
