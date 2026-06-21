<template>
  <div class="tab-pane">
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 class="toolbar-title">
          <UiIcon name="cube" />
          {{ t('versions.mods.title') }}
        </h3>
      </div>
      <div class="toolbar-right">
        <UiInput
          v-model="searchQuery"
          :placeholder="t('versions.mods.searchPlaceholder')"
          icon="icon-search"
          clearable
          class="search-input"
        />
        <UiButton variant="primary" size="sm" icon="icon-add" @click="addMod">
          {{ t('versions.mods.addMod') }}
        </UiButton>
      </div>
    </div>

    <div class="panel" style="flex: 1; overflow: hidden;">
      <div v-if="loading" class="loading-container">
        <UiIcon name="spinner" class="spin" style="font-size: 32px;" />
        <p>{{ t('common.loading') }}</p>
      </div>
      
      <div v-else-if="filteredMods.length === 0" class="empty-state">
        <UiIcon name="cube" />
        <p>{{ t('versions.mods.noMods') }}</p>
        <UiButton variant="secondary" size="sm" @click="addMod">{{ t('versions.mods.addOne') }}</UiButton>
      </div>
      
      <div v-else class="mods-grid" ref="gridRef">
        <div
          v-for="mod in filteredMods"
          :key="mod.id"
          class="mod-card"
          @click="showModDetails(mod)"
        >
          <div class="mod-content-wrapper">
            <div class="mod-icon">
              <img v-if="mod.icon" :src="mod.icon" :alt="mod.name" />
              <UiIcon v-else name="cube" />
            </div>
            <div class="mod-info">
              <div class="mod-header">
                <h4 class="mod-name">{{ mod.name }}</h4>
                <UiSwitch v-model="mod.enabled" size="sm" @click.stop />
              </div>
              <p class="mod-desc" :title="mod.description">{{ mod.description }}</p>
              <div class="mod-meta">
                <span class="mod-version">{{ mod.version }}</span>
                <span class="mod-author">by {{ mod.author }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import gsap from 'gsap'
import UiButton from '@/components/ui/Button.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSwitch from '@/components/ui/Switch.vue'

interface Mod {
  id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
  icon?: string
}

const { t } = useI18n()
const message = useGlassMessage()
const gridRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const searchQuery = ref('')

const mods = ref<Mod[]>([
  {
    id: 'jei',
    name: 'Just Enough Items',
    description: '查看物品合成表和用途的基础模组。',
    version: '11.6.0',
    author: 'mezz',
    enabled: true
  },
])

const filteredMods = computed(() => {
  if (!searchQuery.value) return mods.value
  const query = searchQuery.value.toLowerCase()
  return mods.value.filter(mod => 
    mod.name.toLowerCase().includes(query) || 
    mod.description.toLowerCase().includes(query)
  )
})

const addMod = () => {
  message.info(t('versions.mods.addModPending'))
}

const showModDetails = (mod: Mod) => {
  message.info(t('versions.mods.viewDetails', { name: mod.name }))
}

onMounted(() => {
  nextTick(() => {
    if (gridRef.value) {
      gsap.fromTo(gridRef.value.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      )
    }
  })
})
</script>
<style scoped src="@/styles/ModsTab.css"></style>
