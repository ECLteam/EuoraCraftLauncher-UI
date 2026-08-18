/**
 * 游戏路径规范化工具。
 */

/**
 * 规范化游戏路径：统一分隔符、去除尾部斜杠并转为小写，便于路径比较与缓存键。
 */
export function normalizeGamePath(path: string): string {
  return path
    .trim()
    .replace(/[\\/]+/g, '/')
    .replace(/\/$/, '')
    .toLocaleLowerCase()
}
