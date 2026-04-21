import type {
  ApiResponse,
  PaginatedResponse,
  LauncherConfig,
  BackgroundConfig,
  GameConfig,
  ThemeConfig,
  DownloadConfig,
  LocaleConfig,
  MouseEffectConfig,
  JavaInstallation,
  MinecraftVersion,
  VersionFilter,
  GameInstance,
  InstanceCreateRequest,
  ModInfo,
  ModSearchFilter,
  DownloadTask,
  WindowPosition,
  ScannedVersion,
} from '@/types/api'

const CONFIG = {
  DEBUG: import.meta.env.DEV,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000
} as const

class Logger {
  static log(...args: any[]) {
    if (CONFIG.DEBUG) {
      console.log('[API]', ...args)
    }
  }

  static error(...args: any[]) {
    console.error('[API Error]', ...args)
  }

  static warn(...args: any[]) {
    console.warn('[API Warn]', ...args)
  }
}

class ApiValidator {
  static checkEnvironment(): boolean {
    if (typeof window === 'undefined') {
      Logger.error('window对象不存在')
      return false
    }

    if (!window.pywebview) {
      Logger.error('window.pywebview不存在')
      return false
    }

    if (!window.pywebview.api) {
      Logger.error('window.pywebview.api不存在')
      return false
    }

    return true
  }

  static checkMethod(method: string): boolean {
    if (!this.checkEnvironment()) {
      return false
    }

    const api = window.pywebview!.api as unknown as Record<string, unknown>
    if (typeof api[method] !== 'function') {
      Logger.error(`API方法 ${method} 不存在`)
      Logger.log('可用方法:', Object.keys(window.pywebview!.api))
      return false
    }

    return true
  }

  static validateResponse<T>(response: any): response is ApiResponse<T> {
    if (response === null || response === undefined) {
      return false
    }

    if (typeof response !== 'object') {
      return false
    }

    // 必须包含success字段
    if (typeof response.success !== 'boolean') {
      return false
    }

    return true
  }
}

class ApiClient {
  private retryCount = 0
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessingQueue = false

  async call<T = any>(
    method: string,
    ...args: any[]
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now()

    try {
      // 环境检查（带重试）
      let methodReady = false
      for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
        if (ApiValidator.checkMethod(method)) {
          methodReady = true
          break
        }
        if (i < CONFIG.MAX_RETRIES - 1) {
          await this.delay(CONFIG.RETRY_DELAY)
        }
      }

      if (!methodReady) {
        throw new Error(`API环境未就绪或方法 ${method} 不存在`)
      }

      // 执行调用
      Logger.log(`调用 ${method}`, args.length ? '参数:' : '(无参数)', args)
      
      const api = window.pywebview!.api as unknown as Record<string, (...args: any[]) => Promise<any>>
      const rawResult = await api[method](...args)
      const duration = (performance.now() - startTime).toFixed(2)

      // 验证响应格式
      if (!ApiValidator.validateResponse<T>(rawResult)) {
        Logger.warn(`方法 ${method} 返回非标准响应格式:`, rawResult)
        
        // 尝试转换为标准格式
        const normalizedResponse: ApiResponse<T> = {
          success: true,
          data: rawResult as T,
          message: '响应已自动标准化',
          timestamp: Date.now()
        }
        
        Logger.log(`✓ ${method} 完成 (${duration}ms, 自动标准化):`, normalizedResponse)
        return normalizedResponse
      }

      // 标准响应处理
      const response = rawResult as ApiResponse<T>
      
      if (response.success) {
        Logger.log(`✓ ${method} 成功 (${duration}ms):`, response.data)
      } else {
        Logger.error(`✗ ${method} 失败 (${duration}ms):`, response.message)
      }

      return response

    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2)
      Logger.error(`✗ ${method} 异常 (${duration}ms):`, error)

      // 错误响应
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        errorCode: 'EXECUTION_ERROR',
        timestamp: Date.now()
      }
    }
  }

  async callWithRetry<T = any>(
    method: string,
    ...args: any[]
  ): Promise<ApiResponse<T>> {
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      const result = await this.call<T>(method, ...args)
      
      if (result.success) {
        return result
      }

      // 如果是网络错误或可重试错误
      const isRetryable = result.errorCode === 'NETWORK_ERROR' || 
                         result.errorCode === 'TIMEOUT_ERROR' ||
                         attempt < CONFIG.MAX_RETRIES

      if (isRetryable) {
        Logger.warn(`方法 ${method} 第 ${attempt} 次尝试失败，${CONFIG.RETRY_DELAY}ms后重试:`, result.message)
        await this.delay(CONFIG.RETRY_DELAY * attempt)
      } else {
        break
      }
    }

    return {
      success: false,
      message: `方法 ${method} 重试 ${CONFIG.MAX_RETRIES} 次后仍失败`,
      errorCode: 'MAX_RETRIES_EXCEEDED',
      timestamp: Date.now()
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async callQueued<T = any>(
    method: string,
    ...args: any[]
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      this.requestQueue.push(async () => {
        const result = await this.call<T>(method, ...args)
        resolve(result)
      })

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift()!
      await task()
    }

    this.isProcessingQueue = false
  }
}

class ApiService {
  private client = new ApiClient()

  async ping() {
    return this.client.call<{ status: string; timestamp: number }>('ping')
  }

  // 窗口控制
  async minimizeWindow() {
    return this.client.call('minimize_window')
  }

  async closeWindow() {
    return this.client.call('close_window')
  }

  async getWindowPosition() {
    return this.client.call<WindowPosition>('get_window_position')
  }

  async setWindowPosition(position: Partial<WindowPosition>) {
    return this.client.call('set_window_position', position)
  }

  // 配置管理
  async getLauncherConfig() {
    return this.client.call<LauncherConfig>('get_launcher_config')
  }

  async getBackgroundConfig() {
    return this.client.call<BackgroundConfig>('get_background_config')
  }

  async getBackgroundImage() {
    return this.client.call<{ base64: string; path: string; type: string }>('get_background_image')
  }

  async updateBackgroundConfig(config: Partial<BackgroundConfig>) {
    return this.client.call('update_background_config', config)
  }

  async updateBackgroundImage(imageType: string, imagePath: string) {
    return this.client.call('update_background_image', imageType, imagePath)
  }

  async loadImageFromUrl(url: string) {
    return this.client.call<{ path: string }>('load_image_from_url', url)
  }

  async fetchImageDataUrl(url: string) {
    return this.client.call<{ dataUrl: string }>('fetch_image_data_url', url)
  }

  async getAvatarDataUrl(uuid: string, typeName: string = 'Mojang', customServer?: string, size: number = 64, useDefaultSkin: boolean = false) {
    return this.client.call<{ dataUrl: string }>('get_avatar_data_url', uuid, typeName, customServer, size, useDefaultSkin)
  }

  async selectLocalImage() {
    return this.client.call<{ path: string }>('select_local_image')
  }

  async selectJavaExecutable() {
    return this.client.call<{ path: string }>('select_java_executable')
  }

  async getGameConfig() {
    return this.client.call<GameConfig>('get_game_config')
  }

  async updateGameConfig(config: Partial<GameConfig>) {
    return this.client.call('update_game_config', config)
  }

  async getJavaList() {
    return this.client.call<JavaInstallation[]>('get_java_list')
  }

  async getThemeConfig() {
    return this.client.call<ThemeConfig>('get_theme_config')
  }

  async updateThemeConfig(config: Partial<ThemeConfig>) {
    return this.client.call('update_theme_config', config)
  }

  async getDownloadConfig() {
    return this.client.call<DownloadConfig>('get_download_config')
  }

  async updateDownloadConfig(config: Partial<DownloadConfig>) {
    return this.client.call('update_download_config', config)
  }

  // 语言配置
  async getLocaleConfig() {
    return this.client.call<LocaleConfig>('get_locale_config')
  }

  async updateLocaleConfig(locale: string) {
    return this.client.call('update_locale_config', locale)
  }

  // 鼠标特效配置
  async getMouseEffectConfig() {
    return this.client.call<MouseEffectConfig>('get_mouse_effect_config')
  }

  async updateMouseEffectConfig(config: Partial<MouseEffectConfig>) {
    return this.client.call('update_mouse_effect_config', config)
  }

  // 文件选择
  async selectDirectory() {
    return this.client.call<{ path: string }>('select_directory')
  }

  async selectFile(filters?: { name: string; extensions: string[] }[]) {
    return this.client.call<{ path: string }>('select_file', filters)
  }

  // 版本管理
  async getMinecraftVersions(filter?: VersionFilter) {
    return this.client.call<MinecraftVersion[]>('get_minecraft_versions', filter)
  }

  async getFabricVersions() {
    return this.client.call<string[]>('get_fabric_versions')
  }

  async scanVersions(paths: string[]) {

    return this.client.call<ScannedVersion[]>('scan_versions_in_path', paths)
  }


  async getVersionDetails(versionId: string) {
    return this.client.call<MinecraftVersion>('get_version_details', versionId)
  }

  async installVersion(versionId: string, options?: { gamePath?: string; loader?: string; loaderVersion?: string }) {
    return this.client.call<{ version: string; loader: string; gamePath: string }>('install_version', versionId, options)
  }

  async uninstallVersion(versionId: string) {
    return this.client.call('uninstall_version', versionId)
  }

  async checkVersionUpdate(versionId: string) {
    return this.client.call<{ updateAvailable: boolean; latestVersion?: string }>('check_version_update', versionId)
  }

  // 实例管理
  async getGameInstances() {
    return this.client.call<GameInstance[]>('get_game_instances')
  }

  async getInstanceDetails(instanceId: string) {
    return this.client.call<GameInstance>('get_instance_details', instanceId)
  }

  async createInstance(request: InstanceCreateRequest) {
    return this.client.call<GameInstance>('create_instance', request)
  }

  async updateInstance(instanceId: string, updates: Partial<GameInstance>) {
    return this.client.call('update_instance', instanceId, updates)
  }

  async deleteInstance(instanceId: string) {
    return this.client.call('delete_instance', instanceId)
  }

  async launchInstance(params?: { version: string; gamePath?: string; javaPath?: string; memory?: { min: number; max: number }; javaArgs?: string }) {
    return this.client.call<{ taskId: string; version: string }>('launch_instance', params)
  }

  async getLaunchStatus(taskId: string) {
    return this.client.call<{ stage: string; percent: number; message: string; completed: boolean; error?: string; instanceId?: string }>('get_launch_status', taskId)
  }

  async stopInstance(instanceId: string) {
    return this.client.call('stop_instance', instanceId)
  }

  async getInstanceLogs(instanceId: string) {
    return this.client.call<{ logs: string[] }>('get_instance_logs', instanceId)
  }

  // 模组管理
  async getInstanceMods(instanceId: string) {
    return this.client.call<ModInfo[]>('get_instance_mods', instanceId)
  }

  async searchMods(filter: ModSearchFilter) {
    return this.client.call<PaginatedResponse<ModInfo>>('search_mods', filter)
  }

  async installMod(instanceId: string, modId: string) {
    return this.client.call<DownloadTask>('install_mod', instanceId, modId)
  }

  async uninstallMod(instanceId: string, modId: string) {
    return this.client.call('uninstall_mod', instanceId, modId)
  }

  async toggleMod(instanceId: string, modId: string, enabled: boolean) {
    return this.client.call('toggle_mod', instanceId, modId, enabled)
  }

  // 下载管理
  async getDownloadTasks() {
    return this.client.call<DownloadTask[]>('get_download_tasks')
  }

  async getDownloadTask(taskId: string) {
    return this.client.call<DownloadTask>('get_download_task', taskId)
  }

  async pauseDownloadTask(taskId: string) {
    return this.client.call('pause_download_task', taskId)
  }

  async resumeDownloadTask(taskId: string) {
    return this.client.call('resume_download_task', taskId)
  }

  async cancelDownloadTask(taskId: string) {
    return this.client.call('cancel_download_task', taskId)
  }

  // 诊断工具
  async diagnoseApi() {
    return this.client.call<{
      environment: Record<string, any>
      apiMethods: string[]
      connectivity: boolean
    }>('diagnose_api')
  }

  // 账户管理
  async getAccounts() {
    return this.client.call<{
      accounts: Array<{
        id: string
        alias: string
        type: 'microsoft' | 'offline'
        email: string
        uuid: string
        isCurrent: boolean
        skinUrl?: string
      }>
      current: {
        id: string
        alias: string
        type: 'microsoft' | 'offline'
        email: string
        uuid: string
        skinUrl?: string
      } | null
    }>('get_accounts')
  }

  async getCurrentAccount() {
    return this.client.call<{
      id: string
      alias: string
      type: 'microsoft' | 'offline'
      email: string
      uuid: string
      skinUrl?: string
    } | null>('get_current_account')
  }

  async addOfflineAccount(username: string) {
    return this.client.call<{
      account?: {
        id: string
        alias: string
        type: 'microsoft' | 'offline'
        email: string
        uuid: string
      }
    }>('add_offline_account', username)
  }

  async startMicrosoftLogin() {
    return this.client.call<{
      status: 'pending' | 'completed' | 'error'
      userCode?: string
      verificationUri?: string
      message: string
      interval?: number
    }>('start_microsoft_login')
  }

  async pollMicrosoftLogin() {
    return this.client.call<{
      status: 'pending' | 'ready' | 'error'
      message: string
      retry_after?: number
    }>('poll_microsoft_login')
  }

  async completeMicrosoftLogin() {
    return this.client.call<{
      account?: {
        id: string
        alias: string
        type: 'microsoft' | 'offline'
        email: string
      }
      message: string
    }>('complete_microsoft_login')
  }

  async switchAccount(accountId: string) {
    return this.client.call('switch_account', accountId)
  }

  async removeAccount(accountId: string) {
    return this.client.call('remove_account', accountId)
  }

  async refreshAccountProfile(accountId: string) {
    return this.client.call('refresh_account_profile', accountId)
  }
}

// 导出
export const api = new ApiService()

// 全局诊断函数
if (typeof window !== 'undefined') {
  (window as any).diagnoseApi = async () => {
    console.log('window:', typeof window !== 'undefined' ? '✓' : '✗')
    console.log('pywebview:', window.pywebview ? '✓' : '✗')
    console.log('api:', window.pywebview?.api ? '✓' : '✗')
    
    if (window.pywebview?.api) {
      console.log('可用方法:', Object.keys(window.pywebview.api))
      try {
        const pingResult = await api.ping()
        console.log('ping:', pingResult)
      } catch (e) {
        console.error('ping 失败:', e)
      }
    }
  }
}

export default api