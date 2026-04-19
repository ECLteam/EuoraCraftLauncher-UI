<template>
  <div class="skin-container" :style="containerStyle">
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      class="skin-layer"
      :width="size"
      :height="size"
      alt="avatar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAvatarRenderer } from '@/composables/useAvatarRenderer'
import type { CSSProperties } from 'vue'

interface Props {
  uuid?: string
  username?: string
  typeName?: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  typeName: 'Mojang',
  size: 64
})

const avatarUrl = ref<string>('')
const { renderAvatar } = useAvatarRenderer()

const containerStyle = computed<CSSProperties>(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  position: 'relative'
}))

async function updateAvatar() {
  const url = await renderAvatar(
    props.uuid,
    props.username,
    props.typeName,
    props.size
  )
  if (url) {
    avatarUrl.value = url
  }
}

onMounted(() => {
  updateAvatar()
})

watch(() => props.uuid, updateAvatar)
watch(() => props.username, updateAvatar)
watch(() => props.typeName, updateAvatar)
watch(() => props.size, updateAvatar)
</script>

<style scoped src="@/styles/components/SkinRenderer.css"></style>
