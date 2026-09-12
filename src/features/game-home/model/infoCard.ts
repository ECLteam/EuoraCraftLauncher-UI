import type { InfoCardAnnouncement, InfoCardData, InfoCardMode } from '@/types/system'

export type InfoCardView = 'tip' | 'announce'

export const EMPTY_INFO_CARD: InfoCardData = {
  mode: 'auto',
  tips: [],
  announcements: [],
  welcome: null,
  interval: 8000,
}

/**
 * 组合首页卡片的本地文案与后端公告。
 *
 * 小贴士和欢迎语随前端语言切换；公告仍由后端负责拉取、缓存和有效期过滤，
 * 避免把网络代理与离线回退逻辑搬进 WebView。
 */
export function createLocalizedInfoCard(
  announcements: InfoCardAnnouncement[],
  t: (key: string) => string
): InfoCardData {
  return {
    mode: 'rotate',
    tip_title: t('game.didYouKnow'),
    announcement_title: t('game.announcement'),
    tips: [
      t('game.infoCard.tips.gameSettings'),
      t('game.infoCard.tips.instanceSettings'),
      t('game.infoCard.tips.accounts'),
      t('game.infoCard.tips.dataDirectory'),
    ],
    announcements,
    welcome: {
      title: t('game.welcomeTitle'),
      content: t('game.welcomeContent'),
    },
    interval: 8000,
  }
}

export function normalizeInfoCard(data?: Partial<InfoCardData> | null): InfoCardData {
  const normalized: InfoCardData = {
    mode: data?.mode ?? EMPTY_INFO_CARD.mode,
    tips: data?.tips ?? [],
    announcements: data?.announcements ?? [],
    welcome: data?.welcome ?? null,
    interval: data?.interval ?? EMPTY_INFO_CARD.interval,
  }

  if (data?.tip_title) normalized.tip_title = data.tip_title
  if (data?.announcement_title) normalized.announcement_title = data.announcement_title
  return normalized
}

export function resolveInitialInfoCardView(
  mode: InfoCardMode,
  hasTips: boolean,
  hasAnnouncements: boolean
): InfoCardView {
  if (mode === 'tip_only') return 'tip'
  if (mode === 'announcement_only' || mode === 'announcement_first') {
    return hasAnnouncements ? 'announce' : 'tip'
  }
  return hasAnnouncements ? 'announce' : hasTips ? 'tip' : 'tip'
}
