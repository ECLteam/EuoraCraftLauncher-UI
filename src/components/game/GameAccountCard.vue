<template>
  <NCard class="account-card ecl-surface" contentStyle="padding: 14px 16px;">
    <div class="account-info">
      <AvatarRenderer
        v-if="account"
        class="account-avatar"
        :uuid="account.uuid"
        :username="account.alias"
        :typeName="account.type"
        :skinUrl="account.skinUrl"
        :accountId="account.id"
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
      <div class="account-actions">
        <NButton size="small" @click="emit('manage')">{{ t('game.manage') }}</NButton>
        <NDropdown
          trigger="click"
          placement="bottom-end"
          :showArrow="true"
          :disabled="loading || !accounts.length"
          :options="accountOptions"
          @select="selectAccount"
        >
          <NButton quaternary circle size="small" :title="t('game.switch')" :disabled="loading || !accounts.length">
            <template #icon><UiIcon name="chevron-down" :size="15" /></template>
          </NButton>
        </NDropdown>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard, NDropdown } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AvatarRenderer from '@/components/game/AvatarRenderer.vue'
import UiIcon from '@/components/ui/Icon.vue'
import type { MinecraftAccount } from '@/types/api'
import { getAccountTypeLabelKey } from '@/utils/enums'

const props = defineProps<{
  account: MinecraftAccount | null
  accounts: MinecraftAccount[]
  accountTypeLabel: string
  loading?: boolean
}>()

const emit = defineEmits<{
  manage: []
  switch: [accountId: string]
}>()
const { t } = useI18n()

const accountOptions = computed(() =>
  props.accounts.map((savedAccount) => ({
    label: `${savedAccount.id === props.account?.id ? '✓ ' : ''}${savedAccount.alias} · ${getAccountTypeLabel(
      savedAccount.type
    )}`,
    key: savedAccount.id,
  }))
)

function getAccountTypeLabel(type: MinecraftAccount['type']) {
  return t(getAccountTypeLabelKey(type))
}

function selectAccount(accountId: string | number) {
  const selectedAccountId = String(accountId)
  if (selectedAccountId === props.account?.id) return
  emit('switch', selectedAccountId)
}
</script>

<style scoped>
.account-card {
  background: var(--ecl-surface);
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
  box-shadow: var(--ecl-shadow-surface);
}

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
}

.account-avatar-placeholder {
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

.account-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
}
</style>
