import { create as createNaiveUI } from 'naive-ui'
import { createApp } from 'vue'
import { pinia } from '@/app/stores'
import App from '@/App.vue'
import { initTheme } from '@/composables/useTheme'
import { i18n, getCurrentLocale, loadLocaleFromBackend } from '@/i18n'
import router from '@/router'
import UiIcon from './components/ui/Icon.vue'
// Font Awesome 图标字体（本地 vendored 资源，离线可用）
// fontawesome.css 提供图标定义，regular.css / solid.css 提供对应风格字体
import '@/assets/vendor/fontawesome/css/fontawesome.min.css'
import '@/assets/vendor/fontawesome/css/regular.min.css'
import '@/assets/vendor/fontawesome/css/solid.min.css'
import '@/styles/main.css'

// 快速初始化主题（从本地存储），避免白屏闪烁
// 后端配置将在 App.vue 挂载后加载并覆盖
initTheme()
document.documentElement.setAttribute('lang', getCurrentLocale())

// 尝试从后端加载语言配置（非阻塞）
loadLocaleFromBackend().catch(() => {})

const naive = createNaiveUI()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(naive)
app.use(i18n)
app.component('UiIcon', UiIcon)
app.mount('#app')
