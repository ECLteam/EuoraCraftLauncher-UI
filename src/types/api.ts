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

export type JsonDict = Record<string, unknown>

// ═══════════════════════════════════════════════════════════════════
//  应用配置
// ═══════════════════════════════════════════════════════════════════

export interface LauncherConfig {
  version: string
  version_type: 'dev' | 'beta' | 'release'
  debug: boolean
  /** 由 ECL_CONFIG_launcher_showcase 环境变量控制，启用后使用 mock 数据替代真实后端 */
  showcase?: boolean
}

export interface BackgroundConfig {
  type: 'default' | 'none' | 'custom' | 'local' | 'url' | 'gradient'
  path: string
  opacity: number
  blur: number
  image_base64?: string
  mode?: 'single' | 'carousel' | 'random'
  interval?: number
  /** URL 轮播/随机模式下的图片地址列表 */
  urls?: string[]
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
  fullscreen?: boolean
  last_install_path?: string
  last_manage_path?: string
  /** 当前激活的游戏路径（用于确定启动哪个路径下的实例） */
  active_path?: string
}

/**
 * 实例路径下的 ecl.json 结构。
 * 每个 .minecraft 根目录存放一个，记录该路径下的启动实例等信息。
 */
export interface EclPathConfig {
  /** 当前路径下选中的启动实例 ID */
  activeVersion?: string
  /** 兼容旧版/别名 */
  active_version?: string
  [key: string]: unknown
}

export interface SystemMemoryInfo {
  totalMb: number
  usedMb: number
  freeMb: number
  percentUsed: number
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primary_color: string
  blur_amount: number
  sidebar_collapsed: boolean
  navigation_mode?: NavigationMode
  /** @deprecated 兼容旧配置；true 对应 sidebar，false 对应 top。 */
  titlebar_hidden: boolean
  transparent_bg: boolean
}

export type NavigationMode = 'sidebar' | 'top'

export interface DownloadConfig {
  mirror_source: 'official' | 'bmclapi'
}

export interface LocaleConfig {
  locale: string
}

export interface UiConfig {
  locale?: string
  theme?: Partial<ThemeConfig> & { background_opacity?: number }
  background?: Partial<BackgroundConfig>
}

export type ConfigSection = 'launcher' | 'game' | 'download' | 'ui' | 'locale' | 'background' | string

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
  /** 后端解析得到的原版版本类型，前端不再根据版本名称猜测 */
  versionType: Exclude<MinecraftVersionType, 'all'>
  path: string
  displayName: string
  primaryLoader: string
  loaderVersion?: string
  vanillaName: string
  requiredJava?: number | null
  hasForge: boolean
  hasNeoForge: boolean
  hasFabric: boolean
  hasQuilt: boolean
  hasOptiFine?: boolean
  isBroken: boolean
  jsonPath: string
  sourceName?: string
}

// ═══════════════════════════════════════════════════════════════════
//  实例
// ═══════════════════════════════════════════════════════════════════

export interface GameInstance {
  id: string
  name: string
  type: string
  isRunning: boolean
  version?: string
}

export interface InstallVersionResult {
  taskId: string
  versionId: string
  versionName: string
}

export interface LaunchInstanceResult {
  instanceId: string
  versionId: string
  gamePath: string
}

// ═══════════════════════════════════════════════════════════════════
//  账户
// ═══════════════════════════════════════════════════════════════════

export type AccountType = 'microsoft' | 'offline' | 'authlib'

export interface AuthlibProfile {
  id: string
  name: string
  logged_in?: boolean
}

export interface MinecraftAccount {
  id: string
  alias: string
  type: AccountType
  email?: string
  uuid?: string
  isCurrent?: boolean
  skinUrl?: string
  auth_server?: string
  profile_selection_required?: boolean
  available_profiles?: AuthlibProfile[]
}

export interface AccountListData {
  accounts: MinecraftAccount[]
  current: MinecraftAccount | null
}

export type MicrosoftLoginStage =
  'waiting_authorization' | 'authorization_confirmed' | 'minecraft_token' | 'profile' | 'saving' | 'completed'

export interface MicrosoftLoginData {
  status?: 'pending' | 'progress' | 'completed' | 'error'
  stage?: MicrosoftLoginStage
  needs_client_id?: boolean
  userCode?: string
  verificationUri?: string
  message?: string
  interval?: number
}

export interface MicrosoftLoginConfigData {
  available: boolean
  needs_client_id: boolean
}

export interface MicrosoftPollData {
  status: 'pending' | 'progress' | 'ready' | 'error'
  stage?: MicrosoftLoginStage
  message?: string
  retry_after?: number
}

export interface MicrosoftLoginStatusEvent {
  status: 'progress' | 'ready' | 'error' | 'cancelled'
  stage?: MicrosoftLoginStage
  focus?: boolean
  message?: string
}

export interface MicrosoftCompleteData {
  status?: 'pending' | 'completed'
  stage?: MicrosoftLoginStage
  success?: boolean
  account?: MinecraftAccount
  message?: string
  retry_after?: number
}

export interface AuthlibServer {
  name: string
  url: string
  email: string
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
  debug: boolean
}

export interface DebugMaintenanceResult {
  action: 'reset_launcher_data' | 'clear_plugins'
  restart_required: boolean
  targets: string[]
  backup_root: string
}

// ═══════════════════════════════════════════════════════════════════
//  页信息卡
// ═══════════════════════════════════════════════════════════════════

export type InfoCardMode = 'auto' | 'rotate' | 'announcement_first' | 'tip_only' | 'announcement_only'

export interface InfoCardAnnouncement {
  id?: string
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
  tip_title?: string
  announcement_title?: string
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
  dataUrl?: string
  base64?: string
}

export interface ImageSaveUrlResult {
  dataUrl: string
  base64: string
  url: string
  /** 后端落盘到本地数据目录后的路径（可能为空） */
  path?: string | null
}

export interface ImageSaveAsPayload {
  data_url?: string
  url?: string
  path?: string
}

export interface ImageListResult {
  files: string[]
}

export interface AvatarOptions {
  uuid: string
  account_id?: string
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
  projectId: string
  slug: string
  title: string
  displayTitle: string
  description: string
  author: string
  iconUrl?: string
  downloads: number
  follows: number
  dateModified?: string
  source: 'modrinth' | 'curseforge'
  projectUrl: string
  categories: string[]
  loaders: string[]
  gameVersions: string[]
  wiki?: McmodInfo
  alternatives: ModSourceReference[]
}

export interface ModSourceReference {
  source: 'modrinth' | 'curseforge'
  projectId: string
  slug: string
  projectUrl: string
}

export interface McmodInfo {
  id: string
  title: string
  englishName: string
  summary: string
  iconUrl?: string
  url: string
}

export interface ModSourceStatus {
  available: boolean
  error: string
  total: number
}

export interface ModSearchResult {
  items: ModSearchItem[]
  sources: Record<string, ModSourceStatus>
  total: number
  query: string
}

export interface ModInfo {
  id: string
  slug: string
  title: string
  description: string
  author: string
  body: string
  iconUrl?: string
  source: 'modrinth' | 'curseforge'
  loaders: string[]
  gameVersions: string[]
  projectUrl: string
}

export interface ModVersion {
  id: string
  projectId: string
  name: string
  versionNumber: string
  gameVersions: string[]
  loaders: string[]
  filename: string
  datePublished?: string
  downloads: number
  releaseType: 'release' | 'beta' | 'alpha'
}

export interface ModInstallResult {
  installed: Array<{ filename: string; source: string; skipped: boolean }>
  modsPath: string
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
  services: string[]
  settings?: PluginSettingSchema[]
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
  key?: string
  priority?: number
}

export interface VueSlotItem {
  plugin: string
  component_name: string
  template: string
  script: string
  style: string
}

export interface VueComponentDef {
  plugin: string
  template: string
  script: string
  style: string
}

export interface PluginSettingSchema {
  key: string
  default: unknown
  description: string
  type: 'bool' | 'string' | 'number' | 'select'
}

export interface PluginSettingsData {
  schema: PluginSettingSchema[]
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
  errorCode?: string
}

export type DownloadProgress = InstallProgress

export type LaunchPhase =
  | 'preparing'
  | 'account'
  | 'microsoft_token'
  | 'authlib_token'
  | 'offline_account'
  | 'account_ready'
  | 'authlib'
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
  errorCode?: string
}

// ═══════════════════════════════════════════════════════════════════
//  事件映射
// ═══════════════════════════════════════════════════════════════════

export type LauncherPopupLevel = 'info' | 'warning' | 'critical'

export interface LauncherPopupEvent {
  id: string
  title: string
  content: string
  level?: LauncherPopupLevel
  dismissible?: boolean
  cacheable?: boolean
  /** @deprecated 使用 cacheable；保留用于兼容已有后端事件。 */
  once?: boolean
}

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
  'launcher:error': {
    error_id: string
    title: string
    message: string
    detail?: string
  }
  'launcher:popup': LauncherPopupEvent
  'game:install_progress': InstallProgress
  'game:launch_progress': LaunchProgress
  'game:versions_changed': { gamePath: string }
  'mods:install_progress': { phase: 'resolving' | 'downloading'; projectId?: string; filename?: string }
  accounts_changed: AccountListData
  accounts_microsoft_login_status: MicrosoftLoginStatusEvent
  'plugin:status_changed': { name: string; action: string; result: string }
  'plugin:installed': { name: string }
  'plugin:css_injected': { plugin: string; css: string; key?: string | null }
  'plugin:script_injected': { plugin: string; script: string }
  'plugin:typescript_injected': { plugin: string; script: string }
  'plugin:html_injected': { plugin: string; slot: string; html: string; key?: string | null; priority?: number }
  'config:updated': { section: string; data: unknown }
  'plugin:route_registered': { plugin: string; path: string; title: string; icon?: string }
  'plugin:vue_route_registered': {
    plugin: string
    path: string
    title: string
    component_name: string
    template: string
    script: string
    style: string
    icon?: string
  }
  'plugin:vue_slot_registered': {
    plugin: string
    slot: string
    component_name: string
    template: string
    script: string
    style: string
  }
  'plugin:settings_changed': { plugin: string; key: string; old_value: unknown; new_value: unknown }
}

export type BackendEventName = keyof BackendEvents

// ═══════════════════════════════════════════════════════════════════
//  命令参数映射
// ═══════════════════════════════════════════════════════════════════

export interface CommandPayloadMap {
  ping: undefined

  // 配置
  config_get: { section: ConfigSection }
  config_set: { section: ConfigSection; data: unknown }
  config_list: undefined

  // 系统信息
  system_memory: undefined

  // Java
  java_scan: undefined
  java_list: undefined

  // 版本
  minecraft_versions: { filter_type?: string }
  minecraft_versions_classified: undefined
  fabric_versions: { game_version: string }
  forge_versions: { game_version: string }
  neoforge_versions: { game_version: string }
  optifine_versions: { game_version: string }
  quilt_versions: { game_version: string }
  scan_versions: { path?: string | string[]; force?: boolean }
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
  }
  uninstall_version: { version_id: string; game_path?: string }

  // 实例路径 ecl.json
  ecl_config_get: { game_path: string }
  ecl_config_set: { game_path: string; data: Record<string, unknown> }
  ecl_config_patch: { game_path: string; data: Record<string, unknown> }

  // 账户
  accounts_list: undefined
  accounts_current: undefined
  accounts_add_offline: { username: string; uuid?: string }
  accounts_add_authlib: {
    server_url: string
    email: string
    password: string
  }
  accounts_select_authlib_profile: { account_id: string; profile_id: string }
  authlib_resolve_server: { server_url: string }
  accounts_microsoft_login_config: undefined
  accounts_start_microsoft_login: undefined
  accounts_poll_microsoft_login: undefined
  accounts_cancel_microsoft_login: undefined
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
  // 文件 / 图片
  image_fetch_data_url: { url: string }
  image_save_url: { url: string }
  image_save_as: ImageSaveAsPayload
  image_read_file: { path: string }
  image_list_files: { path: string }
  avatar_data_url: AvatarOptions

  // 文件选择
  select_directory: undefined
  select_java: undefined
  select_image: undefined
  select_file: undefined
  open_folder: { path: string }
  open_url: { url: string }

  // 实例
  instances_list: undefined
  launch_instance: {
    version_id: string
    game_path?: string
    java_path?: string
    memory?: number
    width?: number
    height?: number
    jvm_args?: string[]
    game_args?: string[]
    version_isolation?: boolean
  }
  cancel_launch: undefined
  instance_stop: { instance_id: string }

  export_logs: { output_path?: string }

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
  plugin_get_vue_slots: Record<string, never>
  plugin_get_vue_components: Record<string, never>
  plugin_call_command: { command: string; params?: Record<string, unknown> }
  plugin_get_settings: { plugin_name: string }
  plugin_update_setting: { plugin_name: string; key: string; value: unknown }
  plugin_notify_sidebar_state: { collapsed: boolean }

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
    source: 'modrinth' | 'curseforge'
    file_id: string
    game_path: string
    instance_id: string
    game_version?: string
    loader_type?: string
  }

  // 启动器信息 / 页信息卡
  launcher_info: undefined
  info_card_get: undefined
  list_sections: undefined
  debug_reset_launcher_data: undefined
  debug_clear_plugins: undefined
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

  config_get: unknown
  config_set: void
  config_list: string[]

  system_memory: SystemMemoryInfo

  java_scan: JavaInstallation[]
  java_list: JavaInstallation[]

  minecraft_versions: MinecraftVersion[]
  minecraft_versions_classified: MinecraftVersionCatalog
  fabric_versions: string[]
  forge_versions: string[]
  neoforge_versions: string[]
  optifine_versions: string[]
  quilt_versions: string[]
  scan_versions: ScannedVersion[]
  install_version: InstallVersionResult
  uninstall_version: void

  ecl_config_get: Record<string, unknown>
  ecl_config_set: void
  ecl_config_patch: Record<string, unknown>

  accounts_list: AccountListData
  accounts_current: MinecraftAccount | null
  accounts_add_offline: MinecraftAccount
  accounts_add_authlib: MinecraftAccount
  accounts_select_authlib_profile: MinecraftAccount
  authlib_resolve_server: string
  accounts_microsoft_login_config: MicrosoftLoginConfigData
  accounts_start_microsoft_login: MicrosoftLoginData
  accounts_poll_microsoft_login: MicrosoftPollData
  accounts_cancel_microsoft_login: void
  accounts_complete_microsoft_login: MicrosoftCompleteData
  accounts_switch: void
  accounts_remove: void
  accounts_refresh_profile: void
  authlib_servers: AuthlibServer[]

  user_agreement_get: UserAgreement
  user_agreement_save: UserAgreement
  user_agreement_clear: void

  image_fetch_data_url: ImageDataUrl
  image_save_url: ImageSaveUrlResult
  image_save_as: SelectResult
  image_read_file: ImageDataUrl
  image_list_files: ImageListResult
  avatar_data_url: ImageDataUrl

  select_directory: SelectResult
  select_java: SelectResult
  select_image: ImageSelection
  select_file: SelectResult
  open_folder: void
  open_url: void

  instances_list: GameInstance[]
  launch_instance: LaunchInstanceResult
  cancel_launch: void
  export_logs: { path: string }
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
  plugin_get_vue_slots: Record<string, VueSlotItem[]>
  plugin_get_vue_components: Record<string, VueComponentDef>
  plugin_call_command: unknown
  plugin_get_settings: PluginSettingsData
  plugin_update_setting: void
  plugin_notify_sidebar_state: void

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

  search_mods: ModSearchResult
  get_mod_info: ModInfo
  get_mod_versions: ModVersion[]
  download_mod: ModInstallResult

  launcher_info: LauncherInfo
  info_card_get: InfoCardData
  list_sections: string[]
  debug_reset_launcher_data: DebugMaintenanceResult
  debug_clear_plugins: DebugMaintenanceResult
  frontend_ready: void

  config_get_all: Record<string, unknown>
  config_get_many: Record<string, unknown>

  fs_read_dir: FsEntry[]
  fs_read_file: FileContent
  fs_exists: PathInfo
  file_resolve: SelectResult
}
