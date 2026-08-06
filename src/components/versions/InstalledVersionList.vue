<template>
  <section class="version-panel">
    <div class="panel-header">
      <div class="header-left">
        <h3 class="panel-title">
          <UiIcon name="cube" :size="16" />
          {{ pathName }}
        </h3>
        <span v-if="versions.length > 0" class="version-count-badge">
          {{ t('versions.manage.versionCount', { count: versions.length }) }}
        </span>
      </div>
      <div class="header-right">
        <button class="btn-refresh" :disabled="refreshLoading" @click="emit('refresh')">
          <UiIcon name="refresh" :size="14" />
          {{ t('common.refresh') }}
        </button>
        <button class="btn-install-version" @click="emit('install')">
          <UiIcon name="download" :size="14" />
          {{ t('versions.download.installNew') }}
        </button>
        <div class="search-box">
          <UiIcon name="search" :size="16" class="search-icon" />
          <input
            :value="searchQuery"
            type="text"
            :placeholder="t('versions.manage.searchVersion')"
            class="search-input"
            @input="updateSearchQuery"
          />
          <button v-if="searchQuery" class="search-clear" type="button" @click="emit('update:searchQuery', '')">
            <UiIcon name="close" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div class="version-content">
      <div v-if="selectedPathIndex === -1" class="empty-state">
        <UiIcon name="folder" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('versions.manage.selectPathHint') }}</p>
        <p v-if="pathCount === 0" class="empty-hint">{{ t('versions.manage.addPathToStart') }}</p>
        <button v-if="pathCount === 0" class="btn-primary" @click="emit('addPath')">
          <UiIcon name="add" :size="16" />
          {{ t('common.add') }}
        </button>
      </div>

      <div v-else-if="loading" class="loading-state">
        <UiIcon name="spinner" class="spin" :size="24" />
        <p>{{ t('versions.manage.scanning') }}</p>
      </div>

      <div v-else-if="versions.length === 0" class="empty-state">
        <UiIcon name="cube" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('versions.manage.noVersionsFound') }}</p>
        <p class="empty-hint">{{ t('versions.manage.currentPath') }}: {{ pathLocation }}</p>
      </div>

      <div v-else class="version-table">
        <div class="table-header">
          <span class="col-icon" />
          <span class="col-name">{{ t('versions.manage.versionName') }}</span>
          <span class="col-type">{{ t('versions.manage.loaderType') }}</span>
          <span class="col-actions" />
        </div>

        <div class="table-body">
          <div
            v-for="version in filteredVersions"
            :key="version.versionId"
            :class="['table-row', { selected: selectedVersion === version.versionId }]"
            @click="emit('selectVersion', version)"
          >
            <div class="col-icon">
              <div class="version-icon" :class="[version.versionType, { 'has-image': Boolean(versionImage(version)) }]">
                <img v-if="versionImage(version)" :src="versionImage(version)" alt="" class="version-icon-img" />
                <UiIcon v-else :name="getLoaderIcon(version.primaryLoader)" :size="18" />
              </div>
            </div>
            <div class="col-name">
              <span class="version-name">{{ version.versionId }}</span>
              <span class="version-mcver">{{ version.vanillaName || t('versions.manage.unknownVersion') }}</span>
            </div>
            <div class="col-type">
              <span :class="['badge', 'badge-' + getLoaderClass(version.primaryLoader)]">
                {{ loaderDisplayName(version.primaryLoader) }}
              </span>
            </div>
            <div class="col-actions">
              <button
                class="btn-action btn-settings"
                :title="t('settings.title')"
                @click.stop="emit('detail', version)"
              >
                <UiIcon name="settings" :size="14" />
              </button>
              <button
                v-if="!version.isBroken"
                class="btn-action btn-play"
                :title="t('common.launch')"
                @click.stop="emit('launch', version)"
              >
                <UiIcon name="play" :size="14" />
              </button>
              <button class="btn-action btn-delete" :title="t('common.delete')" @click.stop="emit('remove', version)">
                <UiIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { getVersionImage } from '@/config/version'
import type { ScannedVersion } from '@/types/api'
import { getLoaderClass, getLoaderIcon, getLoaderImage, getLoaderName } from '@/utils/loader'

const props = defineProps<{
  versions: ScannedVersion[]
  selectedPathIndex: number
  pathCount: number
  pathName: string
  pathLocation?: string
  loading: boolean
  refreshLoading: boolean
  searchQuery: string
  selectedVersion: string
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  refresh: []
  install: []
  addPath: []
  selectVersion: [version: ScannedVersion]
  detail: [version: ScannedVersion]
  launch: [version: ScannedVersion]
  remove: [version: ScannedVersion]
}>()

const { t } = useI18n()

const filteredVersions = computed(() => {
  const query = props.searchQuery.trim().toLowerCase()
  if (!query) return props.versions
  return props.versions.filter(
    (version) => version.versionId.toLowerCase().includes(query) || version.displayName?.toLowerCase().includes(query)
  )
})

function updateSearchQuery(event: Event) {
  emit('update:searchQuery', (event.target as HTMLInputElement).value)
}

function loaderDisplayName(loaderType: string | null): string {
  if (
    !loaderType ||
    loaderType === 'Unknown' ||
    loaderType === 'release' ||
    loaderType === 'snapshot' ||
    loaderType === 'Vanilla'
  ) {
    return t('versions.manage.vanilla')
  }
  return getLoaderName(loaderType)
}

function versionImage(version: ScannedVersion): string {
  if (version.hasOptiFine) return getLoaderImage('optifine')
  return getLoaderImage(version.primaryLoader) || getVersionImage(version.versionType)
}
</script>

<style scoped src="@/styles/components/versions/InstalledVersionList.css"></style>
