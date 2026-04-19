

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errorCode?: string
  timestamp?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}



export interface LauncherConfig {
  version: string
  version_type: 'dev' | 'beta' | 'release'
  debug: boolean
}

export interface UIConfig {
  width: number
  height: number
  title: string
  background: BackgroundConfig
}

export interface BackgroundConfig {
  type: 'default' | 'local' | 'url' | 'gradient'
  path: string
  opacity: number
  blur: number
  image_base64?: string
}

export interface GamePath {
  name: string
  path: string
}

export interface GameConfig {
  minecraft_paths: (string | GamePath)[]
  java_auto?: boolean
  java_path?: string
  memory_auto?: boolean
  memory_size?: number
  fullscreen?: boolean
  java_list?: JavaInstallation[]
}

export interface JavaInstallation {
  path: string
  version: string
  major_version: number
  java_type: string
  arch: string
  sources: string[]
}

export interface SystemMemory {
  total_mb: number
  used_mb: number
  free_mb: number
  percent_used: number
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primary_color: string
  blur_amount: number
}

export interface DownloadConfig {
  mirror_source: 'official' | 'bmclapi'
  download_threads: number
}

export interface LocaleConfig {
  locale: string
}

export interface MouseEffectConfig {
  enabled: boolean
  color: string
  scale: number
  opacity: number
  speed: number
}



export interface MinecraftVersion {
  id: string
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha'
  releaseTime: string
  assetsIndex?: string
  javaVersion?: {
    component: string
    majorVersion: number
  }
  downloads: {
    client: VersionDownload
    server?: VersionDownload
  }
  localPath?: string
  installed: boolean
  installDate?: string
}

export interface VersionDownload {
  sha1: string
  size: number
  url: string
}

export interface VersionFilter {
  type?: ('release' | 'snapshot' | 'old_beta' | 'old_alpha')[]
  installed?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export interface ScannedVersion {
  folder: string
  status: 'success' | 'failure'
  loader_type: string | null
  version: string | null
  error: string | null
  path?: string
}



export interface GameInstance {
  id: string
  name: string
  version: string
  gamePath: string
  lastPlayed?: string
  playTime: number
  modCount: number
  icon?: string
  javaArgs?: string
  javaPath?: string
  memory: {
    min: number
    max: number
  }
  isRunning?: boolean
  createdAt?: string
}

export interface InstanceCreateRequest {
  name: string
  version: string
  gamePath?: string
  icon?: string
  javaArgs?: string
  memory?: {
    min: number
    max: number
  }
}



export interface ModInfo {
  id: string
  name: string
  version: string
  description?: string
  authors: string[]
  dependencies: ModDependency[]
  filePath: string
  fileSize: number
  enabled: boolean
  updateAvailable?: boolean
  latestVersion?: string
}

export interface ModDependency {
  modId: string
  versionRange: string
  optional: boolean
}

export interface ModSearchFilter {
  query?: string
  minecraftVersion?: string
  modLoader?: 'fabric' | 'forge' | 'quilt'
  category?: string
  page?: number
  pageSize?: number
}



export interface DownloadTask {
  id: string
  type: 'version' | 'mod' | 'resourcepack' | 'other'
  name: string
  url: string
  size: number
  downloaded: number
  speed: number
  progress: number
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'
  error?: string
  startTime?: number
  endTime?: number
}



export interface WindowPosition {
  x: number
  y: number
  width: number
  height: number
}



export interface ApiMethods {
  // 测试连接
  ping(): Promise<ApiResponse<{ status: string; timestamp: number }>>
  
  // 窗口控制
  minimize_window(): Promise<ApiResponse>
  close_window(): Promise<ApiResponse>
  get_window_position(): Promise<ApiResponse<WindowPosition>>
  set_window_position(position: Partial<WindowPosition>): Promise<ApiResponse>
  
  // 配置管理
  get_launcher_config(): Promise<ApiResponse<LauncherConfig>>
  get_background_config(): Promise<ApiResponse<BackgroundConfig>>
  get_background_image(): Promise<ApiResponse<{ base64: string; path: string; type: string }>>
  update_background_config(config: Partial<BackgroundConfig>): Promise<ApiResponse>
  update_background_image(image_type: string, image_path: string): Promise<ApiResponse>
  load_image_from_url(url: string): Promise<ApiResponse<{ path: string }>>
  select_local_image(): Promise<ApiResponse<{ path: string }>>
  
  get_game_config(): Promise<ApiResponse<GameConfig>>
  update_game_config(config: Partial<GameConfig>): Promise<ApiResponse>
  get_java_list(): Promise<ApiResponse<JavaInstallation[]>>
  
  get_theme_config(): Promise<ApiResponse<ThemeConfig>>
  update_theme_config(config: Partial<ThemeConfig>): Promise<ApiResponse>
  
  get_download_config(): Promise<ApiResponse<DownloadConfig>>
  update_download_config(config: Partial<DownloadConfig>): Promise<ApiResponse>
  
  // 语言配置
  get_locale_config(): Promise<ApiResponse<LocaleConfig>>
  update_locale_config(locale: string): Promise<ApiResponse>
  
  // 鼠标特效配置
  get_mouse_effect_config(): Promise<ApiResponse<MouseEffectConfig>>
  update_mouse_effect_config(config: Partial<MouseEffectConfig>): Promise<ApiResponse>
  
  // 文件选择
  select_directory(): Promise<ApiResponse<{ path: string }>>
  select_file(filters?: { name: string; extensions: string[] }[]): Promise<ApiResponse<{ path: string }>>
  
  // 版本管理
  get_minecraft_versions(filter?: VersionFilter): Promise<ApiResponse<MinecraftVersion[]>>
  scan_versions(paths: string[]): Promise<ApiResponse<ScannedVersion[]>>
  get_version_details(versionId: string): Promise<ApiResponse<MinecraftVersion>>
  install_version(versionId: string, options?: { gamePath?: string }): Promise<ApiResponse<DownloadTask>>
  uninstall_version(versionId: string): Promise<ApiResponse>
  check_version_update(versionId: string): Promise<ApiResponse<{ updateAvailable: boolean; latestVersion?: string }>>
  
  // 实例管理
  get_game_instances(): Promise<ApiResponse<GameInstance[]>>
  get_instance_details(instanceId: string): Promise<ApiResponse<GameInstance>>
  create_instance(request: InstanceCreateRequest): Promise<ApiResponse<GameInstance>>
  update_instance(instanceId: string, updates: Partial<GameInstance>): Promise<ApiResponse>
  delete_instance(instanceId: string): Promise<ApiResponse>
  launch_instance(instanceId: string): Promise<ApiResponse<{ pid?: number }>>
  
  // 模组管理
  get_instance_mods(instanceId: string): Promise<ApiResponse<ModInfo[]>>
  search_mods(filter: ModSearchFilter): Promise<PaginatedResponse<ModInfo>>
  install_mod(instanceId: string, modId: string): Promise<ApiResponse<DownloadTask>>
  uninstall_mod(instanceId: string, modId: string): Promise<ApiResponse>
  toggle_mod(instanceId: string, modId: string, enabled: boolean): Promise<ApiResponse>
  
  // 下载管理
  get_download_tasks(): Promise<ApiResponse<DownloadTask[]>>
  get_download_task(taskId: string): Promise<ApiResponse<DownloadTask>>
  pause_download_task(taskId: string): Promise<ApiResponse>
  resume_download_task(taskId: string): Promise<ApiResponse>
  cancel_download_task(taskId: string): Promise<ApiResponse>
  
  // 诊断工具
  diagnose_api(): Promise<ApiResponse<{
    environment: Record<string, any>
    apiMethods: string[]
    connectivity: boolean
  }>>
  
  // 账户管理
  get_accounts(): Promise<ApiResponse<{
    accounts: MinecraftAccount[]
    current: MinecraftAccount | null
  }>>
  get_current_account(): Promise<ApiResponse<MinecraftAccount | null>>
  add_offline_account(username: string): Promise<ApiResponse<{ account?: MinecraftAccount }>>
  start_microsoft_login(): Promise<ApiResponse<{
    status: 'pending' | 'completed' | 'error'
    userCode?: string
    verificationUri?: string
    message: string
    interval?: number
  }>>
  poll_microsoft_login(): Promise<ApiResponse<{
    status: 'pending' | 'ready' | 'error'
    message: string
    retry_after?: number
  }>>
  complete_microsoft_login(): Promise<ApiResponse<{ account?: MinecraftAccount; message: string }>>
  switch_account(accountId: string): Promise<ApiResponse>
  remove_account(accountId: string): Promise<ApiResponse>
  refresh_account_profile(accountId: string): Promise<ApiResponse>
}



export interface MinecraftAccount {
  id: string
  alias: string
  type: 'microsoft' | 'offline'
  email: string
  uuid: string
  isCurrent?: boolean
  skinUrl?: string
}