import type {
  ThemeDesignSessionSnapshot,
  ThemeEffectRecipe,
  ThemePresetV1,
  ThemeSelection,
  ThemeStyleOverride,
  ThemeStyleValue,
} from '@/types/api'

const STYLE_ELEMENT_ID = 'ecl-theme-runtime'
const SAFE_PROPERTIES = new Set([
  'background',
  'backgroundColor',
  'backgroundImage',
  'color',
  'borderColor',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'boxShadow',
  'opacity',
  'filter',
  'backdropFilter',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'outlineColor',
  'outlineStyle',
  'outlineWidth',
  'outlineOffset',
  'padding',
  'gap',
  'transform',
  'transition',
  'animation',
])
const STATE_SELECTORS = {
  hover: ':hover',
  active: ':active',
  focus: ':focus',
  focusVisible: ':focus-visible',
  disabled: ':disabled, [aria-disabled="true"]',
} as const
const TOKEN_VARIABLES: Record<string, string[]> = {
  primary: ['--primary', '--ecl-primary'],
  radiusControl: ['--ecl-radius-control', '--r-sm'],
  radiusCard: ['--ecl-radius-card', '--card-radius'],
  radiusDialog: ['--ecl-radius-dialog'],
  shadowSurface: ['--ecl-shadow-surface', '--shadow-card'],
  fontBody: ['--ecl-font-body', '--font-body'],
}
const SCHEME_VARIABLES: Record<string, string[]> = {
  canvas: ['--ecl-canvas', '--bg-base'],
  surface: ['--ecl-surface', '--bg-surface', '--card-bg'],
  surfaceMuted: ['--ecl-surface-muted'],
  text: ['--ecl-text', '--text-primary'],
  textSecondary: ['--ecl-text-secondary', '--text-secondary'],
  border: ['--ecl-border', '--border'],
}
const pluginEffects = new Map<string, ThemeStyleOverride>()

function escapeAttribute(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replace(/[\r\n]/g, '')
}

function cssPropertyName(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

function safeCssValue(value: ThemeStyleValue): string | null {
  if (value === null || typeof value === 'boolean') return null
  const text = String(value).trim()
  if (!text || /[{};]/.test(text) || /(?:javascript|expression|url)\s*\(/i.test(text)) return null
  return text
}

function declarations(properties: Record<string, ThemeStyleValue> | undefined): string {
  if (!properties) return ''
  return Object.entries(properties)
    .filter(([property]) => SAFE_PROPERTIES.has(property))
    .map(([property, raw]) => {
      const value = safeCssValue(raw)
      return value ? `${cssPropertyName(property)}:${value}` : ''
    })
    .filter(Boolean)
    .join(';')
}

function compileOverride(selector: string, override: ThemeStyleOverride): string[] {
  const rules: string[] = []
  const base = declarations(override.properties ?? (override as Record<string, ThemeStyleValue>))
  if (base) rules.push(`${selector}{${base}}`)
  for (const [state, values] of Object.entries(override.states ?? {})) {
    const suffix = STATE_SELECTORS[state as keyof typeof STATE_SELECTORS]
    const body = declarations(values)
    if (suffix && body) rules.push(`${selector}${suffix}{${body}}`)
  }
  return rules
}

function effectSelector(recipe: ThemeEffectRecipe): string | null {
  const target = recipe.target
  if (!target || typeof target !== 'object') return null
  const scope = (target as Record<string, unknown>).scope
  const id = (target as Record<string, unknown>).id
  if (scope === 'global') return ':root'
  if (typeof id !== 'string') return null
  const escaped = escapeAttribute(id)
  if (scope === 'component') return `[data-theme-component="${escaped}"]`
  if (scope === 'node') return `[data-theme-node="${escaped}"]`
  if (scope === 'instance') return `[data-theme-instance="${escaped}"]`
  return null
}

function compileEffect(recipe: ThemeEffectRecipe): string[] {
  const selector = effectSelector(recipe)
  const type = typeof recipe.type === 'string' ? recipe.type : ''
  const params =
    recipe.params && typeof recipe.params === 'object' ? (recipe.params as Record<string, ThemeStyleValue>) : {}
  if (!selector) return []
  if (pluginEffects.has(type)) return compileOverride(selector, pluginEffects.get(type)!)
  const properties: Record<string, ThemeStyleValue> = {}
  if (type === 'shadow') properties.boxShadow = params.value ?? '0 10px 30px rgba(0,0,0,.16)'
  if (type === 'glass') {
    properties.background = params.background ?? 'rgba(255,255,255,.12)'
    properties.backdropFilter = `blur(${safeCssValue(params.blur ?? '12px') || '12px'}) saturate(${safeCssValue(params.saturation ?? '1.2') || '1.2'})`
  }
  if (type === 'gradient')
    properties.backgroundImage = params.value ?? 'linear-gradient(135deg, var(--primary), transparent)'
  if (type === 'border') {
    properties.borderColor = params.color ?? 'var(--primary)'
    properties.borderWidth = params.width ?? '1px'
    properties.borderStyle = params.style ?? 'solid'
  }
  if (type === 'filter') properties.filter = params.value ?? 'saturate(1.1)'
  if (type === 'motion') {
    properties.transition = `transform ${safeCssValue(params.duration ?? '180ms') || '180ms'} ${safeCssValue(params.easing ?? 'ease') || 'ease'}`
    return compileOverride(selector, {
      properties,
      states: { hover: { transform: params.transform ?? 'translateY(-2px)' } },
    })
  }
  return compileOverride(selector, { properties })
}

/** 将受控协议编译成变量与属性选择器；永不接受任意 CSS。 */
export function compileThemeCss(preset: ThemePresetV1, scheme: 'light' | 'dark'): string {
  const root: string[] = []
  for (const [token, raw] of Object.entries(preset.tokens)) {
    const value = safeCssValue(raw)
    if (!value) continue
    const names = TOKEN_VARIABLES[token] ?? [`--ecl-token-${token.replace(/[^a-zA-Z0-9_-]/g, '')}`]
    for (const name of names) root.push(`${name}:${value}`)
  }
  for (const [token, raw] of Object.entries(preset.schemes[scheme] ?? {})) {
    const value = safeCssValue(raw)
    if (!value) continue
    const names = SCHEME_VARIABLES[token] ?? [`--ecl-color-${token.replace(/[^a-zA-Z0-9_-]/g, '')}`]
    for (const name of names) root.push(`${name}:${value}`)
  }
  const rules = [`:root{${root.join(';')}}`]
  for (const [name, override] of Object.entries(preset.componentOverrides)) {
    rules.push(...compileOverride(`[data-theme-component="${escapeAttribute(name)}"]`, override))
  }
  for (const [name, override] of Object.entries(preset.nodeOverrides)) {
    rules.push(...compileOverride(`[data-theme-node="${escapeAttribute(name)}"]`, override))
  }
  for (const [name, override] of Object.entries(preset.instanceOverrides ?? {})) {
    rules.push(...compileOverride(`[data-theme-instance="${escapeAttribute(name)}"]`, override))
  }
  for (const recipe of preset.effects) rules.push(...compileEffect(recipe))
  rules.push(
    '@media (prefers-reduced-motion: reduce){[data-theme-component],[data-theme-node],[data-theme-instance]{animation:none!important;transition:none!important}}'
  )
  return rules.join('\n')
}

export function applyThemePreset(preset: ThemePresetV1): void {
  const scheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ELEMENT_ID
    document.head.appendChild(style)
  }
  style.textContent = compileThemeCss(preset, scheme)
  document.documentElement.dataset.themePreset = preset.id
}

export function clearThemePreview(): void {
  document.getElementById(STYLE_ELEMENT_ID)?.remove()
  delete document.documentElement.dataset.themePreset
}

export type ThemeValueSource = 'base' | 'global' | 'component' | 'node' | 'instance' | 'draft'

function scopedProperty(
  preset: ThemePresetV1,
  selection: ThemeSelection,
  property: string
): { value?: ThemeStyleValue; source: ThemeValueSource } {
  let result: { value?: ThemeStyleValue; source: ThemeValueSource } = { source: 'base' }
  if (selection.componentType) {
    const value = preset.componentOverrides[selection.componentType]?.properties?.[property]
    if (value !== undefined) result = { value, source: 'component' }
  }
  const nodeValue = preset.nodeOverrides[selection.nodeId]?.properties?.[property]
  if (nodeValue !== undefined) result = { value: nodeValue, source: 'node' }
  if (selection.instanceKey) {
    const value = preset.instanceOverrides?.[selection.instanceKey]?.properties?.[property]
    if (value !== undefined) result = { value, source: 'instance' }
  }
  return result
}

/** 返回最终值以及赢得层叠的来源，控制台据此解释每一个字段。 */
export function resolveThemeProperty(
  snapshot: ThemeDesignSessionSnapshot,
  selection: ThemeSelection,
  property: string
): { value?: ThemeStyleValue; source: ThemeValueSource } {
  const base = scopedProperty(snapshot.basePreset, selection, property)
  const draft = scopedProperty(snapshot.draft, selection, property)
  if (draft.value !== base.value || draft.source !== base.source) return { ...draft, source: 'draft' }
  return draft
}

export const safeThemeProperties = Object.freeze([...SAFE_PROPERTIES])

export function registerThemeExtensions(effects: Array<Record<string, unknown>>): void {
  pluginEffects.clear()
  for (const effect of effects) {
    if (typeof effect.id !== 'string' || !effect.properties || typeof effect.properties !== 'object') continue
    pluginEffects.set(effect.id, { properties: effect.properties as Record<string, ThemeStyleValue> })
  }
}

/** 生成不暴露业务主键的稳定实例选择器。 */
export function themeInstanceKey(namespace: string, businessKey: string): string {
  let hash = 0x811c9dc5
  const input = `${namespace}\0${businessKey}`
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${namespace}:${(hash >>> 0).toString(16).padStart(8, '0')}`
}
