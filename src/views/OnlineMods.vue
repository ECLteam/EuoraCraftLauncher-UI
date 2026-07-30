<template>
  <div class="ecl-page online-mods-page">
    <PageHeader :title="t('mods.onlineSearch')" icon="search" />

    <NCard class="search-card" contentStyle="padding: 12px;">
      <NInputGroup>
        <NInput
          v-model:value="query"
          :placeholder="t('mods.searchPlaceholder')"
          clearable
          @keydown.enter="handleSearch"
        >
          <template #prefix><UiIcon name="search" :size="15" /></template>
        </NInput>
        <NButton type="primary" :loading="loading" @click="handleSearch">
          {{ t('mods.search') }}
        </NButton>
      </NInputGroup>
    </NCard>

    <div id="plugin-slot-online-mods-search-after" class="plugin-slot-container"></div>

    <NCard class="results-card" contentStyle="padding: 0; height: 100%; overflow: auto;">
      <NSpin :show="loading" class="results-spin">
        <NList v-if="results.length" hoverable>
          <NListItem v-for="mod in results" :key="mod.id">
            <template #prefix>
              <NAvatar :size="42" :src="mod.icon_url" color="var(--ecl-surface-muted)">
                <UiIcon name="cube" :size="20" />
              </NAvatar>
            </template>
            <NThing :title="mod.title" :description="mod.description">
              <template #footer>
                <NSpace :size="6">
                  <NTag size="small" :bordered="false">
                    {{ mod.source === 'modrinth' ? 'Modrinth' : 'CurseForge' }}
                  </NTag>
                  <span class="downloads"> {{ mod.downloads?.toLocaleString() }} {{ t('mods.downloads') }} </span>
                </NSpace>
              </template>
            </NThing>
            <template #suffix>
              <NButton type="primary" size="small" @click="handleInstall(mod)">
                {{ t('mods.install') }}
              </NButton>
            </template>
          </NListItem>
        </NList>
        <NEmpty
          v-else-if="!loading"
          class="results-empty"
          :description="searched ? t('mods.noResults') : t('mods.searchPlaceholder')"
        />
      </NSpin>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import {
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NInput,
  NInputGroup,
  NList,
  NListItem,
  NSpace,
  NSpin,
  NTag,
  NThing,
} from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import PageHeader from '@/components/layout/PageHeader.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import type { ModSearchItem } from '@/types/api'
import { formatErrors, v } from '@/utils/validate'

const { t } = useI18n()
const message = useGlassMessage()
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })
const query = ref('')
const searched = ref(false)
const results = ref<ModSearchItem[]>([])
const querySchema = v.string().min(1, t('mods.queryRequired')).max(100, t('mods.queryTooLong'))

async function handleSearch() {
  const trimmed = query.value.trim()
  const validated = querySchema.safeParse(trimmed)
  if (!validated.success) {
    message.error(formatErrors(validated.errors))
    return
  }

  searched.value = true
  const response = await run(async () => backend.command('search_mods', { query: trimmed }))
  results.value = response?.success && response.data ? response.data : []
}

async function handleInstall(_mod: ModSearchItem) {
  message.info('下载功能开发中...')
}
</script>

<style scoped src="@/styles/views/OnlineMods.css"></style>
