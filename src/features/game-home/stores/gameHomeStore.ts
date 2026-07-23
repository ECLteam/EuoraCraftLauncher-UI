import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { gameHomeApi } from '@/features/game-home/api/gameHomeApi'
import { EMPTY_INFO_CARD, normalizeInfoCard } from '@/features/game-home/model/infoCard'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { InfoCardData } from '@/types/api'

export const useGameHomeStore = defineStore('game-home', () => {
  const settingsStore = useSettingsStore()
  const infoCard = ref<InfoCardData>({ ...EMPTY_INFO_CARD })
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')

  const hasGamePath = computed(() => settingsStore.game.minecraft_paths.length > 0)

  async function load(): Promise<void> {
    status.value = 'loading'
    error.value = ''
    try {
      const [card] = await Promise.all([gameHomeApi.getInfoCard(), settingsStore.load()])
      infoCard.value = normalizeInfoCard(card)
      status.value = 'ready'
    } catch (reason) {
      status.value = 'error'
      error.value = reason instanceof Error ? reason.message : '加载游戏首页失败'
      throw reason
    }
  }

  function cancelLaunch(): Promise<void> {
    return gameHomeApi.cancelLaunch()
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
