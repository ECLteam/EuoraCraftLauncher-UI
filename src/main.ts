import { createApp } from 'vue'
import { create as createNaiveUI } from 'naive-ui'
import router from '@/router'
import App from '@/App.vue'
import { initTheme } from '@/composables/useTheme'
import { i18n, getCurrentLocale } from '@/i18n'
import UiIcon from './components/ui/Icon.vue'
import '@/styles/base/main.css'

// 快速初始化主题（从本地存储），避免白屏闪烁
// 后端配置将在 App.vue 挂载后加载并覆盖
initTheme()
document.documentElement.setAttribute('lang', getCurrentLocale())

const naive = createNaiveUI()
const app = createApp(App)
app.use(router)
app.use(naive)
app.use(i18n)
app.component('UiIcon', UiIcon)
app.mount('#app')