// 全局类型声明
interface PyWebViewAPI {
  minimize_window: () => Promise<any>
  close_window: () => Promise<any>
  get_user_agreement_status: () => Promise<any>
  save_user_agreement: () => Promise<any>
  clear_user_agreement: () => Promise<any>
  // 配置管理API
  get_launcher_config: () => Promise<any>
  get_background_config: () => Promise<any>
  get_background_image: () => Promise<any>
  update_background_config: (config: any) => Promise<any>
  update_background_image: (type: string, path: string) => Promise<any>
  get_game_config: () => Promise<any>
  update_game_config: (config: any) => Promise<any>
  get_java_list: () => Promise<any>
  get_theme_config: () => Promise<any>
  update_theme_config: (config: any) => Promise<any>
  get_download_config: () => Promise<any>
  update_download_config: (config: any) => Promise<any>
  get_mouse_effect_config: () => Promise<any>
  update_mouse_effect_config: (config: any) => Promise<any>
  get_locale_config: () => Promise<any>
  update_locale_config: (locale: string) => Promise<any>
  // 文件选择API
  select_directory: () => Promise<any>
  select_java_executable: () => Promise<any>
  select_local_image: () => Promise<any>
  // 版本管理API
  get_minecraft_versions: (filter?: any) => Promise<any>
  get_fabric_versions: () => Promise<any>
  scan_versions_in_path: (paths: string[]) => Promise<any>
  install_version: (versionId: string, options?: any) => Promise<any>
  uninstall_version: (versionId: string) => Promise<any>
  // 账户管理API
  get_accounts: () => Promise<any>
  get_current_account: () => Promise<any>
  add_offline_account: (username: string) => Promise<any>
  start_microsoft_login: () => Promise<any>
  poll_microsoft_login: () => Promise<any>
  complete_microsoft_login: () => Promise<any>
  switch_account: (accountId: string) => Promise<any>
  remove_account: (accountId: string) => Promise<any>
  refresh_account_profile: (accountId: string) => Promise<any>
  // 实例管理API
  get_game_instances: () => Promise<any>
  get_instance_details: (instanceId: string) => Promise<any>
  create_instance: (request: any) => Promise<any>
  update_instance: (instanceId: string, updates: any) => Promise<any>
  delete_instance: (instanceId: string) => Promise<any>
  launch_instance: (instanceId: string) => Promise<any>
  stop_instance: (instanceId: string) => Promise<any>
  get_instance_logs: (instanceId: string) => Promise<any>
  // 通用API
  ping: () => Promise<any>
  // 可以添加更多API方法
  [key: string]: any
}

interface Window {
  pywebview?: {
    api: PyWebViewAPI
  }
}

export {}