<template>
  <section class="theme-studio-panel">
    <header class="studio-header">
      <div>
        <h1>主题设计控制台</h1>
        <p>{{ session?.draft.meta.name || '正在连接设计会话…' }}</p>
      </div>
      <span v-if="session" class="revision">r{{ session.revision }}{{ session.dirty ? ' · 未保存' : '' }}</span>
      <button
        v-if="windowContext.type !== 'theme-studio'"
        class="close-button"
        title="关闭控制台"
        @click="emit('closeRequest')"
      >
        ×
      </button>
    </header>

    <template v-if="session">
      <div class="studio-actions">
        <button :disabled="!session.canUndo" title="撤销" @click="store.undo()">↶</button>
        <button :disabled="!session.canRedo" title="重做" @click="store.redo()">↷</button>
        <button class="primary" :disabled="!session.dirty" @click="save">保存</button>
        <button @click="saveAs">另存为</button>
        <button @click="discard">放弃</button>
      </div>

      <article class="studio-section selection-card">
        <span class="eyebrow">当前节点</span>
        <strong>{{ selected?.nodeId || '请在主窗口点选节点' }}</strong>
        <small v-if="selected?.path?.length">{{ selected.path.join(' / ') }}</small>
        <label>
          作用范围
          <select :value="selected?.scope || 'global'" @change="setScope">
            <option value="global">全局 Token</option>
            <option value="component" :disabled="!selected?.componentType">组件类型</option>
            <option value="node" :disabled="!selected?.nodeId">页面节点</option>
            <option value="instance" :disabled="!selected?.instanceKey">数据实例</option>
          </select>
        </label>
      </article>

      <article class="studio-section">
        <h2>效果配方</h2>
        <p class="source">效果仍经过属性白名单编译；不会注入任意 CSS 或脚本。</p>
        <div class="effect-buttons">
          <button v-for="type in effectTypes" :key="type.value" @click="addEffect(type.value)">
            + {{ type.label }}
          </button>
        </div>
        <div v-for="effect in selectedEffects" :key="effect.index" class="effect-row">
          <span>{{ effect.type }}</span>
          <button @click="removeEffect(effect.index)">移除</button>
        </div>
      </article>

      <article class="studio-section">
        <h2>基础外观</h2>
        <label>
          预设名称
          <input :value="session.draft.meta.name" maxlength="120" @change="patchText('/meta/name', $event)" />
        </label>
        <template v-if="(selected?.scope || 'global') === 'global'">
          <label>
            主色
            <span class="color-field">
              <input type="color" :value="token('primary', '#5b6ff5')" @input="patchText('/tokens/primary', $event)" />
              <input :value="token('primary')" @change="patchText('/tokens/primary', $event)" />
            </span>
          </label>
          <label
            >卡片圆角 <input :value="token('radiusCard')" @change="patchText('/tokens/radiusCard', $event)"
          /></label>
          <label
            >控件圆角 <input :value="token('radiusControl')" @change="patchText('/tokens/radiusControl', $event)"
          /></label>
          <label>界面字体 <input :value="token('fontBody')" @change="patchText('/tokens/fontBody', $event)" /></label>
          <label
            >表面阴影 <input :value="token('shadowSurface')" @change="patchText('/tokens/shadowSurface', $event)"
          /></label>
        </template>
        <template v-else-if="overrideRoot">
          <label v-for="field in appearanceFields" :key="field.name">
            <span
              >{{ field.label }} <small>{{ sourceFor(field.name) }}</small></span
            >
            <input
              :value="property(field.name)"
              :placeholder="field.placeholder"
              @change="patchProperty(field.name, $event)"
            />
          </label>
          <h3>状态与动效</h3>
          <label
            >Hover 变换
            <input
              :value="stateProperty('hover', 'transform')"
              placeholder="translateY(-2px)"
              @change="patchStateProperty('hover', 'transform', $event)"
          /></label>
          <label
            >过渡
            <input
              :value="property('transition')"
              placeholder="transform 180ms ease"
              @change="patchProperty('transition', $event)"
          /></label>
          <label
            >焦点颜色
            <input
              :value="stateProperty('focusVisible', 'outlineColor')"
              placeholder="var(--primary)"
              @change="patchStateProperty('focusVisible', 'outlineColor', $event)"
          /></label>
          <label
            >焦点宽度
            <input
              :value="stateProperty('focusVisible', 'outlineWidth')"
              placeholder="2px"
              @change="patchStateProperty('focusVisible', 'outlineWidth', $event)"
          /></label>
          <div v-if="accessibilityWarnings.length" class="warning-list">
            <p v-for="warning in accessibilityWarnings" :key="warning">⚠ {{ warning }}</p>
          </div>
          <p class="source">来源：{{ scopeLabel }}层；未设置项继续继承较低层。</p>
        </template>
      </article>

      <article class="studio-section">
        <div class="section-heading">
          <h2>插件插槽</h2>
          <label class="switch"
            ><input
              :checked="store.showSlots"
              type="checkbox"
              @change="store.setShowSlots(($event.target as HTMLInputElement).checked)"
            />
            显示画布插槽</label
          >
        </div>
        <div class="slot-list">
          <div v-for="slot in relevantSlots" :key="slot.id" class="slot-row">
            <div>
              <strong>{{ slot.id }}</strong
              ><small>{{ slot.page }} · {{ slot.instances }} 个上下文</small>
            </div>
            <span :class="{ occupied: slot.occupied }">{{ slot.occupied ? `已占用 ${slot.occupied}` : '空' }}</span>
            <button title="复制插槽 ID" @click="copy(slot.id)">复制</button>
          </div>
        </div>
      </article>

      <article v-if="session.pluginDependencies?.length" class="studio-section">
        <h2>插件依赖</h2>
        <p v-for="dependency in session.pluginDependencies" :key="dependency.id">
          {{ dependency.id }} {{ dependency.version || '' }}
        </p>
      </article>
    </template>
    <div v-else class="studio-loading">正在读取后端权威设计会话…</div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { pluginSlotDescriptors } from '@/features/plugins/slots/slotRegistry'
import { windowContext } from '@/features/windows/model/windowContext'
import type { ThemeStyleOverride, ThemeTargetScope } from '@/types/api'
import { resolveThemeProperty } from '../runtime/themeRuntime'
import { useThemeDesignerStore } from '../stores/themeDesignerStore'

const emit = defineEmits<{ saved: []; discarded: []; closeRequest: [] }>()
const store = useThemeDesignerStore()
const { session, selected } = storeToRefs(store)
const relevantSlots = computed(() =>
  pluginSlotDescriptors
    .map((descriptor) => {
      const hosts = (session.value?.slotHosts ?? []).filter((host) => host.slotId === descriptor.id)
      return {
        ...descriptor,
        instances: hosts.length,
        occupied: hosts.filter((host) => host.occupied).length,
      }
    })
    .filter((slot) => slot.instances > 0 || slot.page === 'global')
)
const pointer = (value: string) => value.replaceAll('~', '~0').replaceAll('/', '~1')
const overrideRoot = computed(() => {
  const selection = selected.value
  if (!selection) return ''
  if (selection.scope === 'component' && selection.componentType)
    return `/componentOverrides/${pointer(selection.componentType)}`
  if (selection.scope === 'node') return `/nodeOverrides/${pointer(selection.nodeId)}`
  if (selection.scope === 'instance' && selection.instanceKey)
    return `/instanceOverrides/${pointer(selection.instanceKey)}`
  return ''
})
const currentOverride = computed<ThemeStyleOverride>(() => {
  const draft = session.value?.draft
  const selection = selected.value
  if (!draft || !selection) return {}
  if (selection.scope === 'component' && selection.componentType)
    return draft.componentOverrides[selection.componentType] ?? {}
  if (selection.scope === 'node') return draft.nodeOverrides[selection.nodeId] ?? {}
  if (selection.scope === 'instance' && selection.instanceKey)
    return draft.instanceOverrides?.[selection.instanceKey] ?? {}
  return {}
})
const scopeLabel = computed(
  () => ({ global: '全局', component: '组件', node: '节点', instance: '实例' })[selected.value?.scope || 'global']
)
const appearanceFields = [
  { name: 'backgroundColor', label: '背景', placeholder: 'rgba(...) / #rrggbb' },
  { name: 'color', label: '文字颜色', placeholder: '#rrggbb' },
  { name: 'borderColor', label: '边框颜色', placeholder: '#rrggbb' },
  { name: 'borderRadius', label: '圆角', placeholder: '8px' },
  { name: 'boxShadow', label: '阴影', placeholder: '0 8px 24px rgba(...)' },
  { name: 'backdropFilter', label: '玻璃模糊', placeholder: 'blur(12px)' },
  { name: 'opacity', label: '透明度', placeholder: '0.0 - 1.0' },
] as const
const effectTypes = [
  { value: 'shadow', label: '阴影' },
  { value: 'glass', label: '玻璃' },
  { value: 'gradient', label: '渐变' },
  { value: 'border', label: '边框' },
  { value: 'filter', label: '滤镜' },
  { value: 'motion', label: 'Hover 动效' },
] as const
const selectedEffects = computed(() =>
  (session.value?.draft.effects ?? [])
    .map((effect, index) => ({ ...effect, index }))
    .filter((effect) => {
      const target = effect.target as { scope?: string; id?: string } | undefined
      const selectedTarget = currentEffectTarget()
      return target?.scope === selectedTarget.scope && target?.id === selectedTarget.id
    })
)
const accessibilityWarnings = computed(() => {
  const warnings: string[] = []
  const foreground = property('color')
  const background = property('backgroundColor')
  if (contrast(foreground, background) !== null && contrast(foreground, background)! < 4.5)
    warnings.push('文字与背景对比度低于 WCAG AA 4.5:1')
  const blur = property('backdropFilter').match(/blur\((\d+(?:\.\d+)?)px\)/i)
  if (blur && Number(blur[1]) > 24) warnings.push('玻璃模糊超过 24px，可能影响性能和可读性')
  const transition = property('transition').match(/(\d+(?:\.\d+)?)s\b/i)
  if (transition && Number(transition[1]) > 0.8) warnings.push('动效超过 800ms；系统“减少动效”模式会禁用主题动画')
  if (stateProperty('focusVisible', 'outlineWidth') === '0') warnings.push('焦点轮廓不可见，键盘用户可能无法定位')
  return warnings
})

function eventValue(event: Event): string {
  return (event.target as HTMLInputElement).value.trim()
}
function token(name: string, fallback = ''): string {
  const value = session.value?.draft.tokens[name]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback
}
function property(name: string): string {
  const value = currentOverride.value.properties?.[name]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}
function stateProperty(state: 'hover' | 'focusVisible', name: string): string {
  const value = currentOverride.value.states?.[state]?.[name]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}
function sourceFor(name: string): string {
  if (!session.value || !selected.value) return '基础'
  return { base: '基础', global: '全局', component: '组件', node: '节点', instance: '实例', draft: '当前草稿' }[
    resolveThemeProperty(session.value, selected.value, name).source
  ]
}
function patchText(path: string, event: Event): void {
  void store.patch([{ op: 'set', path, value: eventValue(event) }])
}
function patchProperty(name: string, event: Event): void {
  if (!overrideRoot.value) return
  const value = eventValue(event)
  void store.patch([{ op: value ? 'set' : 'remove', path: `${overrideRoot.value}/properties/${name}`, value }])
}
function patchStateProperty(state: 'hover' | 'focusVisible', name: string, event: Event): void {
  if (!overrideRoot.value) return
  const value = eventValue(event)
  void store.patch([{ op: value ? 'set' : 'remove', path: `${overrideRoot.value}/states/${state}/${name}`, value }])
}
function currentEffectTarget(): { scope: ThemeTargetScope; id?: string } {
  const selection = selected.value
  if (!selection || selection.scope === 'global') return { scope: 'global' }
  if (selection.scope === 'component') return { scope: 'component', id: selection.componentType }
  if (selection.scope === 'instance') return { scope: 'instance', id: selection.instanceKey }
  return { scope: 'node', id: selection.nodeId }
}
function addEffect(type: string): void {
  if (!session.value) return
  const target = currentEffectTarget()
  if (target.scope !== 'global' && !target.id) return
  void store.patch([
    {
      op: 'set',
      path: `/effects/${session.value.draft.effects.length}`,
      value: { id: crypto.randomUUID(), type, target, params: {} },
    },
  ])
}
function removeEffect(index: number): void {
  void store.patch([{ op: 'remove', path: `/effects/${index}` }])
}
function contrast(foreground: string, background: string): number | null {
  const parse = (value: string) => {
    const match = /^#([0-9a-f]{6})$/i.exec(value)
    if (!match) return null
    return [0, 2, 4].map((offset) => parseInt(match[1]!.slice(offset, offset + 2), 16) / 255)
  }
  const luminance = (rgb: number[]) =>
    rgb
      .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0)
  const fg = parse(foreground)
  const bg = parse(background)
  if (!fg || !bg) return null
  const [lighter, darker] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (lighter! + 0.05) / (darker! + 0.05)
}
function setScope(event: Event): void {
  store.setScope((event.target as HTMLSelectElement).value as ThemeTargetScope)
}
async function save(): Promise<void> {
  await store.commit()
  emit('saved')
}
async function saveAs(): Promise<void> {
  // eslint-disable-next-line no-alert -- system prompt is also available in the native WebView window
  const name = window.prompt('新主题名称', `${session.value?.draft.meta.name || 'ECL Theme'} Copy`)?.trim()
  if (!name) return
  await store.saveAs(name)
}
async function discard(): Promise<void> {
  // eslint-disable-next-line no-alert -- destructive draft action requires synchronous confirmation
  if (store.dirty && !window.confirm('放弃所有未保存的主题修改？')) return
  await store.discard(false)
  emit('discarded')
}
function copy(value: string): void {
  void navigator.clipboard?.writeText(value)
}
</script>

<style scoped>
.theme-studio-panel {
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 18px;
  color: var(--text-primary);
  background: var(--ecl-canvas, var(--bg-base, #f4f6fa));
  overflow: auto;
}
.studio-header,
.section-heading,
.studio-actions,
.color-field,
.slot-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.studio-header {
  justify-content: space-between;
  margin-bottom: 12px;
}
h1 {
  margin: 0;
  font-size: 19px;
}
h2 {
  margin: 0 0 10px;
  font-size: 14px;
}
p {
  margin: 3px 0;
}
.studio-header p,
small,
.source {
  color: var(--text-secondary);
  font-size: 12px;
}
.revision,
.eyebrow {
  color: var(--primary);
  font-size: 12px;
}
.studio-actions {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 8px 0;
  background: inherit;
}
button,
input,
select {
  min-height: 32px;
  border: 1px solid var(--border-color);
  border-radius: var(--r-sm);
  background: var(--bg-secondary);
  color: inherit;
}
button {
  padding: 0 11px;
  cursor: pointer;
}
button.primary {
  color: white;
  border-color: var(--primary);
  background: var(--primary);
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
.studio-section {
  margin-top: 10px;
  padding: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--ecl-radius-card, 8px);
  background: var(--bg-secondary);
  box-shadow: var(--ecl-shadow-surface);
}
.studio-section > label {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}
.studio-section input:not([type='checkbox']):not([type='color']),
.studio-section select {
  width: 100%;
  padding: 0 8px;
}
.color-field {
  min-width: 0;
}
input[type='color'] {
  width: 38px;
  padding: 3px;
  flex: none;
}
.selection-card {
  display: grid;
  gap: 4px;
}
.selection-card label {
  margin-top: 8px;
}
h3 {
  margin: 14px 0 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.warning-list {
  margin-top: 10px;
  padding: 7px 9px;
  border-radius: var(--r-sm);
  color: #b96b00;
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  font-size: 11px;
}
.effect-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
}
.effect-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding: 5px 7px;
  border-radius: var(--r-sm);
  background: var(--bg-tertiary);
  font-size: 11px;
}
.section-heading {
  justify-content: space-between;
}
.section-heading h2 {
  margin: 0;
}
.switch {
  font-size: 12px;
}
.slot-list {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  max-height: 240px;
  overflow: auto;
}
.slot-row {
  padding: 7px;
  border-radius: var(--r-sm);
  background: var(--bg-tertiary);
}
.slot-row > div {
  min-width: 0;
  flex: 1;
}
.slot-row strong,
.slot-row small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.slot-row strong {
  font-size: 11px;
}
.slot-row span {
  font-size: 11px;
  color: var(--text-secondary);
}
.slot-row span.occupied {
  color: var(--primary);
}
.slot-row button {
  min-height: 26px;
  padding: 0 7px;
  font-size: 11px;
}
.studio-loading {
  display: grid;
  place-items: center;
  min-height: 50vh;
  color: var(--text-secondary);
}
</style>
