import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import type { InstanceCategory, InstanceProfile, ScannedVersion } from '@/types/instances'

export interface InstanceTarget {
  gamePath: string
  versionId: string
}

function payload(target: InstanceTarget) {
  return { game_path: target.gamePath, version_id: target.versionId }
}

export function targetFromVersion(version: ScannedVersion): InstanceTarget {
  return { gamePath: version.path, versionId: version.versionId }
}

export const instanceProfileApi = {
  async get(target: InstanceTarget): Promise<InstanceProfile> {
    return unwrapResponse(await backend.command('game_instance_profile_get', payload(target)), '读取实例资料')
  },

  async patch(
    target: InstanceTarget,
    patch: Partial<Omit<InstanceProfile, 'schemaVersion' | 'icon'>>
  ): Promise<InstanceProfile> {
    return unwrapResponse(
      await backend.command('game_instance_profile_patch', { ...payload(target), patch }),
      '保存实例资料'
    )
  },

  async reset(target: InstanceTarget, fields: string[]): Promise<InstanceProfile> {
    return unwrapResponse(
      await backend.command('game_instance_profile_reset', { ...payload(target), fields }),
      '恢复实例资料自动值'
    )
  },

  async setIcon(
    target: InstanceTarget,
    iconType: 'auto' | 'builtin' | 'loader' | 'local',
    options: { value?: string; sourcePath?: string } = {}
  ): Promise<InstanceProfile> {
    return unwrapResponse(
      await backend.command('game_instance_icon_set', {
        ...payload(target),
        icon_type: iconType,
        value: options.value,
        source_path: options.sourcePath,
      }),
      '保存实例图标'
    )
  },

  async chooseLocalIcon(): Promise<string | null> {
    const result = unwrapResponse(await backend.command('select_image', { purpose: 'instance_icon' }), '选择实例图标')
    return result?.path || null
  },

  async setPinOrder(versions: ScannedVersion[]): Promise<void> {
    unwrapResponse(
      await backend.command('game_instance_pin_order_set', {
        entries: versions.map((version) => ({ game_path: version.path, version_id: version.versionId })),
      }),
      '保存置顶顺序'
    )
  },

  async categories(): Promise<InstanceCategory[]> {
    return unwrapResponse(await backend.command('game_instance_categories_get'), '读取实例分类')
  },

  async upsertCategory(category: Partial<InstanceCategory> & Pick<InstanceCategory, 'name' | 'color'>) {
    return unwrapResponse(
      await backend.command('game_instance_categories_upsert', {
        category_id: category.id,
        name: category.name,
        color: category.color,
        order: category.order,
      }),
      '保存实例分类'
    )
  },

  async deleteCategory(categoryId: string): Promise<void> {
    unwrapResponse(
      await backend.command('game_instance_categories_delete', { category_id: categoryId }),
      '删除实例分类'
    )
  },
}
