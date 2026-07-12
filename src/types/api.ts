/**
 * 前端定义的数据结构、命令参数/响应映射与事件映射。
 *
 * 后端不关心这些字段的具体含义，只负责存/取 JSON。
 * 社区替换前端时，可以自由增删字段，不需要改后端代码。
 */

// ═══════════════════════════════════════════════════════════════════
//  通用响应
// ═══════════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errorCode?: string
  timestamp?: number
}

// ═══════════════════════════════════════════════════════════════════
//  应用配置
// ═══════════════════════════════════════════════════════════════════

export interface LauncherConfig {
  version: string
  version_type: 'dev' | 'beta' | 'release'
  debug: boolean
}

export interface BackgroundConfig {
  type: 'default' | 'local' | 'url' | 'gradient'
  path: string
  opacity: number
  blur: number
  image_base64?: string
}

export type MinecraftPathEntry = string | { name: string; path: string; protected?: boolean }

export interface GameConfig {
  minecraft_paths: MinecraftPathEntry[]
  java_auto?: boolean
  java_path?: string
  memory_auto?: boolean
  memory_size?: number
  game_width?: number
  game_height?: number
  jvm_args?: string[]
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primary_color: string
  blur_amount: number
  sidebar_collapsed: boolean
  titlebar_hidden: boolean
}

export interface DownloadConfig {
  mirror_source: 'official' | 'bmclapi'
  download_threads: number
}

export interface LocaleConfig {
  locale: string
}

export type ConfigSection =
  | 'launcher'
  | 'game'
  | 'download'
  | 'ui'
  | 'locale'
  | 'background'
  | string

// ═══════════════════════════════════════════════════════════════════
//  Java
// ═══════════════════════════════════════════════════════════════════

export interface JavaInstallation {
  path: string
  version: string
  major_version: number
  java_type: string
  arch: string
  sources: string[]
}

// ═══════════════════════════════════════════════════════════════════
//  Minecraft 版本
// ═══════════════════════════════════════════════════════════════════

export type MinecraftVersionType = 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | 'april_fools' | 'all'

export interface MinecraftVersion {
  id: string
  type: MinecraftVersionType
  releaseTime: string
  time: string
  url: string
}

export interface MinecraftVersionItem {
  id: string
  type: MinecraftVersionType
  releaseTime: string
}

export interface MinecraftVersionCatalog {
  all: MinecraftVersionItem[]
  release: MinecraftVersionItem[]
  snapshot: MinecraftVersionItem[]
  april_fools: MinecraftVersionItem[]
  old_beta: MinecraftVersionItem[]
  old_alpha: MinecraftVersionItem[]
}

export type LoaderType = 'Vanilla' | 'Forge' | 'NeoForge' | 'Fabric' | 'Quilt' | 'OptiFine'

export interface ScannedVersion {
  id: string
  versionId: string
  displayName: string
  primaryLoader: string
  vanillaName: string
  hasForge: boolean
  hasNeoForge: boolean
  hasFabric: boolean
  hasQuilt: boolean
  hasOptiFine?: boolean
  isBroken: boolean
  jsonPath: string
  sourceName?: string
}

export interface VersionCatalogItem {
  all: string[]
  stable: string[]
  unstable: string[]
}

// ═══════════════════════════════════════════════════════════════════
//  游戏实例
// ═══════════════════════════════════════════════════════════════════

export interface GameInstance {
  id: string
  name: string
  type: string
  isRunning: boolean
  version?: string
}

// ═══════════════════════════════════════════════════════════════════
//  账户
// ═══════════════════════════════════════════════════════════════════

export type AccountType = 'microsoft' | 'offline' | 'authlib'

export interface MinecraftAccount {
  id: string
  alias: string
  type: AccountType
  email?: string
  uuid?: string
  isCurrent?: boolean
  skinUrl?: string
  auth_server?: string
}

export interface AccountListData {
  accounts: MinecraftAccount[]
  current: MinecraftAccount | null
}

export interface MicrosoftLoginData {
  status?: 'pending' | 'completed' | 'error'
  needs_client_id?: boolean
  userCode?: string
  verificationUri?: string
  message?: string
  interval?: number
}

export interface MicrosoftPollData {
  status: 'pending' | 'ready' | 'error'
  message?: string
  retry_after?: number
}

export interface MicrosoftCompleteData {
  success?: boolean
  account?: MinecraftAccount
  message?: string
}

export interface AuthlibServer {
  name: string
  url: string
  description: string
}

// ═══════════════════════════════════════════════════════════════════
//  用户协议
// ═══════════════════════════════════════════════════════════════════

export interface UserAgreement {
  accepted: boolean
  uuid: string
}

// ═══════════════════════════════════════════════════════════════════
//  启动器信息 / 密钥环
// ═══════════════════════════════════════════════════════════════════

export interface LauncherInfo {
  version: string
  version_type: string
}

// ═══════════════════════════════════════════════════════════════════
//  游戏页信息卡
// ═══════════════════════════════════════════════════════════════════

export type InfoCardMode = 'auto' | 'rotate' | 'announcement_first' | 'tip_only' | 'announcement_only'

export interface InfoCardAnnouncement {
  title: string
  date: string
  content: string
}

export interface InfoCardWelcome {
  title: string
  content: string
}

export interface InfoCardData {
  mode: InfoCardMode
  tips: string[]
  announcements: InfoCardAnnouncement[]
  welcome?: InfoCardWelcome | null
  interval?: number
}

// ═══════════════════════════════════════════════════════════════════
//  文件 / 图片
// ═══════════════════════════════════════════════════════════════════

export interface SelectResult {
  path: string
}

export interface ImageSelection {
  path: string
  base64: string
}

export interface ImageDataUrl {
  dataUrl: string
}

export interface AvatarOptions {
  uuid: string
  type_name?: string
  custom_server?: string
  size?: number
  use_default_skin?: boolean
  avatar_type?: string
}

export interface FsEntry {
  name: string
  is_dir: boolean
  size: number
  mtime: number
}

export interface FileContent {
  content: string
  size: number
}

export interface PathInfo {
  exists: boolean
  is_dir: boolean
  is_file: boolean
}

// ═══════════════════════════════════════════════════════════════════
//  Mod / 资源
// ═══════════════════════════════════════════════════════════════════

export interface ModItem {
  filename: string
  name: string
  version: string
  author: string
  loader_type: string
  game_version: string
  enabled: boolean
}

export interface ModSearchItem {
  id: string
  slug: string
  title: string
  description: string
  author: string
  icon_url?: string
  downloads: number
  follows?: number
  date_modified?: string
  source: string
}

export interface ModInfo {
  id: string
  slug: string
  title: string
  description: string
  author: string
  icon_url?: string
  source: string
  loaders: string[]
  game_versions: string[]
  [k: string]: unknown
}

export interface ModVersion {
  id: string
  version_number: string
  game_versions: string[]
  loaders: string[]
  download_url?: string
  filename?: string
  date_published?: string
}

export interface ResourcePack {
  filename: string
  name?: string
  description?: string
  format?: number
}

export interface ShaderPack {
  filename: string
  name?: string
}

export interface SaveEntry {
  name: string
  lastPlayed?: string
  gameMode?: string
}

export interface ModpackTypeInfo {
  type: string
  [k: string]: unknown
}

// ═══════════════════════════════════════════════════════════════════
//  插件
// ═══════════════════════════════════════════════════════════════════

export interface PluginDependency {
  name: string
  version: string
}

export interface PluginInfo {
  name: string
  title: string
  version: string
  description: string
  author: string
  icon: string
  status: string
  error: string | null
  dependencies: Record<string, string>
  events: Record<string, unknown>
  services: string[]
  is_system: boolean
}

export interface PluginRoute {
  plugin: string
  path: string
  title: string
  icon?: string
}

export interface PluginSlotItem {
  plugin: string
  html: string
}

export interface PluginSettingsSchema {
  schema: unknown
  values: Record<string, unknown>
}

// ═══════════════════════════════════════════════════════════════════
//  进度事件
// ═══════════════════════════════════════════════════════════════════

export type InstallPhase = 'install' | 'download' | 'done' | 'error'

export interface InstallProgress {
  phase: InstallPhase
  task_id?: string
  done?: number
  total?: number
  message: string
  subtask?: string
}

export type LaunchPhase =
  | 'preparing'
  | 'checking'
  | 'files_checked'
  | 'building_args'
  | 'args_built'
  | 'natives_done'
  | 'about_to_launch'
  | 'launching'
  | 'downloading'
  | 'launched'
  | 'error'

export interface LaunchProgress {
  phase: LaunchPhase
  message: string
  percent?: number
  done?: number
  total?: number
}

// ═══════════════════════════════════════════════════════════════════
//  事件映射
// ═══════════════════════════════════════════════════════════════════

export interface BackendEvents {
  'config:init': {
    launcher: LauncherConfig
    game: GameConfig
    download: DownloadConfig
    ui: ThemeConfig & {
      locale?: string
      background?: Partial<BackgroundConfig>
    }
  }
  'launcher:notify': {
    type: 'info' | 'warning' | 'error'
    title: string
    message: string
  }
  'launcher:agreement_required': Record<string, never>
  'game:install_progress': InstallProgress
  'game:launch_progress': LaunchProgress
  'plugin:status_changed': { name: string; action: string; result: string }
  'plugin:installed': { name: string }
  'plugin:css_injected': { plugin: string; css: string }
  'plugin:script_injected': { plugin: string; script: string }
  'plugin:typescript_injected': { plugin: string; script: string }
  'plugin:html_injected': { plugin: string; slot: string; html: string }
  'plugin:route_registered': { plugin: string; path: string; title: string; icon?: string }
  'plugin:route_unregistered': { plugin: string; path: string }
  'plugin:disabled': { plugin: string }
  'plugin:pre_unload': { name: string }
  'plugin:cleanup': { name: string }
  'plugin:slots_cleared': { plugin: string }
  'plugin:settings_changed': { plugin: string; key: string; old_value: unknown; new_value: unknown }
}

export type BackendEventName = keyof BackendEvents

// ═══════════════════════════════════════════════════════════════════
//  命令参数映射
// ═══════════════════════════════════════════════════════════════════

export interface CommandPayloadMap {
  ping: undefined

  // Java
  java_scan: undefined
  java_list: undefined

  // 游戏版本
  minecraft_versions: { filter_type?: string }
  minecraft_versions_classified: undefined
  fabric_versions: { game_version: string }
  forge_versions: { game_version: string }
  neoforge_versions: { game_version: string }
  optifine_versions: { game_version: string }
  quilt_versions: { game_version: string }
  scan_versions: { path?: string | string[] }
  install_version: {
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
  uninstall_version: { version_id: string; game_path?: string }

  // 账户
  accounts_list: undefined
  accounts_current: undefined
  accounts_add_offline: { username: string }
  accounts_add_authlib: {
    server_url: string
    email: string
    password: string
  }
  accounts_start_microsoft_login: undefined
  accounts_poll_microsoft_login: undefined
  accounts_complete_microsoft_login: undefined
  accounts_switch: { account_id: string }
  accounts_remove: { account_id: string }
  accounts_refresh_profile: { account_id: string }

  // Authlib
  authlib_servers: undefined

  // 用户协议
  user_agreement_get: undefined
  user_agreement_save: { accepted: boolean; uuid: string }
  user_agreement_clear: undefined

  // 图片
  image_fetch_data_url: { url: string }
  image_save_url: { url: string }
  image_read_file: { path: string }
  avatar_data_url: AvatarOptions

  // 文件选择
  select_directory: undefined
  select_java: undefined
  select_image: undefined
  select_file: undefined
  open_folder: { path: string }

  // 游戏实例
  instances_list: undefined
  launch_instance: {
    version_id: string
    game_path?: string
    java_path?: string
    memory?: number
    width?: number
    height?: number
    jvm_args?: string[]
    download_threads?: number
  }
  cancel_launch: undefined
  instance_stop: { instance_id: string }

  // 插件
  plugin_list: undefined
  plugin_info: { plugin_name: string }
  plugin_enable: { plugin_name: string }
  plugin_disable: { plugin_name: string; force?: boolean }
  plugin_unload: { plugin_name: string }
  plugin_reload: { plugin_name: string; cascade?: boolean }
  plugin_install: { plugin_path: string }
  plugin_get_routes: { plugin_id?: string }
  plugin_get_slots: Record<string, never>
  plugin_call_command: { command: string; params?: Record<string, unknown> }
  plugin_get_settings: { plugin_name: string }
  plugin_update_setting: { plugin_name: string; key: string; value: unknown }

  // Mod 管理（主框架）
  get_mods: { game_path?: string }
  toggle_mod: { game_path: string; filename: string }
  add_mod: { game_path: string; source_path: string }
  remove_mod: { game_path: string; filename: string }
  open_mods_folder: { game_path: string }

  // 整合包 / 资源
  detect_modpack_type: { file_path: string }
  import_modpack: {
    file_path: string
    game_path?: string
    version_name?: string
    download_threads?: number
  }
  export_modpack: {
    game_path?: string
    output_path?: string
    format?: string
    name?: string
    version?: string
    author?: string
  }
  list_resourcepacks: { game_path?: string }
  list_shaderpacks: { game_path?: string }
  list_saves: { game_path?: string }
  remove_resourcepack: { game_path: string; filename: string }
  remove_shaderpack: { game_path: string; filename: string }
  delete_save: { game_path: string; save_name: string }
  open_resourcepacks_folder: { game_path: string }
  open_shaderpacks_folder: { game_path: string }
  open_saves_folder: { game_path: string }

  // 在线 Mod 搜索
  search_mods: {
    query: string
    source?: string
    game_version?: string
    loader_type?: string
    limit?: number
    offset?: number
  }
  get_mod_info: { mod_id: string; source: string }
  get_mod_versions: { mod_id: string; source: string; game_version?: string; loader_type?: string }
  download_mod: {
    mod_id: string
    source: string
    version_id: string
    game_path: string
    filename?: string
  }

  // 启动器信息 / 游戏页信息卡
  launcher_info: undefined
  info_card_get: undefined
  list_sections: undefined
  frontend_ready: undefined

  // 批量配置
  config_get_all: undefined
  config_get_many: { sections: string[] }

  // 文件系统
  fs_read_dir: { path: string }
  fs_read_file: { path: string; mode?: 'text' | 'base64' }
  fs_exists: { path: string }

  // 文件路径
  file_resolve: { path: string }
}

export type CommandName = keyof CommandPayloadMap

// ═══════════════════════════════════════════════════════════════════
//  命令响应映射
// ═══════════════════════════════════════════════════════════════════

export interface CommandResponseMap {
  ping: { status: string; message: string }

  java_scan: JavaInstallation[]
  java_list: JavaInstallation[]

  minecraft_versions: MinecraftVersion[]
  minecraft_versions_classified: MinecraftVersionCatalog
  fabric_versions: VersionCatalogItem[]
  forge_versions: VersionCatalogItem[]
  neoforge_versions: VersionCatalogItem[]
  optifine_versions: VersionCatalogItem[]
  quilt_versions: VersionCatalogItem[]
  scan_versions: ScannedVersion[]
  install_version: void
  uninstall_version: void

  accounts_list: AccountListData
  accounts_current: MinecraftAccount | null
  accounts_add_offline: MinecraftAccount
  accounts_add_authlib: MinecraftAccount
  accounts_start_microsoft_login: MicrosoftLoginData
  accounts_poll_microsoft_login: MicrosoftPollData
  accounts_complete_microsoft_login: MicrosoftCompleteData
  accounts_switch: void
  accounts_remove: void
  accounts_refresh_profile: void
  authlib_servers: AuthlibServer[]

  user_agreement_get: UserAgreement
  user_agreement_save: UserAgreement
  user_agreement_clear: void

  image_fetch_data_url: ImageDataUrl
  image_save_url: SelectResult
  image_read_file: ImageDataUrl
  avatar_data_url: ImageDataUrl

  select_directory: SelectResult
  select_java: SelectResult
  select_image: ImageSelection
  select_file: SelectResult
  open_folder: void

  instances_list: GameInstance[]
  launch_instance: void
  cancel_launch: void
  instance_stop: void

  plugin_list: PluginInfo[]
  plugin_info: PluginInfo
  plugin_enable: void
  plugin_disable: void
  plugin_unload: void
  plugin_reload: void
  plugin_install: void
  plugin_get_routes: PluginRoute[]
  plugin_get_slots: Record<string, PluginSlotItem[]>
  plugin_call_command: unknown
  plugin_get_settings: PluginSettingsSchema
  plugin_update_setting: void

  get_mods: ModItem[]
  toggle_mod: { enabled: boolean }
  add_mod: { filename: string }
  remove_mod: void
  open_mods_folder: SelectResult

  detect_modpack_type: ModpackTypeInfo
  import_modpack: void
  export_modpack: void
  list_resourcepacks: ResourcePack[]
  list_shaderpacks: ShaderPack[]
  list_saves: SaveEntry[]
  remove_resourcepack: void
  remove_shaderpack: void
  delete_save: void
  open_resourcepacks_folder: void
  open_shaderpacks_folder: void
  open_saves_folder: void

  search_mods: ModSearchItem[]
  get_mod_info: ModInfo
  get_mod_versions: ModVersion[]
  download_mod: void

  launcher_info: LauncherInfo
  info_card_get: InfoCardData
  list_sections: string[]
  frontend_ready: void

  config_get_all: Record<string, unknown>
  config_get_many: Record<string, unknown>

  fs_read_dir: FsEntry[]
  fs_read_file: FileContent
  fs_exists: PathInfo
  file_resolve: SelectResult
}
