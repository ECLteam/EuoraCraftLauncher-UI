import { afterEach, describe, expect, it } from 'vitest'
import { getWindowContext } from './windowContext'

describe('windowContext', () => {
  afterEach(() => {
    delete window.__ECL_WINDOW_CONTEXT__
  })

  it('优先读取宿主初始化脚本提供的受控窗口身份', () => {
    window.__ECL_WINDOW_CONTEXT__ = {
      window: 'theme-studio',
      label: 'theme-studio',
      session: 'abc123',
      title: 'Theme Studio',
    }

    expect(getWindowContext()).toEqual({
      type: 'theme-studio',
      label: 'theme-studio',
      sessionId: 'abc123',
      route: undefined,
      title: 'Theme Studio',
    })
  })
})
