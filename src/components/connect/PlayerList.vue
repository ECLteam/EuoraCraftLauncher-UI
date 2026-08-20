<template>
  <section class="connect-player-section">
    <div v-if="players.length" class="connect-player-list">
      <div
        v-for="player in players"
        :key="player.machineId || player.name"
        class="connect-player-row"
        :class="{ 'is-host': player.kind === 'host' }"
      >
        <UiAvatar
          :src="player.iconBase64 ? `data:image/png;base64,${player.iconBase64}` : undefined"
          :name="player.name"
          :size="40"
        />
        <div class="connect-player-identity">
          <div>
            <strong>{{ player.name }}</strong>
            <UiTag v-if="player.kind === 'host'" size="tiny" tone="info">{{ t('connect.players.host') }}</UiTag>
          </div>
          <span>{{ player.vendor }}</span>
        </div>
        <span class="connect-player-presence" aria-hidden="true"></span>
        <UiButton
          v-if="hostControls && player.kind !== 'host'"
          variant="ghost"
          shape="square"
          icon="user-x"
          :title="t('connect.players.kick')"
          :disabled="busy"
          @click="emit('kick', player)"
        />
      </div>
    </div>
    <span v-else class="connect-empty-text">{{ t('connect.players.empty') }}</span>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiAvatar from '@/components/ui/Avatar.vue'
import UiButton from '@/components/ui/Button.vue'
import UiTag from '@/components/ui/Tag.vue'
import type { ConnectorPlayer } from '@/types/api'

defineOptions({ name: 'ConnectorPlayerList' })

defineProps<{
  players: ConnectorPlayer[]
  hostControls?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  kick: [player: ConnectorPlayer]
}>()

const { t } = useI18n()
</script>
