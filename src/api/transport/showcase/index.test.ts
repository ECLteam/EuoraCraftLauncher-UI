import { describe, expect, it } from 'vitest'
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

  it('不同 transport 实例之间不会共享展示数据', async () => {
    const first = createShowcaseTransport()
    const second = createShowcaseTransport()

    await first.invoke('accounts_add_offline', { username: 'OnlyInFirst' })
    const firstAccounts = (await first.invoke('accounts_list', {})) as ApiResponse<{ accounts: unknown[] }>
    const secondAccounts = (await second.invoke('accounts_list', {})) as ApiResponse<{ accounts: unknown[] }>

    expect(firstAccounts.data?.accounts).toHaveLength((secondAccounts.data?.accounts.length ?? 0) + 1)
  })
})
