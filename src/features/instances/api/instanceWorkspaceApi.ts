import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import type {
  GameOperation,
  GameResource,
  GameResourceType,
  InstanceTargetPayload,
  ScannedVersion,
  ScreenshotEntry,
  ServerEntry,
  ServerStatus,
  WorldEntry,
} from '@/types/api'

export function workspaceTarget(version: ScannedVersion, versionIsolation = false): InstanceTargetPayload {
  return { game_path: version.path, version_id: version.versionId, version_isolation: versionIsolation }
}

const call = async <T>(name: Parameters<typeof backend.command>[0], payload: object, message: string): Promise<T> =>
  unwrapResponse((await backend.command(name, payload as never)) as never, message) as T

export const instanceWorkspaceApi = {
  folders: (
    target: InstanceTargetPayload,
    folder: 'instance' | 'mods' | 'saves' | 'screenshots' | 'logs' | 'crash-reports'
  ) => call<{ path: string }>('game_instance_folder_open', { ...target, folder }, '打开实例目录'),
  worlds: (target: InstanceTargetPayload) => call<WorldEntry[]>('game_world_list', target, '读取存档'),
  patchWorld: (target: InstanceTargetPayload, worldId: string, patch: object) =>
    call<WorldEntry>('game_world_patch', { ...target, world_id: worldId, patch }, '修改存档'),
  copyWorld: (target: InstanceTargetPayload, worldId: string, newWorldId: string) =>
    call<GameOperation>('game_world_copy', { ...target, world_id: worldId, new_world_id: newWorldId }, '复制存档'),
  deleteWorld: (target: InstanceTargetPayload, worldId: string) =>
    call<void>('game_world_delete_to_trash', { ...target, world_id: worldId }, '删除存档'),
  backupWorld: (target: InstanceTargetPayload, worldId: string) =>
    call<GameOperation>('game_world_backup_create', { ...target, world_id: worldId }, '备份存档'),
  worldBackups: (target: InstanceTargetPayload, worldId: string) =>
    call<Array<{ id: string; createdAt?: string; locked: boolean; automatic: boolean; size: number }>>(
      'game_world_backup_list',
      { ...target, world_id: worldId },
      '读取存档备份'
    ),
  restoreWorldBackup: (target: InstanceTargetPayload, worldId: string, backupId: string) =>
    call<GameOperation>(
      'game_world_backup_restore',
      { ...target, world_id: worldId, backup_id: backupId },
      '恢复存档备份'
    ),
  lockWorldBackup: (target: InstanceTargetPayload, worldId: string, backupId: string, locked: boolean) =>
    call('game_world_backup_lock', { ...target, world_id: worldId, backup_id: backupId, locked }, '锁定存档备份'),
  deleteWorldBackup: (target: InstanceTargetPayload, worldId: string, backupId: string) =>
    call<void>(
      'game_world_backup_delete_to_trash',
      { ...target, world_id: worldId, backup_id: backupId },
      '删除存档备份'
    ),
  setWorldIcon: (target: InstanceTargetPayload, worldId: string, sourcePath: string) =>
    call<{ path: string }>(
      'game_world_icon_set',
      { ...target, world_id: worldId, source_path: sourcePath },
      '设置世界图标'
    ),
  launchWorld: (target: InstanceTargetPayload, worldId: string) =>
    call('game_launch', { ...target, quick_target: { type: 'world', world_id: worldId } }, '快速进入存档'),
  importWorld: (target: InstanceTargetPayload, sourcePath: string) =>
    call<GameOperation>('game_world_import', { ...target, source_path: sourcePath }, '导入存档'),
  exportWorld: (target: InstanceTargetPayload, worldId: string, outputPath: string) =>
    call<GameOperation>('game_world_export', { ...target, world_id: worldId, output_path: outputPath }, '导出存档'),
  screenshots: (target: InstanceTargetPayload) => call<ScreenshotEntry[]>('game_screenshot_list', target, '读取截图'),
  thumbnail: (target: InstanceTargetPayload, screenshotId: string) =>
    call<{ path: string }>('game_screenshot_thumbnail', { ...target, screenshot_id: screenshotId }, '生成截图缩略图'),
  copyScreenshot: (target: InstanceTargetPayload, screenshotId: string) =>
    call<void>('game_screenshot_copy', { ...target, screenshot_id: screenshotId }, '复制截图'),
  saveScreenshot: (target: InstanceTargetPayload, screenshotId: string, outputPath: string) =>
    call<{ path: string }>(
      'game_screenshot_save_as',
      { ...target, screenshot_id: screenshotId, output_path: outputPath },
      '另存截图'
    ),
  deleteScreenshot: (target: InstanceTargetPayload, screenshotId: string) =>
    call<void>('game_screenshot_delete_to_trash', { ...target, screenshot_id: screenshotId }, '删除截图'),
  setCover: (target: InstanceTargetPayload, screenshotId: string) =>
    call('game_screenshot_set_cover', { ...target, screenshot_id: screenshotId }, '设置实例封面'),
  setBackground: (target: InstanceTargetPayload, screenshotId: string) =>
    call('game_screenshot_set_background', { ...target, screenshot_id: screenshotId }, '设置启动器背景'),
  servers: (target: InstanceTargetPayload) => call<ServerEntry[]>('game_server_list', target, '读取服务器'),
  saveServer: (target: InstanceTargetPayload, server: Partial<ServerEntry> & Pick<ServerEntry, 'name' | 'address'>) =>
    call<ServerEntry>(
      'game_server_upsert',
      { ...target, server_id: server.id, name: server.name, address: server.address, favorite: server.favorite },
      '保存服务器'
    ),
  deleteServer: (target: InstanceTargetPayload, serverId: string) =>
    call<void>('game_server_delete', { ...target, server_id: serverId }, '删除服务器'),
  serverStatuses: (addresses: string[]) =>
    call<ServerStatus[]>('game_server_status_refresh', { addresses }, '刷新服务器状态'),
  launchServer: (target: InstanceTargetPayload, address: string) =>
    call('game_launch', { ...target, quick_target: { type: 'server', address } }, '连接服务器'),
  resources: (target: InstanceTargetPayload, resourceType: GameResourceType, worldId?: string) =>
    call<GameResource[]>(
      'game_resource_list',
      { ...target, resource_type: resourceType, world_id: worldId },
      '读取资源'
    ),
  installResources: (
    target: InstanceTargetPayload,
    resourceType: GameResourceType,
    sourcePaths: string[],
    worldId?: string
  ) =>
    call<GameOperation>(
      'game_resource_install',
      { ...target, resource_type: resourceType, source_paths: sourcePaths, world_id: worldId },
      '安装资源'
    ),
  toggleResource: (
    target: InstanceTargetPayload,
    resourceType: GameResourceType,
    resourceId: string,
    enabled: boolean,
    worldId?: string
  ) =>
    call(
      'game_resource_toggle',
      { ...target, resource_type: resourceType, resource_id: resourceId, enabled, world_id: worldId },
      '切换资源状态'
    ),
  checkResourceUpdates: (
    target: InstanceTargetPayload,
    resourceType: GameResourceType,
    gameVersion: string,
    loader: string,
    worldId?: string
  ) =>
    call<Array<Record<string, unknown>>>(
      'game_resource_update_check',
      { ...target, resource_type: resourceType, game_version: gameVersion, loader, world_id: worldId },
      '检查资源更新'
    ),
  updateResource: (
    target: InstanceTargetPayload,
    resourceType: GameResourceType,
    resourceId: string,
    update: Record<string, unknown>,
    worldId?: string
  ) =>
    call<GameOperation>(
      'game_resource_update',
      { ...target, resource_type: resourceType, resource_id: resourceId, update, world_id: worldId },
      '更新资源'
    ),
  deleteResources: (
    target: InstanceTargetPayload,
    resourceType: GameResourceType,
    resourceIds: string[],
    worldId?: string
  ) =>
    call<void>(
      'game_resource_delete_to_trash',
      { ...target, resource_type: resourceType, resource_ids: resourceIds, world_id: worldId },
      '删除资源'
    ),
  exportResourceManifest: (
    target: InstanceTargetPayload,
    resourceType: GameResourceType,
    outputPath: string,
    outputFormat: 'json' | 'csv',
    worldId?: string
  ) =>
    call<{ path: string }>(
      'game_resource_manifest_export',
      {
        ...target,
        resource_type: resourceType,
        output_path: outputPath,
        output_format: outputFormat,
        world_id: worldId,
      },
      '导出资源清单'
    ),
  chooseResourceFiles: async () =>
    unwrapResponse(await backend.command('select_files', { purpose: 'resource-files' }), '选择资源文件').paths,
  checkFiles: (target: InstanceTargetPayload) => call('game_instance_files_check', target, '校验实例文件'),
  repairFiles: (target: InstanceTargetPayload) =>
    call<GameOperation>('game_instance_files_repair', target, '补全实例文件'),
  deleteInstance: (target: InstanceTargetPayload) => call<void>('game_instance_delete_to_trash', target, '删除实例'),
}
