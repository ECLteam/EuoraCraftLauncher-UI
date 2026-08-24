import { describe, expect, it } from 'vitest'
import { derivePackName, extractPackPath } from './modpackImportStore'

describe('extractPackPath 从拖放文件列表提取整合包', () => {
  const file = (path: string) => ({ path }) as unknown as File

  it('识别 .zip / .mrpack 路径', () => {
    expect(extractPackPath([file('D:/packs/My.zip')])).toBe('D:/packs/My.zip')
    expect(extractPackPath([file('/packs/Curse.zip')])).toBe('/packs/Curse.zip')
    expect(extractPackPath([file('C:/packs/Mr.mrpack')])).toBe('C:/packs/Mr.mrpack')
  })

  it('无 path 字段的 File 被忽略', () => {
    expect(extractPackPath([file(''), new File([], 'x.jar')])).toBeUndefined()
  })

  it('非整合包文件返回 undefined', () => {
    expect(extractPackPath([file('mods/sodium.jar')])).toBeUndefined()
  })

  it('空列表 / undefined 返回 undefined', () => {
    expect(extractPackPath([])).toBeUndefined()
    expect(extractPackPath(undefined)).toBeUndefined()
  })
})

describe('derivePackName 从整合包文件路径推导实例名', () => {
  it('去除目录前缀与 .zip/.mrpack 后缀', () => {
    expect(derivePackName('D:\\Modpacks\\My Pack.zip')).toBe('My Pack')
    expect(derivePackName('/home/user/packs/SkyBlock.mrpack')).toBe('SkyBlock')
  })

  it('大小写不敏感识别后缀', () => {
    expect(derivePackName('packs/Modern.ZIP')).toBe('Modern')
    expect(derivePackName('packs/Craft.MRPACK')).toBe('Craft')
  })

  it('清理非法文件名字符', () => {
    expect(derivePackName('packs/My:Pack*?.zip')).toBe('My Pack')
  })

  it('空路径返回空串', () => {
    expect(derivePackName('')).toBe('')
    expect(derivePackName('   ')).toBe('')
  })

  it('非整合包后缀不剥离', () => {
    expect(derivePackName('packs/backup.tar.gz')).toBe('backup.tar.gz')
  })
})
