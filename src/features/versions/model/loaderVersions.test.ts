import { describe, expect, it } from 'vitest'
import { normalizeLoaderVersions } from './loaderVersions'

describe('normalizeLoaderVersions', () => {
  it('兼容数组和带 all 字段的后端结果', () => {
    expect(normalizeLoaderVersions(['1.0', { version: '2.0' }, { LoaderVersion: '3.0' }])).toEqual([
      '1.0',
      '2.0',
      '3.0',
    ])
    expect(normalizeLoaderVersions({ all: [{ version: '4.0' }] })).toEqual(['4.0'])
  })

  it('兼容后端返回的单项版本目录数组', () => {
    expect(
      normalizeLoaderVersions([
        {
          all: ['0.16.14', '0.16.13'],
          stable: ['0.16.14'],
          unstable: ['0.16.13'],
        },
      ])
    ).toEqual(['0.16.14', '0.16.13'])
  })

  it('忽略缺少版本号的对象', () => {
    expect(normalizeLoaderVersions([{}, null])).toEqual([])
  })
})
