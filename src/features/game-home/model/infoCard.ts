import type { InfoCardData, InfoCardMode } from '@/types/api'

export type InfoCardView = 'tip' | 'announce'

export const EMPTY_INFO_CARD: InfoCardData = {
  mode: 'auto',
  tips: [],
  announcements: [],
  welcome: null,
  interval: 8000,
}

export function normalizeInfoCard(data?: Partial<InfoCardData> | null): InfoCardData {
  return {
    mode: data?.mode ?? EMPTY_INFO_CARD.mode,
    tips: data?.tips ?? [],
    announcements: data?.announcements ?? [],
    welcome: data?.welcome ?? null,
    interval: data?.interval ?? EMPTY_INFO_CARD.interval,
  }
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
