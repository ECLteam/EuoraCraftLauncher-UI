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
        name: '展示实例',
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
  ui: {
    locale: 'zh-CN',
    theme: {
      mode: 'system',
      primary_color: '#6f8cff',
      blur_amount: 18,
      sidebar_collapsed: false,
      navigation_mode: 'sidebar',
      titlebar_hidden: true,
      background_opacity: 0.16,
    },
    background: {
      type: 'none',
      path: '',
      opacity: 0.16,
      blur: 18,
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
    sourceName: '展示实例',
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
    sourceName: '展示实例',
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
    sourceName: '展示实例',
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
  tips: [
    '展示模式中的操作只会修改浏览器内存，不会写入后端配置。',
    '可以在版本页体验搜索、筛选和安装流程。',
    '插件页提供启用、禁用和重载交互示例。',
  ],
  announcements: [
    {
      title: '前端重构展示模式',
      date: '2026-07-23',
      content: '当前界面由独立的 Showcase Transport 提供数据，可脱离 PyTauri 运行。',
    },
  ],
  welcome: {
    title: '欢迎进入 ECL 展示模式',
    content: '这里可以安全查看和测试启动器的主要前端功能。',
  },
  interval: 8000,
}

export function createShowcaseAccount(alias: string, type: MinecraftAccount['type'] = 'offline'): MinecraftAccount {
  return {
    id: `showcase-${type}-${Date.now()}`,
    alias,
    type,
    uuid: `showcase-${alias.toLowerCase().replace(/\s+/g, '-')}`,
    skinUrl: `${import.meta.env.BASE_URL}img/skins/Sunny.png`,
    isCurrent: false,
  }
}
