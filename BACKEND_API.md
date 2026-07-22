# EuoraCraft Launcher 前端所需后端 API

本文档根据 `src/types/api.ts` 和 `src/api/client.ts` 整理，共 **87 个命令**。

## 通用约定

前端直接调用独立命令：

```ts
window.__TAURI__.pytauri.pyInvoke(command, payload)
```

每个命令都应返回统一响应对象：

```ts
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errorCode?: string
  timestamp?: number
}
```

下表中的“返回 data”只表示成功时 `data` 字段的类型。返回 `void` 时可以省略 `data`。

## 基础与配置（8）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `ping` | 无 | `{ status: string; message: string }` |
| `config_get` | `{ section: ConfigSection }` | `unknown` |
| `config_set` | `{ section: ConfigSection; data: unknown }` | `void` |
| `config_list` | 无 | `string[]` |
| `config_get_all` | 无 | `Record<string, unknown>` |
| `config_get_many` | `{ sections: string[] }` | `Record<string, unknown>` |
| `list_sections` | 无 | `string[]` |
| `frontend_ready` | 无 | `void` |

## Java（2）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `java_scan` | 无 | `JavaInstallation[]` |
| `java_list` | 无 | `JavaInstallation[]` |

## Minecraft 版本（10）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `minecraft_versions` | `{ filter_type?: string }` | `MinecraftVersion[]` |
| `minecraft_versions_classified` | 无 | `MinecraftVersionCatalog` |
| `fabric_versions` | `{ game_version: string }` | `VersionCatalogItem[]` |
| `forge_versions` | `{ game_version: string }` | `VersionCatalogItem[]` |
| `neoforge_versions` | `{ game_version: string }` | `VersionCatalogItem[]` |
| `optifine_versions` | `{ game_version: string }` | `VersionCatalogItem[]` |
| `quilt_versions` | `{ game_version: string }` | `VersionCatalogItem[]` |
| `scan_versions` | `{ path?: string \| string[] }` | `ScannedVersion[]` |
| `install_version` | 见下方安装参数 | `void` |
| `uninstall_version` | `{ version_id: string; game_path?: string }` | `void` |

`install_version` 参数：

```ts
{
  version_id: string
  version_name?: string
  loader_type?: string
  task_id?: string
  fabric_version?: string
  forge_version?: string
  neoforge_version?: string
  optifine_version?: string
  optifine_type?: string
  optifine_patch?: string
  quilt_version?: string
  game_path?: string
  download_threads?: number
}
```

## 账户与 Authlib（11）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `accounts_list` | 无 | `AccountListData` |
| `accounts_current` | 无 | `MinecraftAccount \| null` |
| `accounts_add_offline` | `{ username: string }` | `MinecraftAccount` |
| `accounts_add_authlib` | `{ server_url: string; email: string; password: string }` | `MinecraftAccount` |
| `accounts_start_microsoft_login` | 无 | `MicrosoftLoginData` |
| `accounts_poll_microsoft_login` | 无 | `MicrosoftPollData` |
| `accounts_complete_microsoft_login` | 无 | `MicrosoftCompleteData` |
| `accounts_switch` | `{ account_id: string }` | `void` |
| `accounts_remove` | `{ account_id: string }` | `void` |
| `accounts_refresh_profile` | `{ account_id: string }` | `void` |
| `authlib_servers` | 无 | `AuthlibServer[]` |

## 用户协议（3）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `user_agreement_get` | 无 | `UserAgreement` |
| `user_agreement_save` | `{ accepted: boolean; uuid: string }` | `UserAgreement` |
| `user_agreement_clear` | 无 | `void` |

## 图片（4）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `image_fetch_data_url` | `{ url: string }` | `ImageDataUrl` |
| `image_save_url` | `{ url: string }` | `SelectResult` |
| `image_read_file` | `{ path: string }` | `ImageDataUrl` |
| `avatar_data_url` | `AvatarOptions` | `ImageDataUrl` |

## 文件选择与打开（5）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `select_directory` | 无 | `SelectResult` |
| `select_java` | 无 | `SelectResult` |
| `select_image` | 无 | `ImageSelection` |
| `select_file` | 无 | `SelectResult` |
| `open_folder` | `{ path: string }` | `void` |

## 游戏实例与日志（5）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `instances_list` | 无 | `GameInstance[]` |
| `launch_instance` | 见下方启动参数 | `void` |
| `cancel_launch` | 无 | `void` |
| `instance_stop` | `{ instance_id: string }` | `void` |
| `export_logs` | `{ output_path?: string }` | `{ path: string }` |

`launch_instance` 参数：

```ts
{
  version_id: string
  game_path?: string
  java_path?: string
  memory?: number
  width?: number
  height?: number
  jvm_args?: string[]
  download_threads?: number
}
```

## 插件（12）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `plugin_list` | 无 | `PluginInfo[]` |
| `plugin_info` | `{ plugin_name: string }` | `PluginInfo` |
| `plugin_enable` | `{ plugin_name: string }` | `void` |
| `plugin_disable` | `{ plugin_name: string; force?: boolean }` | `void` |
| `plugin_unload` | `{ plugin_name: string }` | `void` |
| `plugin_reload` | `{ plugin_name: string; cascade?: boolean }` | `void` |
| `plugin_install` | `{ plugin_path: string }` | `void` |
| `plugin_get_routes` | `{ plugin_id?: string }` | `PluginRoute[]` |
| `plugin_get_slots` | `{}` | `Record<string, PluginSlotItem[]>` |
| `plugin_call_command` | `{ command: string; params?: Record<string, unknown> }` | `unknown` |
| `plugin_get_settings` | `{ plugin_name: string }` | `PluginSettingsSchema` |
| `plugin_update_setting` | `{ plugin_name: string; key: string; value: unknown }` | `void` |

## Mod 管理（5）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `get_mods` | `{ game_path?: string }` | `ModItem[]` |
| `toggle_mod` | `{ game_path: string; filename: string }` | `{ enabled: boolean }` |
| `add_mod` | `{ game_path: string; source_path: string }` | `{ filename: string }` |
| `remove_mod` | `{ game_path: string; filename: string }` | `void` |
| `open_mods_folder` | `{ game_path: string }` | `SelectResult` |

## 整合包与游戏资源（12）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `detect_modpack_type` | `{ file_path: string }` | `ModpackTypeInfo` |
| `import_modpack` | `{ file_path: string; game_path?: string; version_name?: string; download_threads?: number }` | `void` |
| `export_modpack` | `{ game_path?: string; output_path?: string; format?: string; name?: string; version?: string; author?: string }` | `void` |
| `list_resourcepacks` | `{ game_path?: string }` | `ResourcePack[]` |
| `list_shaderpacks` | `{ game_path?: string }` | `ShaderPack[]` |
| `list_saves` | `{ game_path?: string }` | `SaveEntry[]` |
| `remove_resourcepack` | `{ game_path: string; filename: string }` | `void` |
| `remove_shaderpack` | `{ game_path: string; filename: string }` | `void` |
| `delete_save` | `{ game_path: string; save_name: string }` | `void` |
| `open_resourcepacks_folder` | `{ game_path: string }` | `void` |
| `open_shaderpacks_folder` | `{ game_path: string }` | `void` |
| `open_saves_folder` | `{ game_path: string }` | `void` |

## 在线 Mod（4）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `search_mods` | `{ query: string; source?: string; game_version?: string; loader_type?: string; limit?: number; offset?: number }` | `ModSearchItem[]` |
| `get_mod_info` | `{ mod_id: string; source: string }` | `ModInfo` |
| `get_mod_versions` | `{ mod_id: string; source: string; game_version?: string; loader_type?: string }` | `ModVersion[]` |
| `download_mod` | `{ mod_id: string; source: string; version_id: string; game_path: string; filename?: string }` | `void` |

## 启动器信息（2）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `launcher_info` | 无 | `LauncherInfo` |
| `info_card_get` | 无 | `InfoCardData` |

## 文件系统与路径（4）

| 命令 | 请求 payload | 返回 data |
| --- | --- | --- |
| `fs_read_dir` | `{ path: string }` | `FsEntry[]` |
| `fs_read_file` | `{ path: string; mode?: 'text' \| 'base64' }` | `FileContent` |
| `fs_exists` | `{ path: string }` | `PathInfo` |
| `file_resolve` | `{ path: string }` | `SelectResult` |

## 类型定义位置

上表涉及的完整对象字段定义以 `src/types/api.ts` 为准。命令参数由 `CommandPayloadMap` 定义，成功响应的 `data` 类型由 `CommandResponseMap` 定义。
