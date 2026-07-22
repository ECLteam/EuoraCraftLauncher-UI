<template>
  <div class="about-pane">
    <!-- 关于 -->
    <div class="about-card">
      <div class="card-title">
        关于
      </div>
      <div class="card-body">
        <div class="card-grid">
          <div class="avatar-col">
            <img
              src="/favicon.ico"
              alt="EuoraCraft"
              class="avatar avatar-logo"
            >
          </div>
          <div class="info-col">
            <div class="item-title">
              EuoraCraft Launcher
            </div>
            <div class="item-desc">
              {{ versionText }}
            </div>
          </div>
          <div class="btn-col">
            <a
              class="about-btn"
              :href="URLS.githubOrg"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 特别鸣谢 -->
    <div class="about-card">
      <div class="card-title">
        特别鸣谢
      </div>
      <div class="card-body">
        <div
          v-for="item in thanks"
          :key="item.name"
          class="card-grid"
        >
          <div class="avatar-col">
            <div class="avatar avatar-thanks">
              {{ item.initial }}
            </div>
          </div>
          <div class="info-col">
            <div class="item-title">
              {{ item.name }}
            </div>
            <div class="item-desc">
              {{ item.desc }}
            </div>
          </div>
          <div class="btn-col">
            <a
              v-if="item.url"
              class="about-btn"
              :href="item.url"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>{{ item.btnText }}</span>
            </a>
            <span
              v-else
              class="item-desc"
            >{{ item.btnText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术栈 -->
    <div class="about-card">
      <div class="card-title">
        技术栈
      </div>
      <div class="card-body">
        <div class="tech-flow">
          <span
            v-for="tech in techStack"
            :key="tech"
            class="tech-tag"
          >{{ tech }}</span>
        </div>
      </div>
    </div>

    <!-- 许可与版权 -->
    <div class="about-card">
      <div class="card-title">
        许可与版权声明
      </div>
      <div class="card-body">
        <div class="license-item">
          <div class="license-name">
            PyTauri
          </div>
          <div class="license-text">
            Copyright WSH032. Licensed under MIT.
          </div>
          <div class="license-btns">
            <a
              class="about-btn"
              :href="URLS.pytauri.repo"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>来源</span>
            </a>
            <a
              class="about-btn"
              :href="URLS.pytauri.license"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">
            Vue 3
          </div>
          <div class="license-text">
            Copyright Evan You. Licensed under MIT.
          </div>
          <div class="license-btns">
            <a
              class="about-btn"
              :href="URLS.vue.repo"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>来源</span>
            </a>
            <a
              class="about-btn"
              :href="URLS.vue.license"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">
            Vite
          </div>
          <div class="license-text">
            Copyright Evan You &amp; Vite Contributors. Licensed under MIT.
          </div>
          <div class="license-btns">
            <a
              class="about-btn"
              :href="URLS.vite.repo"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>来源</span>
            </a>
            <a
              class="about-btn"
              :href="URLS.vite.license"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">
            Tauri
          </div>
          <div class="license-text">
            Copyright Tauri Programme within The Commons Conservancy. Licensed under MIT / Apache 2.0.
          </div>
          <div class="license-btns">
            <a
              class="about-btn"
              :href="URLS.tauri.repo"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>来源</span>
            </a>
            <a
              class="about-btn"
              :href="URLS.tauri.license"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">
            Naive UI
          </div>
          <div class="license-text">
            Copyright 07akioni. Licensed under MIT.
          </div>
          <div class="license-btns">
            <a
              class="about-btn"
              :href="URLS.naiveUI.repo"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>来源</span>
            </a>
            <a
              class="about-btn"
              :href="URLS.naiveUI.license"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">
            Authlib-Injector
          </div>
          <div class="license-text">
            Copyright yushijinhun. Licensed under AGPL-3.0.
          </div>
          <div class="license-btns">
            <a
              class="about-btn"
              :href="URLS.authlibInjector.repo"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>来源</span>
            </a>
            <a
              class="about-btn"
              :href="URLS.authlibInjector.license"
              target="_blank"
            >
              <UiIcon
                name="globe"
                :size="14"
              />
              <span>许可</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 法律信息 -->
    <div class="about-card">
      <div class="card-title">
        法律信息
      </div>
      <div class="card-body">
        <p class="legal-text">
          Copyright &copy; 2026 EuoraCraft Team. All Rights Reserved.<br>
          非 MINECRAFT 官方产品。未经 MOJANG 或 MICROSOFT 批准，也不与 MOJANG 或 MICROSOFT 关联。<br>
          Minecraft 是 Mojang Synergies AB 的商标。
        </p>
        <div class="legal-btns">
          <a
            class="about-btn highlight"
            :href="URLS.githubOrg"
            target="_blank"
          >
            <UiIcon
              name="globe"
              :size="14"
            />
            <span>开源代码</span>
          </a>
        </div>
      </div>
    </div>

    <div
      id="plugin-slot-settings-about-bottom"
      class="plugin-slot-container"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import UiIcon from '@/components/ui/Icon.vue'
import { URLS } from '@/config/urls'

const launcherVersion = inject<Readonly<Ref<string>>>('launcherVersion')
const launcherVersionType = inject<Readonly<Ref<'dev' | 'beta' | 'release'>>>('launcherVersionType')

const versionText = computed(() => {
  const v = launcherVersion?.value
  const t = launcherVersionType?.value
  if (!v) return '当前版本：v1.0.0'
  if (t && t !== 'release') return `当前版本：v${v}-${t}`
  return `当前版本：v${v}`
})

interface ThanksItem {
  name: string
  initial: string
  desc: string
  url?: string
  btnText: string
}

const thanks: ThanksItem[] = [
  {
    name: 'PyTauri',
    initial: 'PT',
    desc: '提供了 Python 与 Tauri 的桥梁，让启动器能用 Python 写后端',
    url: URLS.pytauri.repo,
    btnText: 'GitHub',
  },
  {
    name: 'Vue 3',
    initial: 'V',
    desc: '渐进式 JavaScript 框架，构建了启动器的前端界面',
    url: URLS.vue.repo,
    btnText: 'GitHub',
  },
  {
    name: 'Tauri',
    initial: 'T',
    desc: '轻量级桌面应用框架，提供了原生窗口和系统集成能力',
    url: URLS.tauri.repo,
    btnText: 'GitHub',
  },
  {
    name: 'Authlib-Injector',
    initial: 'AI',
    desc: '提供了 Minecraft 外置登录（Yggdrasil）支持',
    url: URLS.authlibInjector.repo,
    btnText: 'GitHub',
  },
  {
    name: 'bangbang93',
    initial: 'BB',
    desc: '提供 BMCLAPI 镜像源，加速国内 Minecraft 下载',
    url: URLS.bmclapi,
    btnText: '镜像站',
  },
  {
    name: 'LittleSkin',
    initial: 'LS',
    desc: '提供 Minecraft 外置登录（Yggdrasil）皮肤站服务',
    url: URLS.littleskin,
    btnText: '网站',
  },
]

const techStack = [
  'Vue 3', 'TypeScript', 'Vite', 'Naive UI', 'GSAP',
  'TailwindCSS', 'Vue Router', 'Vue I18n', 'Iconify', 'Sass',
  'Python', 'PyTauri', 'Requests', 'Cryptography',
  'Keyring', 'MSAL', 'Pydantic', 'Pillow', 'AnyIO',
  'PyInstaller', 'Terser', 'PostCSS', 'Autoprefixer', 'Ruff',
]
</script>

<style scoped src="@/styles/views/settings/AboutTab.css"></style>

