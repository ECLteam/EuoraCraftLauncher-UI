export function normalizeLoaderVersions(data: unknown): string[] {
  const list = Array.isArray(data)
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
