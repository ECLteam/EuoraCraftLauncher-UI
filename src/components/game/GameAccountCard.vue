<template>
  <NCard class="account-card" contentStyle="padding: 14px 16px;">
    <div class="account-info">
      <AvatarRenderer
        v-if="account"
        class="account-avatar"
        :uuid="account.uuid"
        :username="account.alias"
        :typeName="account.type"
        :skinUrl="account.skinUrl"
        :size="40"
      />
      <div v-else class="account-avatar-placeholder">
        <UiIcon name="user" :size="20" />
      </div>
      <div class="account-details">
        <div class="account-name">{{ account?.alias || t('game.noAccount') }}</div>
        <div class="account-type">
          {{ account ? accountTypeLabel : t('game.clickManageToAdd') }}
        </div>
      </div>
      <NButton size="small" @click="emit('manage')">{{ t('game.manage') }}</NButton>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import AvatarRenderer from '@/components/game/AvatarRenderer.vue'
import UiIcon from '@/components/ui/Icon.vue'
import type { MinecraftAccount } from '@/types/api'

defineProps<{
  account: MinecraftAccount | null
  accountTypeLabel: string
}>()

const emit = defineEmits<{ manage: [] }>()
const { t } = useI18n()
</script>

<style scoped>
.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-avatar,
.account-avatar-placeholder {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 7px;
}

.account-avatar-placeholder {
  display: grid;
  place-items: center;
  background: var(--ecl-surface-muted);
  color: var(--ecl-text-secondary);
}

.account-details {
  min-width: 0;
  flex: 1;
}

.account-name,
.account-type {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-name {
  color: var(--ecl-text);
  font-size: 14px;
  font-weight: 650;
}

.account-type {
  margin-top: 2px;
  color: var(--ecl-text-secondary);
  font-size: 11px;
}
</style>
