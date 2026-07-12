<template>
  <div class="online-mods-page">
    <div class="search-header">
      <div class="search-bar">
        <UiIcon
          name="search"
          :size="16"
          class="search-icon"
        />
        <input
          v-model="query"
          type="text"
          :placeholder="t('mods.searchPlaceholder')"
          class="search-input"
          @keydown.enter="handleSearch"
        >
      </div>
      <NButton
        type="primary"
        size="small"
        :loading="loading"
        @click="handleSearch"
      >
        {{ t('mods.search') }}
      </NButton>
    </div>

    <div
      v-if="loading"
      class="loading-state"
    >
      <NSpin size="medium" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <div
      v-else-if="results.length === 0 && searched"
      class="empty-state"
    >
      <UiIcon
        name="search"
        :size="48"
        class="empty-icon"
      />
      <p class="empty-text">
        {{ t('mods.noResults') }}
      </p>
    </div>

    <div
      v-else-if="results.length > 0"
      class="results-list"
    >
      <div
        v-for="mod in results"
        :key="mod.id"
        class="mod-result-item"
      >
        <div class="mod-icon">
          <img
            v-if="mod.icon_url"
            :src="mod.icon_url"
            alt=""
          >
          <UiIcon
            v-else
            name="cube"
            :size="20"
          />
        </div>
        <div class="mod-info">
          <div class="mod-name">
            {{ mod.title }}
          </div>
          <div class="mod-desc">
            {{ mod.description }}
          </div>
          <div class="mod-meta">
            <span class="mod-source">{{ mod.source === 'modrinth' ? 'Modrinth' : 'CurseForge' }}</span>
            <span class="mod-downloads">{{ mod.downloads?.toLocaleString() }} {{ t('mods.downloads') }}</span>
          </div>
        </div>
        <div class="mod-actions">
          <NButton
            size="tiny"
            type="primary"
            @click="handleInstall(mod)"
          >
            {{ t('mods.install') }}
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSpin } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { v, formatErrors } from '@/utils/validate'
import type { ModSearchItem } from '@/types/api'

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
  const res = await run(async () => backend.command('search_mods', { query: trimmed }))
  if (res?.success && res.data) {
    results.value = res.data
  } else {
    results.value = []
  }
}

async function handleInstall(_mod: ModSearchItem) {
  message.info('下载功能开发中...')
}
</script>

<style scoped src="@/styles/OnlineMods.css"></style>
