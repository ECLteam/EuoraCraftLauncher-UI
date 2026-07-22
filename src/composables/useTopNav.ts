import { computed } from 'vue'
import { useTheme } from './useTheme'

export function useTopNav() {
  const { titlebarHidden, setTitlebarHidden } = useTheme()

  const toggleTopNav = () => {
    setTitlebarHidden(!titlebarHidden.value)
  }

  const setTopNav = (val: boolean) => {
    setTitlebarHidden(val)
  }

  // 顶部栏是否启用（启用即显示）：语义上与 titlebarHidden 相反
  const topNavEnabled = computed<boolean>({
    get: () => !titlebarHidden.value,
    set: (val: boolean) => setTitlebarHidden(!val),
  })

  return {
    topNavEnabled,
    toggleTopNav,
    setTopNav,
  }
}
