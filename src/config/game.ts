// ============================================================
// 游戏相关配置
// 启动阶段、进度映射、默认值等
// ============================================================

import type { LaunchPhase } from '@/types/api'

// ---- 启动阶段文案 ----

export const LAUNCH_STAGES = {
  prepare: '准备启动...',
  preparing: '正在准备...',
  checking_files: '检查游戏文件完整性...',
  files_checked: '文件校验完成',
  completing_files: '补全缺失文件...',
  downloading_assets: '下载游戏资源...',
  building_params: '构建启动参数...',
  args_built: '参数构建完成',
  extracting_natives: '解压原生库...',
  natives_done: '原生库解压完成',
  about_to_launch: '即将启动...',
  launching: '启动游戏进程...',
  completed: '启动成功！',
  launched: '启动成功！',
  success: '启动成功！',
  error: '启动失败',
} as const

// ---- 启动进度百分比映射 ----

export const LAUNCH_PROGRESS: Partial<Record<LaunchPhase, number>> = {
  preparing: 3,
  checking: 5,
  files_checked: 50,
  building_args: 65,
  args_built: 75,
  natives_done: 85,
  about_to_launch: 92,
  launching: 95,
}

/** 下载阶段的基础进度 */
export const DOWNLOAD_BASE_PROGRESS = 10
/** 下载阶段的缩放系数 */
export const DOWNLOAD_PROGRESS_SCALE = 0.38

// ---- 延迟/超时 ----

/** 启动成功后关闭进度面板的延迟 (ms) */
export const LAUNCH_SUCCESS_HIDE_DELAY = 1500
/** 启动失败后关闭进度面板的延迟 (ms) */
export const LAUNCH_ERROR_HIDE_DELAY = 2000
/** 状态消息自动消失时间 (ms) */
export const STATUS_MESSAGE_AUTO_HIDE = 5000

// ---- 内存默认值 ----

/** 内存滑块最小值 (MB) */
export const MEMORY_MIN = 1024
/** 内存滑块步长 (MB) */
export const MEMORY_STEP = 256
/** 自动内存默认值 (MB) */
export const AUTO_MEMORY_DEFAULT = 4096
/** 安全内存最小值 (MB) */
export const SAFE_MEMORY_MIN = 1024
/** 系统内存使用比例上限 */
export const MEMORY_MAX_RATIO = 0.8

// ---- 版本设置默认值 ----

export const DEFAULT_VERSION_SETTINGS = {
  isolated: false,
  customMemory: false,
  memory: 4096,
  customJava: false,
  javaPath: '',
  jvmArgs: '',
  gameArgs: '',
}

// ---- 虚拟滚动 ----

export const VERSION_LIST_ITEM_HEIGHT = 56
export const VERSION_LIST_BUFFER_SIZE = 5
export const VERSION_LIST_CACHE_TTL = 10 * 60 * 1000

// ---- 加载器版本列表截取上限 ----

export const LOADER_VERSION_LIST_LIMIT = 20
