type Translate = (key: string) => string

const updateKeyPrefix = 'settings.aboutTab.update.'

/** 根据更新内容决定更新弹窗的主题；空内容时才回退至通用更新提示。 */
export function getUpdateModalTitle(notes: string | null | undefined, translate: Translate): string {
  return translate(`${updateKeyPrefix}${notes?.trim() ? 'notesTitle' : 'updateAvailableTitle'}`)
}
