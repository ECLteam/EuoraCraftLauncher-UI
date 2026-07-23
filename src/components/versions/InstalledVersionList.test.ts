import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import type { ScannedVersion } from '@/types/api'
import InstalledVersionList from './InstalledVersionList.vue'

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
  return mount(InstalledVersionList, {
    global: {
      plugins: [i18n],
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

describe('InstalledVersionList', () => {
  it('按版本名称过滤列表', () => {
    const wrapper = mountVersionList('fabric')

    expect(wrapper.findAll('.table-row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Fabric 1.21.1')
    expect(wrapper.text()).not.toContain('1.20.1')
  })

  it('将启动操作作为版本事件抛出', async () => {
    const wrapper = mountVersionList()

    await wrapper.get('.btn-play').trigger('click')

    expect(wrapper.emitted('launch')).toEqual([[versions[0]]])
  })
})
