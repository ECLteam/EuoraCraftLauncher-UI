import type { InstanceSortKey, ScannedVersion } from '@/types/instances'

export interface InstanceFilterOptions {
  query: string
  showHidden: boolean
  favoritesOnly: boolean
  pinnedOnly: boolean
  categoryId: string
}

export interface InstanceSortOptions {
  key: InstanceSortKey
  direction: 'asc' | 'desc'
}

export function instanceDisplayName(version: ScannedVersion): string {
  return version.alias || version.displayName || version.versionId
}

function dateValue(value?: string | null): number {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

export function compareInstances(left: ScannedVersion, right: ScannedVersion, sort: InstanceSortOptions): number {
  const leftGroup = left.pinned ? 0 : left.favorite ? 1 : 2
  const rightGroup = right.pinned ? 0 : right.favorite ? 1 : 2
  if (leftGroup !== rightGroup) return leftGroup - rightGroup
  if (leftGroup === 0) {
    const pinCompare = (left.pinOrder ?? Number.MAX_SAFE_INTEGER) - (right.pinOrder ?? Number.MAX_SAFE_INTEGER)
    if (pinCompare) return pinCompare
  }
  let result = 0
  if (sort.key === 'name') {
    result = instanceDisplayName(left).localeCompare(instanceDisplayName(right), 'zh-CN', { numeric: true })
  } else if (sort.key === 'gameVersion') {
    result = String(left.vanillaName).localeCompare(String(right.vanillaName), undefined, { numeric: true })
  } else if (sort.key === 'lastLaunchedAt') {
    result = dateValue(left.lastLaunchedAt) - dateValue(right.lastLaunchedAt)
  } else {
    result = Number(left[sort.key] || 0) - Number(right[sort.key] || 0)
  }
  if (result) return sort.direction === 'asc' ? result : -result
  return instanceDisplayName(left).localeCompare(instanceDisplayName(right), 'zh-CN', { numeric: true })
}

export function filterAndSortInstances(
  versions: ScannedVersion[],
  filters: InstanceFilterOptions,
  sort: InstanceSortOptions,
  categoryName: (id?: string) => string = () => ''
): ScannedVersion[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return versions
    .filter((version) => {
      if (!filters.showHidden && version.hidden) return false
      if (filters.favoritesOnly && !version.favorite) return false
      if (filters.pinnedOnly && !version.pinned) return false
      if (filters.categoryId && version.categoryId !== filters.categoryId) return false
      if (!query) return true
      return [
        instanceDisplayName(version),
        version.versionId,
        version.description,
        version.primaryLoader,
        version.vanillaName,
        categoryName(version.categoryId),
        ...(version.tags || []),
      ].some((value) =>
        String(value || '')
          .toLocaleLowerCase()
          .includes(query)
      )
    })
    .sort((left, right) => compareInstances(left, right, sort))
}
