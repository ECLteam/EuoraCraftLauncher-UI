import type { FileContent, FsEntry, PathInfo } from '@/types/system'
import { call } from './commands'

/**
 * 通过后端读取本地图片并转换为可在 DOM 中直接使用的 Data URL。
 *
 * 不依赖 Tauri Asset Protocol，避免未启用本地资源服务时生成无法连接的
 * `asset.localhost` 地址，也避免扩大 WebView 可直接读取的文件路径范围。
 *
 * @param path - 本地图片路径
 * @returns 图片 Data URL，读取失败时返回 null
 */
async function resolveFileUrl(path: string): Promise<string | null> {
  const res = await call<{ dataUrl: string }>('image_read_file', { path })
  return res.success && res.data?.dataUrl ? res.data.dataUrl : null
}

export function createFs() {
  return {
    readDir(path: string) {
      return call<FsEntry[]>('fs_read_dir', { path })
    },
    readFile(path: string, mode: 'text' | 'base64' = 'text') {
      return call<FileContent>('fs_read_file', { path, mode })
    },
    exists(path: string) {
      return call<PathInfo>('fs_exists', { path })
    },
  }
}

export function createFile() {
  return {
    /** 将本地图片路径转为可在 <img> 中直接使用的 Data URL */
    async toUrl(path: string): Promise<string | null> {
      return resolveFileUrl(path)
    },

    /** 路径规整与存在性校验 */
    resolve(path: string) {
      return call<{ path: string }>('file_resolve', { path })
    },
  }
}
