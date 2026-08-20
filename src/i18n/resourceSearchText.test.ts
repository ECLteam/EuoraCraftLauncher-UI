import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { i18n, type LocaleCode } from './index'

const originalLocale = i18n.global.locale.value as LocaleCode

describe('在线资源搜索文案', () => {
  beforeAll(() => {
    i18n.global.locale.value = 'zh-CN'
  })

  afterAll(() => {
    i18n.global.locale.value = originalLocale
  })

  it.each([
    ['resourcepack', '搜索资源包名称...'],
    ['shaderpack', '搜索光影包名称...'],
    ['datapack', '搜索数据包名称...'],
  ])('%s 页显示对应的搜索占位文字', (resourceType, expected) => {
    const resource = i18n.global.t(`download.${resourceType}`)
    expect(i18n.global.t('mods.searchPlaceholder', { resource })).toBe(expected)
  })
})
