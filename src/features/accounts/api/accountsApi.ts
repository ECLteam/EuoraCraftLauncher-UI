import backend from '@/api/client'
import type {
  AccountListData,
  AuthlibServer,
  MinecraftAccount,
  MicrosoftCompleteData,
  MicrosoftLoginData,
  MicrosoftPollData,
} from '@/types/api'

function assertSuccess<T>(result: { success: boolean; data?: T; message?: string }, operation: string): T {
  if (!result.success) throw new Error(result.message || `${operation}失败`)
  return result.data as T
}

export const accountsApi = {
  async list(): Promise<AccountListData> {
    return assertSuccess(await backend.command('accounts_list'), '读取账户列表')
  },

  async current(): Promise<MinecraftAccount | null> {
    return assertSuccess(await backend.command('accounts_current'), '读取当前账户') ?? null
  },

  async addOffline(username: string): Promise<MinecraftAccount> {
    return assertSuccess(await backend.command('accounts_add_offline', { username }), '添加离线账户')
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

  async switch(accountId: string): Promise<void> {
    assertSuccess(await backend.command('accounts_switch', { account_id: accountId }), '切换账户')
  },

  async remove(accountId: string): Promise<void> {
    assertSuccess(await backend.command('accounts_remove', { account_id: accountId }), '删除账户')
  },

  async refresh(accountId: string): Promise<void> {
    assertSuccess(await backend.command('accounts_refresh_profile', { account_id: accountId }), '刷新账户')
  },

  async listAuthlibServers(): Promise<AuthlibServer[]> {
    return assertSuccess(await backend.command('authlib_servers'), '读取外置登录服务器') ?? []
  },

  async startMicrosoftLogin(): Promise<MicrosoftLoginData> {
    return assertSuccess(await backend.command('accounts_start_microsoft_login'), '启动微软登录')
  },

  async pollMicrosoftLogin(): Promise<MicrosoftPollData> {
    return assertSuccess(await backend.command('accounts_poll_microsoft_login'), '查询微软登录状态')
  },

  async completeMicrosoftLogin(): Promise<MicrosoftCompleteData> {
    return assertSuccess(await backend.command('accounts_complete_microsoft_login'), '完成微软登录')
  },
}
