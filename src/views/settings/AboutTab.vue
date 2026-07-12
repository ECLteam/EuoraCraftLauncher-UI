<template>
  <div class="about-pane">
    <!-- 关于 -->
    <div class="about-card">
      <div class="card-title">关于</div>
      <div class="card-body">
        <div class="card-grid">
          <div class="avatar-col">
            <div class="avatar avatar-logo">EC</div>
          </div>
          <div class="info-col">
            <div class="item-title">EuoraCraft Launcher</div>
            <div class="item-desc">当前版本：v1.0.0</div>
          </div>
          <div class="btn-col">
            <a class="about-btn" href="https://github.com/ECLteam" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 特别鸣谢 -->
    <div class="about-card">
      <div class="card-title">特别鸣谢</div>
      <div class="card-body">
        <div
          v-for="item in thanks"
          :key="item.name"
          class="card-grid"
        >
          <div class="avatar-col">
            <div class="avatar avatar-thanks">{{ item.initial }}</div>
          </div>
          <div class="info-col">
            <div class="item-title">{{ item.name }}</div>
            <div class="item-desc">{{ item.desc }}</div>
          </div>
          <div class="btn-col">
            <a v-if="item.url" class="about-btn" :href="item.url" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>{{ item.btnText }}</span>
            </a>
            <span v-else class="item-desc">{{ item.btnText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术栈 -->
    <div class="about-card">
      <div class="card-title">技术栈</div>
      <div class="card-body">
        <div class="tech-flow">
          <span v-for="tech in techStack" :key="tech" class="tech-tag">{{ tech }}</span>
        </div>
      </div>
    </div>

    <!-- 许可与版权 -->
    <div class="about-card">
      <div class="card-title">许可与版权声明</div>
      <div class="card-body">
        <div class="license-item">
          <div class="license-name">PyTauri</div>
          <div class="license-text">Copyright WSH032. Licensed under MIT.</div>
          <div class="license-btns">
            <a class="about-btn" href="https://github.com/WSH032/pytauri" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>来源</span>
            </a>
            <a class="about-btn" href="https://github.com/WSH032/pytauri/blob/main/LICENSE" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">Vue 3</div>
          <div class="license-text">Copyright Evan You. Licensed under MIT.</div>
          <div class="license-btns">
            <a class="about-btn" href="https://github.com/vuejs/core" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>来源</span>
            </a>
            <a class="about-btn" href="https://github.com/vuejs/core/blob/main/LICENSE" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">Vite</div>
          <div class="license-text">Copyright Evan You &amp; Vite Contributors. Licensed under MIT.</div>
          <div class="license-btns">
            <a class="about-btn" href="https://github.com/vitejs/vite" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>来源</span>
            </a>
            <a class="about-btn" href="https://github.com/vitejs/vite/blob/main/LICENSE" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">Tauri</div>
          <div class="license-text">Copyright Tauri Programme within The Commons Conservancy. Licensed under MIT / Apache 2.0.</div>
          <div class="license-btns">
            <a class="about-btn" href="https://github.com/tauri-apps/tauri" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>来源</span>
            </a>
            <a class="about-btn" href="https://github.com/tauri-apps/tauri/blob/dev/LICENSE_APACHE-2.0" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">Naive UI</div>
          <div class="license-text">Copyright 07akioni. Licensed under MIT.</div>
          <div class="license-btns">
            <a class="about-btn" href="https://github.com/tusen-ai/naive-ui" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>来源</span>
            </a>
            <a class="about-btn" href="https://github.com/tusen-ai/naive-ui/blob/main/LICENSE" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>许可</span>
            </a>
          </div>
        </div>
        <div class="license-item">
          <div class="license-name">Authlib-Injector</div>
          <div class="license-text">Copyright yushijinhun. Licensed under AGPL-3.0.</div>
          <div class="license-btns">
            <a class="about-btn" href="https://github.com/yushijinhun/authlib-injector" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>来源</span>
            </a>
            <a class="about-btn" href="https://github.com/yushijinhun/authlib-injector/blob/develop/LICENSE" target="_blank">
              <UiIcon name="globe" :size="14" />
              <span>许可</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 法律信息 -->
    <div class="about-card">
      <div class="card-title">法律信息</div>
      <div class="card-body">
        <p class="legal-text">
          Copyright &copy; 2026 EuoraCraft Team. All Rights Reserved.<br />
          非 MINECRAFT 官方产品。未经 MOJANG 或 MICROSOFT 批准，也不与 MOJANG 或 MICROSOFT 关联。<br />
          Minecraft 是 Mojang Synergies AB 的商标。
        </p>
        <div class="legal-btns">
          <a class="about-btn highlight" href="https://github.com/ECLteam" target="_blank">
            <UiIcon name="globe" :size="14" />
            <span>开源代码</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiIcon from '@/components/ui/Icon.vue'

const thanks = [
  {
    name: 'PyTauri',
    initial: 'PT',
    desc: '提供了 Python 与 Tauri 的桥梁，让启动器能用 Python 写后端',
    url: 'https://github.com/WSH032/pytauri',
    btnText: 'GitHub',
  },
  {
    name: 'Vue 3',
    initial: 'V',
    desc: '渐进式 JavaScript 框架，构建了启动器的前端界面',
    url: 'https://github.com/vuejs/core',
    btnText: 'GitHub',
  },
  {
    name: 'Tauri',
    initial: 'T',
    desc: '轻量级桌面应用框架，提供了原生窗口和系统集成能力',
    url: 'https://github.com/tauri-apps/tauri',
    btnText: 'GitHub',
  },
  {
    name: 'Authlib-Injector',
    initial: 'AI',
    desc: '提供了 Minecraft 外置登录（Yggdrasil）支持',
    url: 'https://github.com/yushijinhun/authlib-injector',
    btnText: 'GitHub',
  },
  {
    name: 'bangbang93',
    initial: 'BB',
    desc: '提供 BMCLAPI 镜像源，加速国内 Minecraft 下载',
    url: 'https://bmclapi2.bangbang93.com',
    btnText: '镜像站',
  },
  {
    name: 'LittleSkin',
    initial: 'LS',
    desc: '提供 Minecraft 外置登录（Yggdrasil）皮肤站服务',
    url: 'https://littleskin.cn',
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

<style scoped>
.about-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

/* 卡片 */
.about-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 7px;
  overflow: hidden;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 11px 18px;
  border-bottom: 1px solid var(--border);
}

.card-body {
  padding: 11px 18px 18px;
}

/* 网格行 */
.card-grid {
  display: grid;
  grid-template-columns: 36px 1fr 135px;
  align-items: center;
  min-height: 40px;
  gap: 0;
}

.card-grid + .card-grid {
  margin-top: 5px;
}

.avatar-col {
  display: flex;
  align-items: center;
}

.avatar {
  width: 31px;
  height: 31px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.avatar-logo {
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 14px;
}

.avatar-thanks {
  background: var(--bg-base);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.info-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 13px;
  min-width: 0;
}

.item-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-desc {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 1px;
  line-height: 1.4;
}

.btn-col {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.about-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 13px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease-out;
}

.about-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.about-btn.highlight {
  border-color: var(--primary);
  color: var(--primary);
}

.about-btn.highlight:hover {
  background: var(--primary);
  color: var(--text-on-primary);
}

/* 技术栈流动布局 */
.tech-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tech-tag {
  padding: 3px 9px;
  border-radius: 4px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 许可项 */
.license-item {
  display: grid;
  grid-template-columns: 144px 1fr auto;
  align-items: center;
  gap: 13px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}

.license-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.license-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.license-text {
  font-size: 10px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.license-btns {
  display: flex;
  gap: 7px;
}

/* 法律信息 */
.legal-text {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 14px;
}

.legal-btns {
  display: flex;
  gap: 7px;
}
</style>
