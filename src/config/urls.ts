// ============================================================
// 外部链接统一管理
// 所有外部 URL 集中在此，方便维护和批量替换
// ============================================================

export const URLS = {
  /** 用户协议 */
  userAgreement: 'https://euoracraft.zient.top/guide/user-agreement/',

  /** GitHub 组织 */
  githubOrg: 'https://github.com/ECLteam',

  /** 头像服务 */
  avatarApi: 'https://crafatar.com/avatars',

  /** 镜像源 */
  bmclapi: 'https://bmclapi2.bangbang93.com',
  littleskin: 'https://littleskin.cn',

  // ---- 技术栈链接 ----

  pytauri: {
    repo: 'https://github.com/WSH032/pytauri',
    license: 'https://github.com/WSH032/pytauri/blob/main/LICENSE',
  },
  vue: {
    repo: 'https://github.com/vuejs/core',
    license: 'https://github.com/vuejs/core/blob/main/LICENSE',
  },
  vite: {
    repo: 'https://github.com/vitejs/vite',
    license: 'https://github.com/vitejs/vite/blob/main/LICENSE',
  },
  tauri: {
    repo: 'https://github.com/tauri-apps/tauri',
    license: 'https://github.com/tauri-apps/tauri/blob/dev/LICENSE_APACHE-2.0',
  },
  naiveUI: {
    repo: 'https://github.com/tusen-ai/naive-ui',
    license: 'https://github.com/tusen-ai/naive-ui/blob/main/LICENSE',
  },
  authlibInjector: {
    repo: 'https://github.com/yushijinhun/authlib-injector',
    license: 'https://github.com/yushijinhun/authlib-injector/blob/develop/LICENSE',
  },
} as const

/** 头像 URL 构建 */
export function getAvatarUrl(uuid: string, size = 64): string {
  const cleanUuid = uuid.replace(/-/g, '')
  return `${URLS.avatarApi}/${cleanUuid}?size=${size}&overlay=true&default=MHF_Steve`
}