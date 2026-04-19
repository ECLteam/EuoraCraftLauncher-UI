// ==================== 全局缓存管理器 ====================
// 支持内存缓存、本地存储和过期时间管理

interface CacheOptions {
  /** 缓存过期时间（毫秒） */
  ttl?: number
  /** 是否使用本地存储持久化 */
  persistent?: boolean
  /** 缓存分组 */
  group?: string
}

interface CacheItem<T = any> {
  value: T
  timestamp: number
  ttl?: number
  group?: string
}

class GlobalCache {
  private memoryCache = new Map<string, CacheItem>()
  private readonly PREFIX = 'euora-cache-'
  private readonly DEFAULT_TTL = 30 * 60 * 1000 // 30分钟

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const {
      ttl = this.DEFAULT_TTL,
      persistent = false,
      group = 'default'
    } = options

    const cacheItem: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      group
    }

    // 内存缓存
    this.memoryCache.set(key, cacheItem)

    // 持久化存储
    if (persistent) {
      try {
        const storageKey = this.getStorageKey(key)
        localStorage.setItem(storageKey, JSON.stringify(cacheItem))
      } catch (error) {
        console.warn('本地存储写入失败:', error)
      }
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    // 先检查内存缓存
    let cacheItem = this.memoryCache.get(key)
    
    // 如果内存中没有，尝试从本地存储加载
    if (!cacheItem) {
      try {
        const storageKey = this.getStorageKey(key)
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          cacheItem = JSON.parse(stored)
          // 加载到内存中
          if (cacheItem) {
            this.memoryCache.set(key, cacheItem)
          }
        }
      } catch (error) {
        console.warn('本地存储读取失败:', error)
      }
    }

    if (!cacheItem) return null

    // 检查是否过期
    if (cacheItem && this.isExpired(cacheItem)) {
      this.delete(key)
      return null
    }

    return cacheItem.value
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    // 删除内存缓存
    this.memoryCache.delete(key)

    // 删除本地存储
    try {
      const storageKey = this.getStorageKey(key)
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('本地存储删除失败:', error)
    }
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const value = this.get(key)
    return value !== null
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear()
    
    // 清空本地存储中的缓存项
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('清空本地存储失败:', error)
    }
  }

  /**
   * 清空指定分组的缓存
   */
  clearGroup(group: string): void {
    // 清空内存缓存中的分组
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.group === group) {
        this.memoryCache.delete(key)
      }
    }

    // 清空本地存储中的分组
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          const storageKey = key.substring(this.PREFIX.length)
          const item = this.memoryCache.get(storageKey)
          if (item && item.group === group) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.warn('清空分组缓存失败:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const memoryCount = this.memoryCache.size
    let persistentCount = 0
    let totalSize = 0

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          persistentCount++
          const value = localStorage.getItem(key)
          if (value) {
            totalSize += new Blob([value]).size
          }
        }
      }
    } catch (error) {
      console.warn('获取缓存统计失败:', error)
    }

    return {
      memoryCount,
      persistentCount,
      totalSize: this.formatBytes(totalSize)
    }
  }

  /**
   * 定期清理过期缓存
   */
  startCleanup(interval: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanupExpired()
    }, interval)
  }

  /**
   * 清理所有过期缓存
   */
  private cleanupExpired(): void {
    // 清理内存缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key)
      }
    }

    // 清理本地存储
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const item: CacheItem = JSON.parse(stored)
            if (this.isExpired(item)) {
              localStorage.removeItem(key)
            }
          }
        }
      }
    } catch (error) {
      console.warn('清理过期缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(item: CacheItem): boolean {
    if (!item.ttl) return false
    return Date.now() - item.timestamp > item.ttl
  }

  /**
   * 获取本地存储的键名
   */
  private getStorageKey(key: string): string {
    return `${this.PREFIX}${key}`
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// 创建全局缓存实例
export const globalCache = new GlobalCache()

// 启动定期清理（每5分钟清理一次过期缓存）
globalCache.startCleanup()

// 导出类型
export type { CacheOptions, CacheItem }

// ==================== 缓存键常量 ====================

/**
 * 缓存键常量，用于统一管理缓存键名
 */
export const CACHE_KEYS = {
  // 版本相关
  VERSIONS: 'versions',
  FABRIC_VERSIONS: 'fabric-versions',
  FORGE_VERSIONS: 'forge-versions',
  
  // 账户相关
  ACCOUNTS: 'accounts',
  CURRENT_ACCOUNT: 'current-account',
  
  // 皮肤相关
  AVATARS: 'avatars',
  SKINS: 'skins',
  
  // 设置相关
  SETTINGS: 'settings',
  THEME: 'theme',
  LANGUAGE: 'language',
  
  // 实例相关
  INSTANCES: 'instances',
  GAME_PATHS: 'game-paths',
  
  // API相关
  API_RESPONSES: 'api-responses'
} as const

/**
 * 缓存分组常量
 */
export const CACHE_GROUPS = {
  VERSION: 'version',
  ACCOUNT: 'account',
  SKIN: 'skin',
  SETTING: 'setting',
  INSTANCE: 'instance',
  API: 'api'
} as const