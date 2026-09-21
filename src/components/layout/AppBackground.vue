<template>
  <div class="app-background" aria-hidden="true"></div>
  <video
    v-if="backgroundMediaType === 'video' && backgroundVideoUrl"
    ref="videoElement"
    class="app-background app-background-video"
    :src="backgroundVideoUrl"
    :style="{ objectFit: backgroundVideo.fit }"
    autoplay
    loop
    playsinline
    preload="metadata"
    disablepictureinpicture
    aria-hidden="true"
    @error="handleVideoError"
    @loadeddata="syncPlayback"
  ></video>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { backgroundMediaType, backgroundVideoUrl, backgroundVideo, markBackgroundVideoUnavailable } = useTheme()
const videoElement = ref<HTMLVideoElement | null>(null)
let windowActive = document.hasFocus()
let mediaQuery: MediaQueryList | null = null

function shouldPause(): boolean {
  return (
    backgroundVideo.value.paused ||
    mediaQuery?.matches === true ||
    document.hidden ||
    (backgroundVideo.value.pause_when_inactive && !windowActive)
  )
}

function syncPlayback(): void {
  const video = videoElement.value
  if (!video) return
  video.muted = backgroundVideo.value.muted
  video.volume = backgroundVideo.value.volume
  if (shouldPause()) {
    video.pause()
    return
  }
  void video.play().catch(() => {
    // 自动播放策略或解码器可能拒绝播放；保留封面背景且不抛出未处理 rejection。
  })
}

function handleVideoError(): void {
  markBackgroundVideoUnavailable()
}

function handleVisibilityChange(): void {
  windowActive = !document.hidden && document.hasFocus()
  syncPlayback()
}

function handleWindowFocus(): void {
  windowActive = true
  syncPlayback()
}

function handleWindowBlur(): void {
  windowActive = false
  syncPlayback()
}

function handleReducedMotionChange(): void {
  syncPlayback()
}

watch(
  [backgroundMediaType, backgroundVideoUrl, backgroundVideo],
  async () => {
    await nextTick()
    syncPlayback()
  },
  { deep: true }
)

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)
  mediaQuery.addEventListener('change', handleReducedMotionChange)
  syncPlayback()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('blur', handleWindowBlur)
  mediaQuery?.removeEventListener('change', handleReducedMotionChange)
  const video = videoElement.value
  if (video) {
    video.pause()
    video.removeAttribute('src')
    video.load()
  }
})
</script>
