import { ref } from 'vue'

const CACHE_TTL = 30 * 60 * 1000

interface CacheEntry {
  url: string
  timestamp: number
}

const avatarCache = new Map<string, CacheEntry>()

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

  // 根据用户名确定使用Steve还是Alex皮肤
  const skinType = getHueFromString(username) % 2 === 0 ? 'steve' : 'alex'
  
  // 创建默认Minecraft皮肤颜色
  const skinColors = {
    steve: {
      skin: '#8B4513',  // 棕色皮肤
      shirt: '#3F51B5', // 蓝色衬衫
      pants: '#4CAF50', // 绿色裤子
      hair: '#000000'   // 黑色头发
    },
    alex: {
      skin: '#D2B48C',  // 浅棕色皮肤
      shirt: '#E91E63', // 粉色衬衫
      pants: '#9C27B0', // 紫色裤子
      hair: '#FF5722'   // 橙色头发
    }
  }

  const colors = skinColors[skinType]
  
  // 绘制背景
  ctx.fillStyle = colors.skin
  ctx.fillRect(0, 0, size, size)

  // 计算像素大小
  const pixel = Math.max(1, Math.floor(size / 8))
  const offsetX = Math.floor((size - pixel * 8) / 2)
  const offsetY = Math.floor((size - pixel * 8) / 2)

  // 绘制Minecraft风格的头像
  // 头部轮廓
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

export function getAvatarUrl(uuid: string, size: number): string {
  const cleanUuid = uuid.replace(/-/g, '')
  return `https://crafatar.com/avatars/${cleanUuid}?size=${size}&overlay=true&default=MHF_Steve`
}

export function useAvatarRenderer() {
  const loading = ref(false)
  const error = ref(false)

  async function renderAvatar(
    uuid: string | undefined,
    username: string | undefined,
    accountType: string,
    size: number
  ): Promise<string | null> {
    loading.value = true
    error.value = false

    try {
      const id = uuid?.trim()
      const name = username?.trim() || 'Player'

      // 统一通过后端API获取头像，包括离线玩家
      const api = (window as any).pywebview?.api
      if (api?.get_avatar_data_url) {
        try {
          // 对于离线玩家，设置use_default_skin=true
          const useDefaultSkin = !id || accountType.toLowerCase() === 'offline'
          const serverType = useDefaultSkin ? 'Mojang' : accountType
          const uuidToUse = id || '00000000-0000-0000-0000-000000000000'
          
          const result = await api.get_avatar_data_url(uuidToUse, serverType, undefined, size, useDefaultSkin)
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
    } catch (e) {
      error.value = true
      return renderOfflineAvatar(username || 'Player', size)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    renderAvatar
  }
}