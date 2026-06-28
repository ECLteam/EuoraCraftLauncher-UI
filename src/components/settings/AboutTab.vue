<template>
  <div class="tab-pane">
    <div class="about-section">
      <div class="about-logo">EC</div>
      <h1 class="about-title-text">EuoraCraft Launcher</h1>
      <p class="about-version">v1.0.0</p>
      <p class="about-desc">
        {{ t('app.title') }}<br />
        Minecraft Launcher
      </p>

      <div class="about-links">
        <a class="link-item" href="https://github.com/ECLteam" target="_blank">
          <UiIcon name="globe" :size="14" class="link-icon" />
          <span class="link-text">GitHub</span>
        </a>
      </div>

      <div class="about-tech">
        <div class="tech-title">Tech Stack</div>
        <div class="tech-tags">
          <span class="tech-tag">Vue 3</span>
          <span class="tech-tag">TypeScript</span>
          <span class="tech-tag">Vite</span>
          <span class="tech-tag">Tauri</span>
          <span class="tech-tag">GSAP</span>
        </div>
      </div>

      <!-- 密钥环管理 -->
      <div class="keyring-section">
        <div class="tech-title">{{ t('settings.about') }} - Keyring</div>
        <div class="keyring-info" v-if="keyringInfo">
          <span class="info-label">Backend</span>
          <span class="info-value">{{ keyringInfo.type }}</span>
          <span class="info-label">Secure</span>
          <span class="info-value" :class="{ 'text-danger': !keyringInfo.secure }">
            {{ keyringInfo.secure ? 'Yes' : 'No' }}
          </span>
        </div>
        <div class="keyring-info" v-else>
          <span class="info-value text-muted">Keyring not initialized</span>
        </div>
        <button class="danger-btn" @click="handleClearKeyring" :disabled="clearing">
          {{ clearing ? 'Clearing...' : 'Clear Keyring' }}
        </button>
      </div>

      <div class="about-footer-text">
        <p>&copy; 2026 EuoraCraft Team. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import backend from '@/api/client'
import { useGlassMessage } from '@/composables/useGlassMessage'

const { t } = useI18n()
const glass = useGlassMessage()

const keyringInfo = ref<{ type: string; secure: boolean } | null>(null)
const clearing = ref(false)

const loadKeyringInfo = async () => {
  try {
    const result = await backend.command('get_keyring_info')
    if (result.success && result.data?.initialized) {
      keyringInfo.value = result.data
    }
  } catch {
    // ignore
  }
}

const handleClearKeyring = async () => {
  clearing.value = true
  try {
    const result = await backend.command('clear_keyring')
    if (result.success) {
      glass.success('Keyring cleared')
      keyringInfo.value = null
    } else {
      glass.warning(result.message || 'Failed')
    }
  } catch {
    glass.warning('Failed to clear keyring')
  } finally {
    clearing.value = false
  }
}

onMounted(loadKeyringInfo)
</script>

<style scoped>
.tab-pane {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.about-section {
  text-align: center;
  max-width: 360px;
}

.about-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: var(--r-md);
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.02em;
}

.about-title-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.about-version {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 12px;
  font-family: var(--font-mono);
}

.about-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.6;
}

.about-links {
  display: flex;
  justify-content: center;
  gap: var(--s-lg);
  margin-bottom: 24px;
}

.link-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.link-item:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.link-icon {
  flex-shrink: 0;
}

.about-tech {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-base);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
}

.tech-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.tech-tag {
  padding: 3px 10px;
  border-radius: var(--r-xs);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 密钥环管理 */
.keyring-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-base);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
}

.keyring-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-sm);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.info-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.info-value {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.text-danger {
  color: var(--color-error);
}

.text-muted {
  color: var(--text-tertiary);
  font-size: 12px;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 20px;
  border-radius: var(--r-sm);
  border: 1px solid var(--color-error);
  background: transparent;
  color: var(--color-error);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.danger-btn:hover:not(:disabled) {
  background: var(--color-error);
  color: #fff;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.about-footer-text {
  font-size: 11px;
  color: var(--text-tertiary);
}

.about-footer-text p {
  margin: 0;
}
</style>
