<template>
  <div class="online-mods-page">
    <div class="search-header">
      <div class="search-bar">
        <UiIcon name="search" :size="16" class="search-icon" />
        <input
          v-model="query"
          type="text"
          :placeholder="t('mods.searchPlaceholder')"
          class="search-input"
          @keydown.enter="handleSearch"
        />
      </div>
      <n-button type="primary" size="small" @click="handleSearch" :loading="loading">
        {{ t('mods.search') }}
      </n-button>
    </div>

    <div v-if="loading" class="loading-state">
      <n-spin size="medium" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="results.length === 0 && searched" class="empty-state">
      <UiIcon name="search" :size="48" class="empty-icon" />
      <p class="empty-text">{{ t('mods.noResults') }}</p>
    </div>

    <div v-else-if="results.length > 0" class="results-list">
      <div v-for="mod in results" :key="mod.id" class="mod-result-item">
        <div class="mod-icon">
          <img v-if="mod.icon_url" :src="mod.icon_url" alt="" />
          <UiIcon v-else name="cube" :size="20" />
        </div>
        <div class="mod-info">
          <div class="mod-name">{{ mod.title }}</div>
          <div class="mod-desc">{{ mod.description }}</div>
          <div class="mod-meta">
            <span class="mod-source">{{ mod.source === 'modrinth' ? 'Modrinth' : 'CurseForge' }}</span>
            <span class="mod-downloads">{{ mod.downloads?.toLocaleString() }} {{ t('mods.downloads') }}</span>
          </div>
        </div>
        <div class="mod-actions">
          <n-button size="tiny" type="primary" @click="handleInstall(mod)">
            {{ t('mods.install') }}
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NSpin } from 'naive-ui'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { v, formatErrors } from '@/utils/validate'
import backend from '@/api/client'

const { t } = useI18n()
const message = useGlassMessage()
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })
const query = ref('')
const searched = ref(false)
const results = ref<any[]>([])

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

async function handleInstall(mod: any) {
  message.info('下载功能开发中...')
}
</script>

<style scoped>
.online-mods-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--s-lg);
}

.search-header {
  display: flex;
  align-items: center;
  gap: var(--s-md);
  margin-bottom: var(--s-lg);
  flex-shrink: 0;
}

.search-bar {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: var(--text-tertiary);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 29px;
  padding: 0 14px 0 32px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms ease-out;
}

.search-input::placeholder { color: var(--text-tertiary); }
.search-input:focus { border-color: var(--border-active); }

.results-list {
  flex: 1;
  overflow-y: auto;
}

.mod-result-item {
  display: flex;
  align-items: center;
  min-height: 58px;
  padding: 9px 11px;
  gap: 11px;
  border-radius: var(--r-sm);
  transition: background 150ms ease-out;
}

.mod-result-item:hover { background: var(--bg-hover); }
.mod-result-item + .mod-result-item { margin-top: 2px; }

.mod-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
  background: var(--primary-alpha);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  overflow: hidden;
  flex-shrink: 0;
}

.mod-icon img { width: 100%; height: 100%; object-fit: cover; }

.mod-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mod-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mod-desc {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mod-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: var(--text-tertiary);
}

.mod-source {
  padding: 0 5px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
  font-weight: 500;
}

.mod-actions { flex-shrink: 0; }

.loading-state, .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-md);
  color: var(--text-secondary);
}

.empty-icon { color: var(--text-tertiary); }
.empty-text { font-size: 13px; margin: 0; }
</style>