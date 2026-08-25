import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { ModInfo } from '@/types/mods'
import RequiredModDependencies from './RequiredModDependencies.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const sodium: ModInfo = {
  id: 'AANobbMI',
  slug: 'sodium',
  title: 'Sodium',
  description: 'Rendering optimization mod',
  author: 'CaffeineMC',
  iconUrl: 'https://example.com/sodium.png',
  code: '',
  source: 'modrinth',
  loaders: ['fabric'],
  gameVersions: ['26.2'],
  projectUrl: 'https://modrinth.com/mod/sodium',
  body: '',
}

describe('RequiredModDependencies', () => {
  it('renders required mods and emits the selected project', async () => {
    const wrapper = mount(RequiredModDependencies, {
      props: { dependencies: [sodium], gameVersion: '26.2' },
      global: {
        stubs: {
          UiIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Sodium')
    expect(wrapper.text()).toContain('26.2')

    await wrapper.get('.dependency-mod-card').trigger('click')
    expect(wrapper.emitted('open')).toEqual([[sodium]])
  })

  it('stays hidden when there are no dependencies to show', () => {
    const wrapper = mount(RequiredModDependencies, { props: { dependencies: [] } })
    expect(wrapper.find('.required-dependencies').exists()).toBe(false)
  })
})
