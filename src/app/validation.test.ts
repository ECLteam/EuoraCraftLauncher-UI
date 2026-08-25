import { object, string } from 'valibot'
import { describe, expect, it } from 'vitest'
import { assertParams } from './validation'

describe('assertParams', () => {
  it('通过校验并返回纯净输出', () => {
    const schema = object({ name: string() })
    expect(assertParams(schema, { name: 'Alice' }, '测试')).toEqual({ name: 'Alice' })
  })

  it('校验失败抛出带字段路径的错误', () => {
    const schema = object({ name: string() })
    expect(() => assertParams(schema, { name: 123 }, '测试')).toThrow(/测试 参数校验失败/)
  })
})
