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
        <component :is="rootComponent" />
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
import ThemeStudioWindow from '@/features/themes/components/ThemeStudioWindow.vue'
import { windowContext } from '@/features/windows/model/windowContext'
import PluginWindowShell from '@/features/windows/PluginWindowShell.vue'

defineOptions({ name: 'AppProviders' })

const { locale } = useI18n()
const { naiveTheme, themeOverrides } = useTheme()
const rootComponent =
  windowContext.type === 'theme-studio' ? ThemeStudioWindow : windowContext.type === 'plugin' ? PluginWindowShell : App

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
