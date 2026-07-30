<template>
  <NCard class="info-card" contentStyle="padding: 0;">
    <NButton
      v-if="canToggle"
      class="info-toggle-btn"
      quaternary
      circle
      size="small"
      :title="view === 'tip' ? '查看公告' : '查看小贴士'"
      @click="emit('toggle')"
    >
      <template #icon><UiIcon :name="view === 'tip' ? 'bell' : 'lightbulb'" :size="14" /></template>
    </NButton>

    <Transition name="info-fade" mode="out-in">
      <div v-if="view === 'tip'" key="tip" class="info-tip">
        <div class="info-header">
          <UiIcon name="lightbulb" :size="16" />
          <span class="info-title">
            {{ isWelcome ? data.welcome?.title || t('game.welcomeTitle') : t('game.didYouKnow') }}
          </span>
        </div>
        <p class="info-content">
          {{ isWelcome ? data.welcome?.content || t('game.welcomeContent') : currentTip }}
        </p>
      </div>

      <div v-else key="announce" class="info-announce">
        <div class="info-header">
          <UiIcon name="bell" :size="16" />
          <span class="info-title">{{ t('game.announcement') }}</span>
        </div>
        <div class="announce-list">
          <div v-if="!hasAnnouncements" class="announce-empty">
            {{ t('game.noAnnouncements') }}
          </div>
          <template v-else-if="data.mode === 'rotate'">
            <div v-if="currentAnnouncement" class="announce-item">
              <div class="announce-item-header">
                <span class="announce-item-title">{{ currentAnnouncement.title }}</span>
                <span class="announce-item-date">{{ currentAnnouncement.date }}</span>
              </div>
              <p class="announce-item-desc">
                {{ currentAnnouncement.content }}
              </p>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, index) in data.announcements" :key="index" class="announce-item">
              <div class="announce-item-header">
                <span class="announce-item-title">{{ item.title }}</span>
                <span class="announce-item-date">{{ item.date }}</span>
              </div>
              <p class="announce-item-desc">
                {{ item.content }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import type { InfoCardData, InfoCardAnnouncement } from '@/types/api'

defineProps<{
  data: InfoCardData
  view: 'tip' | 'announce'
  isWelcome: boolean
  currentTip: string
  currentAnnouncement: InfoCardAnnouncement | null
  hasAnnouncements: boolean
  canToggle: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.info-card {
  position: relative;
  overflow: hidden;
}

.info-toggle-btn {
  position: absolute;
  z-index: 1;
  top: 7px;
  right: 7px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px 0;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
}

.info-title {
  color: var(--text-primary);
}

.info-content {
  margin: 0;
  padding: 7px 14px 11px;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.5;
}

.info-announce {
  padding-bottom: 4px;
}

.announce-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  overflow-y: auto;
  max-height: 180px;
  padding: 7px 14px 11px;
}

.announce-empty {
  padding: 7px 0;
  color: var(--text-tertiary);
  font-size: 11px;
  text-align: center;
}

.announce-item {
  padding-bottom: 7px;
  border-bottom: 1px solid var(--divider);
}

.announce-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.announce-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.announce-item-title {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
}

.announce-item-date {
  flex-shrink: 0;
  color: var(--text-tertiary);
  font-size: 10px;
}

.announce-item-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.5;
}
</style>
