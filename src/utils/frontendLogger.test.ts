import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installFrontendLogging } from './frontendLogger'

const mocks = vi.hoisted(() => ({
  isDesktop: true,
  command: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  default: {
    runtime: {
      get isDesktop() {
        return mocks.isDesktop
      },
    },
    command: mocks.command,
  },
}))

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('installFrontendLogging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isDesktop = true
    mocks.command.mockResolvedValue({ success: true })
    installFrontendLogging()
  })

  it('把 console.error 转发为 frontend_log 错误日志', async () => {
    console.error('登录失败', new Error('boom'))
    await flush()

    expect(mocks.command).toHaveBeenCalledWith(
      'frontend_log',
      expect.objectContaining({ level: 'error', message: '登录失败' })
    )
  })

  it('把 console.warn 转发为 frontend_log 警告日志', async () => {
    console.warn('配置缺失，使用默认值')
    await flush()

    expect(mocks.command).toHaveBeenCalledWith(
      'frontend_log',
      expect.objectContaining({ level: 'warn', message: '配置缺失，使用默认值' })
    )
  })

  it('多个参数序列化到 detail 字段', async () => {
    console.error('加载失败:', { code: 404 })
    await flush()

    expect(mocks.command).toHaveBeenCalledWith(
      'frontend_log',
      expect.objectContaining({ level: 'error', message: '加载失败:', detail: expect.stringContaining('404') })
    )
  })

  it('非桌面环境不产生任何 IPC 调用', async () => {
    mocks.isDesktop = false
    console.error('不应转发')
    console.warn('不应转发')
    await flush()

    expect(mocks.command).not.toHaveBeenCalled()
  })

  it('普通信息日志不转发', async () => {
    // eslint-disable-next-line no-console -- 被测对象即 console 拦截器，需直接调用 console 验证转发行为
    console.log('常规日志')
    // eslint-disable-next-line no-console
    console.info('信息日志')
    // eslint-disable-next-line no-console
    console.debug('调试日志')
    await flush()

    expect(mocks.command).not.toHaveBeenCalled()
  })

  it('抑制 WebGL 着色器编译警告，不输出也不转发', async () => {
    console.warn('THREE.WebGLProgram: Program Info Log: (50,12-96): warning X4713: Sample Bias value is limited')
    await flush()

    expect(mocks.command).not.toHaveBeenCalled()
  })
})
