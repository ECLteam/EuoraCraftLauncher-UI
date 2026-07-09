<!-- src/components/ui/Icon.vue -->
<template>
  <span :class="['icon', `icon-${name}`, className]" :style="style">
    <Icon :icon="getIconName(name)" :width="size" :height="size" />
  </span>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  name: string
  size?: number | string
  className?: string
  style?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  size: 16
})

// 图标名称映射（模块级常量，避免每次调用重新创建）
const iconMap: Record<string, string> = {
  // 导航
  'game': 'hugeicons:game',
  'cube': 'mdi:cube-outline',
  'folder': 'mdi:folder-outline',
  'settings': 'mdi:cog-outline',
  'puzzle': 'mdi:puzzle-outline',
  'plugin': 'mdi:puzzle-outline',
  'bug': 'mdi:bug-outline',
  'menu': 'mdi:menu',
  'help': 'mdi:help-circle-outline',

  // 操作
  'close': 'mdi:close',
  'spinner': 'mdi:loading',
  'loading': 'mdi:loading',
  'add': 'mdi:plus',
  'trash': 'mdi:trash-can-outline',
  'search': 'mdi:magnify',
  'download': 'mdi:download',
  'play': 'mdi:play',
  'refresh': 'mdi:refresh',
  'check': 'mdi:check',
  'brush': 'mdi:brush',

  // 方向
  'chevron-down': 'mdi:chevron-down',
  'chevron-up': 'mdi:chevron-up',
  'arrow-right': 'mdi:chevron-right',
  'arrow-left': 'mdi:chevron-left',

  // 文件
  'file-text': 'mdi:file-document-outline',
  'external-link': 'mdi:open-in-new',
  'globe': 'mdi:earth',
  'archive': 'mdi:archive-outline',
  'calendar': 'mdi:calendar-outline',

  // 通知/状态
  'info': 'mdi:information-outline',
  'bell': 'mdi:bell-outline',
  'lightbulb': 'mdi:lightbulb-outline',

  // 消息类型
  'success': 'mdi:check-circle-outline',
  'error': 'mdi:close-circle-outline',
  'warning': 'mdi:alert-circle-outline',

  // 窗口
  'minimize': 'mdi:window-minimize',
  'moon': 'mdi:weather-night',
  'sun': 'mdi:weather-sunny',

  // 加载器
  'lab': 'mdi:flask-outline',
  'fire': 'mdi:fire',
  'grid': 'mdi:grid',
  'eye': 'mdi:eye-outline',
  'happy': 'mdi:emoticon-happy-outline',
  'cloud-download': 'mdi:cloud-download-outline',

  // 账户
  'microsoft': 'mdi:microsoft',
  'user': 'mdi:account-outline',
  'user-x': 'mdi:account-remove-outline',
  'game-controller': 'mdi:gamepad-variant-outline',
  'shield': 'mdi:shield-outline',

  // 任务
  'x-mark': 'mdi:close',
  'circle': 'mdi:circle-small',
  'package': 'mdi:package-variant-closed',
}

const getIconName = (iconName: string) => {
  return iconMap[iconName] || 'mdi:help-circle-outline'
}
</script>

<style scoped src="@/styles/Icon.css"></style>