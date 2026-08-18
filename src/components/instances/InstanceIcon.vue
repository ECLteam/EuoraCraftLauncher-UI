<template>
  <span class="instance-icon" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="imageUrl" :src="imageUrl" alt="" :style="{ width: `${size}px`, height: `${size}px` }" />
    <UiIcon v-else :name="fallbackIcon" :size="Math.max(16, Math.round(size * 0.55))" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'
import { getLoaderIcon, getLoaderImage, getVersionImage } from '@/config/version'
import type { ScannedVersion } from '@/types/api'

const props = withDefaults(
  defineProps<{
    version: ScannedVersion
    size?: number
  }>(),
  { size: 38 }
)

const localUrl = ref('')
let requestId = 0

const builtInImages: Record<string, string> = {
  grass: '/img/item/grass.png',
  chest: '/img/item/chest.png',
  command: '/img/item/command.png',
  coal: '/img/item/coal.png',
  iron: '/img/item/iron.png',
  quartz: '/img/item/quartz.png',
}

const imageUrl = computed(() => {
  const icon = props.version.icon
  if (icon?.type === 'data') return icon.value
  if (icon?.type === 'builtin') return builtInImages[icon.value] || getVersionImage(props.version.versionType)
  if (icon?.type === 'loader')
    return getLoaderImage(icon.value) || (icon.value === 'vanilla' ? builtInImages.grass : '')
  if (icon?.type === 'local' || icon?.type === 'external') return localUrl.value
  return getLoaderImage(props.version.primaryLoader) || getVersionImage(props.version.versionType)
})

const fallbackIcon = computed(() => getLoaderIcon(props.version.primaryLoader || 'vanilla'))

watch(
  () => props.version.icon,
  async (icon) => {
    localUrl.value = ''
    const currentRequest = ++requestId
    if (!icon || !['local', 'external'].includes(icon.type) || !icon.value) return
    const response = await backend.command('image_read_file', { path: icon.value })
    if (currentRequest === requestId && response.success) localUrl.value = response.data?.dataUrl || ''
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.instance-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--r-sm);
  color: var(--primary);
}

.instance-icon img {
  display: block;
  object-fit: contain;
  image-rendering: pixelated;
}
</style>
