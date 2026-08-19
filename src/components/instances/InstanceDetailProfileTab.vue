<template>
  <div class="info-card profile-card">
    <div class="info-card__header"><span>个性化</span></div>
    <div class="profile-form-grid">
      <label
        ><span>实例别名</span><NInput v-model:value="profileForm.alias" maxlength="120" /><small
          >磁盘目录仍为 {{ version?.versionId }}</small
        ></label
      >
      <label><span>分类</span><NSelect v-model:value="profileForm.categoryId" :options="categoryOptions" /></label>
      <label class="profile-form-wide"
        ><span>描述</span
        ><NInput
          v-model:value="profileForm.description"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          maxlength="1000"
      /></label>
      <label class="profile-form-wide"
        ><span>标签（使用逗号分隔）</span
        ><NInput v-model:value="profileForm.tagsText" placeholder="朋友服, 机械动力, 生存"
      /></label>
      <label
        ><span>兼容元数据来源</span
        ><NSelect v-model:value="profileForm.preferredExternalSource" :options="sourceOptions"
      /></label>
      <div class="profile-switches">
        <span><NSwitch v-model:value="profileForm.favorite" />收藏</span>
        <span><NSwitch v-model:value="profileForm.pinned" />置顶</span>
        <span><NSwitch v-model:value="profileForm.hidden" />隐藏</span>
      </div>
    </div>
  </div>
  <div class="info-card">
    <div class="info-card__header">字段来源与恢复</div>
    <div class="field-source-list">
      <div v-for="field in profileFields" :key="field">
        <span>{{ profileFieldLabel(field) }}</span
        ><code>{{ version?.fieldSources?.[field] || 'auto' }}</code
        ><NButton
          v-if="version?.profileOverrides?.includes(field)"
          size="tiny"
          quaternary
          @click="resetProfileField(field)"
          >恢复自动</NButton
        >
      </div>
    </div>
    <p v-for="warning in version?.sourceWarnings || []" :key="warning" class="source-warning">
      {{ warning }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NSelect, NSwitch } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceProfileApi, targetFromVersion } from '@/features/instances/api/instanceProfileApi'
import type { InstanceCategory, InstanceExternalSource, ScannedVersion } from '@/types/api'

defineOptions({ name: 'InstanceDetailProfileTab' })

const props = defineProps<{
  version: ScannedVersion | null
  visible: boolean
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const message = useLauncherMessage()

const categories = ref<InstanceCategory[]>([])
const profileSaving = ref(false)
const profileForm = reactive({
  alias: '',
  description: '',
  favorite: false,
  pinned: false,
  hidden: false,
  categoryId: 'unclassified',
  tagsText: '',
  preferredExternalSource: 'auto' as InstanceExternalSource,
})
const categoryOptions = computed(() =>
  categories.value.map((category) => ({ label: category.name, value: category.id }))
)
const sourceOptions = [
  { label: '自动（最新来源）', value: 'auto' },
  { label: 'PCL / PCL-CE', value: 'pcl' },
  { label: 'HMCL', value: 'hmcl' },
  { label: 'Qomicex', value: 'qomicex' },
]
const profileFields = ['alias', 'description', 'favorite', 'pinned', 'hidden', 'categoryId', 'tags', 'icon']

function loadProfileForm() {
  const version = props.version
  if (!version) return
  skipProfileWatch = true
  Object.assign(profileForm, {
    alias: version.displayName || version.versionId,
    description: version.description || '',
    favorite: Boolean(version.favorite),
    pinned: Boolean(version.pinned),
    hidden: Boolean(version.hidden),
    categoryId: version.categoryId || 'unclassified',
    tagsText: (version.tags || []).join(', '),
    preferredExternalSource: version.preferredExternalSource || 'auto',
  })
  savedProfileSnapshot.value = JSON.stringify(profileForm)
  void nextTick(() => {
    skipProfileWatch = false
  })
}

/** 个性化表单自动保存：防抖 + 串行化（参考设置 tab） */
let skipProfileWatch = false
let profileSaveTimer: ReturnType<typeof setTimeout> | null = null
let profileResaveQueued = false
const savedProfileSnapshot = ref('')

function profilePayload() {
  return {
    alias: profileForm.alias,
    description: profileForm.description,
    favorite: profileForm.favorite,
    pinned: profileForm.pinned,
    hidden: profileForm.hidden,
    categoryId: profileForm.categoryId,
    tags: profileForm.tagsText
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    preferredExternalSource: profileForm.preferredExternalSource,
  }
}

async function persistProfile() {
  const version = props.version
  if (!version) return
  if (profileSaving.value) {
    profileResaveQueued = true
    return
  }
  profileSaving.value = true
  try {
    await instanceProfileApi.patch(targetFromVersion(version), profilePayload())
    // 直接更新本地版本对象，避免触发全量扫描
    const v = version as unknown as Record<string, unknown>
    v.displayName = profileForm.alias
    v.description = profileForm.description
    v.favorite = profileForm.favorite
    v.pinned = profileForm.pinned
    v.hidden = profileForm.hidden
    v.categoryId = profileForm.categoryId
    v.tags = profilePayload().tags
    v.preferredExternalSource = profileForm.preferredExternalSource
    savedProfileSnapshot.value = JSON.stringify(profileForm)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.profileSaveFailed'))
  } finally {
    profileSaving.value = false
    if (profileResaveQueued) {
      profileResaveQueued = false
      void persistProfile()
    }
  }
}

function scheduleProfileSave(delay = 300) {
  if (profileSaveTimer) clearTimeout(profileSaveTimer)
  profileSaveTimer = setTimeout(() => {
    profileSaveTimer = null
    void persistProfile()
  }, delay)
}

function flushProfileSave() {
  if (profileSaveTimer) {
    clearTimeout(profileSaveTimer)
    profileSaveTimer = null
  }
  if (JSON.stringify(profileForm) !== savedProfileSnapshot.value) void persistProfile()
}

async function resetProfileField(field: string) {
  const version = props.version
  if (!version) return
  await instanceProfileApi.reset(targetFromVersion(version), [field])
  emit('updated')
}

function profileFieldLabel(field: string): string {
  return (
    {
      alias: '别名',
      description: '描述',
      favorite: '收藏',
      pinned: '置顶',
      hidden: '隐藏',
      categoryId: '分类',
      tags: '标签',
      icon: '图标',
    }[field] || field
  )
}

// 打开时加载表单与分类；关闭时 flush 挂起中的自动保存（复刻原父组件行为）
watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadProfileForm()
      void instanceProfileApi.categories().then((items) => (categories.value = items))
    } else {
      flushProfileSave()
    }
  },
  { immediate: true }
)

// 个性化表单：修改即自动保存（300ms 防抖）
watch(
  profileForm,
  () => {
    if (skipProfileWatch) return
    scheduleProfileSave()
  },
  { deep: true }
)

// 切换到其他 tab / 组件卸载时，同样 flush 挂起中的自动保存
onBeforeUnmount(() => {
  if (profileSaveTimer) clearTimeout(profileSaveTimer)
  if (JSON.stringify(profileForm) !== savedProfileSnapshot.value) void persistProfile()
})
</script>

<style scoped src="@/styles/views/instances/InstanceDetailModal.css"></style>
