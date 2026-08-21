import backend from '@/api/client'
import type {
  ApiResponse,
  ThemeDesignSessionSnapshot,
  ThemePatchOperation,
  ThemePresetV1,
  ThemeSlotHostSnapshot,
} from '@/types/api'

function dataOrThrow<T>(response: ApiResponse<T>, action: string): T {
  if (!response.success || response.data === undefined) throw new Error(response.message || `${action}失败`)
  return response.data
}

export const themeApi = {
  async list() {
    return dataOrThrow(await backend.command('theme_list'), '读取主题库')
  },
  async active() {
    return dataOrThrow(await backend.command('theme_active'), '读取当前主题')
  },
  async activate(presetId: string) {
    return dataOrThrow(await backend.command('theme_activate', { preset_id: presetId }), '激活主题')
  },
  async remove(presetId: string) {
    const response = await backend.command('theme_delete', { preset_id: presetId })
    if (!response.success) throw new Error(response.message || '删除主题失败')
  },
  async import(sourcePath: string, replace = false) {
    return dataOrThrow(await backend.command('theme_import', { source_path: sourcePath, replace }), '导入主题')
  },
  async export(presetId: string, outputPath: string, includeInstanceOverrides = false) {
    return dataOrThrow(
      await backend.command('theme_export', {
        preset_id: presetId,
        output_path: outputPath,
        include_instance_overrides: includeInstanceOverrides,
      }),
      '导出主题'
    )
  },
  async save(preset: ThemePresetV1) {
    return dataOrThrow(await backend.command('theme_save', { preset }), '保存主题')
  },
  async asset(presetId: string, assetPath: string) {
    return dataOrThrow(
      await backend.command('theme_asset', { preset_id: presetId, asset_path: assetPath }),
      '读取主题资源'
    )
  },
  async start(presetId?: string, restore = true) {
    return dataOrThrow(
      await backend.command('theme_design_start', { preset_id: presetId, restore }),
      '启动主题设计会话'
    )
  },
  async get(sessionId: string) {
    return dataOrThrow(await backend.command('theme_design_get', { session_id: sessionId }), '读取主题设计会话')
  },
  async select(sessionId: string, selection: ThemeDesignSessionSnapshot['selection']) {
    if (!selection) throw new Error('没有可选中的主题节点')
    return dataOrThrow(
      await backend.command('theme_design_select', { session_id: sessionId, selection }),
      '选择主题节点'
    )
  },
  async setOverlay(sessionId: string, showSlots: boolean, slotHosts?: ThemeSlotHostSnapshot[]) {
    return dataOrThrow(
      await backend.command('theme_design_overlay', {
        session_id: sessionId,
        show_slots: showSlots,
        slot_hosts: slotHosts,
      }),
      '切换设计叠层'
    )
  },
  patch(sessionId: string, revision: number, operations: ThemePatchOperation[]) {
    return backend.command('theme_design_patch', {
      session_id: sessionId,
      expected_revision: revision,
      operations,
    })
  },
  undo(sessionId: string, revision: number) {
    return backend.command('theme_design_undo', { session_id: sessionId, expected_revision: revision })
  },
  redo(sessionId: string, revision: number) {
    return backend.command('theme_design_redo', { session_id: sessionId, expected_revision: revision })
  },
  async commit(sessionId: string) {
    return dataOrThrow(await backend.command('theme_design_commit', { session_id: sessionId }), '保存主题草稿')
  },
  async discard(sessionId: string, keepRecovery = false) {
    const response = await backend.command('theme_design_discard', {
      session_id: sessionId,
      keep_recovery: keepRecovery,
    })
    if (!response.success) throw new Error(response.message || '放弃主题草稿失败')
  },
  async saveAs(sessionId: string, name: string) {
    return dataOrThrow(await backend.command('theme_design_save_as', { session_id: sessionId, name }), '另存主题')
  },
}
