// ============================================================
// 版本/加载器统一配置
// 所有版本类型、加载器的标签、图标、CSS 类、筛选分类
// 修改此文件即可全局生效
// ============================================================

import type { CommandName, MinecraftVersionType } from '@/types/api'

// ---- 版本类型 ----

export interface VersionTypeMeta {
  id: MinecraftVersionType
  labelKey: string
  icon: string
  image: string
  badgeClass: string
}

/** 版本类型完整元数据（标签、图标、badge 样式） */
export const VERSION_TYPES: VersionTypeMeta[] = [
  { id: 'release', labelKey: 'versions.download.release', icon: 'check', image: '/img/item/grass.png', badgeClass: 'badge-success' },
  { id: 'snapshot', labelKey: 'versions.download.snapshot', icon: 'lab', image: '/img/item/command.png', badgeClass: 'badge-warning' },
  { id: 'old_beta', labelKey: 'versions.download.oldBeta', icon: 'archive', image: '/img/item/coal.png', badgeClass: 'badge-info' },
  { id: 'old_alpha', labelKey: 'versions.download.oldAlpha', icon: 'archive', image: '/img/item/quartz.png', badgeClass: 'badge-info' },
  { id: 'april_fools', labelKey: 'versions.download.aprilFools', icon: 'cube', image: '/img/item/iron.png', badgeClass: 'badge-april' },
]

/** 版本类型 -> 图标名（用于 UiIcon） */
export const VERSION_ICON_MAP: Record<string, string> = Object.fromEntries(
  VERSION_TYPES.map(v => [v.id, v.icon])
)

/** 版本类型 -> 像素图标资源 */
export const VERSION_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  VERSION_TYPES.map(v => [v.id, v.image])
)

/** 版本类型 -> badge CSS 类 */
export const VERSION_BADGE_CLASS_MAP: Record<string, string> = Object.fromEntries(
  VERSION_TYPES.map(v => [v.id, v.badgeClass])
)

/** 版本类型 -> i18n key */
export const VERSION_LABEL_KEY_MAP: Record<string, string> = Object.fromEntries(
  VERSION_TYPES.map(v => [v.id, v.labelKey])
)

/** 版本筛选分类 */
export const VERSION_FILTERS = [
  { id: 'all', labelKey: 'versions.download.allVersions', icon: 'cube' },
  { id: 'release', labelKey: 'versions.download.release', icon: 'check' },
  { id: 'snapshot', labelKey: 'versions.download.snapshot', icon: 'lab' },
  { id: 'april_fools', labelKey: 'versions.download.aprilFools', icon: 'happy' },
  { id: 'old_beta', labelKey: 'versions.download.oldBeta', icon: 'archive' },
  { id: 'old_alpha', labelKey: 'versions.download.oldAlpha', icon: 'archive' },
]

// ---- 加载器 ----

export interface LoaderMeta {
  value: string
  /** 显示名称（中文） */
  label: string
  /** 图标名（用于 UiIcon :name） */
  icon: string
  /** 像素图标资源路径（优先于 UiIcon） */
  image?: string
  /** CSS 类后缀（用于 badge） */
  class: string
}

/** 加载器完整元数据 */
export const LOADERS: LoaderMeta[] = [
  { value: 'vanilla', label: '原版', icon: 'cube', class: 'vanilla' },
  { value: 'fabric', label: 'Fabric', icon: 'lab', image: '/img/item/fabric.png', class: 'fabric' },
  { value: 'forge', label: 'Forge', icon: 'fire', image: '/img/item/forge.png', class: 'forge' },
  { value: 'neoforge', label: 'NeoForge', icon: 'fire', image: '/img/item/neoforge.png', class: 'neoforge' },
  { value: 'quilt', label: 'Quilt', icon: 'grid', image: '/img/item/quilt.png', class: 'quilt' },
  { value: 'optifine', label: 'OptiFine', icon: 'eye', image: '/img/item/optifine.png', class: 'optifine' },
  { value: 'liteloader', label: 'LiteLoader', icon: 'cube', class: 'liteloader' },
]

/** 加载器图标映射 */
export const LOADER_ICON_MAP: Record<string, string> = {}
/** 加载器像素图标映射 */
export const LOADER_IMAGE_MAP: Record<string, string> = {}
/** 加载器名称映射 */
export const LOADER_NAME_MAP: Record<string, string> = {}
/** 加载器 CSS 类映射 */
export const LOADER_CLASS_MAP: Record<string, string> = {}

for (const l of LOADERS) {
  LOADER_ICON_MAP[l.value] = l.icon
  if (l.image) LOADER_IMAGE_MAP[l.value] = l.image
  LOADER_NAME_MAP[l.value] = l.label
  LOADER_CLASS_MAP[l.value] = l.class
}

/** 加载器标签映射（与名称相同，预留扩展） */
export const LOADER_LABEL_MAP: Record<string, string> = { ...LOADER_NAME_MAP }

/** 安装页面可选的加载器列表（排除 OptiFine 和 LiteLoader） */
export const INSTALLABLE_LOADERS = LOADERS.filter(
  l => !['optifine', 'liteloader'].includes(l.value)
)

/** 加载器 -> 后端命令后缀映射 */
export const LOADER_COMMAND_MAP: Record<string, Extract<CommandName,
  'fabric_versions' | 'forge_versions' | 'neoforge_versions' | 'quilt_versions'>> = {
  fabric: 'fabric_versions',
  forge: 'forge_versions',
  neoforge: 'neoforge_versions',
  quilt: 'quilt_versions',
}

// ---- 下载源 ----

export interface MirrorOption {
  value: string
  label: string
  desc: string
}

export const MIRROR_OPTIONS: MirrorOption[] = [
  { value: 'official', label: '官方源', desc: 'Minecraft Official' },
  { value: 'bmclapi', label: 'BMCLAPI', desc: 'BMCLAPI 镜像加速' },
]

// ---- 工具函数 ----

export function getLoaderIcon(loader: string | null | undefined): string {
  const key = loader?.toLowerCase() || ''
  return LOADER_ICON_MAP[key] || 'cube'
}

export function getLoaderImage(loader: string | null | undefined): string {
  const key = loader?.toLowerCase() || ''
  return LOADER_IMAGE_MAP[key] || ''
}

export function getLoaderName(loader: string | null | undefined): string {
  if (!loader) return '原版'
  const key = loader.toLowerCase()
  if (LOADER_NAME_MAP[key]) return LOADER_NAME_MAP[key]
  return loader.charAt(0).toUpperCase() + loader.slice(1)
}

export function getLoaderLabel(loader: string | null | undefined): string {
  if (!loader) return '原版'
  const key = loader.toLowerCase()
  return LOADER_LABEL_MAP[key] || loader
}

export function getLoaderClass(loader: string | null | undefined): string {
  const key = loader?.toLowerCase() || ''
  return LOADER_CLASS_MAP[key] || 'vanilla'
}

export function getVersionIcon(type: string): string {
  return VERSION_ICON_MAP[type] || 'cube'
}

export function getVersionImage(type: string | null | undefined): string {
  const key = type?.toLowerCase() || ''
  return VERSION_IMAGE_MAP[key] || ''
}

export function getVersionBadgeClass(type: string): string {
  return VERSION_BADGE_CLASS_MAP[type] || 'badge-default'
}
