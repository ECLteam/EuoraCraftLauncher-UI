<template>
  <iframe
    v-if="enabled"
    ref="iframeRef"
    src="/mouse-effect.html"
    class="mouse-effect-iframe"
    frameborder="0"
    :style="iframeStyle"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

interface Props {
  enabled: boolean
  color?: string
  scale?: number
  opacity?: number
  speed?: number
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false,
  color: '45,175,255',
  scale: 1.5,
  opacity: 1.0,
  speed: 1.0
})

const iframeRef = ref<HTMLIFrameElement | null>(null)

// iframe 始终不接收鼠标事件，只通过 postMessage 接收转发的事件
const iframeStyle = computed(() => ({
  pointerEvents: 'none' as const
}))

const updateEffect = () => {
  if (!iframeRef.value?.contentWindow) return
  const win = iframeRef.value.contentWindow as any
  
  if (win.updateColor) {
    win.updateColor(props.color)
  }
  if (win.updateEffectSettings) {
    win.updateEffectSettings(props.scale, props.opacity, props.speed)
  }
}

// 监听父窗口的鼠标事件并转发给 iframe
const setupEventForwarding = () => {
  const forwardEvent = (e: MouseEvent, type: string) => {
    if (!iframeRef.value) return
    const iframe = iframeRef.value
    const rect = iframe.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    iframe.contentWindow?.postMessage({
      type: 'mouse',
      eventType: type,
      x,
      y
    }, '*')
  }
  
  const onMouseDown = (e: MouseEvent) => {
    forwardEvent(e, 'mousedown')
  }
  const onMouseMove = (e: MouseEvent) => {
    forwardEvent(e, 'mousemove')
  }
  const onMouseUp = (e: MouseEvent) => {
    forwardEvent(e, 'mouseup')
  }
  
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  
  return () => {
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
}

let cleanup: (() => void) | null = null

watch(() => props.enabled, (val) => {
  if (val) {
    setTimeout(updateEffect, 100)
    if (!cleanup) cleanup = setupEventForwarding()
  } else {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  }
})

watch(() => [props.color, props.scale, props.opacity, props.speed], () => {
  updateEffect()
}, { deep: true })

onMounted(() => {
  if (props.enabled) {
    setTimeout(updateEffect, 100)
    cleanup = setupEventForwarding()
  }
})
</script>

<style scoped>
.mouse-effect-iframe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
  border: none;
}
</style>
