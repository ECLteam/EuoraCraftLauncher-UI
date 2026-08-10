<template>
  <div class="ecl-page online-mods-page">
    <PageHeader :title="t('mods.onlineSearch')" icon="search" />

    <NCard class="search-card" contentStyle="padding: 14px;">
      <div class="search-controls">
        <NInput
          v-model:value="query"
          class="query-input"
          :placeholder="t('mods.searchPlaceholder')"
          clearable
          @keydown.enter="handleSearch"
        >
          <template #prefix><UiIcon name="search" :size="15" /></template>
        </NInput>
        <NSelect
          v-model:value="selectedInstanceKey"
          class="instance-select"
          :options="instanceOptions"
          :placeholder="t('mods.selectInstance')"
          filterable
        />
        <NSelect v-model:value="source" class="source-select" :options="sourceOptions" />
        <NButton type="primary" :loading="loading" @click="handleSearch">
          <template #icon><UiIcon name="search" :size="15" /></template>
          {{ t('mods.search') }}
        </NButton>
      </div>
      <div v-if="selectedInstance" class="instance-context">
        <UiIcon name="game-controller" :size="14" />
        <span>{{ selectedInstance.displayName }}</span>
        <NTag size="small" :bordered="false">{{ selectedInstance.vanillaName }}</NTag>
        <NTag size="small" :bordered="false">{{ selectedInstance.primaryLoader }}</NTag>
      </div>
    </NCard>

    <div id="plugin-slot-online-mods-search-after" class="plugin-slot-container"></div>

    <div v-if="sourceWarnings.length" class="source-warnings">
      <NAlert v-for="warning in sourceWarnings" :key="warning.name" type="warning" :showIcon="false">
        <strong>{{ warning.name }}</strong> · {{ warning.error }}
      </NAlert>
    </div>

    <NCard class="results-card" contentStyle="padding: 0; height: 100%; overflow: hidden;">
      <NSpin :show="loading" class="results-spin">
        <NScrollbar v-if="results.length" class="results-scroll">
          <div class="result-summary">
            <span>{{ t('mods.resultCount', { count: results.length }) }}</span>
            <span v-if="effectiveQuery && effectiveQuery !== query.trim()" class="translated-query">
              {{ t('mods.translatedQuery', { query: effectiveQuery }) }}
            </span>
          </div>
          <div class="mod-grid">
            <article v-for="mod in results" :key="mod.id" class="mod-card" @click="openDetails(mod)">
              <div class="mod-card-header">
                <NAvatar :size="54" :src="mod.iconUrl" color="var(--ecl-surface-muted)" objectFit="cover">
                  <UiIcon name="cube" :size="24" />
                </NAvatar>
                <div class="mod-title-wrap">
                  <h3>{{ mod.displayTitle }}</h3>
                  <p v-if="mod.displayTitle !== mod.title">{{ mod.title }}</p>
                  <p v-else>{{ mod.author }}</p>
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

              <div class="mod-tags">
                <NTag v-if="mod.wiki" size="small" :bordered="false" type="info">MC 百科</NTag>
                <NTag v-for="loader in mod.loaders.slice(0, 3)" :key="loader" size="small" :bordered="false">
                  {{ loaderName(loader) }}
                </NTag>
                <NTag v-for="category in mod.categories.slice(0, 2)" :key="category" size="small" :bordered="false">
                  {{ category }}
                </NTag>
              </div>

              <div class="mod-card-footer">
                <span><UiIcon name="download" :size="13" />{{ formatDownloads(mod.downloads) }}</span>
                <NButton type="primary" size="small" secondary @click.stop="openDetails(mod)">
                  {{ t('mods.chooseVersion') }}
                </NButton>
              </div>
            </article>
          </div>
        </NScrollbar>
        <NEmpty
          v-else-if="!loading"
          class="results-empty"
          :description="searched ? t('mods.noResults') : t('mods.searchHint')"
        >
          <template #icon><UiIcon name="cloud-download" :size="42" /></template>
        </NEmpty>
      </NSpin>
    </NCard>

    <NModal
      v-model:show="detailsVisible"
      preset="card"
      class="mod-detail-modal"
      :title="selectedMod?.displayTitle || t('mods.details')"
      :bordered="false"
      :segmented="{ content: true, footer: true }"
    >
      <NSpin :show="detailLoading">
        <div v-if="selectedMod" class="detail-content">
          <div class="detail-hero">
            <NAvatar :size="72" :src="selectedMod.iconUrl" color="var(--ecl-surface-muted)">
              <UiIcon name="cube" :size="30" />
            </NAvatar>
            <div class="detail-heading">
              <h2>{{ selectedMod.displayTitle }}</h2>
              <p>{{ selectedMod.title }} · {{ selectedMod.author }}</p>
              <div class="detail-links">
                <NButton v-if="activeSourceRef" size="small" secondary @click="openUrl(activeSourceRef.projectUrl)">
                  <template #icon><UiIcon name="external-link" :size="14" /></template>
                  {{ sourceLabel(activeSourceRef.source) }}
                </NButton>
                <NButton v-if="selectedMod.wiki" size="small" secondary @click="openUrl(selectedMod.wiki.url)">
                  <template #icon><UiIcon name="file-text" :size="14" /></template>
                  MC 百科
                </NButton>
              </div>
            </div>
          </div>

          <p class="detail-description">
            {{ selectedMod.wiki?.summary || selectedMod.description || detailInfo?.description }}
          </p>

          <div class="version-picker">
            <template v-if="selectedMod.alternatives.length > 1">
              <label>{{ t('mods.downloadSource') }}</label>
              <NSelect
                v-model:value="selectedSourceKey"
                class="detail-source-select"
                :options="detailSourceOptions"
                @update:value="loadSelectedSource"
              />
            </template>
            <label>{{ t('mods.compatibleVersion') }}</label>
            <NSelect
              v-model:value="selectedFileId"
              :options="versionOptions"
              :loading="detailLoading"
              :placeholder="versions.length ? t('mods.chooseVersion') : t('mods.noCompatibleVersion')"
            />
            <p class="version-hint">{{ t('mods.dependencyHint') }}</p>
          </div>
        </div>
      </NSpin>

      <template #footer>
        <div class="detail-footer">
          <span v-if="selectedInstance" class="install-target">
            {{ t('mods.installTo', { instance: selectedInstance.displayName }) }}
          </span>
          <NButton
            type="primary"
            :loading="installing"
            :disabled="!selectedFileId || !selectedInstance"
            @click="installSelected"
          >
            <template #icon><UiIcon name="download" :size="15" /></template>
            {{ installProgress || t('mods.install') }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import {
  NAlert,
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NInput,
  NModal,
  NScrollbar,
  NSelect,
  NSpin,
  NTag,
} from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import PageHeader from '@/components/layout/PageHeader.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useInstanceStore } from '@/features/instances/stores/instanceStore'
import { modApi } from '@/features/mods/api/modApi'
import type {
  ModInfo,
  ModSearchItem,
  ModSourceReference,
  ModSourceStatus,
  ModVersion,
  ScannedVersion,
} from '@/types/api'
import { getErrorMessage } from '@/utils/error'
import { formatErrors, v } from '@/utils/validate'

const { t } = useI18n()
const message = useGlassMessage()
const instanceStore = useInstanceStore()
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })
const query = ref('')
const source = ref<'all' | 'modrinth' | 'curseforge'>('all')
const selectedInstanceKey = ref('')
const searched = ref(false)
const results = ref<ModSearchItem[]>([])
const sourceStatuses = ref<Record<string, ModSourceStatus>>({})
const effectiveQuery = ref('')
const detailsVisible = ref(false)
const detailLoading = ref(false)
const selectedMod = ref<ModSearchItem | null>(null)
const detailInfo = ref<ModInfo | null>(null)
const versions = ref<ModVersion[]>([])
const selectedSourceKey = ref('')
const selectedFileId = ref<string | null>(null)
const installing = ref(false)
const installProgress = ref('')
const querySchema = v.string().min(1, t('mods.queryRequired')).max(100, t('mods.queryTooLong'))

const sourceOptions = computed(() => [
  { label: t('mods.allSources'), value: 'all' },
  { label: 'Modrinth', value: 'modrinth' },
  { label: 'CurseForge', value: 'curseforge' },
])

const installableInstances = computed(() =>
  instanceStore.scannedVersions.filter((version) => !version.isBroken)
)

function instanceKey(version: ScannedVersion): string {
  return `${version.path}\u0000${version.versionId}`
}

const instanceOptions = computed(() =>
  installableInstances.value.map((version) => ({
    label: `${version.displayName} · ${version.vanillaName} · ${version.primaryLoader}`,
    value: instanceKey(version),
  }))
)

const selectedInstance = computed(
  () => installableInstances.value.find((version) => instanceKey(version) === selectedInstanceKey.value) ?? null
)

const sourceWarnings = computed(() =>
  Object.entries(sourceStatuses.value)
    .filter(([, status]) => !status.available && status.error)
    .map(([name, status]) => ({ name: name === 'mcmod' ? 'MC 百科' : sourceLabel(name), error: status.error }))
)

const versionOptions = computed(() =>
  versions.value.map((version) => ({
    label: `${version.versionNumber || version.name} · ${version.filename}`,
    value: version.id,
  }))
)

function sourceKey(value: ModSourceReference): string {
  return `${value.source}:${value.projectId}`
}

const detailSourceOptions = computed(() =>
  (selectedMod.value?.alternatives ?? []).map((platform) => ({
    label: sourceLabel(platform.source),
    value: sourceKey(platform),
  }))
)

const activeSourceRef = computed(
  () => selectedMod.value?.alternatives.find((platform) => sourceKey(platform) === selectedSourceKey.value) ?? null
)

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

async function handleSearch() {
  const trimmed = query.value.trim()
  const validated = querySchema.safeParse(trimmed)
  if (!validated.success) {
    message.error(formatErrors(validated.errors))
    return
  }
  if (!selectedInstance.value) {
    message.warning(t('mods.selectInstanceFirst'))
    return
  }

  searched.value = true
  const instance = selectedInstance.value
  const response = await run(() =>
    modApi.search({
      query: trimmed,
      source: source.value,
      game_version: instance.vanillaName,
      loader_type: instance.primaryLoader,
      limit: 24,
      offset: 0,
    })
  ).catch((error) => {
    message.error(getErrorMessage(error))
    return undefined
  })
  results.value = response?.items ?? []
  sourceStatuses.value = response?.sources ?? {}
  effectiveQuery.value = response?.query ?? trimmed
}

async function openDetails(mod: ModSearchItem) {
  selectedMod.value = mod
  const initialSource = mod.alternatives[0] ?? {
    source: mod.source,
    projectId: mod.projectId,
    slug: mod.slug,
    projectUrl: mod.projectUrl,
  }
  selectedSourceKey.value = sourceKey(initialSource)
  detailInfo.value = null
  versions.value = []
  selectedFileId.value = null
  detailsVisible.value = true
  await loadSelectedSource()
}

async function loadSelectedSource() {
  const instance = selectedInstance.value
  const platform = activeSourceRef.value
  if (!instance || !platform) return
  detailInfo.value = null
  versions.value = []
  selectedFileId.value = null
  detailLoading.value = true
  try {
    const [info, files] = await Promise.all([
      modApi.info({ mod_id: platform.projectId, source: platform.source }),
      modApi.versions({
        mod_id: platform.projectId,
        source: platform.source,
        game_version: instance.vanillaName,
        loader_type: instance.primaryLoader,
      }),
    ])
    detailInfo.value = info
    versions.value = files
    selectedFileId.value = files[0]?.id ?? null
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    detailLoading.value = false
  }
}

async function installSelected() {
  const mod = selectedMod.value
  const instance = selectedInstance.value
  const platform = activeSourceRef.value
  const fileId = selectedFileId.value
  if (!mod || !instance || !platform || !fileId) return
  installing.value = true
  installProgress.value = t('mods.resolvingDependencies')
  try {
    const result = await modApi.install({
      mod_id: platform.projectId,
      source: platform.source,
      file_id: fileId,
      game_path: instance.path,
      instance_id: instance.versionId,
      game_version: instance.vanillaName,
      loader_type: instance.primaryLoader,
    })
    message.success(t('mods.installSuccess', { count: result.installed.length }))
    detailsVisible.value = false
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    installing.value = false
    installProgress.value = ''
  }
}

async function openUrl(url: string) {
  if (!url) return
  await modApi.openUrl(url).catch((error) => message.error(getErrorMessage(error)))
}

const stopInstallProgress = backend.on('mods:install_progress', (payload) => {
  installProgress.value = payload.phase === 'downloading' ? t('mods.downloadingFile') : t('mods.resolvingDependencies')
})

onMounted(async () => {
  try {
    await instanceStore.loadAll()
    const preferred =
      installableInstances.value.find(
        (version) =>
          version.versionId === instanceStore.selectedVersion && version.path === instanceStore.currentGamePath
      ) ?? installableInstances.value[0]
    if (preferred) selectedInstanceKey.value = instanceKey(preferred)
  } catch (error) {
    message.error(getErrorMessage(error))
  }
})

onBeforeUnmount(() => stopInstallProgress())
</script>

<style scoped src="@/styles/views/OnlineMods.css"></style>
