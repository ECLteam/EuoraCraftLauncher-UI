import type { ApiResponse, BackendEvents, MinecraftAccount, PluginInfo } from '@/types/api'
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
      { phase: 'preparing', message: '正在准备展示实例', percent: 8 },
      { phase: 'checking', message: '正在检查游戏文件', percent: 34 },
      { phase: 'building_args', message: '正在生成启动参数', percent: 62 },
      { phase: 'launching', message: '正在启动展示实例', percent: 88 },
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
      case 'ping':
        return success({ status: 'ok', message: 'Showcase Transport 已连接' })
      case 'system_memory':
        return success({ totalMb: 32768, usedMb: 8192, freeMb: 24576, percentUsed: 25 })
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
      case 'config_get':
        return success(structuredClone(config[String(payload.section)]))
      case 'config_set':
        config[String(payload.section)] = cloneConfigData(payload.data)
        persistShowcaseConfig(config)
        return success()
      case 'config_list':
      case 'list_sections':
        return success(Object.keys(config))
      case 'config_get_all':
        return success(structuredClone(config))
      case 'config_get_many': {
        const sections = Array.isArray(payload.sections) ? payload.sections : []
        return success(
          Object.fromEntries(sections.map((section) => [String(section), structuredClone(config[String(section)])]))
        )
      }
      case 'java_scan':
      case 'java_list':
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
      case 'minecraft_versions':
        return success(
          showcaseVersionCatalog.all.map((item) => ({
            ...item,
            time: item.releaseTime,
            url: 'showcase://version',
          }))
        )
      case 'minecraft_versions_classified':
        return success(structuredClone(showcaseVersionCatalog))
      case 'fabric_versions':
      case 'forge_versions':
      case 'neoforge_versions':
      case 'optifine_versions':
      case 'quilt_versions':
        return success(structuredClone(showcaseLoaderVersions[command] ?? []))
      case 'scan_versions':
        return success(structuredClone(showcaseScannedVersions))
      case 'install_version': {
        const taskId = String(payload.task_id ?? `showcase-install-${Date.now()}`)
        const versionId = String(payload.version_id)
        emitInstallProgress(taskId)
        return success({
          taskId,
          versionId,
          versionName: String(payload.version_name || versionId),
        })
      }
      case 'uninstall_version':
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
      case 'accounts_select_authlib_profiles':
        return success(
          structuredClone(
            accounts.accounts.filter((account) =>
              (payload.profile_ids as string[] | undefined)?.includes(account.uuid || '')
            )
          )
        )
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
      case 'instances_list':
        return success([])
      case 'launch_instance':
        emitLaunchProgress()
        return success({
          instanceId: 'showcase-instance',
          versionId: String(payload.version_id),
          gamePath: String(payload.game_path || '.minecraft'),
        })
      case 'cancel_launch':
      case 'instance_stop':
        return success()
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
        return success(
          structuredClone(
            showcaseMods.filter(
              (item) =>
                !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
            )
          )
        )
      }
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
          ...(showcaseMods.find((item) => item.id === payload.mod_id) ?? showcaseMods[0]),
          loaders: ['fabric', 'quilt'],
          game_versions: ['1.21.5', '1.21.4'],
        })
      case 'get_mod_versions':
        return success([
          {
            id: 'showcase-mod-version',
            version_number: '1.0.0',
            game_versions: ['1.21.5'],
            loaders: ['fabric'],
            filename: 'showcase-mod.jar',
          },
        ])
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
      case 'avatar_data_url':
        return success({})
      case 'image_save_url':
        return success({
          dataUrl: (payload as { url?: string }).url ?? '',
          base64: '',
          url: (payload as { url?: string }).url ?? '',
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
