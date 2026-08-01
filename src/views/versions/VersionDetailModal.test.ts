import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import type { ScannedVersion } from '@/types/api'
import VersionDetailModal from './VersionDetailModal.vue'

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  resetSettings: vi.fn(),
  selectJava: vi.fn(),
  openFolder: vi.fn(),
}))

vi.mock('@/features/versions/api/versionSettingsApi', () => ({
  versionSettingsApi: {
    get: mocks.getSettings,
    save: mocks.saveSettings,
    reset: mocks.resetSettings,
    selectJava: mocks.selectJava,
  },
}))

vi.mock('@/features/versions/api/versionInstallApi', () => ({
  versionInstallApi: {
    openFolder: mocks.openFolder,
  },
}))

const version: ScannedVersion = {
  id: '1.21.5',
  versionId: '1.21.5',
  versionType: 'release',
  path: 'D:/Games/.minecraft',
  displayName: '1.21.5',
  primaryLoader: 'Vanilla',
  vanillaName: '1.21.5',
  hasForge: false,
  hasNeoForge: false,
  hasFabric: false,
  hasQuilt: false,
  hasOptiFine: false,
  isBroken: false,
  jsonPath: 'D:/Games/.minecraft/versions/1.21.5/1.21.5.json',
}

function mountModal(initialTab: 'overview' | 'mods' | 'settings' | 'saves' = 'settings') {
  return mount(VersionDetailModal, {
    global: {
      plugins: [i18n],
      stubs: { Teleport: true },
    },
    props: {
      visible: true,
      version,
      initialTab,
    },
  })
}

describe('VersionDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSettings.mockResolvedValue({
      isolated: false,
      customMemory: false,
      memory: 4096,
      customJava: false,
      javaPath: '',
      jvmArgs: '',
      gameArgs: '',
    })
  })

  it('uses horizontal tabs and opens the requested settings page', async () => {
    const wrapper = mountModal()
    await flushPromises()

    expect(wrapper.find('.vdm-tabs').exists()).toBe(true)
    expect(wrapper.find('.version-settings-page').exists()).toBe(true)
    expect(wrapper.findAll('.n-switch')).toHaveLength(3)
    expect(mocks.getSettings).toHaveBeenCalledWith({
      versionId: '1.21.5',
      path: 'D:/Games/.minecraft',
    })
  })

  it('switches from version settings to the compact overview page', async () => {
    const wrapper = mountModal()
    await flushPromises()
    const overviewTab = wrapper.findAll('.vdm-tab-button').find((button) => button.text().includes('总览'))

    await overviewTab?.trigger('click')

    expect(wrapper.find('.overview-page').exists()).toBe(true)
    expect(wrapper.findAll('.info-item')).toHaveLength(4)
  })
})
