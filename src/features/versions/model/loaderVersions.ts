export function normalizeLoaderVersions(data: unknown): string[] {
  const nestedCatalog =
    Array.isArray(data) &&
    data.length === 1 &&
    data[0] &&
    typeof data[0] === 'object' &&
    'all' in data[0] &&
    Array.isArray(data[0].all)
      ? data[0].all
      : null

  const list = nestedCatalog
    ? nestedCatalog
    : Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'all' in data && Array.isArray(data.all)
        ? data.all
        : []

  return list
    .map((value: unknown) => {
      if (value == null) return ''
      if (value && typeof value === 'object') {
        const item = value as Record<string, unknown>
        return String(item.LoaderVersion || item.version || '')
      }
      return String(value)
    })
    .filter(Boolean)
}
