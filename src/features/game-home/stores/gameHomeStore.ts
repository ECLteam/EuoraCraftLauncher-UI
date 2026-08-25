import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { queryClient } from '@/app/queryClient'
import { queryKeys } from '@/app/queryKeys'
import { useAsyncState } from '@/composables/useAsyncState'
import { gameHomeApi } from '@/features/game-home/api/gameHomeApi'
import { EMPTY_INFO_CARD, normalizeInfoCard } from '@/features/game-home/model/infoCard'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { InfoCardData } from '@/types/system'

export const useGameHomeStore = defineStore('game-home', () => {
  const settingsStore = useSettingsStore()
  const infoCard = ref<InfoCardData>({ ...EMPTY_INFO_CARD })
  const { status } = useAsyncState()
  const error = ref('')

  const hasGamePath = computed(() => settingsStore.game.minecraft_paths.length > 0)

  async function load(): Promise<void> {
    status.value = 'loading'
    error.value = ''
    try {
      const [card] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.gameHome.infoCard,
          queryFn: () => gameHomeApi.getInfoCard(),
        }),
        settingsStore.load(),
      ])
      infoCard.value = normalizeInfoCard(card)
      status.value = 'ready'
    } catch (reason) {
      status.value = 'error'
      error.value = reason instanceof Error ? reason.message : '加载首页失败'
      throw reason
    }
  }

  function cancelLaunch(): Promise<void> {
    return gameHomeApi.cancelLaunch().finally(() => queryClient.invalidateQueries({ queryKey: queryKeys.gameHome.infoCard }))
  }

  return {
    infoCard,
    status,
    error,
    hasGamePath,
    load,
    cancelLaunch,
  }
})
