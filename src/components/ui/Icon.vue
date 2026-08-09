<!-- src/components/ui/Icon.vue -->
<template>
  <span :class="['icon', `icon-${name}`, className]" :style="style">
    <!-- 品牌图标（微软登录）以内联 SVG 渲染，避免加载 brands 字体 -->
    <svg
      v-if="name === 'microsoft'"
      class="icon-microsoft"
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 21 21"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
    <i
      v-else
      :class="[
        getIcon(name).style,
        `fa-${getIcon(name).name}`,
        { 'fa-spin': name === 'spinner' || name === 'loading' },
      ]"
      :style="{ fontSize: iconSize }"
    />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'UiIcon' })

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  className: '',
  style: () => ({}),
})

const iconSize = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))

interface Props {
  name: string
  size?: number | string
  className?: string
  style?: Record<string, string>
}

interface FaIcon {
  style: string
  name: string
}

// 图标名称映射：将简写名映射到 Font Awesome Classic 图标
// style: 'far' = Regular（优先使用，需 Free Regular 有对应字形），'fas' = Solid（仅用于无 Regular 变体的图标）
const iconMap: Record<string, FaIcon> = {
  // 导航
  game: { style: 'fas', name: 'gamepad' },
  cube: { style: 'fas', name: 'cube' },
  folder: { style: 'far', name: 'folder' },
  settings: { style: 'fas', name: 'gear' },
  puzzle: { style: 'fas', name: 'puzzle-piece' },
  plugin: { style: 'fas', name: 'puzzle-piece' },
  bug: { style: 'fas', name: 'bug' },
  menu: { style: 'fas', name: 'bars' },
  help: { style: 'far', name: 'circle-question' },

  // 操作
  close: { style: 'fas', name: 'xmark' },
  spinner: { style: 'fas', name: 'spinner' },
  loading: { style: 'fas', name: 'spinner' },
  add: { style: 'fas', name: 'plus' },
  delete: { style: 'far', name: 'trash-can' },
  trash: { style: 'far', name: 'trash-can' },
  search: { style: 'fas', name: 'magnifying-glass' },
  download: { style: 'fas', name: 'download' },
  play: { style: 'fas', name: 'play' },
  refresh: { style: 'fas', name: 'rotate' },
  check: { style: 'fas', name: 'check' },
  brush: { style: 'fas', name: 'paintbrush' },
  list: { style: 'fas', name: 'list' },

  // 方向
  'chevron-down': { style: 'fas', name: 'chevron-down' },
  'chevron-up': { style: 'fas', name: 'chevron-up' },
  'arrow-right': { style: 'fas', name: 'chevron-right' },
  'arrow-left': { style: 'fas', name: 'chevron-left' },

  // 文件
  'file-text': { style: 'far', name: 'file-lines' },
  'external-link': { style: 'fas', name: 'up-right-from-square' },
  'folder-open': { style: 'far', name: 'folder-open' },
  globe: { style: 'fas', name: 'globe' },
  archive: { style: 'fas', name: 'box-archive' },
  calendar: { style: 'far', name: 'calendar' },

  // 通知/状态
  info: { style: 'fas', name: 'circle-info' },
  bell: { style: 'far', name: 'bell' },
  lightbulb: { style: 'far', name: 'lightbulb' },

  // 消息类型
  success: { style: 'far', name: 'circle-check' },
  error: { style: 'far', name: 'circle-xmark' },
  warning: { style: 'fas', name: 'circle-exclamation' },

  // 窗口
  minimize: { style: 'far', name: 'window-minimize' },
  moon: { style: 'far', name: 'moon' },
  sun: { style: 'far', name: 'sun' },

  // 加载器
  lab: { style: 'fas', name: 'flask' },
  fire: { style: 'fas', name: 'fire' },
  grid: { style: 'fas', name: 'table-cells' },
  eye: { style: 'far', name: 'eye' },
  happy: { style: 'far', name: 'face-smile' },
  'cloud-download': { style: 'fas', name: 'cloud-arrow-down' },

  // 账户（microsoft 走内联 SVG，不在此映射）
  user: { style: 'far', name: 'user' },
  'user-x': { style: 'fas', name: 'user-xmark' },
  'game-controller': { style: 'fas', name: 'gamepad' },
  shield: { style: 'fas', name: 'shield-halved' },

  // 任务
  'x-mark': { style: 'fas', name: 'xmark' },
  circle: { style: 'far', name: 'circle' },
  package: { style: 'fas', name: 'box' },
}

const getIcon = (iconName: string): FaIcon => {
  return iconMap[iconName] || { style: 'far', name: 'circle-question' }
}
</script>

<style scoped src="@/styles/components/ui/Icon.css"></style>