import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { i18n } from '@/i18n'
import Download from './Download.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { tab: 'world' } }),
  useRouter: () => ({ replace: vi.fn() }),
}))

const OnlineModSearchStub = defineComponent({
  name: 'OnlineModSearch',
  props: {
    resourceType: { type: String, default: 'mod' },
    fixedSource: { type: String, default: '' },
  },
  template: '<div class="online-resource-search" />',
})

describe('下载页', () => {
  it('存档页复用在线资源搜索并固定 CurseForge 来源', () => {
    const wrapper = shallowMount(Download, {
      global: {
        plugins: [i18n],
        stubs: { OnlineModSearch: OnlineModSearchStub },
      },
    })

    const search = wrapper.getComponent(OnlineModSearchStub)
    expect(search.props('resourceType')).toBe('world')
    expect(search.props('fixedSource')).toBe('curseforge')
  })
})
