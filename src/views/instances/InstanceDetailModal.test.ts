import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import type { ScannedVersion } from '@/types/api'
import InstanceDetailModal from './InstanceDetailModal.vue'
import type * as NaiveUi from 'naive-ui'

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  resetSettings: vi.fn(),
  selectJava: vi.fn(),
  openFolder: vi.fn(),
  getStats: vi.fn(),
  onStatsChanged: vi.fn(),
  analyzeCrash: vi.fn(),
  backendCommand: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  default: {
    command: mocks.backendCommand,
  },
}))

vi.mock('@/features/instances/api/instanceSettingsApi', () => ({
  instanceSettingsApi: {
    get: mocks.getSettings,
    save: mocks.saveSettings,
    reset: mocks.resetSettings,
    selectJava: mocks.selectJava,
  },
}))

// 测试环境没有挂载 n-dialog-provider，mock useDialog 避免组件 setup 抛错
vi.mock('naive-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof NaiveUi>()
  return {
    ...actual,
    useDialog: () => ({
      warning: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
    }),
  }
})

vi.mock('@/features/instances/api/instanceInstallApi', () => ({
  instanceInstallApi: {
    openFolder: mocks.openFolder,
  },
}))

vi.mock('@/features/instances/api/instanceRuntimeApi', () => ({
  instanceRuntimeApi: {
    getStats: mocks.getStats,
    onChanged: mocks.onStatsChanged,
    analyzeCrash: mocks.analyzeCrash,
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

function mountModal(initialTab: 'overview' | 'mods' | 'settings' = 'settings') {
  return mount(InstanceDetailModal, {
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

describe('InstanceDetailModal', () => {
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
    mocks.getStats.mockResolvedValue({
      launchCount: 4,
      lastRunDurationSeconds: 65,
      totalRunDurationSeconds: 3665,
    })
    mocks.onStatsChanged.mockReturnValue(vi.fn())
    mocks.backendCommand.mockResolvedValue({ success: true, data: { path: 'D:/Logs/latest.log' } })
    mocks.analyzeCrash.mockResolvedValue({
      reportId: 'b'.repeat(32),
      versionId: '1.21.5',
      exitCode: null,
      detectedBy: ['manual'],
      reasons: [],
      sourceFiles: ['latest.log'],
      hasOutput: true,
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
    expect(wrapper.findAll('.info-item')).toHaveLength(6)
    expect(wrapper.text()).toContain('4 次')
    expect(wrapper.text()).toContain('1m 5s')
    expect(mocks.getStats).toHaveBeenCalledWith('D:/Games/.minecraft', '1.21.5')
  })

  it('selects and analyzes a crash log from quick actions', async () => {
    const wrapper = mountModal('overview')
    await flushPromises()
    const analyzeButton = wrapper.findAll('button').find((button) => button.text().includes('分析崩溃日志'))

    await analyzeButton?.trigger('click')
    await flushPromises()

    expect(mocks.backendCommand).toHaveBeenCalledWith('select_file', { purpose: 'crash-analysis' })
    expect(mocks.analyzeCrash).toHaveBeenCalledWith('D:/Logs/latest.log', 'D:/Games/.minecraft', '1.21.5')
  })

  it('does nothing when crash log selection is cancelled', async () => {
    mocks.backendCommand.mockImplementation(async (command: string) =>
      command === 'select_file' ? { success: true, data: { path: '' } } : { success: true, data: [] }
    )
    const wrapper = mountModal('overview')
    await flushPromises()
    const analyzeButton = wrapper.findAll('button').find((button) => button.text().includes('分析崩溃日志'))

    await analyzeButton?.trigger('click')
    await flushPromises()

    expect(mocks.analyzeCrash).not.toHaveBeenCalled()
  })

  it('user edits auto-save after 300ms debounce', async () => {
    vi.useFakeTimers()
    const wrapper = mountModal()
    await flushPromises()
    await wrapper.findAll('.n-switch')[0]!.trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    expect(mocks.saveSettings).toHaveBeenCalledTimes(1)
    expect(mocks.saveSettings).toHaveBeenCalledWith(
      { versionId: '1.21.5', path: 'D:/Games/.minecraft' },
      expect.objectContaining({ isolated: true })
    )
    vi.useRealTimers()
  })

  it('does not auto-save during settings load', async () => {
    mountModal()
    await flushPromises()
    expect(mocks.saveSettings).not.toHaveBeenCalled()
  })

  it('flushes pending settings save when modal closes', async () => {
    vi.useFakeTimers()
    const wrapper = mountModal()
    await flushPromises()
    await wrapper.findAll('.n-switch')[0]!.trigger('click')
    await wrapper.setProps({ visible: false })
    expect(mocks.saveSettings).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
