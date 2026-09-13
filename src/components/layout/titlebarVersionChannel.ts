export type LauncherVersionType = 'alpha' | 'beta' | 'rc' | 'release'

const labelByVersionType: Record<LauncherVersionType, string> = {
  alpha: 'ALPHA',
  beta: 'BETA',
  rc: 'RC',
  release: '',
}

/** 返回顶部栏的预发布渠道标签；正式版无需额外标签。 */
export function titlebarVersionChannelLabel(versionType: LauncherVersionType): string {
  return labelByVersionType[versionType]
}
