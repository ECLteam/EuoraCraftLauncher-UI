import { addCollection } from '@iconify/vue/offline'
import { icons } from '@iconify-json/tabler'

// 全量注册 Tabler 图标集，保证 Icon 组件完全离线渲染（不触发 Iconify 网络 API）
addCollection(icons)

/** 短名 → Tabler 图标名（全部经 Iconify 官方 API 验证存在） */
export const ICON_MAP: Record<string, string> = {
  // 导航
  game: 'device-gamepad-2',
  'game-controller': 'device-gamepad-2',
  cube: 'cube',
  folder: 'folder',
  'folder-open': 'folder-open',
  settings: 'settings',
  puzzle: 'puzzle',
  plugin: 'puzzle',
  bug: 'bug',
  activity: 'activity',
  menu: 'menu-2',
  help: 'help-circle',

  // 操作
  close: 'x',
  'x-mark': 'x',
  spinner: 'loader-2',
  loading: 'loader-2',
  add: 'plus',
  delete: 'trash',
  trash: 'trash',
  search: 'search',
  download: 'download',
  'cloud-download': 'cloud-download',
  play: 'player-play',
  pause: 'player-pause',
  stop: 'player-stop',
  refresh: 'refresh',
  check: 'check',
  brush: 'brush',
  list: 'list',
  copy: 'copy',
  minus: 'minus',
  edit: 'edit',
  upload: 'upload',
  'cloud-upload': 'cloud-upload',
  'file-download': 'file-download',
  star: 'star',
  'star-filled': 'star-filled',

  // 方向
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'arrow-right': 'chevron-right',
  'arrow-left': 'chevron-left',
  'rotate-left': 'rotate-2',
  'rotate-right': 'rotate-clockwise-2',

  // 文件
  'file-text': 'file-text',
  'external-link': 'external-link',
  globe: 'globe',
  archive: 'archive',
  calendar: 'calendar',

  // 通知/状态
  info: 'info-circle',
  bell: 'bell',
  lightbulb: 'bulb',

  // 消息类型
  success: 'circle-check',
  error: 'circle-x',
  warning: 'alert-circle',
  'alert-triangle': 'alert-triangle',

  // 窗口
  minimize: 'minus',
  moon: 'moon',
  sun: 'sun',

  // 加载器
  lab: 'flask',
  fire: 'flame',
  grid: 'layout-grid',
  eye: 'eye',
  happy: 'mood-smile',

  // 账户
  user: 'user',
  'user-x': 'user-x',
  shield: 'shield',
  circle: 'circle',
  package: 'package',
  shirt: 'shirt',
  wardrobe: 'hanger-2',
}

/** 短名解析，未知短名回退 help-circle（插件自定义图标名兜底，与旧行为一致） */
export function getIconName(name: string): string {
  return ICON_MAP[name] || 'help-circle'
}
