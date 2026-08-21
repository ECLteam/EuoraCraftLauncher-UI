/**
 * 前端定义的数据结构、命令参数/响应映射与事件映射。
 *
 * 后端不关心这些字段的具体含义，只负责存/取 JSON。
 * 社区替换前端时，可以自由增删字段，不需要改后端代码。
 *
 * ── IPC 命令名单一来源 ──────────────────────────────────────────────
 * 本文件导出的 `COMMAND_NAMES` 是前端唯一权威的命令名字符串来源：
 * 所有调用方（如 features/connect/api/connectorApi.ts）必须引用它，
 * 禁止在业务代码中散落硬编码命令名。`CommandPayloadMap` /
 * `CommandResponseMap` 的键与 `COMMAND_NAMES` 一一对应，由文件内
 * `commandNamesAlignedWithPayloadMap` 的编译期断言保证二者永不脱钩
 * （`pnpm typecheck` 即完成校验）。
 *
 * 后端侧权威是 `ECL/api/registry.py::COMMAND_NAMES`：`ECL/api/connector.py`
 * 等处理器方法名通过 `command_handlers()` 的 getattr 动态绑定引用之；
 * `ECL/api/models.py::REQUEST_MODELS` 的键在 `request_schemas()` 中强制
 * 校验必须落在 registry 已注册命令集合内。前后端命令名对齐的自动验证脚本：
 * `frontend/scripts/check-command-alignment.mjs`（pnpm check:commands）。
 *
 * ── DTO 与后端模型对齐 ──────────────────────────────────────────────
 * 请求体结构（`CommandPayloadMap` 中带参数的命令）与后端 `ECL/api/models.py`
 * 的 Pydantic RequestModel 对应。后端 `request_schemas()` 可导出 JSON Schema
 * 作为字段权威参考；后端模型为 extra="forbid"，前端多传的字段会被拒绝，
 * 因此新增/修改跨端 DTO 时必须同步更新后端 models.py 与本文件。
 */

// ═══════════════════════════════════════════════════════════════════
//  通用响应
// ═══════════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errorCode?: string
  presentation?: 'message' | 'modal'
  errorId?: string
  title?: string
  detail?: string
  timestamp?: number
}

export type JsonDict = Record<string, unknown>

// ═══════════════════════════════════════════════════════════════════
//  应用配置
// ═══════════════════════════════════════════════════════════════════

export interface LauncherConfig {
  version?: string
  version_type?: 'dev' | 'beta' | 'release'
  debug?: boolean
  /** 由 ECL_CONFIG_launcher_showcase 环境变量控制，启用后使用 mock 数据替代真实后端 */
  showcase?: boolean
  disable_ssl_verify?: boolean
  /** 忽略系统/环境代理，让所有网络请求直连 */
  ignore_proxy?: boolean
  /** 单次网络请求的总超时秒数 */
  request_timeout?: number
  /** 首次请求失败后允许的额外重试次数 */
  request_retries?: number
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
  /** 手动指定 Qomicex instances.json；为空时由后端自动探测。 */
  qomicex_instances_path?: string
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

export interface ThemeAppearanceConfig {
  /** 卡片圆角（px） */
  radius_card?: number
  /** 控件圆角（px） */
  radius_control?: number
  /** 对话框圆角（px） */
  radius_dialog?: number
  /** 卡片不透明度（0-100） */
  card_opacity?: number
  /** 界面字体族（CSS font-family 值） */
  font_family?: string
}

export interface ThemeScheduleConfig {
  enabled?: boolean
  /** 进入深色时间 'HH:MM' */
  dark_start?: string
  /** 离开深色时间 'HH:MM' */
  dark_end?: string
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  /** 内置皮肤：classic（经典）或 folia（花叶）。 */
  theme_id?: 'classic' | 'folia'
  primary_color: string
  blur_amount: number
  sidebar_collapsed: boolean
  navigation_mode?: NavigationMode
  /** @deprecated 兼容旧配置；true 对应 sidebar，false 对应 top。 */
  titlebar_hidden: boolean
  transparent_bg: boolean
  background_opacity?: number
  appearance?: ThemeAppearanceConfig
  schedule?: ThemeScheduleConfig
}

export interface WindowBounds {
  x?: number
  y?: number
  width?: number
  height?: number
  monitor?: string
}

export interface WindowMetadata {
  label: string
  descriptorId: string
  windowType: 'main' | 'plugin' | string
  plugin?: string | null
  sessionId?: string | null
  singleton: boolean
  followMain: boolean
  dataSchema: { read?: string[]; write?: string[] }
  ready: boolean
  bounds?: WindowBounds
}

export type NavigationMode = 'sidebar' | 'top'

export interface DownloadConfig {
  mirror_source: 'official' | 'bmclapi'
  /** 按资源类型记忆的「上一次安装实例」缓存：key 为资源类型(mod/resourcepack/shaderpack/datapack/world) */
  resourceInstallCache?: Record<string, { gamePath: string; versionId: string }>
  /** 按资源类型记忆的「另存为」目录。 */
  resourceSaveDirectories?: Record<string, string>
}

export interface LocaleConfig {
  locale: string
}

export interface UiConfig {
  locale?: string
  debug?: boolean
  flowDebug?: boolean
  theme?: Partial<ThemeConfig>
  background?: Partial<BackgroundConfig>
  windows?: Record<string, WindowBounds>
  instanceManager?: {
    viewMode?: 'card' | 'list'
    sortKey?: InstanceSortKey
    sortDirection?: 'asc' | 'desc'
  }
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

export type InstanceExternalSource = string
export type InstanceSortKey = 'lastLaunchedAt' | 'totalRunDurationSeconds' | 'launchCount' | 'name' | 'gameVersion'

export interface InstanceIconConfig {
  type: 'builtin' | 'loader' | 'local' | 'external' | 'data'
  value: string
  source?: string
}

export interface InstanceCategory {
  id: string
  name: string
  color: string
  order: number
  builtin: boolean
}

export interface InstanceExternalSourceOption {
  source: string
  title: string
  plugin: string
}

export interface InstanceProfile {
  schemaVersion: number
  alias?: string
  description?: string
  favorite?: boolean
  pinned?: boolean
  hidden?: boolean
  categoryId?: string
  tags?: string[]
  icon?: InstanceIconConfig
  cover?: InstanceIconConfig
  pinOrder?: number
  preferredExternalSource?: InstanceExternalSource
}

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
  alias?: string
  description?: string
  favorite?: boolean
  pinned?: boolean
  hidden?: boolean
  categoryId?: string
  tags?: string[]
  icon?: InstanceIconConfig
  cover?: InstanceIconConfig
  pinOrder?: number
  fieldSources?: Record<string, string>
  profileOverrides?: string[]
  preferredExternalSource?: InstanceExternalSource
  availableSources?: string[]
  externalSourceOptions?: InstanceExternalSourceOption[]
  sourceWarnings?: string[]
  launchCount?: number
  lastRunDurationSeconds?: number
  totalRunDurationSeconds?: number
  lastLaunchedAt?: string | null
}

// ═══════════════════════════════════════════════════════════════════
//  实例
// ═══════════════════════════════════════════════════════════════════

export interface GameInstance {
  id: string
  name: string
  type: string
  isRunning: boolean
  pid?: number | null
  version?: string
  versionId: string
  loader?: string | null
  gamePath: string
}

// ================================================================
//  联机
// ================================================================

export type ConnectorMode = 'idle' | 'starting' | 'host' | 'guest'

export interface ConnectorPlayer {
  name: string
  vendor: string
  iconBase64: string | null
  kind: 'host' | 'guest'
  machineId: string
}

export interface ConnectorGameInfo {
  gameVersion: string
  loader: string | null
  loaderVersion: string | null
}

export interface ConnectorStatus {
  mode: ConnectorMode
  roomCode: string | null
  mcHost: string | null
  mcPort: number | null
  gameInfo: ConnectorGameInfo | null
  players: ConnectorPlayer[]
  nodes: string[]
  error: string | null
}

export interface EasyTierStatus {
  installed: boolean
  status: 'idle' | 'resolving' | 'downloading' | 'extracting' | 'installed' | 'failed'
  progress: number
  speed: number
  error: string | null
}

export interface NatTypeResult {
  type: 'cone' | 'symmetric' | 'blocked' | 'unknown'
  detailType:
    | 'openInternet'
    | 'noPat'
    | 'fullCone'
    | 'restricted'
    | 'portRestricted'
    | 'symmetricEasy'
    | 'symmetric'
    | 'symmetricFirewall'
    | 'udpBlocked'
    | 'unknown'
  publicIp: string | null
  publicPort: number | null
  publicPortEnd: number | null
  supportsIpv6: boolean
}

export interface ConnectorModEntry {
  source: string
  id: string
  hash: string
  name: string
}

export interface ConnectorMatchedInstance {
  gamePath: string
  versionId: string
  name: string
  gameVersion: string
  loader: string | null
  loaderVersion: string | null
  matched: boolean
  modCount: number
}

export interface ConnectorMatchResult {
  mods: ConnectorModEntry[]
  instances: ConnectorMatchedInstance[]
}

export interface VersionRunStats {
  launchCount: number
  lastRunDurationSeconds: number
  totalRunDurationSeconds: number
  lastLaunchedAt?: string | null
  externalSnapshots?: Record<string, Record<string, unknown>>
}

export interface InstanceTargetPayload {
  game_path: string
  version_id: string
  version_isolation?: boolean
}

export interface GameOperation {
  operationId: string
  kind?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  percent?: number
  message?: string
  result?: unknown
  error?: string | null
  errorCode?: string | null
}

export interface WorldEntry {
  id: string
  name: string
  path: string
  iconPath?: string | null
  gameMode?: string
  gameModeId?: number
  difficulty?: string
  difficultyId?: number
  difficultyLocked?: boolean
  allowCommands?: boolean
  version?: string
  seed?: string
  lastPlayedAt?: string | null
  modifiedAt?: string
  createdAt?: string
  error?: string
}

export interface ScreenshotEntry {
  id: string
  name: string
  path: string
  width: number
  height: number
  size: number
  modifiedAt: string
  dateGroup: string
  thumbnailUrl?: string
}

export interface ServerEntry {
  id: string
  name: string
  address: string
  icon?: string | null
  favorite: boolean
  order: number
}

export interface ServerStatus {
  address: string
  online: boolean
  latency?: number
  playersOnline?: number
  playersMax?: number
  version?: string
  protocol?: number
  motd?: string
  icon?: string | null
  error?: string
}

export type GameResourceType = 'mod' | 'resourcepack' | 'shaderpack' | 'datapack' | 'schematic'

export interface GameResource {
  id: string
  type: GameResourceType
  path: string
  name: string
  version?: string
  loader?: string
  enabled: boolean
  size: number
  modifiedAt: string
  sha512?: string | null
  source: string
  sourceProjectId?: string | null
  duplicateHash?: boolean
  duplicateProjectId?: boolean
  missingDependencies?: string[]
}

export type CrashConfidence = 'certain' | 'likely' | 'possible'

export interface CrashReason {
  code: string
  confidence: CrashConfidence
  evidence: string[]
  parameters: Record<string, unknown>
}

export interface CrashAnalysisResult {
  reportId: string
  versionId: string
  exitCode?: number | null
  detectedBy: string[]
  reasons: CrashReason[]
  sourceFiles: string[]
  hasOutput: boolean
}

export interface GameInstancesChangedEvent {
  action: 'started' | 'exited' | 'stopped'
  instanceId: string
  versionId: string
  gamePath: string
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

export type AccountType = 'microsoft' | 'offline' | 'authlib' | 'plugin'

export interface AuthlibProfile {
  id: string
  name: string
  logged_in?: boolean
}

export interface AuthField {
  key: string
  label: string
  type: string
  required: boolean
  placeholder: string
}

export interface AuthProvider {
  id: string
  title: string
  description: string
  fields: AuthField[]
}

export interface MinecraftAccount {
  id: string
  alias: string
  type: AccountType
  email?: string
  uuid?: string
  isCurrent?: boolean
  favorite?: boolean
  pinned?: boolean
  skinUrl?: string
  skinId?: string
  capes?: MicrosoftCape[]
  auth_server?: string
  provider?: string
  providerTitle?: string
  profile_selection_required?: boolean
  available_profiles?: AuthlibProfile[]
}

export interface DefaultSkin {
  id: string
  name: string
  skinUrl: string
}

export interface MicrosoftCape {
  id: string
  name?: string
  state: string
  url: string
}

export type WardrobeKind = 'skin' | 'cape'
export type SkinModel = 'classic' | 'slim'

export interface WardrobeItem {
  id: string
  kind: WardrobeKind
  name: string
  model: SkinModel | null
  favorite: boolean
  width: number
  height: number
  byteSize: number
  sha256: string
  createdAt: string
  updatedAt: string
}

export interface WardrobeImportResult {
  item: WardrobeItem
  deduplicated: boolean
}

export interface AccountTextures {
  skinUrl?: string
  capeUrl?: string
  skinModel?: SkinModel
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

export interface AuthlibLoginConfigData {
  available: boolean
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
  display_name: string
  english_name: string
  mcmod_url: string
  version: string
  author: string
  loader_type: string
  game_version: string
  project_id: string
  dependencies: string[]
  enabled: boolean
  size: number
  modified_at: string
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
  resourceType?: string
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

export interface ModSourceConfig {
  curseforge: { available: boolean }
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
  code: string
  source: 'modrinth' | 'curseforge'
  resourceType?: string
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
  dependencies?: ModDependency[]
}

export interface ModDependency {
  versionId?: string | null
  projectId?: string | null
  filename?: string | null
  dependencyType: 'required' | 'optional' | 'incompatible' | 'embedded' | string
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
  contributes?: {
    themeNodes?: Array<string | Record<string, unknown>>
    windows?: Array<Record<string, unknown>>
  }
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
  contextKey?: string
}

export interface VueSlotItem {
  plugin: string
  component_name: string
  template: string
  script: string
  style: string
  contextKey?: string
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
  /** 进度模式：'bytes' 表示 done/total 为字节数，'files' 表示文件数 */
  progress_type?: 'bytes' | 'files'
  /** 下载文件总数 */
  total_files?: number
  /** 已下载文件数 */
  downloaded_files?: number
  /** 当前下载速度，字节/秒 */
  speed?: number
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

export interface LauncherErrorEvent {
  error_id: string
  title: string
  message: string
  detail?: string
  kind?: 'game_crash'
  crash?: CrashAnalysisResult
}

export interface TerminalLogEntry {
  time: string
  level: string
  logger: string
  filename: string
  lineno: number
  message: string
}

// ═══════════════════════════════════════════════════════════════════
//  子进程实例
// ═══════════════════════════════════════════════════════════════════

/** 后端登记的一个子进程实例（由插件经 ProcessService 启动） */
export interface ProcessInstance {
  id: string
  name: string
  type: string
  pid: number | null
  /** 是否开启标准输入管道（可交互） */
  stdin: boolean
  running: boolean
  /** 该实例最近输出行（环形，最多 BUFFER_LIMIT 条，旧在前新在后） */
  lines: string[]
}

/** 实时推送的某实例单行输出 */
export interface ProcessLogEntry {
  instanceId: string
  name: string
  type: string
  line: string
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
  'launcher:error': LauncherErrorEvent
  'launcher:popup': LauncherPopupEvent
  'launcher:log': TerminalLogEntry
  'process:instance_log': ProcessLogEntry
  'process:instances_changed': ProcessInstance[]
  'game:install_progress': InstallProgress
  'game:launch_progress': LaunchProgress
  'game:operation_progress': GameOperation
  'game:versions_changed': { gamePath: string }
  'game:instances_changed': GameInstancesChangedEvent
  'mods:install_progress': { phase: 'resolving' | 'downloading'; projectId?: string; filename?: string }
  accounts_changed: AccountListData
  accounts_microsoft_login_status: MicrosoftLoginStatusEvent
  'plugin:status_changed': { name: string; action: string; result: string }
  'plugin:installed': { name: string }
  'plugin:css_injected': { plugin: string; css: string; key?: string | null }
  'plugin:script_injected': { plugin: string; script: string }
  'plugin:typescript_injected': { plugin: string; script: string }
  'plugin:html_injected': {
    plugin: string
    slot: string
    html: string
    key?: string | null
    priority?: number
    contextKey?: string
  }
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
    contextKey?: string
  }
  'plugin:settings_changed': { plugin: string; key: string; old_value: unknown; new_value: unknown }
  'window:opened': WindowMetadata
  'window:ready': WindowMetadata
  'window:closed': Partial<WindowMetadata> & { label: string }
}

export type BackendEventName = keyof BackendEvents

// ═══════════════════════════════════════════════════════════════════
//  命令参数映射
// ═══════════════════════════════════════════════════════════════════

export interface CommandPayloadMap {
  system_ping: undefined
  launcher_errors_pending: undefined
  launcher_errors_ack: { error_ids: string[] }

  // 配置
  settings_get: { section?: ConfigSection; sections?: ConfigSection[] } | undefined
  settings_set: { section: ConfigSection; data: unknown }

  // 受控窗口
  window_list: undefined
  window_open: { descriptor_id: string; session_id?: string; instance_key?: string }
  window_focus: { label: string }
  window_close: { label: string }
  window_update_bounds: { label: string } & WindowBounds

  // 前端日志上报
  frontend_log: { level: 'warn' | 'error'; message: string; detail?: string; logger?: string }

  // 系统信息
  system_memory: undefined

  // 联机（当前仅声明前端契约，后端实现后直接接入）
  connector_status: undefined
  connector_host_port: { port: number }
  connector_host_instance: InstanceTargetPayload
  connector_join: { code: string }
  connector_leave: undefined
  connector_kick: { machine_id: string }
  connector_match_instances: undefined
  connector_easytier_status: undefined
  connector_easytier_download: undefined
  connector_detect_ports: undefined
  connector_search_mc_port: { ports: number[] }
  connector_nat_type: undefined

  // Java
  game_java_scan: { paths?: string[] } | undefined

  // 版本
  game_versions: { filter_type?: string; classified?: boolean; source?: 'official' | 'bmclapi' } | undefined
  game_loader_versions: {
    loader: 'fabric' | 'forge' | 'neoforge' | 'quilt'
    game_version: string
    source?: 'official' | 'bmclapi'
  }
  game_fabric_api_versions: {
    loader: 'fabric'
    game_version: string
  }
  game_scan: { paths?: string[]; force?: boolean }
  game_install: {
    version_id: string
    version_name?: string
    loader_type?: 'fabric' | 'forge' | 'neoforge' | 'quilt'
    loader_version?: string
    fabric_api_version?: string
    task_id?: string
    game_path: string
    java_path?: string
    source?: 'official' | 'bmclapi'
  }
  game_uninstall: { version_id: string; game_path: string }

  // 实例路径 ecl.json
  game_config_get: { game_path: string }
  game_config_set: { game_path: string; data: Record<string, unknown> }
  game_config_patch: { game_path: string; patch: Record<string, unknown> }

  // 账户
  accounts_list: undefined
  accounts_current: undefined
  accounts_auth_providers: undefined
  accounts_add_plugin: { provider_id: string; values: Record<string, string> }
  accounts_add_offline: { username: string; uuid?: string; skin?: string }
  accounts_default_skins: undefined
  accounts_set_offline_skin: { account_id: string; skin?: string }
  accounts_add_authlib: {
    server_url: string
    email: string
    password: string
  }
  accounts_select_authlib_profile: { account_id: string; profile_id: string }
  authlib_resolve_server: { server_url: string }
  accounts_microsoft_login_config: undefined
  accounts_authlib_login_config: undefined
  accounts_start_microsoft_login: undefined
  accounts_poll_microsoft_login: undefined
  accounts_cancel_microsoft_login: undefined
  accounts_complete_microsoft_login: undefined
  accounts_switch: { account_id: string }
  accounts_remove: { account_id: string }
  accounts_set_favorite: { account_id: string; favorite: boolean }
  accounts_set_pinned: { account_id: string; pinned: boolean }
  accounts_refresh_profile: { account_id: string }
  accounts_texture_urls: { account_id: string }
  wardrobe_list: undefined
  wardrobe_sync_account_skin: { account_id: string }
  wardrobe_import: {
    path: string
    kind: WardrobeKind
    name?: string
    model?: SkinModel
  }
  wardrobe_update: { item_id: string; name?: string; model?: SkinModel; favorite?: boolean }
  wardrobe_delete: { item_id: string }
  wardrobe_texture: { item_id: string }
  wardrobe_export: { item_id: string }
  wardrobe_apply_skin: { item_id: string; account_id: string }
  microsoft_reset_skin: { account_id: string }
  microsoft_set_cape: { account_id: string; cape_id: string }
  microsoft_reset_cape: { account_id: string }

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

  // 文件选择
  select_directory: undefined
  select_java: undefined
  select_image: { purpose?: 'background' | 'skin' | 'cape' | 'instance_icon' } | undefined
  select_file: { purpose?: 'crash-analysis' | 'modpack' | 'world-import' | 'theme-preset' } | undefined
  select_files: { purpose?: 'resource-files' }
  select_save_file: {
    purpose:
      | 'crash-report'
      | 'launcher-logs'
      | 'world-export'
      | 'instance-export'
      | 'resource-manifest'
      | 'screenshot'
      | 'mod-file'
      | 'theme-preset'
    default_directory?: string
    default_name?: string
  }
  open_folder: { path: string }
  open_url: { url: string }

  // 实例
  game_instances: undefined
  game_version_stats: { game_path: string; version_id: string }
  game_version_settings_get: { game_path: string; version_id: string }
  game_version_settings_set: { game_path: string; version_id: string; data: unknown }
  game_instance_profile_get: { game_path: string; version_id: string }
  game_instance_profile_patch: {
    game_path: string
    version_id: string
    patch: Partial<Omit<InstanceProfile, 'schemaVersion' | 'icon'>>
  }
  game_instance_profile_reset: { game_path: string; version_id: string; fields: string[] }
  game_instance_icon_set: {
    game_path: string
    version_id: string
    icon_type: 'auto' | 'builtin' | 'loader' | 'local'
    value?: string
    source_path?: string
  }
  game_instance_pin_order_set: { entries: Array<{ game_path: string; version_id: string }> }
  game_instance_categories_get: undefined
  game_instance_categories_upsert: { category_id?: string; name: string; color: string; order?: number }
  game_instance_categories_delete: { category_id: string }
  game_instance_folder_open: InstanceTargetPayload & {
    folder: 'instance' | 'mods' | 'saves' | 'screenshots' | 'logs' | 'crash-reports'
  }
  game_instance_clone: InstanceTargetPayload & { new_version_id: string }
  game_instance_import: { game_path: string; source_path: string; new_version_id: string }
  game_instance_export: InstanceTargetPayload & {
    output_path: string
    pack_format: 'ecl' | 'modrinth' | 'curseforge'
    includes?: string[]
  }
  game_instance_files_check: InstanceTargetPayload
  game_instance_files_repair: InstanceTargetPayload
  game_instance_delete_to_trash: InstanceTargetPayload
  game_operation_get: { operation_id: string }
  game_operation_cancel: { operation_id: string }
  game_world_list: InstanceTargetPayload
  game_world_detail: InstanceTargetPayload & { world_id: string }
  game_world_patch: InstanceTargetPayload & {
    world_id: string
    patch: { difficulty?: number; allowCommands?: boolean; difficultyLocked?: boolean }
  }
  game_world_copy: InstanceTargetPayload & { world_id: string; new_world_id: string }
  game_world_import: InstanceTargetPayload & { source_path: string }
  game_world_export: InstanceTargetPayload & { world_id: string; output_path: string }
  game_world_icon_set: InstanceTargetPayload & { world_id: string; source_path: string }
  game_world_delete_to_trash: InstanceTargetPayload & { world_id: string }
  game_world_backup_list: InstanceTargetPayload & { world_id: string }
  game_world_backup_create: InstanceTargetPayload & { world_id: string }
  game_world_backup_restore: InstanceTargetPayload & { world_id: string; backup_id: string }
  game_world_backup_lock: InstanceTargetPayload & { world_id: string; backup_id: string; locked: boolean }
  game_world_backup_delete_to_trash: InstanceTargetPayload & { world_id: string; backup_id: string }
  game_screenshot_list: InstanceTargetPayload
  game_screenshot_thumbnail: InstanceTargetPayload & { screenshot_id: string; size?: number }
  game_screenshot_copy: InstanceTargetPayload & { screenshot_id: string }
  game_screenshot_save_as: InstanceTargetPayload & { screenshot_id: string; output_path: string }
  game_screenshot_delete_to_trash: InstanceTargetPayload & { screenshot_id: string }
  game_screenshot_set_cover: InstanceTargetPayload & { screenshot_id: string }
  game_screenshot_set_background: InstanceTargetPayload & { screenshot_id: string }
  game_server_list: InstanceTargetPayload
  game_server_upsert: InstanceTargetPayload & { server_id?: string; name: string; address: string; favorite?: boolean }
  game_server_delete: InstanceTargetPayload & { server_id: string }
  game_server_reorder: InstanceTargetPayload & { server_ids: string[] }
  game_server_status_refresh: { addresses: string[]; timeout?: number }
  game_resource_list: InstanceTargetPayload & { resource_type: GameResourceType; world_id?: string }
  game_resource_install: InstanceTargetPayload & {
    resource_type: GameResourceType
    source_paths: string[]
    world_id?: string
  }
  game_resource_toggle: InstanceTargetPayload & {
    resource_type: GameResourceType
    resource_id: string
    enabled: boolean
    world_id?: string
  }
  game_resource_delete_to_trash: InstanceTargetPayload & {
    resource_type: GameResourceType
    resource_ids: string[]
    world_id?: string
  }
  game_resource_manifest_export: InstanceTargetPayload & {
    resource_type: GameResourceType
    output_path: string
    output_format: 'json' | 'csv'
    world_id?: string
  }
  game_resource_search: {
    query: string
    game_version: string
    loader: string
    source?: 'modrinth' | 'curseforge'
    limit?: number
  }
  game_resource_identify: { sha512: string }
  game_resource_update_check: InstanceTargetPayload & {
    resource_type: GameResourceType
    game_version: string
    loader: string
    world_id?: string
  }
  game_resource_update: InstanceTargetPayload & {
    resource_type: GameResourceType
    resource_id: string
    update: Record<string, unknown>
    world_id?: string
  }
  game_launch: {
    version_id: string
    game_path: string
    java_path?: string
    memory?: number
    width?: number
    height?: number
    jvm_args?: string[]
    game_args?: string[]
    version_isolation?: boolean
    quick_target?: { type: 'world'; world_id: string } | { type: 'server'; address: string }
  }
  game_launch_cancel: undefined
  game_instance_stop: { instance_id: string }
  game_crash_analyze: { file_path: string; game_path: string; version_id: string }
  game_crash_output: { report_id: string }
  game_crash_export: { report_id: string; output_path?: string }

  export_logs: { output_path?: string }
  logs_get_history: undefined

  // 子进程实例
  process_instances: undefined
  process_input: { instance_id: string; data: string }
  process_stop: { instance_id: string; force?: boolean }
  debug_process_spawn: {
    name: string
    type: string
    args: string[]
    cwd?: string
    stdin?: boolean
  }

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
    resource_type?: string
    limit?: number
    offset?: number
    sort?: string
  }
  mod_source_config: undefined
  get_mod_info: { mod_id: string; source: string; resource_type?: string }
  get_mod_versions: {
    mod_id: string
    source: string
    game_version?: string
    loader_type?: string
    resource_type?: string
  }
  download_mod: {
    mod_id: string
    source: 'modrinth' | 'curseforge'
    file_id: string
    game_path: string
    instance_id: string
    game_version?: string
    loader_type?: string
    resource_type?: string
    world_id?: string
    task_id?: string
  }
  download_mod_to_path: {
    mod_id: string
    source: 'modrinth' | 'curseforge'
    file_id: string
    save_path: string
    resource_type?: string
    task_id?: string
  }

  // 启动器信息 / 页信息卡
  launcher_info: undefined
  info_card_get: undefined
  debug_reset_launcher_data: undefined
  debug_clear_plugins: undefined
  debug_devtools_open: undefined
  frontend_ready: { window_type?: 'main' | 'plugin'; session_id?: string } | undefined

  // 文件系统
  fs_read_dir: { path: string }
  fs_read_file: { path: string; mode?: 'text' | 'base64' }
  fs_exists: { path: string }

  // 文件路径
  file_resolve: { path: string }
}

export type CommandName = keyof CommandPayloadMap

// ═══════════════════════════════════════════════════════════════════
//  命令名单一权威来源（运行时字符串）
// ═══════════════════════════════════════════════════════════════════
// 前端所有 IPC 调用必须引用这里的字符串，禁止硬编码散落。
// 键与 CommandPayloadMap / CommandResponseMap 一一对应，
// 由下方 commandNamesAlignedWithPayloadMap 编译期断言强制同步。
// 后端对应权威：ECL/api/registry.py::COMMAND_NAMES。

export const COMMAND_NAMES = {
  system_ping: 'system_ping',
  launcher_errors_pending: 'launcher_errors_pending',
  launcher_errors_ack: 'launcher_errors_ack',
  settings_get: 'settings_get',
  settings_set: 'settings_set',
  window_list: 'window_list',
  window_open: 'window_open',
  window_focus: 'window_focus',
  window_close: 'window_close',
  window_update_bounds: 'window_update_bounds',
  frontend_log: 'frontend_log',
  system_memory: 'system_memory',
  connector_status: 'connector_status',
  connector_host_port: 'connector_host_port',
  connector_host_instance: 'connector_host_instance',
  connector_join: 'connector_join',
  connector_leave: 'connector_leave',
  connector_kick: 'connector_kick',
  connector_match_instances: 'connector_match_instances',
  connector_easytier_status: 'connector_easytier_status',
  connector_easytier_download: 'connector_easytier_download',
  connector_detect_ports: 'connector_detect_ports',
  connector_search_mc_port: 'connector_search_mc_port',
  connector_nat_type: 'connector_nat_type',
  game_java_scan: 'game_java_scan',
  game_versions: 'game_versions',
  game_loader_versions: 'game_loader_versions',
  game_fabric_api_versions: 'game_fabric_api_versions',
  game_scan: 'game_scan',
  game_install: 'game_install',
  game_uninstall: 'game_uninstall',
  game_config_get: 'game_config_get',
  game_config_set: 'game_config_set',
  game_config_patch: 'game_config_patch',
  accounts_list: 'accounts_list',
  accounts_current: 'accounts_current',
  accounts_auth_providers: 'accounts_auth_providers',
  accounts_add_plugin: 'accounts_add_plugin',
  accounts_add_offline: 'accounts_add_offline',
  accounts_default_skins: 'accounts_default_skins',
  accounts_set_offline_skin: 'accounts_set_offline_skin',
  accounts_add_authlib: 'accounts_add_authlib',
  accounts_select_authlib_profile: 'accounts_select_authlib_profile',
  authlib_resolve_server: 'authlib_resolve_server',
  accounts_microsoft_login_config: 'accounts_microsoft_login_config',
  accounts_authlib_login_config: 'accounts_authlib_login_config',
  accounts_start_microsoft_login: 'accounts_start_microsoft_login',
  accounts_poll_microsoft_login: 'accounts_poll_microsoft_login',
  accounts_cancel_microsoft_login: 'accounts_cancel_microsoft_login',
  accounts_complete_microsoft_login: 'accounts_complete_microsoft_login',
  accounts_switch: 'accounts_switch',
  accounts_remove: 'accounts_remove',
  accounts_set_favorite: 'accounts_set_favorite',
  accounts_set_pinned: 'accounts_set_pinned',
  accounts_refresh_profile: 'accounts_refresh_profile',
  accounts_texture_urls: 'accounts_texture_urls',
  wardrobe_list: 'wardrobe_list',
  wardrobe_sync_account_skin: 'wardrobe_sync_account_skin',
  wardrobe_import: 'wardrobe_import',
  wardrobe_update: 'wardrobe_update',
  wardrobe_delete: 'wardrobe_delete',
  wardrobe_texture: 'wardrobe_texture',
  wardrobe_export: 'wardrobe_export',
  wardrobe_apply_skin: 'wardrobe_apply_skin',
  microsoft_reset_skin: 'microsoft_reset_skin',
  microsoft_set_cape: 'microsoft_set_cape',
  microsoft_reset_cape: 'microsoft_reset_cape',
  authlib_servers: 'authlib_servers',
  user_agreement_get: 'user_agreement_get',
  user_agreement_save: 'user_agreement_save',
  user_agreement_clear: 'user_agreement_clear',
  image_fetch_data_url: 'image_fetch_data_url',
  image_save_url: 'image_save_url',
  image_save_as: 'image_save_as',
  image_read_file: 'image_read_file',
  image_list_files: 'image_list_files',
  select_directory: 'select_directory',
  select_java: 'select_java',
  select_image: 'select_image',
  select_file: 'select_file',
  select_files: 'select_files',
  select_save_file: 'select_save_file',
  open_folder: 'open_folder',
  open_url: 'open_url',
  game_instances: 'game_instances',
  game_version_stats: 'game_version_stats',
  game_version_settings_get: 'game_version_settings_get',
  game_version_settings_set: 'game_version_settings_set',
  game_instance_profile_get: 'game_instance_profile_get',
  game_instance_profile_patch: 'game_instance_profile_patch',
  game_instance_profile_reset: 'game_instance_profile_reset',
  game_instance_icon_set: 'game_instance_icon_set',
  game_instance_pin_order_set: 'game_instance_pin_order_set',
  game_instance_categories_get: 'game_instance_categories_get',
  game_instance_categories_upsert: 'game_instance_categories_upsert',
  game_instance_categories_delete: 'game_instance_categories_delete',
  game_instance_folder_open: 'game_instance_folder_open',
  game_instance_clone: 'game_instance_clone',
  game_instance_import: 'game_instance_import',
  game_instance_export: 'game_instance_export',
  game_instance_files_check: 'game_instance_files_check',
  game_instance_files_repair: 'game_instance_files_repair',
  game_instance_delete_to_trash: 'game_instance_delete_to_trash',
  game_operation_get: 'game_operation_get',
  game_operation_cancel: 'game_operation_cancel',
  game_world_list: 'game_world_list',
  game_world_detail: 'game_world_detail',
  game_world_patch: 'game_world_patch',
  game_world_copy: 'game_world_copy',
  game_world_import: 'game_world_import',
  game_world_export: 'game_world_export',
  game_world_icon_set: 'game_world_icon_set',
  game_world_delete_to_trash: 'game_world_delete_to_trash',
  game_world_backup_list: 'game_world_backup_list',
  game_world_backup_create: 'game_world_backup_create',
  game_world_backup_restore: 'game_world_backup_restore',
  game_world_backup_lock: 'game_world_backup_lock',
  game_world_backup_delete_to_trash: 'game_world_backup_delete_to_trash',
  game_screenshot_list: 'game_screenshot_list',
  game_screenshot_thumbnail: 'game_screenshot_thumbnail',
  game_screenshot_copy: 'game_screenshot_copy',
  game_screenshot_save_as: 'game_screenshot_save_as',
  game_screenshot_delete_to_trash: 'game_screenshot_delete_to_trash',
  game_screenshot_set_cover: 'game_screenshot_set_cover',
  game_screenshot_set_background: 'game_screenshot_set_background',
  game_server_list: 'game_server_list',
  game_server_upsert: 'game_server_upsert',
  game_server_delete: 'game_server_delete',
  game_server_reorder: 'game_server_reorder',
  game_server_status_refresh: 'game_server_status_refresh',
  game_resource_list: 'game_resource_list',
  game_resource_install: 'game_resource_install',
  game_resource_toggle: 'game_resource_toggle',
  game_resource_delete_to_trash: 'game_resource_delete_to_trash',
  game_resource_manifest_export: 'game_resource_manifest_export',
  game_resource_search: 'game_resource_search',
  game_resource_identify: 'game_resource_identify',
  game_resource_update_check: 'game_resource_update_check',
  game_resource_update: 'game_resource_update',
  game_launch: 'game_launch',
  game_launch_cancel: 'game_launch_cancel',
  game_instance_stop: 'game_instance_stop',
  game_crash_analyze: 'game_crash_analyze',
  game_crash_output: 'game_crash_output',
  game_crash_export: 'game_crash_export',
  export_logs: 'export_logs',
  logs_get_history: 'logs_get_history',
  process_instances: 'process_instances',
  process_input: 'process_input',
  process_stop: 'process_stop',
  debug_process_spawn: 'debug_process_spawn',
  plugin_list: 'plugin_list',
  plugin_info: 'plugin_info',
  plugin_enable: 'plugin_enable',
  plugin_disable: 'plugin_disable',
  plugin_unload: 'plugin_unload',
  plugin_reload: 'plugin_reload',
  plugin_install: 'plugin_install',
  plugin_get_routes: 'plugin_get_routes',
  plugin_get_slots: 'plugin_get_slots',
  plugin_get_vue_slots: 'plugin_get_vue_slots',
  plugin_get_vue_components: 'plugin_get_vue_components',
  plugin_call_command: 'plugin_call_command',
  plugin_get_settings: 'plugin_get_settings',
  plugin_update_setting: 'plugin_update_setting',
  plugin_notify_sidebar_state: 'plugin_notify_sidebar_state',
  get_mods: 'get_mods',
  toggle_mod: 'toggle_mod',
  add_mod: 'add_mod',
  remove_mod: 'remove_mod',
  open_mods_folder: 'open_mods_folder',
  detect_modpack_type: 'detect_modpack_type',
  import_modpack: 'import_modpack',
  export_modpack: 'export_modpack',
  list_resourcepacks: 'list_resourcepacks',
  list_shaderpacks: 'list_shaderpacks',
  list_saves: 'list_saves',
  remove_resourcepack: 'remove_resourcepack',
  remove_shaderpack: 'remove_shaderpack',
  delete_save: 'delete_save',
  open_resourcepacks_folder: 'open_resourcepacks_folder',
  open_shaderpacks_folder: 'open_shaderpacks_folder',
  open_saves_folder: 'open_saves_folder',
  search_mods: 'search_mods',
  mod_source_config: 'mod_source_config',
  get_mod_info: 'get_mod_info',
  get_mod_versions: 'get_mod_versions',
  download_mod: 'download_mod',
  download_mod_to_path: 'download_mod_to_path',
  launcher_info: 'launcher_info',
  info_card_get: 'info_card_get',
  debug_reset_launcher_data: 'debug_reset_launcher_data',
  debug_clear_plugins: 'debug_clear_plugins',
  debug_devtools_open: 'debug_devtools_open',
  frontend_ready: 'frontend_ready',
  fs_read_dir: 'fs_read_dir',
  fs_read_file: 'fs_read_file',
  fs_exists: 'fs_exists',
  file_resolve: 'file_resolve',
} as const

/**
 * 编译期断言：`COMMAND_NAMES` 的键与 `CommandPayloadMap` 的键完全一致（双向）。
 *
 * 新增命令时若忘记补进 `COMMAND_NAMES`（或反向多写），这里会退化为 false，
 * `pnpm typecheck` 直接报错。运行时恒为 true，无任何逻辑含义。
 */
export const commandNamesAlignedWithPayloadMap: CommandName extends keyof typeof COMMAND_NAMES
  ? keyof typeof COMMAND_NAMES extends CommandName
    ? true
    : false
  : false = true

// ═══════════════════════════════════════════════════════════════════
//  命令响应映射
// ═══════════════════════════════════════════════════════════════════

export interface CommandResponseMap {
  system_ping: { status: string; message: string }
  launcher_errors_pending: LauncherErrorEvent[]
  launcher_errors_ack: { removed: number }

  settings_get: unknown
  settings_set: void

  window_list: WindowMetadata[]
  window_open: WindowMetadata
  window_focus: void
  window_close: void
  window_update_bounds: WindowMetadata

  frontend_log: void

  system_memory: SystemMemoryInfo

  connector_status: ConnectorStatus
  connector_host_port: { roomCode: string }
  connector_host_instance: { status: string }
  connector_join: { mcHost: string; mcPort: number }
  connector_leave: { status: string }
  connector_kick: { status: string }
  connector_match_instances: ConnectorMatchResult
  connector_easytier_status: EasyTierStatus
  connector_easytier_download: EasyTierStatus
  connector_detect_ports: { ports: number[] }
  connector_search_mc_port: { port: number | null }
  connector_nat_type: NatTypeResult

  game_java_scan: JavaInstallation[]

  game_versions: MinecraftVersion[] | MinecraftVersionCatalog
  game_loader_versions: string[]
  game_fabric_api_versions: string[]
  game_scan: ScannedVersion[]
  game_install: InstallVersionResult
  game_uninstall: void

  game_config_get: Record<string, unknown>
  game_config_set: void
  game_config_patch: Record<string, unknown>

  accounts_list: AccountListData
  accounts_current: MinecraftAccount | null
  accounts_auth_providers: AuthProvider[]
  accounts_add_plugin: MinecraftAccount
  accounts_add_offline: MinecraftAccount
  accounts_default_skins: DefaultSkin[]
  accounts_set_offline_skin: AccountListData
  accounts_add_authlib: MinecraftAccount
  accounts_select_authlib_profile: MinecraftAccount
  authlib_resolve_server: string
  accounts_microsoft_login_config: MicrosoftLoginConfigData
  accounts_authlib_login_config: AuthlibLoginConfigData
  accounts_start_microsoft_login: MicrosoftLoginData
  accounts_poll_microsoft_login: MicrosoftPollData
  accounts_cancel_microsoft_login: void
  accounts_complete_microsoft_login: MicrosoftCompleteData
  accounts_switch: void
  accounts_remove: void
  accounts_refresh_profile: void
  accounts_texture_urls: AccountTextures
  accounts_set_favorite: AccountListData
  accounts_set_pinned: AccountListData
  wardrobe_list: WardrobeItem[]
  wardrobe_sync_account_skin: WardrobeImportResult
  wardrobe_import: WardrobeImportResult
  wardrobe_update: WardrobeItem
  wardrobe_delete: void
  wardrobe_texture: { dataUrl: string; mime: 'image/png' }
  wardrobe_export: SelectResult
  wardrobe_apply_skin: MinecraftAccount
  microsoft_reset_skin: MinecraftAccount
  microsoft_set_cape: MinecraftAccount
  microsoft_reset_cape: MinecraftAccount
  authlib_servers: AuthlibServer[]

  user_agreement_get: UserAgreement
  user_agreement_save: UserAgreement
  user_agreement_clear: void

  image_fetch_data_url: ImageDataUrl
  image_save_url: ImageSaveUrlResult
  image_save_as: SelectResult
  image_read_file: ImageDataUrl
  image_list_files: ImageListResult

  select_directory: SelectResult
  select_java: SelectResult
  select_image: ImageSelection
  select_file: SelectResult
  select_files: { paths: string[] }
  select_save_file: SelectResult
  open_folder: void
  open_url: void

  game_instances: GameInstance[]
  game_version_stats: VersionRunStats
  game_version_settings_get: Record<string, unknown>
  game_version_settings_set: Record<string, unknown>
  game_instance_profile_get: InstanceProfile
  game_instance_profile_patch: InstanceProfile
  game_instance_profile_reset: InstanceProfile
  game_instance_icon_set: InstanceProfile
  game_instance_pin_order_set: void
  game_instance_categories_get: InstanceCategory[]
  game_instance_categories_upsert: InstanceCategory
  game_instance_categories_delete: void
  game_instance_folder_open: { path: string }
  game_instance_clone: GameOperation
  game_instance_import: GameOperation
  game_instance_export: GameOperation
  game_instance_files_check: {
    issues: Array<{ kind: string; path: string; size?: number; message?: string }>
    downloadBytes: number
    canRepair: boolean
  }
  game_instance_files_repair: GameOperation
  game_instance_delete_to_trash: void
  game_operation_get: GameOperation
  game_operation_cancel: boolean
  game_world_list: WorldEntry[]
  game_world_detail: WorldEntry
  game_world_patch: WorldEntry
  game_world_copy: GameOperation
  game_world_import: GameOperation
  game_world_export: GameOperation
  game_world_icon_set: { path: string }
  game_world_delete_to_trash: void
  game_world_backup_list: Array<{ id: string; createdAt?: string; locked: boolean; automatic: boolean; size: number }>
  game_world_backup_create: GameOperation
  game_world_backup_restore: GameOperation
  game_world_backup_lock: { id: string; locked: boolean }
  game_world_backup_delete_to_trash: void
  game_screenshot_list: ScreenshotEntry[]
  game_screenshot_thumbnail: { path: string; sourcePath: string }
  game_screenshot_copy: void
  game_screenshot_save_as: { path: string }
  game_screenshot_delete_to_trash: void
  game_screenshot_set_cover: InstanceProfile
  game_screenshot_set_background: { path: string }
  game_server_list: ServerEntry[]
  game_server_upsert: ServerEntry
  game_server_delete: void
  game_server_reorder: ServerEntry[]
  game_server_status_refresh: ServerStatus[]
  game_resource_list: GameResource[]
  game_resource_install: GameOperation
  game_resource_toggle: { id: string; enabled: boolean }
  game_resource_delete_to_trash: void
  game_resource_manifest_export: { path: string }
  game_resource_search: { source: string; items: unknown[] }
  game_resource_identify: {
    matched: boolean
    ambiguous?: boolean
    source?: string
    projectId?: string
    versionId?: string
  }
  game_resource_update_check: Array<Record<string, unknown>>
  game_resource_update: GameOperation
  game_launch: LaunchInstanceResult
  game_launch_cancel: void
  export_logs: { path: string }
  logs_get_history: { logs: TerminalLogEntry[] }

  process_instances: { instances: ProcessInstance[] }
  process_input: { sent: boolean }
  process_stop: { stopped: boolean }
  debug_process_spawn: { instanceId: string }
  game_instance_stop: void
  game_crash_analyze: CrashAnalysisResult
  game_crash_output: { name: string; content: string }
  game_crash_export: { path: string }

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
  mod_source_config: ModSourceConfig
  get_mod_info: ModInfo
  get_mod_versions: ModVersion[]
  download_mod: ModInstallResult
  download_mod_to_path: { filename: string }

  launcher_info: LauncherInfo
  info_card_get: InfoCardData
  debug_reset_launcher_data: DebugMaintenanceResult
  debug_clear_plugins: DebugMaintenanceResult
  debug_devtools_open: { open: boolean }
  frontend_ready: WindowMetadata | void

  fs_read_dir: FsEntry[]
  fs_read_file: FileContent
  fs_exists: PathInfo
  file_resolve: SelectResult
}
