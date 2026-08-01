import type { TaskItem } from '@/composables/useTaskQueue'
import type {
  AccountListData,
  AuthlibServer,
  InfoCardData,
  MinecraftAccount,
  MinecraftVersionCatalog,
  ModSearchItem,
  PluginInfo,
  ScannedVersion,
  VersionCatalogItem,
} from '@/types/api'

export const showcaseConfig: Record<string, unknown> = {
  launcher: {
    version: '0.2.0-showcase',
    version_type: 'dev',
    debug: true,
  },
  game: {
    minecraft_paths: [
      {
        name: '默认路径',
        path: 'Showcase/.minecraft',
        protected: true,
      },
    ],
    java_auto: true,
    java_path: 'Showcase/Java/bin/javaw.exe',
    memory_auto: false,
    memory_size: 4096,
    game_width: 1280,
    game_height: 720,
    jvm_args: ['-XX:+UseG1GC'],
    fullscreen: false,
    last_install_path: 'Showcase/.minecraft',
  },
  download: {
    mirror_source: 'official',
    download_threads: 16,
  },
  version_settings: {},
  ui: {
    locale: 'zh-CN',
    theme: {
      mode: 'system',
      primary_color: '#6f8cff',
      blur_amount: 0,
      sidebar_collapsed: true,
      navigation_mode: 'sidebar',
      titlebar_hidden: true,
      background_opacity: 1,
    },
    background: {
      type: 'none',
      path: '',
      opacity: 1,
      blur: 0,
    },
  },
}

export const showcaseAccounts: AccountListData = {
  accounts: [
    {
      id: 'showcase-microsoft',
      alias: 'EuoraPlayer',
      type: 'microsoft',
      email: 'player@example.com',
      uuid: '8667ba71b85a4004af54457a9734eed7',
      skinUrl: `${import.meta.env.BASE_URL}img/skins/Alex.png`,
      isCurrent: true,
    },
    {
      id: 'showcase-offline',
      alias: 'Builder',
      type: 'offline',
      uuid: 'showcase-offline-player',
      skinUrl: `${import.meta.env.BASE_URL}img/skins/Steve.png`,
      isCurrent: false,
    },
    {
      id: 'showcase-authlib',
      alias: 'ServerPlayer',
      type: 'authlib',
      auth_server: 'https://example.com/api/yggdrasil',
      uuid: 'showcase-authlib-player',
      skinUrl: `${import.meta.env.BASE_URL}img/skins/Ari.png`,
      isCurrent: false,
    },
  ],
  current: null,
}
showcaseAccounts.current = showcaseAccounts.accounts[0] ?? null

export const showcaseAuthlibServers: AuthlibServer[] = [
  {
    name: '示例认证服务器',
    url: 'https://example.com/api/yggdrasil',
    description: '仅用于展示 Authlib 账户表单，不会发起真实登录。',
  },
]

export const showcaseScannedVersions: ScannedVersion[] = [
  {
    id: '1.21.5-fabric',
    versionId: '1.21.5-Fabric 0.16.14',
    versionType: 'release',
    path: 'Showcase/.minecraft/versions/1.21.5-Fabric',
    displayName: '1.21.5 Fabric',
    primaryLoader: 'Fabric',
    vanillaName: '1.21.5',
    hasForge: false,
    hasNeoForge: false,
    hasFabric: true,
    hasQuilt: false,
    hasOptiFine: false,
    isBroken: false,
    jsonPath: 'Showcase/.minecraft/versions/1.21.5-Fabric/1.21.5-Fabric.json',
    sourceName: '默认路径',
  },
  {
    id: '1.20.1-forge',
    versionId: '1.20.1-Forge 47.3.22',
    versionType: 'release',
    path: 'Showcase/.minecraft/versions/1.20.1-Forge',
    displayName: '1.20.1 Forge',
    primaryLoader: 'Forge',
    vanillaName: '1.20.1',
    hasForge: true,
    hasNeoForge: false,
    hasFabric: false,
    hasQuilt: false,
    hasOptiFine: true,
    isBroken: false,
    jsonPath: 'Showcase/.minecraft/versions/1.20.1-Forge/1.20.1-Forge.json',
    sourceName: '默认路径',
  },
  {
    id: '25w30a',
    versionId: '25w30a',
    versionType: 'snapshot',
    path: 'Showcase/.minecraft/versions/25w30a',
    displayName: '25w30a',
    primaryLoader: 'Vanilla',
    vanillaName: '25w30a',
    hasForge: false,
    hasNeoForge: false,
    hasFabric: false,
    hasQuilt: false,
    isBroken: false,
    jsonPath: 'Showcase/.minecraft/versions/25w30a/25w30a.json',
    sourceName: '默认路径',
  },
]

const releases = [
  { id: '1.21.8', type: 'release' as const, releaseTime: '2026-07-17T10:00:00Z' },
  { id: '1.21.7', type: 'release' as const, releaseTime: '2026-06-30T10:00:00Z' },
  { id: '1.21.6', type: 'release' as const, releaseTime: '2026-06-17T10:00:00Z' },
  { id: '1.21.5', type: 'release' as const, releaseTime: '2026-03-25T10:00:00Z' },
  { id: '1.20.1', type: 'release' as const, releaseTime: '2023-06-12T10:00:00Z' },
]
const snapshots = [
  { id: '26w29a', type: 'snapshot' as const, releaseTime: '2026-07-16T10:00:00Z' },
  { id: '26w28b', type: 'snapshot' as const, releaseTime: '2026-07-10T10:00:00Z' },
]
const aprilFools = [{ id: '25w14craftmine', type: 'april_fools' as const, releaseTime: '2025-04-01T10:00:00Z' }]
const oldBeta = [{ id: 'b1.7.3', type: 'old_beta' as const, releaseTime: '2011-07-08T10:00:00Z' }]
const oldAlpha = [{ id: 'a1.2.6', type: 'old_alpha' as const, releaseTime: '2010-12-03T10:00:00Z' }]

export const showcaseVersionCatalog: MinecraftVersionCatalog = {
  all: [...releases, ...snapshots, ...aprilFools, ...oldBeta, ...oldAlpha],
  release: releases,
  snapshot: snapshots,
  april_fools: aprilFools,
  old_beta: oldBeta,
  old_alpha: oldAlpha,
}

export const showcaseLoaderVersions: Record<string, VersionCatalogItem[]> = {
  fabric_versions: [{ all: ['0.16.14', '0.16.13'], stable: ['0.16.14'], unstable: ['0.16.13'] }],
  forge_versions: [{ all: ['55.0.9', '55.0.8'], stable: ['55.0.9'], unstable: ['55.0.8'] }],
  neoforge_versions: [{ all: ['21.8.2-beta'], stable: [], unstable: ['21.8.2-beta'] }],
  optifine_versions: [{ all: ['HD_U_J1_pre2'], stable: [], unstable: ['HD_U_J1_pre2'] }],
  quilt_versions: [{ all: ['0.28.1'], stable: ['0.28.1'], unstable: [] }],
}

export const showcasePlugins: PluginInfo[] = [
  {
    name: 'showcase-dashboard',
    title: '启动器数据面板',
    version: '1.2.0',
    description: '演示插件卡片、状态操作和宿主能力展示。',
    author: 'ECLTeam',
    icon: '',
    status: 'enabled',
    error: null,
    dependencies: {},
    events: { 'game:launched': true },
    services: ['dashboard'],
    is_system: false,
  },
  {
    name: 'showcase-theme',
    title: 'Aurora 主题',
    version: '0.8.3',
    description: '演示处于禁用状态的主题插件。',
    author: 'Community',
    icon: '',
    status: 'disabled',
    error: null,
    dependencies: {},
    events: {},
    services: ['theme'],
    is_system: false,
  },
  {
    name: 'ecl-system-bridge',
    title: 'ECL 系统桥接',
    version: '0.2.0',
    description: '启动器内置系统插件示例。',
    author: 'ECLTeam',
    icon: '',
    status: 'enabled',
    error: null,
    dependencies: {},
    events: {},
    services: ['system'],
    is_system: true,
  },
]

export const showcaseMods: ModSearchItem[] = [
  {
    id: 'sodium',
    slug: 'sodium',
    title: 'Sodium',
    description: '现代化的 Minecraft 渲染优化 Mod。',
    author: 'CaffeineMC',
    downloads: 128_000_000,
    follows: 720_000,
    date_modified: '2026-07-18T12:00:00Z',
    source: 'modrinth',
  },
  {
    id: 'iris',
    slug: 'iris',
    title: 'Iris Shaders',
    description: '支持现代光影包并与 Sodium 协同工作。',
    author: 'IrisShaders',
    downloads: 84_000_000,
    follows: 460_000,
    date_modified: '2026-07-16T12:00:00Z',
    source: 'modrinth',
  },
  {
    id: 'fabric-api',
    slug: 'fabric-api',
    title: 'Fabric API',
    description: 'Fabric 生态常用的基础 API 集合。',
    author: 'FabricMC',
    downloads: 210_000_000,
    follows: 530_000,
    date_modified: '2026-07-20T12:00:00Z',
    source: 'modrinth',
  },
]

export const showcaseInfoCard: InfoCardData = {
  mode: 'rotate',
  tip_title: '你知道吗',
  announcement_title: '公告',
  tips: [
    '展示模式设置会保存在当前浏览器中，不会写入后端配置。',
    '可以在版本页体验搜索、筛选和安装流程。',
    '插件页提供启用、禁用和重载交互示例。',
  ],
  announcements: [
    {
      id: 'showcase-frontend-refactor',
      title: '前端重构展示模式',
      date: '2026-07-23',
      content: '当前界面由独立的 **Showcase Transport** 提供数据，可脱离 PyTauri 运行。\n\n- 支持 Markdown 公告\n- 点击公告卡片可以查看完整内容',
    },
  ],
  welcome: {
    title: '欢迎进入 ECL 展示模式',
    content: '这里可以安全查看和测试启动器的主要前端功能。',
  },
  interval: 8000,
}

export function createShowcaseAccount(
  alias: string,
  type: MinecraftAccount['type'] = 'offline',
  uuid?: string
): MinecraftAccount {
  return {
    id: `showcase-${type}-${Date.now()}`,
    alias,
    type,
    uuid: uuid || `showcase-${alias.toLowerCase().replace(/\s+/g, '-')}`,
    skinUrl: `${import.meta.env.BASE_URL}img/skins/Sunny.png`,
    isCurrent: false,
  }
}

// ===========================================================================
// Demo Task Queue
// ===========================================================================

/** Interface for pre-populating the task queue in showcase mode */
export interface DemoTaskDef {
  type: 'install' | 'download'
  name: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'canceled'
  progress: number
  message: string
  versionId: string
  loaderType: string
  subtasks?: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'error'; message: string }[]
}

/** Demo task definitions for showcase mode */
export const showcaseDemoTasks: DemoTaskDef[] = [
  {
    type: 'download',
    name: '下载 Minecraft 1.21.5',
    status: 'running',
    progress: 65,
    message: '正在下载 client.jar (12.4 MB / 18.9 MB)',
    versionId: '1.21.5',
    loaderType: 'Vanilla',
    subtasks: [
      { id: 'sub1', name: '下载 JSON 索引', status: 'completed', message: '已完成' },
      { id: 'sub2', name: '下载 client.jar', status: 'running', message: '65%' },
      { id: 'sub3', name: '下载资源文件', status: 'pending', message: '等待中' },
      { id: 'sub4', name: '下载库文件', status: 'pending', message: '等待中' },
    ],
  },
  {
    type: 'install',
    name: '安装 Forge 55.0.9',
    status: 'pending',
    progress: 0,
    message: '等待 Minecraft 1.21.5 下载完成...',
    versionId: '1.21.5',
    loaderType: 'Forge',
  },
  {
    type: 'install',
    name: '安装 OptiFine HD U J1',
    status: 'completed',
    progress: 100,
    message: '安装完成，已注入到 1.21.5',
    versionId: '1.21.5',
    loaderType: 'OptiFine',
  },
  {
    type: 'download',
    name: '删除旧版本 1.16.5',
    status: 'error',
    progress: 34,
    message: '部分文件被其他进程占用，无法删除',
    versionId: '1.16.5',
    loaderType: 'Vanilla',
  },
  {
    type: 'install',
    name: '更新插件 世界备份 v2.0.1',
    status: 'pending',
    progress: 0,
    message: '队列中，等待当前任务完成',
    versionId: '',
    loaderType: '',
  },
  {
    type: 'download',
    name: '下载光影包 SEUS v11',
    status: 'canceled',
    progress: 12,
    message: '用户取消了下载',
    versionId: '',
    loaderType: '',
  },
  {
    type: 'install',
    name: '安装 Fabric API 0.16.10',
    status: 'completed',
    progress: 100,
    message: '已安装到 1.21.5 Fabric',
    versionId: '1.21.5',
    loaderType: 'Fabric',
  },
]

/** Load demo tasks into the global task queue (call once in showcase mode) */
export function loadShowcaseTasks(globalTaskQueue: {
  addTask: (task: { type: 'install' | 'download'; name: string; versionId: string; loaderType: string }) => string
  updateTask: (id: string, updates: Partial<Pick<TaskItem, 'status' | 'progress' | 'message' | 'subtasks'>>) => void
  addSubtask: (id: string, subtask: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'error'; message: string }) => void
}): void {
  for (const def of showcaseDemoTasks) {
    const taskId = globalTaskQueue.addTask({
      type: def.type,
      name: def.name,
      versionId: def.versionId,
      loaderType: def.loaderType,
    })
    globalTaskQueue.updateTask(taskId, {
      status: def.status,
      progress: def.progress,
      message: def.message,
    })
    if (def.subtasks) {
      for (const sub of def.subtasks) {
        globalTaskQueue.addSubtask(taskId, sub)
      }
    }
  }
}
