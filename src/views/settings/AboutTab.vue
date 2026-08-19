<template>
  <div class="about-pane">
    <!-- 关于 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.about') }}</div>
      <div class="card-body">
        <div class="card-grid">
          <div class="avatar-col">
            <img src="/favicon.ico" alt="EuoraCraft" class="avatar avatar-logo" />
          </div>
          <div class="info-col">
            <div class="item-title">EuoraCraft Launcher</div>
            <div v-if="versionText" class="item-desc">
              {{ versionText }}
            </div>
          </div>
          <div class="btn-col">
            <a class="about-btn" href="#" @click.prevent="openExternalUrl(URLS.githubOrg)">
              <UiIcon name="github" :size="14" />
              <span>{{ t('settings.aboutTab.github') }}</span>
            </a>
          </div>
        </div>

        <!-- 开发者 -->
        <div class="thanks-cat">
          <div class="thanks-cat-title">{{ t('settings.aboutTab.developer') }}</div>
          <div v-for="item in developers" :key="item.name" class="card-grid">
            <div class="avatar-col">
              <img v-if="item.img" :src="item.img" :alt="item.name" class="avatar avatar-thanks avatar-img" />
              <div v-else class="avatar avatar-thanks">
                {{ item.initial }}
              </div>
            </div>
            <div class="info-col">
              <div class="item-title">{{ item.name }}</div>
              <div class="item-desc">{{ t(`settings.aboutTab.desc.${item.descKey}`) }}</div>
            </div>
            <div class="btn-col">
              <a v-if="item.url" class="about-btn" href="#" @click.prevent="openExternalUrl(item.url!)">
                <UiIcon :name="item.icon || 'github'" :size="14" />
                <span>{{ t(`settings.aboutTab.${item.btnKey}`) }}</span>
              </a>
              <span v-else class="item-desc">{{ t(`settings.aboutTab.${item.btnKey}`) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 特别鸣谢分组卡片 -->
    <div v-for="(section, si) in thanksSections" :key="section.titleKey" class="about-card">
      <div class="card-title">{{ t(`settings.aboutTab.${section.titleKey}`) }}</div>
      <div class="card-body">
        <div v-for="(cat, ci) in section.categories" :key="cat.labelKey" class="thanks-cat">
          <button class="thanks-cat-row" @click="toggleCategory(si, ci)">
            <span class="thanks-cat-name">{{ t(`settings.aboutTab.categories.${cat.labelKey}`) }}</span>
            <span class="thanks-cat-right">
              <span class="thanks-badge">{{ cat.items.length }}</span>
              <UiIcon :name="isOpen(si, ci) ? 'chevron-up' : 'chevron-down'" :size="14" />
            </span>
          </button>
          <Transition name="about-expand">
            <div v-if="isOpen(si, ci)" class="thanks-collapse-body">
              <div v-for="item in cat.items" :key="item.name" class="card-grid">
                <div class="avatar-col">
                  <img v-if="item.img" :src="item.img" :alt="item.name" class="avatar avatar-thanks avatar-img" />
                  <div v-else class="avatar avatar-thanks">
                    {{ item.initial }}
                  </div>
                </div>
                <div class="info-col">
                  <div class="item-title">{{ item.name }}</div>
                  <div class="item-desc">{{ t(`settings.aboutTab.desc.${item.descKey}`) }}</div>
                </div>
                <div class="btn-col">
                  <a v-if="item.url" class="about-btn" href="#" @click.prevent="openExternalUrl(item.url!)">
                    <UiIcon :name="item.icon || 'github'" :size="14" />
                    <span>{{ t(`settings.aboutTab.${item.btnKey}`) }}</span>
                  </a>
                  <span v-else class="item-desc">{{ t(`settings.aboutTab.${item.btnKey}`) }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 技术栈 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.technicalStack') }}</div>
      <div class="card-body">
        <div class="tech-stack">
          <div v-for="group in techStack" :key="group.labelKey" class="tech-group">
            <div class="tech-group-label">{{ t(`settings.aboutTab.${group.labelKey}`) }}</div>
            <div class="tech-flow">
              <span v-for="tech in group.items" :key="tech" class="tech-tag">{{ tech }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 许可与版权 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.licenses') }}</div>
      <div class="card-body">
        <div v-for="item in licenses" :key="item.name" class="license-item">
          <div class="license-name">{{ item.name }}</div>
          <div class="license-text">{{ item.text }}</div>
          <div class="license-btns">
            <a class="about-btn" href="#" @click.prevent="openExternalUrl(item.repo)">
              <UiIcon name="github" :size="14" />
              <span>{{ t('settings.aboutTab.source') }}</span>
            </a>
            <a class="about-btn" href="#" @click.prevent="openExternalUrl(item.license)">
              <UiIcon name="file-source" :size="14" />
              <span>{{ t('settings.aboutTab.license') }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 法律信息 -->
    <div class="about-card">
      <div class="card-title">{{ t('settings.aboutTab.legal') }}</div>
      <div class="card-body">
        <p class="legal-text">
          Copyright &copy; 2026 EuoraCraft Team. All Rights Reserved.<br />
          {{ t('settings.aboutTab.legalText1') }}<br />
          {{ t('settings.aboutTab.legalText2') }}
        </p>
        <div class="legal-btns">
          <a class="about-btn highlight" href="#" @click.prevent="openExternalUrl(URLS.githubOrg)">
            <UiIcon name="github" :size="14" />
            <span>{{ t('settings.aboutTab.openSource') }}</span>
          </a>
        </div>
      </div>
    </div>

    <div id="plugin-slot-settings-about-bottom" class="plugin-slot-container"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppRuntimeMode } from '@/app/runtime/mode'
import UiIcon from '@/components/ui/Icon.vue'
import { URLS } from '@/config/urls'
import { aboutApi } from '@/features/settings/api/aboutApi'
import type { LauncherInfo } from '@/types/api'
import { openExternalUrl } from '@/utils/openExternal'

const { t } = useI18n()

const launcherVersion = inject<Readonly<Ref<string>>>('launcherVersion')
const launcherVersionType = inject<Readonly<Ref<'dev' | 'beta' | 'release'>>>('launcherVersionType')
const runtimeMode = inject<AppRuntimeMode>('runtimeMode', 'browser')
const launcherInfo = ref<LauncherInfo | null>(null)
const frontendVersion = import.meta.env.VITE_APP_VERSION?.trim() || ''

const versionText = computed(() => {
  const tAbout = (key: string) => t(`settings.aboutTab.${key}`)
  if (runtimeMode === 'showcase') {
    return frontendVersion
      ? `${tAbout('demoMode')} · ${tAbout('frontendVersion')} v${frontendVersion}`
      : tAbout('demoMode')
  }
  if (runtimeMode !== 'desktop') return ''

  const version = launcherInfo.value?.version || launcherVersion?.value
  const versionType = launcherInfo.value?.version_type || launcherVersionType?.value
  if (!version) return ''
  const status = versionType && versionType !== 'release' ? tAbout(`versionType.${versionType}`) : ''
  const base = `${tAbout('versionLabel')}：v${version}${versionType && versionType !== 'release' ? `-${versionType}` : ''}`
  return status ? `${base} · ${status}` : base
})

onMounted(async () => {
  launcherInfo.value = await aboutApi.getLauncherInfo()
})

// ---- 折叠状态 ----
const openCats = ref<Record<string, boolean>>({
  '0-0': true,
  '0-1': true,
})

function isOpen(si: number, ci: number): boolean {
  return !!openCats.value[`${si}-${ci}`]
}

function toggleCategory(si: number, ci: number): void {
  const key = `${si}-${ci}`
  openCats.value = { ...openCats.value, [key]: !openCats.value[key] }
}

// ---- 鸣谢数据 ----

interface ThanksItem {
  name: string
  initial: string
  descKey: string
  url?: string
  /** 对应 settings.aboutTab 下的翻译键（github / website / mirror） */
  btnKey: string
  img?: string
  /** UiIcon 名称，默认 github */
  icon?: string
}

const imgPath = (name: string) => `/img/avatars/${name}`

// 开发者
const developers: ThanksItem[] = [
  {
    name: 'AEBC08',
    initial: 'A',
    descKey: 'aebc08',
    url: 'https://github.com/AEBC08',
    btnKey: 'github',
    img: imgPath('AEBC08.png'),
  },
  {
    name: 'Wuchang325',
    initial: 'W',
    descKey: 'wuchang325',
    url: 'https://github.com/Wuchang325',
    btnKey: 'github',
    img: imgPath('Wuchang325.png'),
  },
  {
    name: 'RATE',
    initial: 'R',
    descKey: 'e2662020',
    url: 'https://github.com/e2662020',
    btnKey: 'github',
    img: imgPath('RATE.png'),
  },
  {
    name: 'YC酱luyancib',
    initial: 'L',
    descKey: 'luyanci',
    url: 'https://github.com/Luyanci',
    btnKey: 'github',
    img: imgPath('luyanci.png'),
  },
]

// 核心开源项目（直接展示）
const coreProjects: ThanksItem[] = [
  {
    name: 'PyTauri',
    initial: 'PT',
    descKey: 'pytauri',
    url: URLS.pytauri.repo,
    btnKey: 'github',
    img: imgPath('pytauri.png'),
  },
  {
    name: 'Vue 3',
    initial: 'V',
    descKey: 'vue3',
    url: URLS.vue.repo,
    btnKey: 'github',
  },
  {
    name: 'Tauri',
    initial: 'T',
    descKey: 'tauri',
    url: URLS.tauri.repo,
    btnKey: 'github',
  },
  {
    name: 'Vite',
    initial: 'V',
    descKey: 'vite',
    url: URLS.vite.repo,
    btnKey: 'github',
  },
  {
    name: 'Naive UI',
    initial: 'N',
    descKey: 'naiveUi',
    url: URLS.naiveUI.repo,
    btnKey: 'github',
  },
  {
    name: 'Tailwind CSS',
    initial: 'T',
    descKey: 'tailwind',
    url: URLS.tailwind.repo,
    btnKey: 'github',
  },
  {
    name: 'Authlib-Injector',
    initial: 'AI',
    descKey: 'authlib',
    url: URLS.authlibInjector.repo,
    btnKey: 'github',
  },
  {
    name: 'EasyTier',
    initial: 'ET',
    descKey: 'easyTier',
    url: URLS.easyTier.repo,
    btnKey: 'github',
  },
]

// 其他依赖（折叠展示）
const moreProjects: ThanksItem[] = [
  {
    name: 'Pinia',
    initial: 'P',
    descKey: 'pinia',
    url: URLS.pinia.repo,
    btnKey: 'github',
  },
  {
    name: 'Vue Router',
    initial: 'R',
    descKey: 'vueRouter',
    url: URLS.vueRouter.repo,
    btnKey: 'github',
  },
  {
    name: 'Vue I18n',
    initial: 'I',
    descKey: 'vueI18n',
    url: URLS.vueI18n.repo,
    btnKey: 'github',
  },
  {
    name: 'VueUse',
    initial: 'U',
    descKey: 'vueUse',
    url: URLS.vueUse.repo,
    btnKey: 'github',
  },
  {
    name: 'GSAP',
    initial: 'G',
    descKey: 'gsap',
    url: URLS.gsap.repo,
    btnKey: 'github',
  },
  {
    name: 'Valibot',
    initial: 'V',
    descKey: 'valibot',
    url: URLS.valibot.repo,
    btnKey: 'github',
  },
  {
    name: 'TypeScript',
    initial: 'TS',
    descKey: 'typescript',
    url: URLS.typescript.repo,
    btnKey: 'github',
  },
  {
    name: 'skinview3d',
    initial: 'S',
    descKey: 'skinview3d',
    url: URLS.skinview3d.repo,
    btnKey: 'github',
  },
]

// 服务与社区
const services: ThanksItem[] = [
  {
    name: 'bangbang93',
    initial: 'BB',
    descKey: 'bangbang93',
    url: URLS.bmclapi,
    btnKey: 'mirror',
    icon: 'search-engine',
    img: imgPath('bangbang93.png'),
  },
  {
    name: 'Modrinth',
    initial: 'M',
    descKey: 'modrinth',
    url: URLS.modrinth,
    btnKey: 'website',
    icon: 'external-site',
    img: imgPath('modrinth.svg'),
  },
  {
    name: 'CurseForge',
    initial: 'C',
    descKey: 'curseforge',
    url: URLS.curseforge,
    btnKey: 'website',
    icon: 'external-site',
    img: imgPath('curseforge.png'),
  },
  {
    name: 'MCMOD百科',
    initial: 'MC',
    descKey: 'mcmod',
    url: URLS.mcmod,
    btnKey: 'website',
    icon: 'external-site',
    img: imgPath('mcmod.png'),
  },
]

// 学习参考项目
const refProjects: ThanksItem[] = [
  {
    name: 'HMCL',
    initial: 'H',
    descKey: 'hmcl',
    url: URLS.hmcl.repo,
    btnKey: 'github',
    img: imgPath('HMCL.png'),
  },
  {
    name: 'Scaffolding-MC',
    initial: 'S',
    descKey: 'scaffolding',
    url: URLS.scaffoldingMC.repo,
    btnKey: 'github',
    img: imgPath('Scaffolding-MC.png'),
  },
]

// ---- 特别鸣谢分组 ----

interface ThanksCategory {
  labelKey: string
  items: ThanksItem[]
}

interface ThanksSection {
  titleKey: string
  categories: ThanksCategory[]
}

const thanksSections: ThanksSection[] = [
  {
    titleKey: 'backendDeps',
    categories: [
      {
        labelKey: 'runtime',
        items: [coreProjects[0]!, coreProjects[2]!, coreProjects[7]!], // PyTauri, Tauri, EasyTier
      },
      {
        labelKey: 'accountAuth',
        items: [coreProjects[6]!], // Authlib-Injector
      },
    ],
  },
  {
    titleKey: 'frontendDeps',
    categories: [
      {
        labelKey: 'coreFramework',
        items: [
          coreProjects[1]!, // Vue 3
          coreProjects[3]!, // Vite
          moreProjects[0]!, // Pinia
          moreProjects[1]!, // Vue Router
          moreProjects[2]!, // Vue I18n
          moreProjects[5]!, // Valibot
          moreProjects[6]!, // TypeScript
        ],
      },
      {
        labelKey: 'uiComponents',
        items: [coreProjects[4]!, coreProjects[5]!], // Naive UI, Tailwind CSS
      },
      {
        labelKey: 'toolsAnim',
        items: [moreProjects[3]!, moreProjects[4]!], // VueUse, GSAP
      },
      {
        labelKey: 'renderDisplay',
        items: [moreProjects[7]!], // skinview3d
      },
    ],
  },
  {
    titleKey: 'services',
    categories: [
      {
        labelKey: 'mirrors',
        items: services,
      },
    ],
  },
  {
    titleKey: 'reference',
    categories: [
      {
        labelKey: 'referenceProject',
        items: refProjects,
      },
    ],
  },
]

const techStack = [
  {
    labelKey: 'frontend',
    items: [
      'Vue 3',
      'TypeScript',
      'Vite',
      'Pinia',
      'Vue Router',
      'Vue I18n',
      'Naive UI',
      'VueUse',
      'GSAP',
      'Font Awesome 6',
      'Valibot',
      'Tailwind CSS',
    ],
  },
  {
    labelKey: 'backendDesktop',
    items: [
      'Python 3.11+',
      'PyTauri 0.8',
      'Tauri 2',
      'AnyIO',
      'HTTPX',
      'Requests',
      'Pydantic 2',
      'Cryptography',
      'Keyring',
      'MSAL',
      'Pillow',
      'psutil',
    ],
  },
  {
    labelKey: 'engineering',
    items: ['Vitest', 'ESLint', 'Prettier', 'PostCSS', 'Autoprefixer', 'Ruff', 'PyInstaller'],
  },
]

interface LicenseItem {
  name: string
  text: string
  repo: string
  license: string
}

const licenses: LicenseItem[] = [
  {
    name: 'PyTauri',
    text: 'Copyright WSH032. Licensed under MIT.',
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
    repo: URLS.naiveUI.repo,
    license: URLS.naiveUI.license,
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
    name: 'GSAP',
    text: 'Copyright GreenSock. Licensed under Standard "No Charge" License.',
    repo: URLS.gsap.repo,
    license: URLS.gsap.license,
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
    text: 'Copyright EasyTier Contributors. Licensed under Apache 2.0.',
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
</script>

<style scoped src="@/styles/views/settings/AboutTab.css"></style>
