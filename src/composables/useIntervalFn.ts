// 统一管理 setInterval，支持动态间隔、暂停/继续/立即执行

import { useIntervalFn as useVueuseIntervalFn } from '@vueuse/core'

export function useIntervalFn(
  fn: () => void | Promise<void>,
  interval: number | (() => number),
  options: { immediate?: boolean } = {},
) {
  const immediate = options.immediate ?? false
  const { isActive, resume, pause } = useVueuseIntervalFn(fn, interval, {
    immediate,
    immediateCallback: immediate,
  })

  function restart() {
    pause()
    resume()
  }

  function runOnce() {
    fn()
  }

  return { active: isActive, resume, pause, restart, runOnce }
}
