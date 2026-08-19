import type { SkinModel } from '@/types/api'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('皮肤图片加载失败'))
    image.src = src
  })
}

/**
 * 通过皮肤纹理自动判断手臂模型。
 *
 * 经典皮肤左臂左侧(x=35)与右臂正面(x=47)有内容，纤细皮肤该列为透明；
 * 非 64×64 纹理无法按此布局判断，统一按经典手臂处理。
 */
export async function detectSkinModel(dataUrl: string): Promise<SkinModel> {
  const image = await loadImage(dataUrl)
  if (image.width !== 64 || image.height !== 64) return 'classic'
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'classic'
  ctx.drawImage(image, 0, 0)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const hasAlpha = (x: number, y: number): boolean => (pixels[(y * canvas.width + x) * 4 + 3] ?? 0) > 0
  for (let y = 48; y <= 55; y++) if (hasAlpha(35, y)) return 'classic'
  for (let y = 20; y <= 27; y++) if (hasAlpha(47, y)) return 'classic'
  return 'slim'
}
