<template>
  <div class="tab-pane">
    <div class="about-section">
      <div class="about-card">
        <div class="about-logo">EC</div>
        <h1 class="about-title-text">EuoraCraft Launcher</h1>
        <p class="about-version">{{ t('settings.version') }} 1.0.0</p>
        <p class="about-desc">
          {{ t('app.title') }}<br />
          Minecraft Launcher
        </p>
        
        <div class="about-links">
          <a class="link-item" @click="openLink('https://github.com/ECLteam')">
            <UiIcon name="globe" class="link-icon" />
            <span class="link-text">GitHub</span>
          </a>
          <!--<a class="link-item" 
          @click="showContact"
          >
            <UiIcon name="info" class="link-icon" />
            <span class="link-text">联系我们</span>
          </a>
          <a class="link-item" @click="openLink('https://www.mcbbs.net/')">
            <UiIcon name="globe" class="link-icon" />
            <span class="link-text">MCBBS</span>
          </a>-->
        </div>
        
        <div class="about-tech">
          <div class="tech-title">Tech Stack</div>
          <div class="tech-tags">
            <span class="tech-tag">Vue 3</span>
            <span class="tech-tag">TypeScript</span>
            <span class="tech-tag">Vite</span>
            <span class="tech-tag">GSAP</span>
            <span class="tech-tag">Fluent Design</span>
          </div>
        </div>
        
        <div class="about-footer-text">
          <p>© 2026 EuoraCraft Team. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDialog } from 'naive-ui'

const { t } = useI18n()
const dialog = useDialog()

const openLink = (url: string) => {
  window.open(url, '_blank')
}

/*const showContact = () => {
  dialog.info({
    title: '联系我们',
    content: '邮箱: support@euoracraft.com\nQQ群: 123456789',
    positiveText: '确定'
  })
}*/
</script>

<style scoped src="@/styles/Settings.css"></style>

<style scoped src="@/styles/AboutTab.css"></style>