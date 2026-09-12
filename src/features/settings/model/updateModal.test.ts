import { describe, expect, it } from 'vitest'
import { getUpdateModalTitle } from './updateModal'

describe('getUpdateModalTitle', () => {
  it('uses update content as the dialog theme when release notes are available', () => {
    expect(getUpdateModalTitle('Added multiplayer improvements', (key) => key)).toBe(
      'settings.aboutTab.update.notesTitle'
    )
  })

  it('falls back to the generic update theme when release notes are empty', () => {
    expect(getUpdateModalTitle('   ', (key) => key)).toBe('settings.aboutTab.update.updateAvailableTitle')
  })
})
