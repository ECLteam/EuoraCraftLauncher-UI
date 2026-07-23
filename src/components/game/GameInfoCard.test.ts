import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import type { InfoCardData } from '@/types/api'
import GameInfoCard from './GameInfoCard.vue'

const data: InfoCardData = {
  mode: 'rotate',
  tips: ['测试小贴士'],
  announcements: [
    {
      title: '维护公告',
      date: '2026-07-24',
      content: '测试公告内容',
    },
  ],
}

function mountInfoCard(overrides: Partial<InstanceType<typeof GameInfoCard>['$props']> = {}) {
  return mount(GameInfoCard, {
    global: {
      plugins: [i18n],
    },
    props: {
      data,
      view: 'tip',
      isWelcome: false,
      currentTip: data.tips[0] ?? '',
      currentAnnouncement: data.announcements[0] ?? null,
      hasAnnouncements: true,
      canToggle: true,
      ...overrides,
    },
  })
}

describe('GameInfoCard', () => {
  it('展示小贴士并允许切换信息类型', async () => {
    const wrapper = mountInfoCard()

    expect(wrapper.text()).toContain('测试小贴士')
    await wrapper.get('.info-toggle-btn').trigger('click')

    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('轮播模式下展示当前公告', () => {
    const wrapper = mountInfoCard({ view: 'announce' })

    expect(wrapper.text()).toContain('维护公告')
    expect(wrapper.text()).toContain('测试公告内容')
  })
})
