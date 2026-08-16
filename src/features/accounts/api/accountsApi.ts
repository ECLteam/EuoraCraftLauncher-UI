import backend from '@/api/client'
import { unwrapResponse as assertSuccess } from '@/app/runtime/errorPresentation'
import type {
  AccountListData,
  AuthlibServer,
  MinecraftAccount,
  MicrosoftCompleteData,
  MicrosoftLoginConfigData,
  MicrosoftLoginData,
  MicrosoftLoginStatusEvent,
  MicrosoftPollData,
  AccountTextures,
  SkinModel,
  WardrobeImportResult,
  WardrobeItem,
  WardrobeKind,
} from '@/types/api'

export const accountsApi = {
  async list(): Promise<AccountListData> {
    return assertSuccess(await backend.command('accounts_list'), '读取账户列表')
  },

  async current(): Promise<MinecraftAccount | null> {
    return assertSuccess(await backend.command('accounts_current'), '读取当前账户') ?? null
  },

  async addOffline(username: string, uuid?: string): Promise<MinecraftAccount> {
    return assertSuccess(await backend.command('accounts_add_offline', { username, uuid }), '添加离线账户')
  },

  async addAuthlib(serverUrl: string, email: string, password: string): Promise<MinecraftAccount> {
    return assertSuccess(
      await backend.command('accounts_add_authlib', {
        server_url: serverUrl,
        email,
        password,
      }),
      '添加外置登录账户'
    )
  },

  async selectAuthlibProfile(accountId: string, profileId: string): Promise<MinecraftAccount> {
    return assertSuccess(
      await backend.command('accounts_select_authlib_profile', {
        account_id: accountId,
        profile_id: profileId,
      }),
      '选择外置登录角色'
    )
  },

  async resolveAuthlibServer(serverUrl: string): Promise<string> {
    return assertSuccess(
      await backend.command('authlib_resolve_server', { server_url: serverUrl }),
      '识别外置登录服务器'
    )
  },

  async switch(accountId: string): Promise<void> {
    assertSuccess(await backend.command('accounts_switch', { account_id: accountId }), '切换账户')
  },

  async remove(accountId: string): Promise<void> {
    assertSuccess(await backend.command('accounts_remove', { account_id: accountId }), '删除账户')
  },

  async setFavorite(accountId: string, favorite: boolean): Promise<AccountListData> {
    return assertSuccess(
      await backend.command('accounts_set_favorite', { account_id: accountId, favorite }),
      '设置收藏'
    )
  },

  async setPinned(accountId: string, pinned: boolean): Promise<AccountListData> {
    return assertSuccess(await backend.command('accounts_set_pinned', { account_id: accountId, pinned }), '设置置顶')
  },

  async refresh(accountId: string): Promise<void> {
    assertSuccess(await backend.command('accounts_refresh_profile', { account_id: accountId }), '刷新账户')
  },

  async textureUrls(accountId: string): Promise<AccountTextures> {
    return assertSuccess(await backend.command('accounts_texture_urls', { account_id: accountId }), '读取账户材质')
  },

  async listWardrobe(): Promise<WardrobeItem[]> {
    return assertSuccess(await backend.command('wardrobe_list'), '读取本地衣柜') ?? []
  },

  async syncAccountSkin(accountId: string): Promise<WardrobeImportResult> {
    return assertSuccess(
      await backend.command('wardrobe_sync_account_skin', { account_id: accountId }),
      '同步账户当前皮肤'
    )
  },

  async selectWardrobeImage(kind: WardrobeKind): Promise<string | null> {
    const result = await backend.command('select_image', { purpose: kind })
    if (!result.success) throw new Error(result.message || '选择纹理失败')
    return result.data?.path || null
  },

  async importWardrobe(path: string, kind: WardrobeKind, model?: SkinModel): Promise<WardrobeImportResult> {
    return assertSuccess(await backend.command('wardrobe_import', { path, kind, model }), '导入本地纹理')
  },

  async updateWardrobe(itemId: string, name?: string, model?: SkinModel, favorite?: boolean): Promise<WardrobeItem> {
    return assertSuccess(
      await backend.command('wardrobe_update', { item_id: itemId, name, model, favorite }),
      '更新衣柜条目'
    )
  },

  async deleteWardrobe(itemId: string): Promise<void> {
    assertSuccess(await backend.command('wardrobe_delete', { item_id: itemId }), '删除衣柜条目')
  },

  async wardrobeTexture(itemId: string): Promise<string> {
    const data = assertSuccess(await backend.command('wardrobe_texture', { item_id: itemId }), '读取衣柜纹理')
    return data.dataUrl
  },

  async exportWardrobe(itemId: string): Promise<string | null> {
    const data = assertSuccess(await backend.command('wardrobe_export', { item_id: itemId }), '导出衣柜纹理')
    return data.path || null
  },

  async applyWardrobeSkin(itemId: string, accountId: string): Promise<MinecraftAccount> {
    return assertSuccess(
      await backend.command('wardrobe_apply_skin', { item_id: itemId, account_id: accountId }),
      '上传 Microsoft 皮肤'
    )
  },

  async resetMicrosoftSkin(accountId: string): Promise<MinecraftAccount> {
    return assertSuccess(await backend.command('microsoft_reset_skin', { account_id: accountId }), '重置皮肤')
  },

  async setMicrosoftCape(accountId: string, capeId: string): Promise<MinecraftAccount> {
    return assertSuccess(
      await backend.command('microsoft_set_cape', { account_id: accountId, cape_id: capeId }),
      '切换披风'
    )
  },

  async resetMicrosoftCape(accountId: string): Promise<MinecraftAccount> {
    return assertSuccess(await backend.command('microsoft_reset_cape', { account_id: accountId }), '卸下披风')
  },

  async listAuthlibServers(): Promise<AuthlibServer[]> {
    return assertSuccess(await backend.command('authlib_servers'), '读取外置登录服务器') ?? []
  },

  async getMicrosoftLoginConfig(): Promise<MicrosoftLoginConfigData> {
    return assertSuccess(await backend.command('accounts_microsoft_login_config'), '读取微软登录配置')
  },

  async startMicrosoftLogin(): Promise<MicrosoftLoginData> {
    return assertSuccess(await backend.command('accounts_start_microsoft_login'), '启动微软登录')
  },

  async pollMicrosoftLogin(): Promise<MicrosoftPollData> {
    return assertSuccess(await backend.command('accounts_poll_microsoft_login'), '查询微软登录状态')
  },

  async cancelMicrosoftLogin(): Promise<void> {
    assertSuccess(await backend.command('accounts_cancel_microsoft_login'), '取消微软登录')
  },

  async completeMicrosoftLogin(): Promise<MicrosoftCompleteData> {
    return assertSuccess(await backend.command('accounts_complete_microsoft_login'), '完成微软登录')
  },

  onMicrosoftLoginStatus(handler: (event: MicrosoftLoginStatusEvent) => void): () => void {
    return backend.on('accounts_microsoft_login_status', handler)
  },
}
