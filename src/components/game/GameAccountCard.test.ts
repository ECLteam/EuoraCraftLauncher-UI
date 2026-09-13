import { mount } from '@vue/test-utils'
import { NDropdown } from 'naive-ui'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { i18n } from '@/i18n'
import GameAccountCard from './GameAccountCard.vue'

describe('GameAccountCard', () => {
  it('打开账户切换菜单时旋转箭头', async () => {
    const wrapper = mount(GameAccountCard, {
      global: {
        plugins: [i18n],
      },
      props: {
        account: null,
        accounts: [{ id: 'offline-player', alias: '离线玩家', type: 'offline' }],
        accountTypeLabel: '',
      },
    })
    const dropdown = wrapper.findComponent(NDropdown)

    dropdown.vm.$emit('update:show', true)
    await nextTick()
    expect(wrapper.get('.account-switch-icon').classes()).toContain('rotated')

    dropdown.vm.$emit('update:show', false)
    await nextTick()
    expect(wrapper.get('.account-switch-icon').classes()).not.toContain('rotated')
  })
})
