<template>
  <article class="mod-card" @click="$emit('open-details', mod)">
    <div class="mod-icon-col">
      <NAvatar :size="52" :src="mod.iconUrl" color="var(--ecl-surface-muted)" objectFit="cover">
        <UiIcon name="cube" :size="22" />
      </NAvatar>
    </div>

    <div class="mod-info-col">
      <div class="mod-title-row">
        <div class="mod-title">
          <h3>{{ mod.displayTitle }}</h3>
          <p>{{ mod.displayTitle !== mod.title ? mod.title : mod.author }}</p>
        </div>
        <div class="platform-tags">
          <NTag
            v-for="platform in mod.alternatives"
            :key="`${platform.source}:${platform.projectId}`"
            size="small"
            :bordered="false"
            :type="platform.source === 'modrinth' ? 'success' : 'warning'"
          >
            {{ sourceLabel(platform.source) }}
          </NTag>
        </div>
      </div>

      <p class="mod-description">{{ mod.wiki?.summary || mod.description }}</p>

      <div class="mod-meta-row">
        <span class="mod-meta-item">
          <UiIcon name="user" :size="12" />
          {{ mod.author }}
        </span>
        <span class="mod-meta-item">
          <UiIcon name="download" :size="12" />
          {{ formatDownloads(mod.downloads) }}
        </span>
      </div>

      <div class="mod-tags">
        <NTag v-if="mod.wiki" size="small" :bordered="false" type="info">MC 百科</NTag>
        <NTag v-if="resourceType !== 'mod'" size="small" :bordered="false" type="info">
          {{ resourceTypeLabel }}
        </NTag>
        <template v-if="resourceType === 'mod'">
          <NTag v-for="loader in mod.loaders.slice(0, 3)" :key="loader" size="small" :bordered="false">
            {{ loaderName(loader) }}
          </NTag>
        </template>
        <NTag v-for="category in mod.categories.slice(0, 3)" :key="category" size="small" :bordered="false">
          {{ category }}
        </NTag>
      </div>
    </div>

    <div class="mod-actions-col">
      <div class="mod-card-buttons">
        <NButton type="primary" size="small" @click.stop="$emit('open-details', mod)">
          <template #icon><UiIcon name="download" :size="14" /></template>
          {{ t('mods.install') }}
        </NButton>
        <NButton size="small" secondary @click.stop="$emit('open-details', mod)">
          {{ t('mods.chooseVersion') }}
        </NButton>
        <NButton
          v-if="resourceType === 'mod' && isDownloadHost"
          size="tiny"
          quaternary
          @click.stop="$emit('open-in-mod-page', mod)"
        >
          {{ t('mods.viewOnModPage') }}
        </NButton>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { NAvatar, NButton, NTag } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import type { ModSearchItem, GameResourceType } from '@/types/api'

const props = defineProps<{
  mod: ModSearchItem
  resourceType: GameResourceType
  isDownloadHost: boolean
}>()

defineEmits<{
  (e: 'open-details', mod: ModSearchItem): void
  (e: 'open-in-mod-page', mod: ModSearchItem): void
}>()

const { t } = useI18n()

const resourceTypeLabel = computed(() => t(`download.${props.resourceType}`))

function sourceLabel(value: string): string {
  if (value === 'modrinth') return 'Modrinth'
  if (value === 'curseforge') return 'CurseForge'
  return value
}

function loaderName(value: string): string {
  if (value === 'neoforge') return 'NeoForge'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDownloads(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
</script>