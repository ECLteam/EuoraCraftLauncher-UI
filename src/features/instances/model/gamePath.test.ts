import { describe, expect, it } from 'vitest'
import { findGamePathIndex, type GamePath } from './gamePath'

const paths: GamePath[] = [
  { name: '默认目录', path: 'C:\\Minecraft' },
  { name: '整合包目录', path: 'D:\\Modpacks' },
]

describe('findGamePathIndex', () => {
  it('优先选择页面请求的路径', () => {
    expect(findGamePathIndex(paths, 'C:\\Minecraft', 'D:\\Modpacks')).toBe(0)
  })

  it('没有页面请求时恢复上次选择的路径', () => {
    expect(findGamePathIndex(paths, undefined, 'D:\\Modpacks')).toBe(1)
  })

  it('记忆路径失效时回退到第一个可用路径', () => {
    expect(findGamePathIndex(paths, undefined, 'E:\\Removed')).toBe(0)
    expect(findGamePathIndex([], undefined, 'E:\\Removed')).toBe(-1)
  })
})
