// 统一管理 setInterval，支持动态间隔、暂停/继续/立即执行

import { ref, onScopeDispose } from 'vue'

export function useIntervalFn(
  fn: () => void | Promise<void>,
  interval: number | (() => number),
  options: { immediate?: boolean } = {}
) {
  const active = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function getInterval(): number {
    return typeof interval === 'function' ? interval() : interval
  }

  function execute() {
    void fn()
  }

  function resume() {
    if (timer) return
    active.value = true
    timer = setInterval(execute, getInterval())
  }

  function pause() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    active.value = false
  }

  function restart() {
    pause()
    resume()
  }

  function runOnce() {
    execute()
  }

  onScopeDispose(pause)

  if (options.immediate) {
    execute()
    resume()
  }

  return { active, resume, pause, restart, runOnce }
}
