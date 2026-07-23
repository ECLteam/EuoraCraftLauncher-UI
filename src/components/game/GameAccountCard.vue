<template>
  <div class="account-card">
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
        <div class="account-name">
          {{ account?.alias || t('game.noAccount') }}
        </div>
        <div class="account-type">
          {{ account ? accountTypeLabel : t('game.clickManageToAdd') }}
        </div>
      </div>
      <button class="account-manage-btn" @click="emit('manage')">
        {{ t('game.manage') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AvatarRenderer from '@/components/game/AvatarRenderer.vue'
import UiIcon from '@/components/ui/Icon.vue'
import type { MinecraftAccount } from '@/types/api'

defineProps<{
  account: MinecraftAccount | null
  accountTypeLabel: string
}>()

const emit = defineEmits<{
  manage: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.account-card {
  display: flex;
  align-items: center;
  height: 65px;
  padding: 14px 18px;
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  background: var(--card-bg);
}

.account-info {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
}

.account-avatar,
.account-avatar-placeholder {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
}

.account-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base-alt);
  color: var(--text-tertiary);
}

.account-details {
  flex: 1;
  min-width: 0;
}

.account-name,
.account-type {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.account-type {
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.account-manage-btn {
  padding: 5px 14px;
  border: 1px solid var(--primary);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--duration-fast) ease-out;
}

.account-manage-btn:hover {
  background: var(--primary-alpha);
}

.account-manage-btn:active {
  transform: translateY(1px);
}
</style>
