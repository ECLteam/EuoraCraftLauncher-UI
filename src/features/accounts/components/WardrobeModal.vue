<template>
  <FullscreenModal
    :visible="visible"
    :title="t('wardrobe.title')"
    :showFooter="false"
    bodyClass="wardrobe-modal-body"
    @update:visible="handleVisibleChange"
    @close="emit('back')"
  >
    <div class="wardrobe-page">
      <main class="wardrobe-content">
        <section class="wardrobe-library ecl-surface">
          <div class="wardrobe-toolbar">
            <div class="wardrobe-account-row">
              <span>{{ t('wardrobe.accountLabel') }}</span>
              <NSelect
                v-model:value="targetAccountId"
                class="wardrobe-account-select"
                size="small"
                :options="accountOptions"
                :placeholder="t('wardrobe.selectAccount')"
                clearable
              />
            </div>
            <div class="wardrobe-category-row">
              <NButtonGroup size="small">
                <NButton :type="activeTab === 'skin' ? 'primary' : 'default'" @click="activeTab = 'skin'">
                  {{ t('wardrobe.skins') }}
                </NButton>
                <NButton :type="activeTab === 'cape' ? 'primary' : 'default'" @click="activeTab = 'cape'">
                  {{ t('wardrobe.localCapes') }}
                </NButton>
                <NButton :type="activeTab === 'official' ? 'primary' : 'default'" @click="activeTab = 'official'">
                  {{ t('wardrobe.officialCapes') }}
                </NButton>
              </NButtonGroup>
              <div class="wardrobe-category-actions">
                <NButton quaternary circle size="small" :title="t('wardrobe.options')" @click="showOptionsModal = true">
                  <template #icon><UiIcon name="menu" :size="16" /></template>
                </NButton>
                <NButton
                  v-if="activeTab !== 'official'"
                  size="small"
                  type="primary"
                  :loading="importing"
                  @click="importItem"
                >
                  <template #icon><UiIcon name="upload" :size="14" /></template>
                  {{ t('wardrobe.import') }}
                </NButton>
              </div>
            </div>
          </div>
          <NAlert v-if="activeTab === 'cape'" class="wardrobe-cape-notice" type="info" :showIcon="false">
            {{ t('wardrobe.localCapePreviewOnly') }}
          </NAlert>

          <NSpin :show="loading">
            <div v-if="activeTab !== 'official' && filteredItems.length" class="wardrobe-grid">
              <div
                v-for="item in filteredItems"
                :key="item.id"
                class="wardrobe-card"
                :class="{ selected: selectedLocal?.id === item.id }"
                role="button"
                tabindex="0"
                @click="selectLocal(item)"
                @keydown.enter="selectLocal(item)"
                @keydown.space.prevent="selectLocal(item)"
              >
                <img v-if="textureUrls[item.id]" :src="textureUrls[item.id]" :alt="item.name" />
                <div v-else class="wardrobe-card-placeholder"><UiIcon name="shirt" :size="28" /></div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.width }}×{{ item.height }}</span>
                <NButton
                  v-if="item.kind === 'skin'"
                  class="wardrobe-favorite-button"
                  :class="{ 'wardrobe-favorite-button-active': item.favorite }"
                  quaternary
                  circle
                  size="tiny"
                  :type="item.favorite ? 'warning' : 'default'"
                  :title="item.favorite ? t('wardrobe.unfavorite') : t('wardrobe.favorite')"
                  @click.stop="toggleFavorite(item)"
                >
                  <template #icon>
                    <UiIcon
                      :class="{ 'wardrobe-favorite-icon-active': item.favorite }"
                      :name="item.favorite ? 'star-filled' : 'star'"
                      :size="14"
                      :style="item.favorite ? { color: '#f5b301' } : {}"
                    />
                  </template>
                </NButton>
                <div class="wardrobe-card-actions">
                  <NPopconfirm @positiveClick="deleteItem(item)">
                    <template #trigger>
                      <NButton
                        quaternary
                        circle
                        size="tiny"
                        type="error"
                        :title="t('wardrobe.delete')"
                        :loading="deletingId === item.id"
                        @click.stop
                      >
                        <template #icon><UiIcon name="delete" :size="14" /></template>
                      </NButton>
                    </template>
                    {{ t('wardrobe.deleteConfirm') }}
                  </NPopconfirm>
                  <NButton quaternary circle size="tiny" :title="t('wardrobe.edit')" @click.stop="openEditModal(item)">
                    <template #icon><UiIcon name="edit" :size="14" /></template>
                  </NButton>
                  <NButton
                    v-if="item.kind === 'skin'"
                    quaternary
                    circle
                    size="tiny"
                    :title="t('wardrobe.saveAs')"
                    @click.stop="exportItem(item)"
                  >
                    <template #icon><UiIcon name="file-download" :size="14" /></template>
                  </NButton>
                  <NButton
                    v-if="item.kind === 'skin'"
                    quaternary
                    circle
                    size="tiny"
                    type="primary"
                    :title="t('wardrobe.applySkin')"
                    @click.stop="openUploadModal(item)"
                  >
                    <template #icon><UiIcon name="cloud-upload" :size="14" /></template>
                  </NButton>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'official' && officialCapes.length" class="wardrobe-grid">
              <div
                v-for="cape in officialCapes"
                :key="cape.id"
                class="wardrobe-card"
                :class="{ selected: selectedOfficialCape?.id === cape.id }"
                role="button"
                tabindex="0"
                @click="selectOfficialCape(cape)"
                @keydown.enter="selectOfficialCape(cape)"
                @keydown.space.prevent="selectOfficialCape(cape)"
              >
                <img v-if="officialCapeUrls[cape.id]" :src="officialCapeUrls[cape.id]" :alt="cape.name || cape.id" />
                <div v-else class="wardrobe-card-placeholder"><UiIcon name="shield" :size="28" /></div>
                <strong>{{ cape.name || cape.id }}</strong>
                <NTag v-if="cape.state.toUpperCase() === 'ACTIVE'" size="small" type="success">
                  {{ t('wardrobe.active') }}
                </NTag>
                <div class="wardrobe-card-actions">
                  <NButton
                    v-if="cape.state.toUpperCase() !== 'ACTIVE'"
                    quaternary
                    circle
                    size="tiny"
                    type="primary"
                    :title="t('wardrobe.applyCape')"
                    :loading="applying"
                    @click.stop="applyCapeItem(cape)"
                  >
                    <template #icon><UiIcon name="check" :size="14" /></template>
                  </NButton>
                  <NButton
                    v-else
                    quaternary
                    circle
                    size="tiny"
                    :title="t('wardrobe.removeCape')"
                    :loading="applying"
                    @click.stop="resetCape"
                  >
                    <template #icon><UiIcon name="minus" :size="14" /></template>
                  </NButton>
                </div>
              </div>
            </div>
            <NEmpty v-else class="wardrobe-empty" :description="emptyDescription" />
          </NSpin>
        </section>

        <section class="wardrobe-preview ecl-surface">
          <SkinViewer3D :skinUrl="previewSkinUrl" :capeUrl="previewCapeUrl" :model="previewModel" />
        </section>
      </main>
    </div>

    <Modal v-model:visible="showEditModal" :title="t('wardrobe.editTitle')" width="440px">
      <div v-if="selectedLocal" class="wardrobe-dialog-form">
        <NInput v-model:value="editName" :placeholder="t('wardrobe.name')" maxlength="80" />
        <NSelect v-if="selectedLocal.kind === 'skin'" v-model:value="editModel" :options="modelOptions" />
        <div class="wardrobe-meta">
          <span>{{ selectedLocal.width }}×{{ selectedLocal.height }}</span>
          <span>{{ formatBytes(selectedLocal.byteSize) }}</span>
        </div>
        <NAlert v-if="selectedLocal.kind === 'cape'" type="info" :showIcon="false">
          {{ t('wardrobe.localCapePreviewOnly') }}
        </NAlert>
      </div>
      <template #footer>
        <NButton @click="showEditModal = false">{{ t('modal.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="saveSelected">{{ t('wardrobe.save') }}</NButton>
      </template>
    </Modal>

    <Modal v-model:visible="showUploadModal" :title="t('wardrobe.uploadTitle')" width="460px">
      <div v-if="selectedLocal" class="wardrobe-dialog-form">
        <div class="wardrobe-upload-item">
          <img v-if="textureUrls[selectedLocal.id]" :src="textureUrls[selectedLocal.id]" :alt="selectedLocal.name" />
          <div>
            <strong>{{ selectedLocal.name }}</strong>
            <span>{{ selectedLocal.width }}×{{ selectedLocal.height }}</span>
          </div>
        </div>
        <NSelect v-model:value="targetAccountId" :options="accountOptions" :placeholder="t('wardrobe.selectAccount')" />
        <NAlert v-if="!isStandardSkin" type="warning" :showIcon="false">
          {{ t('wardrobe.standardOnly') }}
        </NAlert>
      </div>
      <template #footer>
        <NButton @click="showUploadModal = false">{{ t('modal.cancel') }}</NButton>
        <NButton type="primary" :loading="applying" :disabled="!canApplySkin" @click="applySkin">
          {{ t('wardrobe.applySkin') }}
        </NButton>
      </template>
    </Modal>

    <Modal v-model:visible="showOptionsModal" :title="t('wardrobe.options')" width="420px">
      <div class="wardrobe-dialog-form">
        <NButton block :disabled="!targetAccountId" :loading="applying" @click="resetSkin">
          {{ t('wardrobe.resetSkin') }}
        </NButton>
        <NAlert type="info" :showIcon="false">{{ t('wardrobe.customCapeUnsupported') }}</NAlert>
      </div>
      <template #footer>
        <NButton @click="showOptionsModal = false">{{ t('common.close') }}</NButton>
      </template>
    </Modal>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { NAlert, NButton, NButtonGroup, NEmpty, NInput, NPopconfirm, NSelect, NSpin, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import Modal from '@/components/modals/Modal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { clearAvatarCache, fetchTextureDataUrl } from '@/composables/useAvatarRenderer'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import SkinViewer3D from '@/features/accounts/components/SkinViewer3D.vue'
import type { MinecraftAccount, MicrosoftCape, SkinModel, WardrobeItem } from '@/types/api'

const props = defineProps<{
  visible: boolean
  accounts: MinecraftAccount[]
  currentAccount: MinecraftAccount | null
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'back'): void
  (event: 'accountsChanged'): void
}>()

const { t } = useI18n()
const message = useLauncherMessage()
const items = ref<WardrobeItem[]>([])
const textureUrls = ref<Record<string, string>>({})
const officialCapeUrls = ref<Record<string, string>>({})
const activeTab = ref<'skin' | 'cape' | 'official'>('skin')
const selectedLocal = ref<WardrobeItem | null>(null)
const selectedOfficialCape = ref<MicrosoftCape | null>(null)
const selectedSkinUrl = ref('')
const selectedCapeUrl = ref('')
const accountSkinUrl = ref('')
const accountCapeUrl = ref('')
const targetAccountId = ref<string | null>(null)
const editName = ref('')
const editModel = ref<SkinModel>('classic')
const loading = ref(false)
const importing = ref(false)
const saving = ref(false)
const deletingId = ref('')
const applying = ref(false)
const showEditModal = ref(false)
const showUploadModal = ref(false)
const showOptionsModal = ref(false)
let targetTextureRequest = 0

const microsoftAccounts = computed(() => props.accounts.filter((account) => account.type === 'microsoft'))
const accountOptions = computed(() =>
  microsoftAccounts.value.map((account) => ({ label: account.alias, value: account.id }))
)
const targetAccount = computed(() => microsoftAccounts.value.find((account) => account.id === targetAccountId.value))
const officialCapes = computed(() => targetAccount.value?.capes ?? [])
const filteredItems = computed(() => items.value.filter((item) => item.kind === activeTab.value))
const previewSkinUrl = computed(() => selectedSkinUrl.value || accountSkinUrl.value)
const previewCapeUrl = computed(() => selectedCapeUrl.value || accountCapeUrl.value)
const previewModel = computed<SkinModel>(() =>
  selectedLocal.value?.kind === 'skin' ? (selectedLocal.value.model ?? editModel.value) : 'classic'
)
const isStandardSkin = computed(
  () => selectedLocal.value?.kind === 'skin' && selectedLocal.value.width === 64 && selectedLocal.value.height === 64
)
const canApplySkin = computed(() => Boolean(targetAccountId.value && isStandardSkin.value))
const modelOptions = computed(() => [
  { label: t('wardrobe.classic'), value: 'classic' },
  { label: t('wardrobe.slim'), value: 'slim' },
])
const emptyDescription = computed(() =>
  activeTab.value === 'official' ? t('wardrobe.noOfficialCapes') : t('wardrobe.empty')
)

function handleVisibleChange(value: boolean): void {
  emit('update:visible', value)
}

async function loadItems(): Promise<void> {
  loading.value = true
  try {
    items.value = await accountsApi.listWardrobe()
    await Promise.all(items.value.map(loadLocalTexture))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function loadLocalTexture(item: WardrobeItem): Promise<string> {
  if (!textureUrls.value[item.id]) textureUrls.value[item.id] = await accountsApi.wardrobeTexture(item.id)
  return textureUrls.value[item.id] ?? ''
}

async function loadTargetTextures(): Promise<void> {
  const accountId = targetAccountId.value
  const request = ++targetTextureRequest
  accountSkinUrl.value = ''
  accountCapeUrl.value = ''
  selectedSkinUrl.value = ''
  selectedCapeUrl.value = ''
  selectedLocal.value = null
  selectedOfficialCape.value = null
  officialCapeUrls.value = {}
  if (!accountId) return
  try {
    const textures = await accountsApi.textureUrls(accountId)
    if (request !== targetTextureRequest) return
    accountCapeUrl.value = (await fetchTextureDataUrl(textures.capeUrl || '')) || ''
    await Promise.all(
      officialCapes.value.map(async (cape) => {
        officialCapeUrls.value[cape.id] = (await fetchTextureDataUrl(cape.url)) || ''
      })
    )
    try {
      const result = await accountsApi.syncAccountSkin(accountId)
      if (request !== targetTextureRequest) return
      items.value = [result.item, ...items.value.filter((item) => item.id !== result.item.id)]
      await selectLocal(result.item)
    } catch (reason) {
      if (request !== targetTextureRequest) return
      accountSkinUrl.value = (await fetchTextureDataUrl(textures.skinUrl || '')) || ''
      message.warning(reason instanceof Error ? reason.message : t('wardrobe.syncFailed'))
    }
  } catch (reason) {
    if (request !== targetTextureRequest) return
    message.warning(reason instanceof Error ? reason.message : t('wardrobe.textureFailed'))
  }
}

async function selectLocal(item: WardrobeItem): Promise<void> {
  selectedLocal.value = item
  selectedOfficialCape.value = null
  editName.value = item.name
  editModel.value = item.model ?? 'classic'
  const texture = await loadLocalTexture(item)
  if (item.kind === 'skin') selectedSkinUrl.value = texture
  else selectedCapeUrl.value = texture
}

async function selectOfficialCape(cape: MicrosoftCape): Promise<void> {
  selectedOfficialCape.value = cape
  selectedLocal.value = null
  selectedCapeUrl.value = officialCapeUrls.value[cape.id] || ((await fetchTextureDataUrl(cape.url)) ?? '')
}

async function importItem(): Promise<void> {
  const kind = activeTab.value === 'cape' ? 'cape' : 'skin'
  importing.value = true
  try {
    const path = await accountsApi.selectWardrobeImage(kind)
    if (!path) return
    const result = await accountsApi.importWardrobe(path, kind, kind === 'skin' ? 'classic' : undefined)
    await loadItems()
    const item = items.value.find((candidate) => candidate.id === result.item.id) ?? result.item
    await selectLocal(item)
    message.success(result.deduplicated ? t('wardrobe.duplicate') : t('wardrobe.imported'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.importFailed'))
  } finally {
    importing.value = false
  }
}

async function openEditModal(item: WardrobeItem): Promise<void> {
  await selectLocal(item)
  showEditModal.value = true
}

async function openUploadModal(item: WardrobeItem): Promise<void> {
  await selectLocal(item)
  showUploadModal.value = true
}

async function saveSelected(): Promise<boolean> {
  if (!selectedLocal.value) return false
  saving.value = true
  try {
    const updated = await accountsApi.updateWardrobe(
      selectedLocal.value.id,
      editName.value,
      selectedLocal.value.kind === 'skin' ? editModel.value : undefined
    )
    items.value = items.value.map((item) => (item.id === updated.id ? updated : item))
    selectedLocal.value = updated
    showEditModal.value = false
    message.success(t('wardrobe.saved'))
    return true
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.saveFailed'))
    return false
  } finally {
    saving.value = false
  }
}

async function deleteItem(item: WardrobeItem): Promise<void> {
  deletingId.value = item.id
  try {
    const id = item.id
    await accountsApi.deleteWardrobe(id)
    items.value = items.value.filter((item) => item.id !== id)
    delete textureUrls.value[id]
    if (selectedLocal.value?.id === id) {
      selectedLocal.value = null
      if (item.kind === 'skin') selectedSkinUrl.value = ''
      else selectedCapeUrl.value = ''
    }
    message.success(t('wardrobe.deleted'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.deleteFailed'))
  } finally {
    deletingId.value = ''
  }
}

async function toggleFavorite(item: WardrobeItem): Promise<void> {
  try {
    const updated = await accountsApi.updateWardrobe(item.id, undefined, undefined, !item.favorite)
    items.value = items.value
      .map((candidate) => (candidate.id === updated.id ? updated : candidate))
      .sort(
        (left, right) => Number(right.favorite) - Number(left.favorite) || right.updatedAt.localeCompare(left.updatedAt)
      )
    if (selectedLocal.value?.id === updated.id) selectedLocal.value = updated
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.favoriteFailed'))
  }
}

async function exportItem(item: WardrobeItem): Promise<void> {
  try {
    const path = await accountsApi.exportWardrobe(item.id)
    if (path) message.success(t('wardrobe.exported'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.exportFailed'))
  }
}

async function applySkin(): Promise<void> {
  if (!selectedLocal.value || !targetAccountId.value) return
  applying.value = true
  try {
    await accountsApi.applyWardrobeSkin(selectedLocal.value.id, targetAccountId.value)
    clearAvatarCache()
    emit('accountsChanged')
    await loadTargetTextures()
    showUploadModal.value = false
    message.success(t('wardrobe.skinApplied'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.applyFailed'))
  } finally {
    applying.value = false
  }
}

async function resetSkin(): Promise<void> {
  if (!targetAccountId.value) return
  applying.value = true
  try {
    await accountsApi.resetMicrosoftSkin(targetAccountId.value)
    selectedSkinUrl.value = ''
    clearAvatarCache()
    emit('accountsChanged')
    await loadTargetTextures()
    showOptionsModal.value = false
    message.success(t('wardrobe.skinReset'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.applyFailed'))
  } finally {
    applying.value = false
  }
}

async function applyCape(): Promise<void> {
  if (!targetAccountId.value || !selectedOfficialCape.value) return
  applying.value = true
  try {
    await accountsApi.setMicrosoftCape(targetAccountId.value, selectedOfficialCape.value.id)
    emit('accountsChanged')
    await loadTargetTextures()
    message.success(t('wardrobe.capeApplied'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.applyFailed'))
  } finally {
    applying.value = false
  }
}

async function applyCapeItem(cape: MicrosoftCape): Promise<void> {
  await selectOfficialCape(cape)
  await applyCape()
}

async function resetCape(): Promise<void> {
  if (!targetAccountId.value) return
  applying.value = true
  try {
    await accountsApi.resetMicrosoftCape(targetAccountId.value)
    selectedCapeUrl.value = ''
    emit('accountsChanged')
    await loadTargetTextures()
    message.success(t('wardrobe.capeRemoved'))
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : t('wardrobe.applyFailed'))
  } finally {
    applying.value = false
  }
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    activeTab.value = 'skin'
    const previousAccountId = targetAccountId.value
    const defaultAccountId =
      props.currentAccount?.type === 'microsoft' ? props.currentAccount.id : (microsoftAccounts.value[0]?.id ?? null)
    targetAccountId.value = defaultAccountId
    await loadItems()
    if (previousAccountId === defaultAccountId) await loadTargetTextures()
  }
)

watch(targetAccountId, loadTargetTextures)
</script>

<style scoped>
.wardrobe-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--s-md);
}

.wardrobe-meta,
.wardrobe-card span {
  color: var(--text-secondary);
  font-size: 12px;
}

.wardrobe-content {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(380px, 1fr) minmax(360px, 1fr);
  gap: var(--s-md);
}

.wardrobe-library,
.wardrobe-preview {
  min-height: 0;
  border-radius: var(--r-lg);
  overflow: hidden;
}

.wardrobe-library {
  display: flex;
  flex-direction: column;
  padding: var(--s-md);
}

.wardrobe-toolbar {
  display: flex;
  align-items: stretch;
  flex-direction: column;
  gap: var(--s-sm);
  margin-bottom: var(--s-md);
}

.wardrobe-account-row,
.wardrobe-category-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-sm);
}

.wardrobe-account-row > span {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 13px;
}

.wardrobe-category-actions {
  display: flex;
  align-items: center;
  gap: var(--s-xs);
}

.wardrobe-account-select {
  width: min(280px, 100%);
  min-width: 180px;
  flex: 1 1 220px;
}

.wardrobe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--s-sm);
  overflow: auto;
}

.wardrobe-card {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-xs);
  padding: var(--s-sm) var(--s-sm) 34px;
  border: 1px solid var(--divider);
  border-radius: var(--r-md);
  color: var(--text-primary);
  background: var(--bg-card);
  cursor: pointer;
}

.wardrobe-card-actions {
  position: absolute;
  right: 6px;
  bottom: 5px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.wardrobe-favorite-button {
  position: absolute;
  top: 5px;
  right: 6px;
}

.wardrobe-favorite-icon-active {
  color: #f5b301 !important;
}

.wardrobe-favorite-button-active {
  --n-text-color: #f5b301 !important;
  --n-text-color-hover: #ffc928 !important;
  --n-text-color-pressed: #d99e00 !important;
}

.wardrobe-favorite-icon-active :deep(svg),
.wardrobe-favorite-icon-active :deep(path) {
  color: #f5b301 !important;
  fill: #f5b301 !important;
}

.wardrobe-card.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.wardrobe-card img,
.wardrobe-card-placeholder {
  width: 88px;
  height: 88px;
  object-fit: contain;
  image-rendering: pixelated;
}

.wardrobe-card-placeholder {
  display: grid;
  place-items: center;
  color: var(--text-secondary);
}

.wardrobe-card strong {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wardrobe-preview {
  padding: var(--s-sm);
}

.wardrobe-dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--s-md);
}

.wardrobe-meta {
  display: flex;
  justify-content: space-between;
}

.wardrobe-upload-item {
  display: flex;
  align-items: center;
  gap: var(--s-md);
}

.wardrobe-upload-item img {
  width: 72px;
  height: 72px;
  object-fit: contain;
  image-rendering: pixelated;
}

.wardrobe-upload-item div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--s-xs);
}

.wardrobe-upload-item span {
  color: var(--text-secondary);
  font-size: 12px;
}

.wardrobe-empty {
  margin: auto;
}

@media (max-width: 1100px) {
  .wardrobe-content {
    grid-template-columns: minmax(300px, 1fr) minmax(280px, 1fr);
  }
}

@media (max-width: 820px) {
  .wardrobe-content {
    grid-template-columns: 1fr;
  }

  .wardrobe-preview {
    min-height: 360px;
  }

  .wardrobe-category-row {
    justify-content: space-between;
  }

  .wardrobe-account-select {
    width: min(100%, 320px);
  }
}
</style>
