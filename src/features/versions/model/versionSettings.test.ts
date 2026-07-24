import { describe, expect, it } from 'vitest'
import { createVersionSettingsKey, normalizeVersionSettings, parseLaunchArguments } from './versionSettings'

describe('versionSettings', () => {
  it('使用规范化路径和版本 ID 生成稳定键名', () => {
    expect(createVersionSettingsKey({ versionId: '1.21.5-Fabric', path: 'D:\\Games\\.minecraft\\' })).toBe(
      'd:/games/.minecraft::1.21.5-Fabric'
    )
  })

  it('兼容缺失字段并限制内存范围', () => {
    expect(normalizeVersionSettings({ customMemory: true, memory: 128, javaPath: 123 })).toMatchObject({
      customMemory: true,
      memory: 512,
      javaPath: '',
      isolated: false,
    })
  })

  it('解析带引号和转义字符的启动参数', () => {
    expect(parseLaunchArguments('-Xmx4G -Dname="ECL Player" -Djava=C:\\Java\\bin --server local\\ host')).toEqual([
      '-Xmx4G',
      '-Dname=ECL Player',
      '-Djava=C:\\Java\\bin',
      '--server',
      'local host',
    ])
  })
})
