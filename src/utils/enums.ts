// ============================================================
// 枚举 → 显示文本 统一映射
// 所有「枚举值 → i18n 键」的映射集中在此，组件/工具统一引用，
// 避免各文件各自实现 if-else 映射表。
// ============================================================

import type { AccountType } from '@/types/api'

// ---- 账户类型 ----

/** 账户类型 → i18n 键（完整标签，用于账户卡片/下拉选项） */
export const ACCOUNT_TYPE_LABEL_KEYS: Record<string, string> = {
  microsoft: 'game.microsoftAccount',
  offline: 'game.offlineAccount',
  authlib: 'game.authlibAccount',
  plugin: 'game.pluginAccount',
}

/** 账户类型 → i18n 键（短标签，用于类型徽标/紧凑展示） */
export const ACCOUNT_TYPE_SHORT_LABEL_KEYS: Record<string, string> = {
  microsoft: 'game.accountTypeMicrosoft',
  offline: 'game.accountTypeOffline',
  authlib: 'game.accountTypeAuthlib',
  plugin: 'game.accountTypePlugin',
}

/** 账户类型 → 完整标签 i18n 键，未知类型回退到离线账户 */
export function getAccountTypeLabelKey(type: AccountType | string | undefined | null): string {
  return ACCOUNT_TYPE_LABEL_KEYS[type ?? ''] || 'game.offlineAccount'
}

/** 账户类型 → 短标签 i18n 键，未知类型回退到离线账户 */
export function getAccountTypeShortLabelKey(type: AccountType | string | undefined | null): string {
  return ACCOUNT_TYPE_SHORT_LABEL_KEYS[type ?? ''] || 'game.accountTypeOffline'
}
