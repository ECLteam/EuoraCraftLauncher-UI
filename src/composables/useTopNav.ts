import { computed } from 'vue'
import { useTheme } from './useTheme'

export function useTopNav() {
  const { navigationMode, setNavigationMode } = useTheme()

  const toggleTopNav = () => {
    setNavigationMode(navigationMode.value === 'top' ? 'sidebar' : 'top')
  }

  const setTopNav = (val: boolean) => {
    setNavigationMode(val ? 'top' : 'sidebar')
  }

  const topNavEnabled = computed<boolean>({
    get: () => navigationMode.value === 'top',
    set: (val: boolean) => setNavigationMode(val ? 'top' : 'sidebar'),
  })

  return {
    topNavEnabled,
    toggleTopNav,
    setTopNav,
  }
}
