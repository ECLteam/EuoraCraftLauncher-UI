import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import type { ScannedVersion } from '@/types/api'
import InstalledInstanceList from './InstalledInstanceList.vue'

vi.mock('@/features/instances/api/instanceProfileApi', () => ({
  targetFromVersion: (version: ScannedVersion) => ({ gamePath: version.path, versionId: version.versionId }),
  instanceProfileApi: {
    categories: vi.fn().mockResolvedValue([]),
    patch: vi.fn().mockResolvedValue({}),
    setPinOrder: vi.fn().mockResolvedValue(undefined),
  },
}))

const versions: ScannedVersion[] = [
  {
    id: 'fabric-1.21.1',
    versionId: 'Fabric 1.21.1',
    versionType: 'release',
    path: 'C:\\Games\\.minecraft',
    displayName: '生存服',
    primaryLoader: 'Fabric',
    vanillaName: '1.21.1',
    hasForge: false,
    hasNeoForge: false,
    hasFabric: true,
    hasQuilt: false,
    isBroken: false,
    jsonPath: 'C:\\Games\\.minecraft\\versions\\fabric.json',
  },
  {
    id: 'vanilla-1.20.1',
    versionId: '1.20.1',
    versionType: 'release',
    path: 'C:\\Games\\.minecraft',
    displayName: '原版',
    primaryLoader: 'Vanilla',
    vanillaName: '1.20.1',
    hasForge: false,
    hasNeoForge: false,
    hasFabric: false,
    hasQuilt: false,
    isBroken: false,
    jsonPath: 'C:\\Games\\.minecraft\\versions\\1.20.1.json',
  },
]

function mountVersionList(searchQuery = '') {
  return mount(InstalledInstanceList, {
    global: {
      plugins: [i18n, createPinia()],
    },
    props: {
      versions,
      selectedPathIndex: 0,
      pathCount: 1,
      pathName: '主目录',
      pathLocation: 'C:\\Games\\.minecraft',
      loading: false,
      refreshLoading: false,
      searchQuery,
      selectedVersion: '',
    },
  })
}

describe('InstalledInstanceList', () => {
  it('按版本名称过滤列表', async () => {
    const wrapper = mountVersionList('fabric')
    // 默认视图为列表；切到卡片视图以断言卡片数量按筛选收敛
    await wrapper.get('[title="卡片视图"]').trigger('click')

    expect(wrapper.findAll('.instance-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Fabric 1.21.1')
    expect(wrapper.text()).not.toContain('1.20.1')
  })

  it('将启动操作作为版本事件抛出', async () => {
    const wrapper = mountVersionList()

    await wrapper.get('[title="卡片视图"]').trigger('click')
    await wrapper.get('.play-button').trigger('click')

    expect(wrapper.emitted('launch')).toEqual([[versions[0]]])
  })

  it('列表模式分离游戏版本与加载器并提供快速操作', async () => {
    const wrapper = mountVersionList()

    await wrapper.get('[title="列表视图"]').trigger('click')

    expect(wrapper.get('.table-header').text()).toContain('游戏版本')
    expect(wrapper.get('.table-header').text()).toContain('加载器')
    expect(wrapper.get('.table-header').text()).not.toContain('最近启动')
    expect(wrapper.findAll('.quick-launch-button')).toHaveLength(2)
    expect(wrapper.findAll('[title="删除版本"]')).toHaveLength(2)

    await wrapper.findAll('[title="删除版本"]')[0]!.trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[versions[0]]])
  })
})
