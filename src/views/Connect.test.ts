import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import UiSelect from '@/components/ui/Select.vue'
import { useInstanceStore } from '@/features/instances/stores/instanceStore'
import { i18n } from '@/i18n'
import type {
  ConnectorMatchResult,
  ConnectorStatus,
  EasyTierStatus,
  GameInstance,
  NatTypeResult,
  ScannedVersion,
} from '@/types/api'
import Connect from './Connect.vue'

const mocks = vi.hoisted(() => ({
  useConnector: vi.fn(),
  launchServer: vi.fn(),
  listRunningInstances: vi.fn(),
  onRunningChanged: vi.fn(),
}))

vi.mock('@/features/connect/composables/useConnector', () => ({
  useConnector: mocks.useConnector,
}))

vi.mock('@/features/instances/api/instanceWorkspaceApi', () => ({
  instanceWorkspaceApi: { launchServer: mocks.launchServer },
}))

vi.mock('@/features/instances/api/instanceRuntimeApi', () => ({
  instanceRuntimeApi: {
    list: mocks.listRunningInstances,
    onChanged: mocks.onRunningChanged,
  },
}))

const runningInstance: GameInstance = {
  id: 'survival-1',
  name: '生存世界',
  type: 'instance',
  isRunning: true,
  pid: 1234,
  version: '1.21.5',
  versionId: 'Fabric 1.21.5',
  loader: 'Fabric',
  gamePath: 'C:\\Games\\.minecraft',
}

const scannedVersion: ScannedVersion = {
  id: 'fabric-1.21.5',
  versionId: 'Fabric 1.21.5',
  versionType: 'release',
  path: 'C:\\Games\\.minecraft',
  displayName: '生存世界',
  primaryLoader: 'Fabric',
  loaderVersion: '0.16.10',
  vanillaName: '1.21.5',
  hasForge: false,
  hasNeoForge: false,
  hasFabric: true,
  hasQuilt: false,
  isBroken: false,
  jsonPath: 'C:\\Games\\.minecraft\\versions\\Fabric 1.21.5\\Fabric 1.21.5.json',
}

function idleStatus(): ConnectorStatus {
  return {
    mode: 'idle',
    roomCode: null,
    mcHost: null,
    mcPort: null,
    gameInfo: null,
    players: [],
    nodes: [],
    error: null,
  }
}

function connectorState(status: ConnectorStatus, available = true) {
  return {
    availability: ref(available ? 'available' : 'unavailable'),
    unavailableReason: ref(available ? '' : 'Unknown backend command: connector_status'),
    status: ref(status),
    easyTier: ref<EasyTierStatus | null>(
      available ? { installed: true, status: 'installed', progress: 100, speed: 0, error: null } : null
    ),
    natType: ref<NatTypeResult | null>(null),
    matchResult: ref<ConnectorMatchResult | null>(null),
    busy: ref(false),
    easyTierBusy: ref(false),
    natBusy: ref(false),
    matching: ref(false),
    scanning: ref(false),
    detectedPort: ref(null),
    retryAvailability: vi.fn(),
    hostPort: vi.fn().mockResolvedValue(true),
    hostInstance: vi.fn().mockResolvedValue(true),
    join: vi.fn().mockResolvedValue(true),
    leave: vi.fn().mockResolvedValue(true),
    kick: vi.fn().mockResolvedValue(true),
    detectNat: vi.fn(),
    downloadEasyTier: vi.fn(),
    startPortScan: vi.fn(),
    stopPortScan: vi.fn(),
    refreshMatches: vi.fn(),
  }
}

function mountConnect(state: ReturnType<typeof connectorState>) {
  mocks.useConnector.mockReturnValue(state)
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useInstanceStore()
  store.scannedVersions = [scannedVersion]
  i18n.global.locale.value = 'zh-CN'

  return mount(Connect, {
    global: { plugins: [i18n, pinia] },
  })
}

describe('Connect view', () => {
  beforeEach(() => {
    mocks.useConnector.mockReset()
    mocks.launchServer.mockReset().mockResolvedValue(undefined)
    mocks.listRunningInstances.mockReset().mockResolvedValue([])
    mocks.onRunningChanged.mockReset().mockReturnValue(undefined)
  })

  it('keeps the room choices visible when the backend is unavailable', () => {
    const wrapper = mountConnect(connectorState(idleStatus(), false))

    expect(wrapper.text()).toContain('加入联机房间')
    expect(wrapper.text()).toContain('创建房间')
    expect(wrapper.get('#connect-room-code').attributes('disabled')).toBeDefined()
  })

  it('renders launch failures as a stable starting-state card', () => {
    const wrapper = mountConnect(
      connectorState({
        ...idleStatus(),
        mode: 'starting',
        error: 'Minecraft process exited before opening a LAN port',
      })
    )

    expect(wrapper.text()).toContain('创建房间失败')
    expect(wrapper.text()).toContain('Minecraft process exited before opening a LAN port')
  })

  it('renders EasyTier progress', () => {
    const state = connectorState(idleStatus())
    state.easyTier.value = {
      installed: false,
      status: 'downloading',
      progress: 42,
      speed: 2 * 1024 * 1024,
      error: null,
    }
    const wrapper = mountConnect(state)

    expect(wrapper.text()).toContain('正在下载联机组件')
    expect(wrapper.text()).toContain('42% 2.0 MB/s')
  })

  it('triggers NAT detection from the corner button', async () => {
    const state = connectorState(idleStatus())
    const wrapper = mountConnect(state)

    const button = wrapper.findAll('button').find((candidate) => candidate.text().includes('NAT 检测'))
    expect(button).toBeDefined()
    await button?.trigger('click')

    expect(state.detectNat).toHaveBeenCalled()
  })

  it('selects a running instance and proceeds to port detection', async () => {
    const state = connectorState(idleStatus())
    mocks.listRunningInstances.mockResolvedValue([runningInstance])
    const wrapper = mountConnect(state)
    await flushPromises()

    wrapper.findComponent(UiSelect).vm.$emit('update:modelValue', runningInstance.id)
    await wrapper.vm.$nextTick()
    const button = wrapper.findAll('button').find((candidate) => candidate.text().includes('下一步'))
    await button?.trigger('click')
    await flushPromises()

    expect(state.startPortScan).toHaveBeenCalled()
  })

  it('creates a room with a manually entered port', async () => {
    const state = connectorState(idleStatus())
    mocks.listRunningInstances.mockResolvedValue([runningInstance])
    const wrapper = mountConnect(state)
    await flushPromises()

    wrapper.findComponent(UiSelect).vm.$emit('update:modelValue', runningInstance.id)
    await wrapper.vm.$nextTick()
    await wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('下一步'))
      ?.trigger('click')
    await flushPromises()

    await wrapper.get('#connect-port').setValue('25566')
    await wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('创建房间'))
      ?.trigger('click')

    expect(state.hostPort).toHaveBeenCalledWith(25566)
  })

  it('shows host controls and passes the selected player to kick', async () => {
    const guest = {
      name: 'Guest',
      vendor: 'ECL',
      iconBase64: null,
      kind: 'guest' as const,
      machineId: 'guest-1',
    }
    const state = connectorState({
      ...idleStatus(),
      mode: 'host',
      roomCode: 'U/TEST-ROOM',
      players: [{ ...guest, name: 'Host', kind: 'host', machineId: 'host-1' }, guest],
    })
    const wrapper = mountConnect(state)

    await wrapper.get('[title="踢出玩家"]').trigger('click')

    expect(state.kick).toHaveBeenCalledWith(guest)
  })

  it('quick-launches a matched guest instance against the forwarded address', async () => {
    const state = connectorState({
      ...idleStatus(),
      mode: 'guest',
      roomCode: 'U/TEST-ROOM',
      mcHost: '127.0.0.1',
      mcPort: 25566,
      gameInfo: { gameVersion: '1.21.5', loader: 'Fabric', loaderVersion: '0.16.10' },
    })
    state.matchResult.value = {
      mods: [],
      instances: [
        {
          gamePath: scannedVersion.path,
          versionId: scannedVersion.versionId,
          name: scannedVersion.displayName,
          gameVersion: scannedVersion.vanillaName,
          loader: scannedVersion.primaryLoader,
          loaderVersion: scannedVersion.loaderVersion ?? null,
          matched: true,
          modCount: 0,
        },
      ],
    }
    const wrapper = mountConnect(state)

    const button = wrapper.findAll('button').find((candidate) => candidate.text().includes('快捷启动'))
    await button?.trigger('click')

    expect(mocks.launchServer).toHaveBeenCalledWith(
      { game_path: scannedVersion.path, version_id: scannedVersion.versionId },
      '127.0.0.1:25566'
    )
  })
})
