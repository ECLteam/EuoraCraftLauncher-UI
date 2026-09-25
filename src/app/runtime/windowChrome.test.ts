import { afterEach, describe, expect, it, vi } from 'vitest'
import { desktopWindow } from './desktopWindow'
import { detectActiveWindowChrome, useActiveWindowChrome } from './windowChrome'

describe('detectActiveWindowChrome', () => {
  afterEach(() => vi.restoreAllMocks())

  it('按当前窗口实际装饰状态选择布局', async () => {
    vi.spyOn(desktopWindow, 'isDecorated').mockResolvedValueOnce(true).mockResolvedValueOnce(false)

    await detectActiveWindowChrome()
    expect(useActiveWindowChrome().value).toBe('native')

    await detectActiveWindowChrome()
    expect(useActiveWindowChrome().value).toBe('custom')
  })

  it('无法读取窗口状态时安全回退到自绘布局', async () => {
    vi.spyOn(desktopWindow, 'isDecorated').mockRejectedValue(new Error('window unavailable'))

    await detectActiveWindowChrome()

    expect(useActiveWindowChrome().value).toBe('custom')
  })
})
