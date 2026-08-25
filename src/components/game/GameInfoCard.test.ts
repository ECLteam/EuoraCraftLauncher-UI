import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import type { InfoCardData } from '@/types/system'
import GameInfoCard from './GameInfoCard.vue'

const data: InfoCardData = {
  mode: 'rotate',
  tips: ['测试小贴士'],
  announcements: [
    {
      title: '维护公告',
      date: '2026-07-24',
      content:
        '**Important** announcement content that is long enough to require opening the details modal for the complete message.',
    },
  ],
}

function mountInfoCard(overrides: Partial<InstanceType<typeof GameInfoCard>['$props']> = {}) {
  return mount(GameInfoCard, {
    global: {
      plugins: [i18n],
      stubs: {
        Teleport: true,
      },
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

  it('优先展示后端提供的信息卡标题', () => {
    const wrapper = mountInfoCard({
      data: {
        ...data,
        tip_title: '后端提示标题',
        announcement_title: '后端公告标题',
      },
    })

    expect(wrapper.text()).toContain('后端提示标题')
  })

  it('轮播模式下展示当前公告', () => {
    const wrapper = mountInfoCard({ view: 'announce' })

    expect(wrapper.text()).toContain('维护公告')
    expect(wrapper.text()).toContain('Important announcement content')
    expect(wrapper.text()).toContain('点击查看详情')
  })

  it('opens the selected announcement in a Markdown modal', async () => {
    const wrapper = mountInfoCard({ view: 'announce' })

    await wrapper.get('.announce-item').trigger('click')

    expect(wrapper.get('.announcement-detail').text()).toContain('2026-07-24')
    expect(wrapper.get('.markdown-content strong').text()).toBe('Important')
    expect(wrapper.get('.markdown-content').text()).toContain('announcement content')
  })

  it('renders Chinese Markdown list content in the announcement modal', async () => {
    const announcement = {
      title: '欢迎使用 EuoraCraft Launcher',
      date: '',
      content: 'EuoraCraft Launcher 仍在持续开发中。\n\n- 公告现已支持 **Markdown** 格式',
    }
    const wrapper = mountInfoCard({
      view: 'announce',
      data: { ...data, announcements: [announcement] },
      currentAnnouncement: announcement,
    })

    await wrapper.get('.announce-item').trigger('click')

    expect(wrapper.get('.markdown-content li').text()).toBe('公告现已支持 Markdown 格式')
    expect(wrapper.get('.markdown-content strong').text()).toBe('Markdown')
  })
})
