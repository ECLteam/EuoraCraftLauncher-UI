import { describe, expect, it } from 'vitest'
import { derivePackName } from './modpackImportStore'

describe('derivePackName 从整合包文件路径推导实例名', () => {
  it('去除目录前缀与 .eclmodpack/.zip/.mrpack 后缀', () => {
    expect(derivePackName('D:\\Modpacks\\My Pack.eclmodpack')).toBe('My Pack')
    expect(derivePackName('/home/user/packs/SkyBlock.zip')).toBe('SkyBlock')
    expect(derivePackName('C:/packs/ATM9.mrpack')).toBe('ATM9')
  })

  it('大小写不敏感识别后缀', () => {
    expect(derivePackName('packs/Modern.ZIP')).toBe('Modern')
    expect(derivePackName('packs/Craft.ECLMODPACK')).toBe('Craft')
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
