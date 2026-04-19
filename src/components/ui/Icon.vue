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

// 图标名称映射
const getIconName = (iconName: string) => {
  const iconMap: Record<string, string> = {
    // 游戏相关图标
    'game': 'hugeicons:game',
    'cube': 'mdi:cube-outline',
    'folder': 'mdi:folder-outline',
    'settings': 'mdi:cog-outline',
    
    // 操作图标
    'close': 'mdi:close',
    'loading': 'mdi:loading',
    'spinner': 'mdi:loading',
    'info': 'mdi:information-outline',
    'file-text': 'mdi:file-document-outline',
    'external-link': 'mdi:open-in-new',
    'arrow-right': 'mdi:chevron-right',
    'arrow-left': 'mdi:chevron-left',
    'check': 'mdi:check',
    'delete': 'mdi:delete-outline',
    'trash': 'mdi:trash-can-outline',
    'add': 'mdi:plus',
    'help': 'mdi:help-circle-outline',
    'help-circle': 'mdi:help-circle-outline',
    'alert-triangle': 'mdi:alert-circle-outline',
    'warning': 'mdi:alert-circle-outline',
    'error': 'mdi:alert-outline',
    'bug': 'mdi:bug-outline',
    'menu': 'mdi:menu',
    'left': 'mdi:chevron-left',
    'moon': 'mdi:weather-night',
    'sun': 'mdi:weather-sunny',
    'minimize': 'mdi:window-minimize',
    'maximize': 'mdi:window-maximize',
    'restore': 'mdi:window-restore',
    'brush': 'mdi:brush',
    'download': 'mdi:download',
    'search': 'mdi:magnify',
    'log-in': 'mdi:login',
    'play': 'mdi:play',
    'refresh': 'mdi:refresh',
    'lock': 'mdi:lock-outline',
    'globe': 'mdi:earth',
    'folder-open': 'mdi:folder-open-outline',
    'game-controller': 'mdi:gamepad-variant-outline',
    'chevron-down': 'mdi:chevron-down',
    'stop': 'mdi:stop',
    'lab': 'mdi:flask-outline',
    'archive': 'mdi:archive-outline',
    'happy': 'mdi:emoticon-happy-outline',
    'calendar': 'mdi:calendar-outline',
    'filter': 'mdi:filter-outline',
    'fire': 'mdi:fire',
    'grid': 'mdi:grid',
    
    // 微软相关
    'microsoft': 'mdi:microsoft',
    
    // 用户相关
    'user-x': 'mdi:account-remove-outline'
  }
  
  return iconMap[iconName] || 'mdi:help-circle-outline'
}
</script>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>