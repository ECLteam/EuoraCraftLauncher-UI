import { icons } from '@iconify-json/tabler'
import { describe, expect, it } from 'vitest'
import { ICON_MAP } from './iconify'

describe('图标映射', () => {
  it('ICON_MAP 中所有 Tabler 图标名均存在于 tabler 图标集', () => {
    for (const [short, tablerName] of Object.entries(ICON_MAP)) {
      expect(icons.icons[tablerName], `短名 ${short} -> tabler:${tablerName} 不存在`).toBeDefined()
    }
  })

  it('实例运行管理使用的图标短名均已注册', () => {
    for (const shortName of ['activity', 'game', 'refresh', 'shield', 'stop']) {
      expect(ICON_MAP[shortName], `实例运行管理图标 ${shortName} 未注册`).toBeDefined()
    }
  })
})
