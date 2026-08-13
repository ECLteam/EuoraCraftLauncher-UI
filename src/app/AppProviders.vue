<template>
  <NConfigProvider
    :theme="naiveTheme"
    :themeOverrides="themeOverrides"
    :locale="naiveLocale"
    :dateLocale="naiveDateLocale"
  >
    <NDialogProvider>
      <NMessageProvider
        placement="top"
        :duration="4000"
        :max="5"
        closable
        keepAliveOnHover
        containerClass="launcher-message-container"
        :containerStyle="messageContainerStyle"
      >
        <App />
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { dateEnUS, dateZhCN, enUS, NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { computed, type CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'
import App from '@/App.vue'
import { useTheme } from '@/composables/useTheme'

defineOptions({ name: 'AppProviders' })

const { locale } = useI18n()
const { naiveTheme, themeOverrides } = useTheme()

const naiveLocale = computed(() => (locale.value === 'zh-CN' ? zhCN : enUS))
const naiveDateLocale = computed(() => (locale.value === 'zh-CN' ? dateZhCN : dateEnUS))
const messageContainerStyle: CSSProperties = {
  top: 'calc(var(--titlebar-h) + var(--s-sm))',
  right: 'auto',
  left: '50%',
  width: 'min(420px, calc(100vw - 24px))',
  maxWidth: 'calc(100vw - 24px)',
  transform: 'translateX(-50%)',
}
</script>
