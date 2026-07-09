// ============================================================
// 加载器工具常量与函数
// 统一管理所有加载器相关的图标、名称、标签、CSS 类映射
// ============================================================

/** 加载器图标映射（用于 UiIcon :name） */
export const LOADER_ICON_MAP: Record<string, string> = {
  vanilla: 'cube',
  fabric: 'lab',
  forge: 'fire',
  neoforge: 'fire',
  quilt: 'grid',
  optifine: 'eye',
}

/** 加载器显示名称映射 */
export const LOADER_NAME_MAP: Record<string, string> = {
  vanilla: 'Vanilla',
  fabric: 'Fabric',
  forge: 'Forge',
  neoforge: 'NeoForge',
  quilt: 'Quilt',
  optifine: 'OptiFine',
  liteloader: 'LiteLoader',
}

/** 加载器标签映射（与名称相同，预留扩展） */
export const LOADER_LABEL_MAP: Record<string, string> = {
  ...LOADER_NAME_MAP,
}

/** 加载器 CSS 类后缀映射（用于 badge 等组件） */
export const LOADER_CLASS_MAP: Record<string, string> = {
  vanilla: 'vanilla',
  fabric: 'fabric',
  forge: 'forge',
  neoforge: 'neoforge',
  quilt: 'quilt',
  optifine: 'optifine',
  liteloader: 'liteloader',
}

/**
 * 获取加载器对应的图标名称
 * @param loader 加载器类型字符串
 * @returns 图标名称
 */
export function getLoaderIcon(loader: string | null | undefined): string {
  const key = loader?.toLowerCase() || ''
  return LOADER_ICON_MAP[key] || 'cube'
}

/**
 * 获取加载器显示名称（首字母大写）
 * @param loader 加载器类型字符串
 * @returns 显示名称
 */
export function getLoaderName(loader: string | null | undefined): string {
  if (!loader) return 'Vanilla'
  const key = loader.toLowerCase()
  if (LOADER_NAME_MAP[key]) return LOADER_NAME_MAP[key]
  return loader.charAt(0).toUpperCase() + loader.slice(1)
}

/**
 * 获取加载器标签（用于任务队列等场景）
 * @param loader 加载器类型字符串
 * @returns 标签文本
 */
export function getLoaderLabel(loader: string | null | undefined): string {
  if (!loader) return 'Vanilla'
  const key = loader.toLowerCase()
  return LOADER_LABEL_MAP[key] || loader
}

/**
 * 获取加载器 CSS 类后缀
 * @param loader 加载器类型字符串
 * @returns CSS 类后缀
 */
export function getLoaderClass(loader: string | null | undefined): string {
  const key = loader?.toLowerCase() || ''
  return LOADER_CLASS_MAP[key] || 'vanilla'
}