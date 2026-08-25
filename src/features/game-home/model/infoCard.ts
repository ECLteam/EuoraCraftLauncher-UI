import type { InfoCardData, InfoCardMode } from '@/types/system'

export type InfoCardView = 'tip' | 'announce'

export const EMPTY_INFO_CARD: InfoCardData = {
  mode: 'auto',
  tips: [],
  announcements: [],
  welcome: null,
  interval: 8000,
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
