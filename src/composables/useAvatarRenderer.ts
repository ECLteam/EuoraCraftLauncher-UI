import { ref } from 'vue'
import backend from '@/api/client'
import { getAvatarUrl as buildAvatarUrl } from '@/config/urls'
import type { AccountType } from '@/types/api'

const CACHE_TTL = 30 * 60 * 1000
const MAX_CACHE_ENTRIES = 100

interface CacheEntry {
  url: string
  timestamp: number
}

const avatarCache = new Map<string, CacheEntry>()

function evictOldest() {
  if (avatarCache.size <= MAX_CACHE_ENTRIES) return
  let oldestKey = ''
  let oldestTime = Infinity
  for (const [key, entry] of avatarCache) {
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp
      oldestKey = key
    }
  }
  if (oldestKey) avatarCache.delete(oldestKey)
}

function getCacheKey(uuid: string, type: string, size: number): string {
  return `${uuid}-${type}-${size}`
}

function getCached(uuid: string, type: string, size: number): string | null {
  const key = getCacheKey(uuid, type, size)
  const entry = avatarCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.url
  }
  avatarCache.delete(key)
  return null
}

function setCache(uuid: string, type: string, size: number, url: string): void {
  evictOldest()
  avatarCache.set(getCacheKey(uuid, type, size), { url, timestamp: Date.now() })
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

function getHueFromString(str: string): number {
  return Math.abs(hashCode(str)) % 360
}

export function renderOfflineAvatar(username: string, size: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const skinType = getHueFromString(username) % 2 === 0 ? 'steve' : 'alex'

  const skinColors = {
    steve: {
      skin: '#8B4513',
      shirt: '#3F51B5',
      pants: '#4CAF50',
      hair: '#000000',
    },
    alex: {
      skin: '#D2B48C',
      shirt: '#E91E63',
      pants: '#9C27B0',
      hair: '#FF5722',
    },
  }

  const colors = skinColors[skinType]

  ctx.fillStyle = colors.skin
  ctx.fillRect(0, 0, size, size)

  const pixel = Math.max(1, Math.floor(size / 8))
  const offsetX = Math.floor((size - pixel * 8) / 2)
  const offsetY = Math.floor((size - pixel * 8) / 2)

  ctx.fillStyle = colors.skin
  ctx.fillRect(offsetX, offsetY, pixel * 8, pixel * 8)

  // 头发（顶部）
  ctx.fillStyle = colors.hair
  ctx.fillRect(offsetX, offsetY, pixel * 8, pixel * 2)
  ctx.fillRect(offsetX, offsetY + pixel * 2, pixel, pixel * 6)
  ctx.fillRect(offsetX + pixel * 7, offsetY + pixel * 2, pixel, pixel * 6)

  // 眼睛
  ctx.fillStyle = '#000000'
  ctx.fillRect(offsetX + pixel * 2, offsetY + pixel * 3, pixel, pixel)
  ctx.fillRect(offsetX + pixel * 5, offsetY + pixel * 3, pixel, pixel)

  // 嘴巴
  ctx.fillRect(offsetX + pixel * 3, offsetY + pixel * 5, pixel * 2, pixel)

  return canvas.toDataURL('image/png')
}

export async function loadAvatarImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * 从标准 Minecraft 皮肤中裁切正面头像，并叠加头部第二层。
 * 支持 64×32、64×64 及其整数倍高清皮肤。
 */
export async function renderSkinAvatar(skinUrl: string, size: number): Promise<string | null> {
  const image = await loadAvatarImage(skinUrl)
  if (!image) return null

  const scale = image.naturalWidth / 64
  if (!Number.isInteger(scale) || scale < 1 || image.naturalHeight < 32 * scale) return null

  const outputSize = Math.max(1, Math.round(size))
  const faceSize = 8 * scale
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const context = canvas.getContext('2d')
  if (!context) return null
  context.imageSmoothingEnabled = false

  // 基础脸部：皮肤坐标 (8, 8) 到 (16, 16)。
  context.drawImage(image, 8 * scale, 8 * scale, faceSize, faceSize, 0, 0, outputSize, outputSize)
  // 帽子/头发覆盖层：皮肤坐标 (40, 8) 到 (48, 16)。
  context.drawImage(image, 40 * scale, 8 * scale, faceSize, faceSize, 0, 0, outputSize, outputSize)

  return canvas.toDataURL('image/png')
}

export function getAvatarUrl(uuid: string, size: number): string {
  return buildAvatarUrl(uuid, size)
}

export function useAvatarRenderer() {
  const loading = ref(false)
  const error = ref(false)

  async function renderAvatar(
    uuid: string | undefined,
    username: string | undefined,
    accountType: AccountType | string,
    size: number,
    skinUrl?: string
  ): Promise<string | null> {
    loading.value = true
    error.value = false

    try {
      const id = uuid?.trim()
      const name = username?.trim() || 'Player'
      const localSkinUrl = skinUrl?.trim()

      // 展示账户和带本地皮肤的账户完全由前端裁切，不经过后端头像 API。
      if (localSkinUrl) {
        const cachedSkin = getCached(localSkinUrl, 'skin', size)
        if (cachedSkin) return cachedSkin

        const skinAvatar = await renderSkinAvatar(localSkinUrl, size)
        if (skinAvatar) {
          setCache(localSkinUrl, 'skin', size, skinAvatar)
          return skinAvatar
        }
      }

      // 统一通过后端API获取头像，包括离线玩家
      if (backend.runtime.isAvailable) {
        try {
          // 对于离线玩家，设置use_default_skin=true
          const useDefaultSkin = !id || accountType.toLowerCase() === 'offline'
          const serverType = useDefaultSkin ? 'Mojang' : accountType
          const uuidToUse = id || '00000000-0000-0000-0000-000000000000'

          const result = await backend.command('avatar_data_url', {
            uuid: uuidToUse,
            type_name: serverType,
            size,
            use_default_skin: useDefaultSkin,
          })
          if (result?.success && result.data?.dataUrl) {
            const url = result.data.dataUrl
            // 缓存成功获取的头像
            setCache(uuidToUse, accountType, size, url)
            loading.value = false
            return url
          }
        } catch (e) {
          console.warn('后端皮肤API调用失败，回退到前端生成:', e)
          // 后端失败时回退到前端生成
        }
      }

      // 后端API失败时，回退到前端生成
      if (!id || accountType.toLowerCase() === 'offline') {
        return renderOfflineAvatar(name, size)
      }

      // 对于有UUID的玩家，尝试Crafatar
      const cached = getCached(id, accountType, size)
      if (cached) {
        loading.value = false
        return cached
      }

      const url = getAvatarUrl(id, size)
      const img = await loadAvatarImage(url)
      if (img) {
        setCache(id, accountType, size, url)
        loading.value = false
        return url
      }

      error.value = true
      return renderOfflineAvatar(name, size)
    } catch {
      error.value = true
      return renderOfflineAvatar(username || 'Player', size)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    renderAvatar,
  }
}
