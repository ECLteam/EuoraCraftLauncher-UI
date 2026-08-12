import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SkinViewer3D from './SkinViewer3D.vue'

const viewerMocks = vi.hoisted(() => ({
  loadSkin: vi.fn(async () => undefined),
  loadCape: vi.fn(async () => undefined),
  resetSkin: vi.fn(),
  resetCape: vi.fn(),
  dispose: vi.fn(),
  playerRotation: { y: 0 },
  current: null as { autoRotate: boolean } | null,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('skinview3d', () => ({
  SkinViewer: class {
    width = 0
    height = 0
    autoRotate = false
    autoRotateSpeed = 0
    playerObject = { rotation: viewerMocks.playerRotation }
    loadSkin = viewerMocks.loadSkin
    loadCape = viewerMocks.loadCape
    resetSkin = viewerMocks.resetSkin
    resetCape = viewerMocks.resetCape
    dispose = viewerMocks.dispose

    constructor() {
      viewerMocks.current = this
    }
  },
}))

describe('SkinViewer3D', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    viewerMocks.playerRotation.y = 0
    viewerMocks.current = null
  })

  it('更新皮肤披风并在卸载时释放 WebGL viewer', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    )
    const wrapper = mount(SkinViewer3D, {
      props: { skinUrl: 'skin-a', capeUrl: 'cape-a', model: 'slim' },
    })
    await nextTick()
    await nextTick()

    expect(viewerMocks.loadSkin).toHaveBeenCalledWith('skin-a', { model: 'slim' })
    expect(viewerMocks.loadCape).toHaveBeenCalledWith('cape-a')

    await wrapper.setProps({ skinUrl: 'skin-b', capeUrl: '' })
    await nextTick()
    expect(viewerMocks.loadSkin).toHaveBeenCalledWith('skin-b', { model: 'slim' })
    expect(viewerMocks.resetCape).toHaveBeenCalled()

    wrapper.unmount()
    expect(viewerMocks.dispose).toHaveBeenCalledOnce()
  })

  it('支持手动左右旋转并暂停或继续自动旋转', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    )
    const wrapper = mount(SkinViewer3D)
    await nextTick()
    await nextTick()

    await wrapper.get('[data-testid="rotate-left"]').trigger('click')
    expect(viewerMocks.playerRotation.y).toBeCloseTo(-Math.PI / 8)
    await wrapper.get('[data-testid="rotate-right"]').trigger('click')
    expect(viewerMocks.playerRotation.y).toBeCloseTo(0)

    await wrapper.get('[data-testid="toggle-auto-rotate"]').trigger('click')
    expect(viewerMocks.current?.autoRotate).toBe(false)
    await wrapper.get('[data-testid="toggle-auto-rotate"]').trigger('click')
    expect(viewerMocks.current?.autoRotate).toBe(true)
  })
})
