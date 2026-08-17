import { reactive, ref } from 'vue'

/** 悬浮窗形态：minimized 圆形按钮 / floating 可拖动窗口 / maximized 全屏 */
export type LauncherLogWindowMode = 'minimized' | 'floating' | 'maximized'

/** 悬浮窗位置与尺寸，连同圆形按钮坐标一并持久化 */
export interface LauncherLogWindowLayout {
  x: number
  y: number
  width: number
  height: number
  bx: number
  by: number
}

const STORAGE_KEY = 'ecl.launcherLog.window.v1'

const DEFAULT_LAYOUT: LauncherLogWindowLayout = {
  x: 72,
  y: 72,
  width: 660,
  height: 420,
  bx: 24,
  by: 24,
}

/** 悬浮窗总开关（调试界面控制，默认关闭，关闭时窗口整体隐藏） */
export const launcherLogWindowEnabled = ref(false)
/** 当前形态，默认最小化为圆形按钮 */
export const launcherLogWindowMode = ref<LauncherLogWindowMode>('minimized')
/** 最小化期间累计的新日志条数，用于圆形按钮角标提示 */
export const launcherLogUnread = ref(0)
/** 窗口位置与尺寸，模块级共享以跨页面保持一致 */
export const launcherLogLayout = reactive<LauncherLogWindowLayout>({ ...DEFAULT_LAYOUT })

/**
 * 从本地存储恢复窗口布局，失败时沿用默认值。
 */
export function readLauncherLogLayout(): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    Object.assign(launcherLogLayout, JSON.parse(raw))
  } catch {
    /* 恢复失败时沿用默认布局 */
  }
}

/**
 * 将当前窗口布局写入本地存储，仅在写入失败时静默忽略。
 */
export function persistLauncherLogLayout(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(launcherLogLayout))
  } catch {
    /* 写入失败时忽略，仅丢失记忆 */
  }
}

/**
 * 切换悬浮窗显示。开启后回到最小化（圆形按钮）形态并清零未读数。
 *
 * @param enabled 是否显示悬浮窗
 */
export function setLauncherLogWindowEnabled(enabled: boolean): void {
  launcherLogWindowEnabled.value = enabled
  launcherLogWindowMode.value = 'minimized'
  launcherLogUnread.value = 0
}

/** 展开为可拖动窗口并清零未读数 */
export function openLauncherLogWindow(): void {
  launcherLogWindowMode.value = 'floating'
  launcherLogUnread.value = 0
}

/** 收起为圆形按钮并清零未读数 */
export function minimizeLauncherLogWindow(): void {
  launcherLogWindowMode.value = 'minimized'
  launcherLogUnread.value = 0
}

/** 切换为全屏形态 */
export function maximizeLauncherLogWindow(): void {
  launcherLogWindowMode.value = 'maximized'
}

/** 从全屏恢复为可拖动窗口 */
export function restoreLauncherLogWindow(): void {
  launcherLogWindowMode.value = 'floating'
}

/**
 * 启动器日志悬浮窗控制器（仅调试用途，由调试界面开关控制显隐）。
 *
 * :return: 悬浮窗状态与动作集合
 */
export function useLauncherLogWindow() {
  return {
    launcherLogWindowEnabled,
    launcherLogWindowMode,
    launcherLogUnread,
    launcherLogLayout,
    setLauncherLogWindowEnabled,
    openLauncherLogWindow,
    minimizeLauncherLogWindow,
    maximizeLauncherLogWindow,
    restoreLauncherLogWindow,
  }
}
