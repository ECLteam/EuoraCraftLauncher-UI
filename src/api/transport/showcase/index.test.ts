import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { normalizeLoaderVersions } from '@/features/versions/model/loaderVersions'
import type { ApiResponse } from '@/types/api'
import { createShowcaseTransport } from '.'

describe('ShowcaseTransport', () => {
  it('配置写入只保存在当前 transport 内存中', async () => {
    const transport = createShowcaseTransport()
    const nextUi = { locale: 'en-US', theme: { navigation_mode: 'sidebar' } }

    await transport.invoke('config_set', { section: 'ui', data: nextUi })
    const result = (await transport.invoke('config_get', { section: 'ui' })) as ApiResponse<typeof nextUi>

    expect(result.success).toBe(true)
    expect(result.data).toEqual(nextUi)
  })

  it('可写入包含嵌套 Vue Proxy 的设置对象', async () => {
    const transport = createShowcaseTransport()
    const nextUi = reactive({
      locale: 'zh-CN',
      theme: { navigation_mode: 'sidebar' },
      background: { type: 'custom', path: 'Showcase/background.png' },
    })

    await expect(transport.invoke('config_set', { section: 'ui', data: nextUi })).resolves.toMatchObject({
      success: true,
    })
    const result = (await transport.invoke('config_get', { section: 'ui' })) as ApiResponse<typeof nextUi>

    expect(result.data).toEqual({
      locale: 'zh-CN',
      theme: { navigation_mode: 'sidebar' },
      background: { type: 'custom', path: 'Showcase/background.png' },
    })
  })

  it('不同 transport 实例之间不会共享展示数据', async () => {
    const first = createShowcaseTransport()
    const second = createShowcaseTransport()

    await first.invoke('accounts_add_offline', { username: 'OnlyInFirst' })
    const firstAccounts = (await first.invoke('accounts_list', {})) as ApiResponse<{ accounts: unknown[] }>
    const secondAccounts = (await second.invoke('accounts_list', {})) as ApiResponse<{ accounts: unknown[] }>

    expect(firstAccounts.data?.accounts).toHaveLength((secondAccounts.data?.accounts.length ?? 0) + 1)
  })

  it.each(['fabric', 'forge', 'neoforge', 'quilt'])('为 %s 安装流程提供可用加载器版本', async (loader) => {
    const transport = createShowcaseTransport()
    const result = (await transport.invoke(`${loader}_versions`, {
      game_version: '1.21.8',
    })) as ApiResponse<unknown>

    expect(result.success).toBe(true)
    expect(normalizeLoaderVersions(result.data).length).toBeGreaterThan(0)
  })
})
