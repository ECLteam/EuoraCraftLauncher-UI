<template>
  <div class="dev-page">
    <div class="dev-header">
      <div>
        <h1>{{ t('dev.title') }}</h1>
        <p class="desc">{{ t('dev.desc') }}</p>
      </div>
      <div class="dev-actions">
        <UiButton variant="primary" size="sm" @click="$router.push('/')">
          {{ t('common.close') }}
        </UiButton>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.modal') }}</h2>
      <div class="btn-group">
        <UiButton @click="showNormalModal = true">{{ t('dev.normalModal') }}</UiButton>
        <UiButton @click="showFullscreenModal = true">{{ t('dev.fullscreenModal') }}</UiButton>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.button') }}</h2>
      <div class="btn-group">
        <UiButton variant="primary">Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="outline">Outline</UiButton>
        <UiButton variant="text">Text</UiButton>
        <UiButton :loading="true">Loading</UiButton>
        <UiButton :disabled="true">Disabled</UiButton>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.input') }}</h2>
      <div class="input-group">
        <UiInput v-model="inputValue" :placeholder="t('dev.normalInput')" />
        <UiInput v-model="inputValue" :placeholder="t('dev.withIcon')" icon="icon-search" />
        <UiInput v-model="inputValue" :placeholder="t('dev.clearable')" clearable />
        <UiInput v-model="inputValue" :placeholder="t('dev.password')" type="password" />
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.card') }}</h2>
      <div class="card-group">
        <UiCard :title="t('dev.normalCard')" icon="icon-cube">
          {{ t('dev.cardContent') }}
        </UiCard>
        <UiCard :title="t('dev.noIcon')">
          {{ t('dev.noIconCard') }}
        </UiCard>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('dev.message') }}</h2>
      <div class="btn-group">
        <UiButton @click="showMsg('info')">Info</UiButton>
        <UiButton @click="showMsg('success')">Success</UiButton>
        <UiButton @click="showMsg('warning')">Warning</UiButton>
        <UiButton @click="showMsg('error')">Error</UiButton>
      </div>
    </div>

    <!-- 普通弹窗 -->
    <ContentModal
      v-model:visible="showNormalModal"
      :title="t('dev.normalModalTest')"
    >
      <p>{{ t('dev.normalModalDesc') }}</p>
      <template #footer>
        <UiButton variant="secondary" @click="showNormalModal = false">{{ t('common.close') }}</UiButton>
        <UiButton variant="primary">{{ t('common.confirm') }}</UiButton>
      </template>
    </ContentModal>

    <!-- 全屏弹窗 -->
    <ContentModal
      v-model:visible="showFullscreenModal"
      :title="t('dev.fullscreenModalTest')"
      fullscreen
    >
      <div class="fullscreen-content">
        <p>{{ t('dev.fullscreenModalDesc') }}</p>
        <UiButton @click="showNestedModal = true">{{ t('dev.openNested') }}</UiButton>
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="showFullscreenModal = false">{{ t('common.close') }}</UiButton>
      </template>
    </ContentModal>

    <!-- 嵌套弹窗 -->
    <ContentModal
      v-model:visible="showNestedModal"
      :title="t('dev.nestedModal')"
    >
      <p>{{ t('dev.nestedModalDesc') }}</p>
      <template #footer>
        <UiButton @click="showNestedModal = false">{{ t('common.close') }}</UiButton>
      </template>
    </ContentModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useRouter } from 'vue-router'
import UiButton from '@/components/ui/Button.vue'
import UiInput from '@/components/ui/Input.vue'
import UiCard from '@/components/ui/Card.vue'
import ContentModal from '@/components/modals/ContentModal.vue'

const { t } = useI18n()
const message = useGlassMessage()
const router = useRouter()

const showNormalModal = ref(false)
const showFullscreenModal = ref(false)
const showNestedModal = ref(false)
const inputValue = ref('')
const isDevMode = ref(false)

const showMsg = (type: 'info' | 'success' | 'warning' | 'error') => {
  const messages: Record<string, string> = {
    info: t('common.info'),
    success: t('common.success'),
    warning: t('common.warning'),
    error: t('common.error')
  }
  message[type](messages[type])
}
</script>

<style scoped src="@/styles/DevTools.css"></style>
