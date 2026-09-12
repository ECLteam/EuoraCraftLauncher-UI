import { describe, expect, it } from 'vitest'
import { createLocalizedInfoCard, normalizeInfoCard, resolveInitialInfoCardView } from './infoCard'

describe('game home info card', () => {
  it('补齐后端缺失的信息卡字段', () => {
    expect(normalizeInfoCard({ tips: ['提示'] })).toEqual({
      mode: 'auto',
      tips: ['提示'],
      announcements: [],
      welcome: null,
      interval: 8000,
    })
  })

  it('保留后端提供的信息卡标题', () => {
    expect(
      normalizeInfoCard({
        tip_title: '后端提示标题',
        announcement_title: '后端公告标题',
      })
    ).toMatchObject({
      tip_title: '后端提示标题',
      announcement_title: '后端公告标题',
    })
  })

  it('将前端翻译与远程公告组合为首页卡片', () => {
    const card = createLocalizedInfoCard(
      [{ id: 'notice-1', title: 'Remote notice', date: '', content: 'Details' }],
      (key) => `translated:${key}`
    )

    expect(card.tips).toHaveLength(4)
    expect(card.tip_title).toBe('translated:game.didYouKnow')
    expect(card.welcome?.content).toBe('translated:game.welcomeContent')
    expect(card.announcements).toEqual([{ id: 'notice-1', title: 'Remote notice', date: '', content: 'Details' }])
  })

  it('公告优先模式在无公告时回退到提示', () => {
    expect(resolveInitialInfoCardView('announcement_first', true, false)).toBe('tip')
    expect(resolveInitialInfoCardView('announcement_first', true, true)).toBe('announce')
  })
})
