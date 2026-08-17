import { ref, watch } from 'vue'

const DEBUG_OUTLINE_CLASS = 'dev-show-outlines'
const DEBUG_NO_ANIMATION_CLASS = 'dev-no-animation'

const ANIMATION_DURATIONS: Record<string, number> = {
  '--duration-instant': 0.06,
  '--duration-fast': 0.15,
  '--duration-normal': 0.25,
  '--duration-slow': 0.35,
  '--duration-slower': 0.5,
  '--duration-slowest': 0.7,
}

/** 全局容器边界开关：切页时状态保留，副作用由下方 watch 常驻驱动 */
export const showContainerBoundaries = ref(false)
/** 全局动画禁用开关 */
export const animationsDisabled = ref(false)
/** 全局动画倍速 */
export const animSpeed = ref(1)

function applyAnimationSpeed(speed: number): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (speed === 1) {
    for (const key of Object.keys(ANIMATION_DURATIONS)) root.style.removeProperty(key)
    return
  }
  for (const [key, base] of Object.entries(ANIMATION_DURATIONS)) {
    root.style.setProperty(key, `${(base / speed).toFixed(3)}s`)
  }
}

// 副作用在模块加载时注册、随应用生命周期常驻，避免挂靠在某个视图组件上导致卸载后状态与界面泄漏。
watch(showContainerBoundaries, (v) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(DEBUG_OUTLINE_CLASS, v)
})
watch(animationsDisabled, (v) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(DEBUG_NO_ANIMATION_CLASS, v)
})
watch(animSpeed, applyAnimationSpeed, { immediate: true })

export function setContainerBoundaries(value: boolean): void {
  showContainerBoundaries.value = value
}

export function setAnimationsDisabled(value: boolean): void {
  animationsDisabled.value = value
}

export function resetAnimSpeed(): void {
  animSpeed.value = 1
}

/** 供视图组件取用全局调试运行状态。 */
export function useDevToolsState() {
  return { showContainerBoundaries, animationsDisabled, animSpeed }
}