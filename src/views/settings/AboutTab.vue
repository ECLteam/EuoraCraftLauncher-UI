<template>
  <div class="about-pane">
    <!-- 关于 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.about') }}</div>
      <div class="card-body">
        <div class="launcher-summary">
          <div class="launcher-summary__logo-cell">
            <img src="/favicon.ico" alt="EuoraCraft" class="launcher-summary__logo" />
          </div>
          <div class="launcher-summary__content">
            <div class="launcher-summary__name">
              EuoraCraft Launcher
              <span v-if="isDevMode" class="about-mode-badge about-mode-badge--dev" title="开发模式：Vite 开发构建">
                DEV
              </span>
            </div>
            <div v-if="versionText" class="launcher-summary__version">
              {{ versionText }}
            </div>
          </div>
          <div class="launcher-summary__action">
            <a class="about-btn" href="#" @click.prevent="openExternalUrl(URLS.issues)">
              <UiIcon name="bug" :size="14" />
              <span>{{ t('settings.aboutTab.actions.issue') }}</span>
            </a>
            <a class="about-btn" href="#" @click.prevent="openExternalUrl(URLS.githubOrg)">
              <UiIcon name="github" :size="14" />
              <span>{{ t('settings.aboutTab.actions.github') }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ECLTeam -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.sections.team') }}</div>
      <div class="card-body">
        <AboutEntryRow v-for="member in teamMembers" :key="member.id" :entry="member" />
      </div>
    </div>

    <!-- 特别鸣谢 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.sections.specialThanks') }}</div>
      <div class="card-body">
        <AboutEntryRow v-for="entry in specialThanksEntries" :key="entry.id" :entry="entry" :licenseText="licenseById[entry.id]?.text" :licenseUrl="licenseById[entry.id]?.license" />
      </div>
    </div>

    <!-- 技术栈 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.sections.technologyStack') }}</div>
      <div class="card-body">
        <div v-for="category in technologyCategories" :key="category.id" class="technology-category">
          <button class="technology-category__toggle" @click="toggleTechnologyCategory(category.id)">
            <span class="technology-category__name">
              {{ t(`settings.aboutTab.technologyCategories.${category.titleKey}`) }}
            </span>
            <span class="technology-category__summary">
              <span class="technology-category__count">{{ category.entries.length }}</span>
              <UiIcon :name="isTechnologyCategoryExpanded(category.id) ? 'chevron-up' : 'chevron-down'" :size="14" />
            </span>
          </button>
          <Transition name="technology-expand">
            <div v-if="isTechnologyCategoryExpanded(category.id)" class="technology-category__entries">
              <AboutEntryRow v-for="entry in category.entries" :key="entry.id" :entry="entry" :licenseText="licenseById[entry.id]?.text" :licenseUrl="licenseById[entry.id]?.license" />
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 法律信息 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.sections.legal') }}</div>
      <div class="card-body">
        <p class="legal-text">
          Copyright &copy; 2026 ECLTeam. All Rights Reserved.<br />
          {{ t('settings.aboutTab.legal.disclaimer') }}<br />
          {{ t('settings.aboutTab.legal.trademark') }}
        </p>
        <div class="legal-btns">
          <a class="about-btn highlight" href="#" @click.prevent="openExternalUrl(URLS.githubOrg)">
            <UiIcon name="github" :size="14" />
            <span>{{ t('settings.aboutTab.actions.openSource') }}</span>
          </a>
        </div>
      </div>
    </div>

    <PluginSlotHost slotId="plugin-slot-settings-about-bottom" class="plugin-slot-container" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppRuntimeMode } from '@/app/runtime/mode'
import AboutEntryRow from '@/components/settings/AboutEntryRow.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { URLS } from '@/config/urls'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import { specialThanksEntries, teamMembers, technologyCategories } from '@/features/settings/about/aboutContent'
import { aboutApi } from '@/features/settings/api/aboutApi'
import type { LauncherInfo } from '@/types/system'
import { openExternalUrl } from '@/utils/openExternal'

const { t } = useI18n()

const launcherVersion = inject<Readonly<Ref<string>>>('launcherVersion')
const launcherVersionType = inject<Readonly<Ref<'dev' | 'beta' | 'release'>>>('launcherVersionType')
const runtimeMode = inject<AppRuntimeMode>('runtimeMode', 'browser')
const launcherInfo = ref<LauncherInfo | null>(null)
const frontendVersion = import.meta.env.VITE_APP_VERSION?.trim() || ''
const isDevMode = import.meta.env.DEV
const translateVersion = (key: string): string => t(`settings.aboutTab.version.${key}`)

const versionText = computed(() => {
  if (runtimeMode === 'showcase') {
    return frontendVersion
      ? `${translateVersion('demoMode')} · ${translateVersion('frontendLabel')} v${frontendVersion}`
      : translateVersion('demoMode')
  }

  // 开发/浏览器模式后端无启动器版本时退回前端包版本，保证 DEV 徽标旁始终有版本号
  const version = launcherInfo.value?.version || launcherVersion?.value || frontendVersion
  const versionType = launcherInfo.value?.version_type || launcherVersionType?.value
  if (!version) return ''
  const status = versionType && versionType !== 'release' ? translateVersion(`types.${versionType}`) : ''
  const base = `${translateVersion('label')}：v${version}${versionType && versionType !== 'release' ? `-${versionType}` : ''}`
  return status ? `${base} · ${status}` : base
})

onMounted(async () => {
  launcherInfo.value = await aboutApi.getLauncherInfo()
})

// 技术栈分类默认全部收起：避免默认展开的"后端运行依赖"等把卡片撑成超出视口的大块，与下拉/折叠式行设计一致
const expandedTechnologyCategoryIds = ref<Set<string>>(new Set())

function isTechnologyCategoryExpanded(categoryId: string): boolean {
  return expandedTechnologyCategoryIds.value.has(categoryId)
}

function toggleTechnologyCategory(categoryId: string): void {
  const nextIds = new Set(expandedTechnologyCategoryIds.value)
  if (nextIds.has(categoryId)) nextIds.delete(categoryId)
  else nextIds.add(categoryId)
  expandedTechnologyCategoryIds.value = nextIds
}

interface LicenseEntry {
  name: string
  text: string
  repo: string
  license: string
}

const licenseEntries: LicenseEntry[] = [
  {
    name: 'PyTauri',
    text: 'Copyright WSH032. Licensed under Apache 2.0.',
    repo: URLS.pytauri.repo,
    license: URLS.pytauri.license,
  },
  {
    name: 'Vue 3',
    text: 'Copyright Evan You. Licensed under MIT.',
    repo: URLS.vue.repo,
    license: URLS.vue.license,
  },
  {
    name: 'Vite',
    text: 'Copyright Evan You & Vite Contributors. Licensed under MIT.',
    repo: URLS.vite.repo,
    license: URLS.vite.license,
  },
  {
    name: 'Tauri',
    text: 'Copyright Tauri Programme within The Commons Conservancy. Licensed under MIT / Apache 2.0.',
    repo: URLS.tauri.repo,
    license: URLS.tauri.license,
  },
  {
    name: 'Naive UI',
    text: 'Copyright 07akioni. Licensed under MIT.',
    repo: URLS.naiveUi.repo,
    license: URLS.naiveUi.license,
  },
  {
    name: 'Tailwind CSS',
    text: 'Copyright Tailwind Labs. Licensed under MIT.',
    repo: URLS.tailwind.repo,
    license: URLS.tailwind.license,
  },
  {
    name: 'Pinia',
    text: 'Copyright Eduardo San Martin Morote. Licensed under MIT.',
    repo: URLS.pinia.repo,
    license: URLS.pinia.license,
  },
  {
    name: 'Vue Router',
    text: 'Copyright Evan You. Licensed under MIT.',
    repo: URLS.vueRouter.repo,
    license: URLS.vueRouter.license,
  },
  {
    name: 'Vue I18n',
    text: 'Copyright kazuya kawaguchi. Licensed under MIT.',
    repo: URLS.vueI18n.repo,
    license: URLS.vueI18n.license,
  },
  {
    name: 'VueUse',
    text: 'Copyright Anthony Fu. Licensed under MIT.',
    repo: URLS.vueUse.repo,
    license: URLS.vueUse.license,
  },
  {
    name: 'Valibot',
    text: 'Copyright Fabian Hiller. Licensed under MIT.',
    repo: URLS.valibot.repo,
    license: URLS.valibot.license,
  },
  {
    name: 'TypeScript',
    text: 'Copyright Microsoft Corporation. Licensed under Apache 2.0.',
    repo: URLS.typescript.repo,
    license: URLS.typescript.license,
  },
  {
    name: 'skinview3d',
    text: 'Copyright bs-community. Licensed under MIT.',
    repo: URLS.skinview3d.repo,
    license: URLS.skinview3d.license,
  },
  {
    name: 'Authlib-Injector',
    text: 'Copyright yushijinhun. Licensed under AGPL-3.0.',
    repo: URLS.authlibInjector.repo,
    license: URLS.authlibInjector.license,
  },
  {
    name: 'EasyTier',
    text: 'Copyright EasyTier Contributors. Licensed under LGPL-3.0.',
    repo: URLS.easyTier.repo,
    license: URLS.easyTier.license,
  },
  {
    name: 'HMCL',
    text: 'Copyright HMCL Contributors. Licensed under GPL-3.0.',
    repo: URLS.hmcl.repo,
    license: URLS.hmcl.license,
  },
]

licenseEntries.push(
  {
    name: 'pytauri-wheel',
    text: 'Copyright WSH032. Licensed under Apache 2.0.',
    repo: URLS.pytauri.repo,
    license: 'https://pypi.org/project/pytauri-wheel/',
  },
  {
    name: 'EasyTier-PyO3',
    text: 'Copyright EasyTier-PyO3 contributors. Licensed under LGPL-3.0.',
    repo: URLS.easyTierPyo3.repo,
    license: URLS.easyTierPyo3.license,
  },
  {
    name: 'sass-embedded',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/sass/embedded-host-node',
    license: 'https://www.npmjs.com/package/sass-embedded',
  },
  {
    name: 'Material Color Utilities',
    text: 'Licensed under Apache 2.0.',
    repo: 'https://github.com/material-foundation/material-color-utilities',
    license: 'https://www.npmjs.com/package/@material/material-color-utilities',
  },
  {
    name: 'Iconify',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/iconify/iconify',
    license: 'https://www.npmjs.com/package/@iconify/vue',
  },
  {
    name: 'DOMPurify',
    text: 'Licensed under MPL-2.0 or Apache-2.0.',
    repo: 'https://github.com/cure53/DOMPurify',
    license: 'https://www.npmjs.com/package/dompurify',
  },
  {
    name: 'Marked',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/markedjs/marked',
    license: 'https://www.npmjs.com/package/marked',
  },
  {
    name: 'Sucrase',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/alangpierce/sucrase',
    license: 'https://www.npmjs.com/package/sucrase',
  },
  {
    name: '@tanstack/vue-query',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/TanStack/query',
    license: 'https://www.npmjs.com/package/@tanstack/vue-query',
  },
)

licenseEntries.push(
  {
    name: '@vitejs/plugin-vue',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/vitejs/vite-plugin-vue',
    license: 'https://www.npmjs.com/package/@vitejs/plugin-vue',
  },
  {
    name: 'Vitest',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/vitest-dev/vitest',
    license: 'https://www.npmjs.com/package/vitest',
  },
  {
    name: '@vue/test-utils',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/vuejs/test-utils',
    license: 'https://www.npmjs.com/package/@vue/test-utils',
  },
  {
    name: 'vue-tsc',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/vuejs/language-tools',
    license: 'https://www.npmjs.com/package/vue-tsc',
  },
  {
    name: 'ESLint',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/eslint/eslint',
    license: 'https://www.npmjs.com/package/eslint',
  },
  {
    name: 'Prettier',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/prettier/prettier',
    license: 'https://www.npmjs.com/package/prettier',
  },
  {
    name: 'PostCSS',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/postcss/postcss',
    license: 'https://www.npmjs.com/package/postcss',
  },
  {
    name: 'Autoprefixer',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/postcss/autoprefixer',
    license: 'https://www.npmjs.com/package/autoprefixer',
  },
  {
    name: 'Ruff',
    text: 'Copyright Ruff contributors. Licensed under MIT.',
    repo: 'https://github.com/astral-sh/ruff',
    license: 'https://pypi.org/project/ruff/',
  },
  {
    name: 'PyInstaller',
    text: 'Licensed under GPL-2.0-or-later with a special exception.',
    repo: 'https://github.com/pyinstaller/pyinstaller',
    license: 'https://pypi.org/project/pyinstaller/',
  },
)

licenseEntries.push(
  {
    name: 'pytest',
    text: 'Copyright pytest contributors. Licensed under MIT.',
    repo: 'https://github.com/pytest-dev/pytest',
    license: 'https://pypi.org/project/pytest/',
  },
  {
    name: 'pytest-asyncio',
    text: 'Licensed under Apache 2.0.',
    repo: 'https://github.com/pytest-dev/pytest-asyncio',
    license: 'https://pypi.org/project/pytest-asyncio/',
  },
  {
    name: 'python-semantic-release',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/python-semantic-release/python-semantic-release',
    license: 'https://pypi.org/project/python-semantic-release/',
  },
  {
    name: 'tomlkit',
    text: 'Licensed under MIT.',
    repo: 'https://github.com/sdispater/tomlkit',
    license: 'https://pypi.org/project/tomlkit/',
  },
  {
    name: 'debugpy',
    text: 'Copyright Microsoft Corporation. Licensed under MIT.',
    repo: 'https://github.com/microsoft/debugpy',
    license: 'https://pypi.org/project/debugpy/',
  },
  {
    name: 'IPython',
    text: 'Copyright IPython Development Team. Licensed under BSD-3-Clause.',
    repo: 'https://github.com/ipython/ipython',
    license: 'https://pypi.org/project/ipython/',
  },
  {
    name: 'pip-tools',
    text: 'Licensed under BSD-3-Clause.',
    repo: 'https://github.com/jazzband/pip-tools',
    license: 'https://pypi.org/project/pip-tools/',
  },
  {
    name: 'Nuitka',
    text: 'Copyright Nuitka contributors. Licensed under AGPL-3.0.',
    repo: 'https://github.com/Nuitka/Nuitka',
    license: 'https://pypi.org/project/Nuitka/',
  },
)

const licenseByName = new Map(licenseEntries.map((entry) => [entry.name, entry]))

const licenseById: Record<string, LicenseEntry> = {
  pytauri: licenseByName.get('PyTauri')!,
  tauri: licenseByName.get('Tauri')!,
  'easy-tier': licenseByName.get('EasyTier')!,
  authlibInjector: licenseByName.get('Authlib-Injector')!,
  vue: licenseByName.get('Vue 3')!,
  vite: licenseByName.get('Vite')!,
  pinia: licenseByName.get('Pinia')!,
  vueRouter: licenseByName.get('Vue Router')!,
  vueI18n: licenseByName.get('Vue I18n')!,
  valibot: licenseByName.get('Valibot')!,
  typescript: licenseByName.get('TypeScript')!,
  naiveUi: licenseByName.get('Naive UI')!,
  tailwind: licenseByName.get('Tailwind CSS')!,
  vueUse: licenseByName.get('VueUse')!,
  skinview3d: licenseByName.get('skinview3d')!,
  hmcl: licenseByName.get('HMCL')!,
  pytauriWheel: licenseByName.get('pytauri-wheel')!,
  easyTierPyo3: licenseByName.get('EasyTier-PyO3')!,
  'sass-embedded': licenseByName.get('sass-embedded')!,
  'material-colors': licenseByName.get('Material Color Utilities')!,
  iconify: licenseByName.get('Iconify')!,
  dompurify: licenseByName.get('DOMPurify')!,
  marked: licenseByName.get('Marked')!,
  sucrase: licenseByName.get('Sucrase')!,
  'tanstack-query': licenseByName.get('@tanstack/vue-query')!,
  'vite-plugin-vue': licenseByName.get('@vitejs/plugin-vue')!,
  vitest: licenseByName.get('Vitest')!,
  'vue-test-utils': licenseByName.get('@vue/test-utils')!,
  'vue-tsc': licenseByName.get('vue-tsc')!,
  eslint: licenseByName.get('ESLint')!,
  prettier: licenseByName.get('Prettier')!,
  postcss: licenseByName.get('PostCSS')!,
  autoprefixer: licenseByName.get('Autoprefixer')!,
  ruff: licenseByName.get('Ruff')!,
  pyinstaller: licenseByName.get('PyInstaller')!,
  pytest: licenseByName.get('pytest')!,
  pytestAsyncio: licenseByName.get('pytest-asyncio')!,
  pythonSemanticRelease: licenseByName.get('python-semantic-release')!,
  tomlkit: licenseByName.get('tomlkit')!,
  debugpy: licenseByName.get('debugpy')!,
  ipython: licenseByName.get('IPython')!,
  pipTools: licenseByName.get('pip-tools')!,
  nuitka: licenseByName.get('Nuitka')!,
}
</script>

<style scoped src="@/styles/views/settings/AboutTab.css"></style>
