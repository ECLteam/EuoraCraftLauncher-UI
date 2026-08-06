import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './error'

describe('getErrorMessage', () => {
  it('保留 Error 和字符串中的具体原因', () => {
    expect(getErrorMessage(new Error('连接被拒绝'))).toBe('连接被拒绝')
    expect(getErrorMessage('插件加载失败')).toBe('插件加载失败')
  })

  it('读取 Tauri 返回对象中的错误消息', () => {
    expect(getErrorMessage({ message: '文件不存在' })).toBe('文件不存在')
    expect(getErrorMessage({ detail: '配置格式错误' })).toBe('配置格式错误')
  })

  it('没有具体原因时使用调用方提供的提示', () => {
    expect(getErrorMessage({}, '读取配置失败')).toBe('读取配置失败')
  })
})
