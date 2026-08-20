import type {
  ApiResponse,
  BackendEvents,
  ConnectorMatchResult,
  ConnectorStatus,
  CrashAnalysisResult,
  EasyTierStatus,
  GameInstance,
  MinecraftAccount,
  PluginInfo,
  VersionRunStats,
  WardrobeItem,
} from '@/types/api'
import { loadShowcaseConfig, persistShowcaseConfig } from './configPersistence'
import {
  createShowcaseAccount,
  showcaseAccounts,
  showcaseAuthlibServers,
  showcaseConfig,
  showcaseInfoCard,
  showcaseLoaderVersions,
  showcaseMods,
  showcasePlugins,
  showcaseScannedVersions,
  showcaseVersionCatalog,
} from './fixtures'
import type { BackendTransport } from '../types'

type EventHandler = (payload: unknown) => void

function success<T>(data?: T): ApiResponse<T> {
  return {
    success: true,
    ...(data === undefined ? {} : { data }),
    timestamp: Date.now(),
  }
}

function getPayload(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
}

function cloneConfigData<T>(value: T): T {
  if (value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

function wait(duration = 90): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

export function createShowcaseTransport(): BackendTransport {
  const listeners = new Map<string, Set<EventHandler>>()
  const config = loadShowcaseConfig(showcaseConfig)
  const accounts = structuredClone(showcaseAccounts)
  const plugins = structuredClone(showcasePlugins)
  const wardrobe: WardrobeItem[] = []
  const runningInstances: GameInstance[] = []
  const versionStats = new Map<string, VersionRunStats>()
  let connectorStatus: ConnectorStatus = {
    mode: 'idle',
    roomCode: null,
    mcHost: null,
    mcPort: null,
    gameInfo: null,
    players: [],
    nodes: [],
    error: null,
  }
  let easyTierStatus: EasyTierStatus = {
    installed: true,
    status: 'installed',
    progress: 100,
    speed: 0,
    error: null,
  }
  let portScanCount = 0
  let connectorStartTimer: ReturnType<typeof setTimeout> | null = null

  const hostPlayer = {
    name: 'CloudMaple685',
    vendor: 'EuoraCraft Launcher',
    iconBase64: null,
    kind: 'host' as const,
    machineId: 'showcase-host',
  }
  const guestPlayer = {
    name: 'SkyBuilder',
    vendor: 'Qomicex Launcher',
    iconBase64: null,
    kind: 'guest' as const,
    machineId: 'showcase-guest',
  }

  const setHostedRoom = () => {
    connectorStartTimer = null
    connectorStatus = {
      mode: 'host',
      roomCode: 'U/ECL7-W9KM-4R2P-X8QA',
      mcHost: '127.0.0.1',
      mcPort: 25565,
      gameInfo: { gameVersion: '1.21.5', loader: 'Fabric', loaderVersion: '0.16.10' },
      players: [hostPlayer, guestPlayer],
      nodes: [],
      error: null,
    }
  }

  const connectorMatches = (): ConnectorMatchResult => ({
    mods: [
      { source: 'modrinth', id: 'fabric-api', hash: '67a873fd8fb045aa', name: 'Fabric API' },
      { source: 'curseforge', id: 'sodium', hash: 'af340d09e96544bd', name: 'Sodium' },
    ],
    instances: showcaseScannedVersions.slice(0, 3).map((instance, index) => ({
      gamePath: instance.path,
      versionId: instance.versionId,
      name: instance.displayName || instance.versionId,
      gameVersion: instance.vanillaName,
      loader: instance.primaryLoader || null,
      loaderVersion: instance.loaderVersion ?? null,
      matched: index === 0,
      modCount: index === 0 ? 2 : index + 2,
    })),
  })
  const showcaseCrashReport: CrashAnalysisResult = {
    reportId: '5c0a5eca5e0a4eaf8f465ad0f42d89b1',
    versionId: 'Showcase-1.21.5-Fabric',
    exitCode: 1,
    detectedBy: ['exit_code', 'crash_log'],
    reasons: [
      {
        code: 'mod.missing_dependency',
        confidence: 'certain',
        evidence: ['Mod example-addon depends on example-lib 2.0 or newer, which is missing'],
        parameters: { files: ['example-addon.jar'] },
      },
      {
        code: 'mod.mixin_failure',
        confidence: 'likely',
        evidence: ['Mixin apply failed example-addon.mixins.json:ClientMixin'],
        parameters: {},
      },
    ],
    sourceFiles: ['game-output.log', 'latest.log'],
    hasOutput: true,
  }

  const emit = <E extends keyof BackendEvents>(event: E, payload: BackendEvents[E]) => {
    for (const handler of listeners.get(event) ?? []) handler(payload)
  }

  const emitInstallProgress = (taskId: string) => {
    const steps: BackendEvents['game:install_progress'][] = [
      { phase: 'install', task_id: taskId, message: '正在准备展示安装任务', done: 0, total: 100 },
      {
        phase: 'download',
        task_id: taskId,
        message: '正在模拟下载游戏文件',
        done: 42,
        total: 100,
        subtask: 'download_assets',
      },
      {
        phase: 'download',
        task_id: taskId,
        message: '正在校验展示文件',
        done: 86,
        total: 100,
        subtask: 'check_files',
      },
      { phase: 'done', task_id: taskId, message: '展示安装完成', done: 100, total: 100 },
    ]
    steps.forEach((step, index) => setTimeout(() => emit('game:install_progress', step), 250 * (index + 1)))
  }

  const emitLaunchProgress = () => {
    const steps: BackendEvents['game:launch_progress'][] = [
      { phase: 'preparing', message: '正在准备展示实例', percent: 3 },
      { phase: 'microsoft_token', message: '正在检查正版登录令牌，过期时将自动刷新', percent: 7 },
      { phase: 'account_ready', message: '正版登录令牌已就绪', percent: 17 },
      { phase: 'checking', message: '正在检查游戏文件', percent: 25 },
      { phase: 'files_checked', message: '游戏文件检查完成', percent: 55 },
      { phase: 'building_args', message: '正在生成启动参数', percent: 72 },
      { phase: 'launching', message: '正在启动展示实例', percent: 97 },
      { phase: 'launched', message: '展示实例已启动', percent: 100 },
    ]
    steps.forEach((step, index) => setTimeout(() => emit('game:launch_progress', step), 220 * (index + 1)))
  }

  const setCurrentAccount = (accountId: string) => {
    let current: MinecraftAccount | null = null
    accounts.accounts.forEach((account) => {
      account.isCurrent = account.id === accountId
      if (account.isCurrent) current = account
    })
    accounts.current = current
    emit('accounts_changed', structuredClone(accounts))
  }

  const updatePluginStatus = (name: string, status: string) => {
    const plugin = plugins.find((item) => item.name === name)
    if (!plugin) return
    plugin.status = status
    emit('plugin:status_changed', { name, action: status, result: 'success' })
  }

  const invoke = async (command: string, rawPayload: unknown): Promise<ApiResponse<unknown>> => {
    await wait()
    const payload = getPayload(rawPayload)

    switch (command) {
      case 'system_ping':
        return success({ status: 'ok', message: 'Showcase Transport 已连接' })
      case 'system_memory':
        return success({ totalMb: 32768, usedMb: 8192, freeMb: 24576, percentUsed: 25 })
      case 'connector_status':
        return success(structuredClone(connectorStatus))
      case 'connector_host_port':
        if (connectorStartTimer) clearTimeout(connectorStartTimer)
        setHostedRoom()
        connectorStatus.mcPort = Number(payload.port || 25565)
        return success({ roomCode: connectorStatus.roomCode })
      case 'connector_host_instance':
        if (connectorStartTimer) clearTimeout(connectorStartTimer)
        connectorStatus = {
          mode: 'starting',
          roomCode: null,
          mcHost: null,
          mcPort: null,
          gameInfo: null,
          players: [],
          nodes: [],
          error: null,
        }
        connectorStartTimer = setTimeout(setHostedRoom, 900)
        return success({ status: 'starting' })
      case 'connector_join':
        if (connectorStartTimer) clearTimeout(connectorStartTimer)
        connectorStartTimer = null
        connectorStatus = {
          mode: 'guest',
          roomCode: String(payload.code || 'U/ECL7-W9KM-4R2P-X8QA'),
          mcHost: '127.0.0.1',
          mcPort: 25566,
          gameInfo: { gameVersion: '1.21.5', loader: 'Fabric', loaderVersion: '0.16.10' },
          players: [hostPlayer, { ...guestPlayer, name: 'ShowcasePlayer', machineId: 'showcase-local' }],
          nodes: [],
          error: null,
        }
        return success({ mcHost: connectorStatus.mcHost, mcPort: connectorStatus.mcPort })
      case 'connector_leave':
        if (connectorStartTimer) clearTimeout(connectorStartTimer)
        connectorStartTimer = null
        connectorStatus = {
          mode: 'idle',
          roomCode: null,
          mcHost: null,
          mcPort: null,
          gameInfo: null,
          players: [],
          nodes: [],
          error: null,
        }
        return success({ status: 'idle' })
      case 'connector_kick':
        connectorStatus.players = connectorStatus.players.filter((player) => player.machineId !== payload.machine_id)
        return success({ status: 'ok' })
      case 'connector_match_instances':
        return success(connectorMatches())
      case 'connector_easytier_status':
        return success(structuredClone(easyTierStatus))
      case 'connector_easytier_download':
        easyTierStatus = { installed: true, status: 'installed', progress: 100, speed: 0, error: null }
        return success(structuredClone(easyTierStatus))
      case 'connector_detect_ports':
        portScanCount += 1
        return success({ ports: portScanCount >= 2 ? [25565] : [] })
      case 'connector_search_mc_port':
        return success({ port: portScanCount >= 2 ? 25565 : null })
      case 'connector_nat_type':
        return success({
          type: 'cone',
          detailType: 'portRestricted',
          publicIp: '203.0.113.42',
          publicPort: 51820,
          publicPortEnd: 51820,
          supportsIpv6: true,
        })
      case 'frontend_ready':
        return success()
      case 'debug_reset_launcher_data':
        return success({
          action: 'reset_launcher_data',
          restart_required: true,
          targets: ['setting.json', 'accounts', 'info_card.json'],
          backup_root: 'Showcase/ECL_data/backups',
        })
      case 'debug_clear_plugins':
        return success({
          action: 'clear_plugins',
          restart_required: true,
          targets: ['plugins', 'plugin_config'],
          backup_root: 'Showcase/ECL_data/backups',
        })
      case 'settings_get': {
        if (typeof payload.section === 'string') return success(structuredClone(config[payload.section]))
        if (Array.isArray(payload.sections)) {
          return success(
            Object.fromEntries(
              payload.sections.map((section) => [String(section), structuredClone(config[String(section)])])
            )
          )
        }
        return success(structuredClone(config))
      }
      case 'settings_set':
        config[String(payload.section)] = cloneConfigData(payload.data)
        persistShowcaseConfig(config)
        return success()
      case 'game_java_scan':
        return success([
          {
            path: 'Showcase/Java/bin/javaw.exe',
            version: '21.0.7',
            major_version: 21,
            java_type: 'OpenJDK',
            arch: 'x64',
            sources: ['showcase'],
          },
        ])
      case 'game_versions':
        if (payload.classified) return success(structuredClone(showcaseVersionCatalog))
        return success(
          showcaseVersionCatalog.all.map((item) => ({
            ...item,
            time: item.releaseTime,
            url: 'showcase://version',
          }))
        )
      case 'game_loader_versions':
        return success(structuredClone(showcaseLoaderVersions[`${String(payload.loader)}_versions`] ?? []))
      case 'game_scan':
        return success(structuredClone(showcaseScannedVersions))
      case 'game_install': {
        const taskId = String(payload.task_id ?? `showcase-install-${Date.now()}`)
        const versionId = String(payload.version_id)
        emitInstallProgress(taskId)
        return success({
          taskId,
          versionId,
          versionName: String(payload.version_name || versionId),
        })
      }
      case 'game_uninstall':
        return success()
      case 'accounts_list':
        return success(structuredClone(accounts))
      case 'accounts_current':
        return success(structuredClone(accounts.current))
      case 'accounts_add_offline': {
        const account = createShowcaseAccount(
          String(payload.username || 'ShowcasePlayer'),
          'offline',
          typeof payload.uuid === 'string' && payload.uuid ? payload.uuid : undefined
        )
        accounts.accounts.push(account)
        setCurrentAccount(account.id)
        return success(structuredClone(account))
      }
      case 'accounts_add_authlib': {
        const account = createShowcaseAccount(String(payload.email || 'AuthlibPlayer'), 'authlib')
        account.auth_server = String(payload.server_url || '')
        accounts.accounts.push(account)
        setCurrentAccount(account.id)
        return success(structuredClone(account))
      }
      case 'accounts_select_authlib_profile':
        return success(structuredClone(accounts.current))
      case 'authlib_resolve_server':
        return success(String(payload.server_url || ''))
      case 'accounts_switch':
        setCurrentAccount(String(payload.account_id))
        return success()
      case 'accounts_remove': {
        const index = accounts.accounts.findIndex((item) => item.id === payload.account_id)
        if (index >= 0) accounts.accounts.splice(index, 1)
        setCurrentAccount(accounts.accounts[0]?.id ?? '')
        return success()
      }
      case 'accounts_refresh_profile':
        return success()
      case 'accounts_texture_urls': {
        const account = accounts.accounts.find((item) => item.id === payload.account_id)
        if (account?.type === 'microsoft') return success({ skinUrl: account.skinUrl, skinModel: 'slim' })
        return success({ skinUrl: account?.skinUrl })
      }
      case 'wardrobe_list':
        return success(structuredClone(wardrobe))
      case 'wardrobe_sync_account_skin': {
        let item = wardrobe.find((candidate) => candidate.kind === 'skin')
        const deduplicated = Boolean(item)
        if (!item) {
          item = {
            id: 'showcase-account-skin',
            kind: 'skin',
            name: 'CloudMaple685 当前皮肤',
            model: 'classic',
            favorite: false,
            width: 64,
            height: 64,
            byteSize: 1024,
            sha256: 'showcase-account-skin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          wardrobe.unshift(item)
        }
        return success({ item: structuredClone(item), deduplicated })
      }
      case 'wardrobe_import': {
        const kind = payload.kind === 'cape' ? 'cape' : 'skin'
        const item: WardrobeItem = {
          id: `showcase-${Date.now()}`,
          kind,
          name: kind === 'skin' ? 'Showcase Skin' : 'Showcase Cape',
          model: kind === 'skin' ? 'classic' : null,
          favorite: false,
          width: 64,
          height: kind === 'skin' ? 64 : 32,
          byteSize: 1024,
          sha256: 'showcase',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        wardrobe.unshift(item)
        return success({ item: structuredClone(item), deduplicated: false })
      }
      case 'wardrobe_update': {
        const item = wardrobe.find((candidate) => candidate.id === payload.item_id)
        if (item) {
          if (typeof payload.name === 'string') item.name = payload.name
          if (payload.model === 'classic' || payload.model === 'slim') item.model = payload.model
          if (typeof payload.favorite === 'boolean') item.favorite = payload.favorite
        }
        return success(structuredClone(item))
      }
      case 'wardrobe_delete': {
        const index = wardrobe.findIndex((item) => item.id === payload.item_id)
        if (index >= 0) wardrobe.splice(index, 1)
        return success()
      }
      case 'wardrobe_texture':
        return success({ dataUrl: `${import.meta.env.BASE_URL}img/skins/Alex.png`, mime: 'image/png' as const })
      case 'wardrobe_export':
        return success({ path: 'C:\\Users\\Player\\skin.png' })
      case 'wardrobe_apply_skin':
      case 'microsoft_reset_skin':
      case 'microsoft_set_cape':
      case 'microsoft_reset_cape':
        return success(structuredClone(accounts.accounts.find((item) => item.id === payload.account_id)))
      case 'accounts_start_microsoft_login': {
        const stages = ['authorization_confirmed', 'minecraft_token', 'profile', 'saving'] as const
        stages.forEach((stage, index) => {
          setTimeout(() => emit('accounts_microsoft_login_status', { status: 'progress', stage }), 1000 + index * 500)
        })
        setTimeout(() => emit('accounts_microsoft_login_status', { status: 'ready' }), 3200)
        return success({
          status: 'pending',
          userCode: 'ECL-DEMO',
          verificationUri: 'https://microsoft.com/link',
          message: '展示模式不会发起真实登录',
          interval: 3,
        })
      }
      case 'accounts_poll_microsoft_login':
        return success({ status: 'ready', message: '展示授权已完成' })
      case 'accounts_microsoft_login_config':
        return success({ available: true, needs_client_id: false })
      case 'accounts_cancel_microsoft_login':
        return success({ cancelled: true })
      case 'accounts_complete_microsoft_login':
        return success({
          status: 'completed',
          account: structuredClone(accounts.accounts[0]),
          message: '展示登录完成',
        })
      case 'authlib_servers':
        return success(structuredClone(showcaseAuthlibServers))
      case 'user_agreement_get':
      case 'user_agreement_save':
        return success({ accepted: true, uuid: 'showcase-agreement' })
      case 'user_agreement_clear':
        return success()
      case 'game_instances':
        return success(structuredClone(runningInstances))
      case 'game_version_stats': {
        const key = `${String(payload.game_path)}::${String(payload.version_id)}`
        return success(
          structuredClone(
            versionStats.get(key) ?? {
              launchCount: 7,
              lastRunDurationSeconds: 3862,
              totalRunDurationSeconds: 28435,
            }
          )
        )
      }
      case 'game_crash_analyze':
        return success({ ...structuredClone(showcaseCrashReport), versionId: String(payload.version_id) })
      case 'game_crash_output':
        return success({
          name: 'game-output.log',
          content:
            '[main/ERROR] Missing dependency example-lib 2.0 or newer\n[main/ERROR] Mixin apply failed example-addon.mixins.json:ClientMixin',
        })
      case 'game_crash_export':
        return success({ path: 'Showcase/EuoraCraft-crash-report.zip' })
      case 'game_launch': {
        emitLaunchProgress()
        const instance: GameInstance = {
          id: `showcase-instance-${Date.now()}`,
          name: String(payload.version_id),
          type: 'Minecraft',
          isRunning: true,
          pid: 24000 + runningInstances.length,
          version: String(payload.version_id),
          versionId: String(payload.version_id),
          loader: 'Vanilla',
          gamePath: String(payload.game_path || '.minecraft'),
        }
        runningInstances.push(instance)
        const statsKey = `${instance.gamePath}::${instance.versionId}`
        const stats = versionStats.get(statsKey) ?? {
          launchCount: 7,
          lastRunDurationSeconds: 3862,
          totalRunDurationSeconds: 28435,
        }
        versionStats.set(statsKey, { ...stats, launchCount: stats.launchCount + 1 })
        emit('game:instances_changed', {
          action: 'started',
          instanceId: instance.id,
          versionId: instance.versionId,
          gamePath: instance.gamePath,
        })
        return success({
          instanceId: instance.id,
          versionId: instance.versionId,
          gamePath: instance.gamePath,
        })
      }
      case 'game_launch_cancel':
        return success()
      case 'game_instance_stop': {
        const index = runningInstances.findIndex((instance) => instance.id === payload.instance_id)
        const [stopped] = index >= 0 ? runningInstances.splice(index, 1) : []
        if (stopped) {
          emit('game:instances_changed', {
            action: 'stopped',
            instanceId: stopped.id,
            versionId: stopped.versionId,
            gamePath: stopped.gamePath,
          })
        }
        return success()
      }
      case 'info_card_get':
        return success(structuredClone(showcaseInfoCard))
      case 'plugin_list':
        return success(structuredClone(plugins))
      case 'plugin_info':
        return success(structuredClone(plugins.find((item) => item.name === payload.plugin_name)))
      case 'plugin_enable':
        updatePluginStatus(String(payload.plugin_name), 'enabled')
        return success()
      case 'plugin_disable':
        updatePluginStatus(String(payload.plugin_name), 'disabled')
        return success()
      case 'plugin_reload':
        updatePluginStatus(String(payload.plugin_name), 'enabled')
        return success()
      case 'plugin_unload': {
        const index = plugins.findIndex((item) => item.name === payload.plugin_name)
        if (index >= 0) plugins.splice(index, 1)
        emit('plugin:status_changed', {
          name: String(payload.plugin_name),
          action: 'unload',
          result: 'success',
        })
        return success()
      }
      case 'plugin_install':
        plugins.push({
          name: 'installed-showcase-plugin',
          title: '刚刚安装的展示插件',
          version: '1.0.0',
          description: '由展示模式在内存中创建。',
          author: 'Showcase',
          icon: '',
          status: 'enabled',
          error: null,
          dependencies: {},
          services: [],
          is_system: false,
        } satisfies PluginInfo)
        emit('plugin:status_changed', { name: 'installed-showcase-plugin', action: 'install', result: 'success' })
        return success()
      case 'plugin_get_routes':
        return success([])
      case 'plugin_get_slots':
        return success({})
      case 'plugin_call_command':
        return success({ command: payload.command, mode: 'showcase' })
      case 'plugin_get_settings':
        return success({ schema: {}, values: {} })
      case 'plugin_update_setting':
        return success()
      case 'search_mods': {
        const query = String(payload.query ?? '').toLowerCase()
        const items = showcaseMods.filter(
          (item) =>
            !query ||
            item.title.toLowerCase().includes(query) ||
            item.displayTitle.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        )
        return success({
          items: structuredClone(items),
          sources: {
            modrinth: { available: true, error: '', total: items.length },
            curseforge: { available: false, error: 'Showcase 未配置 CurseForge API Key', total: 0 },
            mcmod: { available: true, error: '', total: 1 },
          },
          total: items.length,
          query,
        })
      }
      case 'mod_source_config':
        return success({ curseforge: { available: false } })
      case 'get_mods':
        return success([
          {
            filename: 'sodium-fabric.jar',
            name: 'Sodium',
            version: '0.6.13',
            author: 'CaffeineMC',
            loader_type: 'Fabric',
            game_version: '1.21.5',
            enabled: true,
          },
        ])
      case 'get_mod_info':
        return success({
          ...(showcaseMods.find((item) => item.id === payload.mod_id || item.projectId === payload.mod_id) ??
            showcaseMods[0]),
          body: 'Showcase 模组详情。',
          loaders: ['fabric', 'quilt'],
          gameVersions: ['1.21.5', '1.21.4'],
        })
      case 'get_mod_versions':
        return success([
          {
            id: 'showcase-mod-version',
            projectId: String(payload.mod_id ?? 'sodium'),
            name: 'Showcase 1.0.0',
            versionNumber: '1.0.0',
            gameVersions: ['1.21.5'],
            loaders: ['fabric'],
            filename: 'showcase-mod.jar',
            downloads: 1024,
            releaseType: 'release',
            dependencies: [
              {
                projectId: 'fabric-api',
                versionId: null,
                filename: null,
                dependencyType: 'required',
              },
            ],
          },
          {
            id: 'showcase-mod-version-snapshot',
            projectId: String(payload.mod_id ?? 'sodium'),
            name: 'Showcase 1.1.0-snapshot',
            versionNumber: '1.1.0-snapshot',
            gameVersions: ['26w29a'],
            loaders: ['fabric'],
            filename: 'showcase-mod-snapshot.jar',
            downloads: 512,
            releaseType: 'beta',
          },
        ])
      case 'download_mod':
        return success({
          installed: [{ filename: 'showcase-mod.jar', source: String(payload.source), skipped: false }],
          modsPath: 'Showcase/.minecraft/versions/1.21.5/mods',
        })
      case 'fs_exists':
        return success({ exists: false, is_dir: false, is_file: false })
      case 'fs_read_dir':
        return success([])
      case 'fs_read_file':
        return success({ content: '', size: 0 })
      case 'file_resolve':
        return success({ path: String(payload.path ?? '') })
      case 'select_directory':
        return success({ path: 'Showcase/SelectedDirectory' })
      case 'select_java':
        return success({ path: 'Showcase/Java/bin/javaw.exe' })
      case 'select_file':
        return success({ path: 'Showcase/SelectedFile.zip' })
      case 'select_image':
        return success({ path: 'Showcase/SelectedImage.png', base64: '' })
      case 'image_fetch_data_url':
      case 'image_read_file':
        return success({})
      case 'image_save_url':
        return success({
          dataUrl: (payload as { url?: string }).url ?? '',
          base64: '',
          url: (payload as { url?: string }).url ?? '',
          path: (payload as { url?: string }).url ?? '',
        })
      case 'image_save_as':
        return success({ path: 'Showcase/SavedImage.png' })
      case 'export_logs':
        return success({ path: 'Showcase/ECL-logs.zip' })
      default:
        return success()
    }
  }

  return {
    mode: 'showcase',
    available: true,
    invoke,
    async listen<T>(event: string, handler: (payload: T) => void) {
      const handlers = listeners.get(event) ?? new Set<EventHandler>()
      const trackedHandler = handler as EventHandler
      handlers.add(trackedHandler)
      listeners.set(event, handlers)
      return () => {
        handlers.delete(trackedHandler)
        if (handlers.size === 0) listeners.delete(event)
      }
    },
    convertFileSrc() {
      return null
    },
  }
}
