import type { BackendTransport } from './types'

/**
 * 工具箱内嵌前端与沙箱启动器之间通过 Dev Channel 建立的传输层连接信息。
 * url 缺省时按 loopback 端口拼装；token 用于启动器端鉴权。
 */
export interface DevChannelConnection {
  port: number
  token: string
  url?: string
}

interface RequestFrame {
  id: number
  method: string
  params?: Record<string, unknown>
}

interface ReplyFrame {
  id: number
  ok: boolean
  data?: unknown
  error?: { code: string; message: string }
}

interface NotificationFrame {
  event: string
  data: unknown
}

// 宿主注入的全局连接信息，供嵌入前端在缺少 Tauri 运行时的情况下回落到 Dev Channel。
export function resolveWsConnection(): DevChannelConnection | null {
  if (typeof window === 'undefined') return null
  const injected = window.__ECL_DEV_WS__
  if (!injected || typeof injected !== 'object' || typeof injected.port !== 'number' || typeof injected.token !== 'string') {
    return null
  }
  if (!injected.token) return null
  return { port: injected.port, token: injected.token, url: injected.url }
}

export function createWsTransport(connection: DevChannelConnection): BackendTransport {
  const listeners = new Map<string, Set<(payload: unknown) => void>>()
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  const subscribed = new Set<string>()
  let socket: WebSocket | null = null
  let nextId = 1

  const dispatch = (name: string, payload: unknown) => {
    for (const handler of listeners.get(name) ?? []) handler(payload)
  }

  const parse = (raw: string): ReplyFrame | NotificationFrame | null => {
    try {
      return JSON.parse(raw) as ReplyFrame | NotificationFrame
    } catch {
      return null
    }
  }

  const react = (frame: ReplyFrame | NotificationFrame) => {
    if ('id' in frame) {
      const waiter = pending.get(frame.id)
      if (!waiter) return
      pending.delete(frame.id)
      if (frame.ok) {
        waiter.resolve(frame.data)
      } else {
        waiter.reject(new Error(frame.error?.message ?? frame.error?.code ?? 'Dev Channel 请求失败'))
      }
      return
    }
    if ('event' in frame) dispatch(frame.event, frame.data)
  }

  const connect = () =>
    new Promise<void>((resolve, reject) => {
      const url = connection.url ?? `ws://127.0.0.1:${connection.port}`
      let authenticated = false
      socket = new WebSocket(url)
      socket.onopen = () => socket?.send(JSON.stringify({ op: 'auth', token: connection.token }))
      socket.onmessage = (event) => {
        const frame = parse(String(event.data))
        if (!frame) return
        if (!authenticated) {
          // 鉴权响应与普通消息共用同一通道，首个 auth_ok 后转入正常分发。
          if ((frame as { op?: string }).op === 'auth_ok') {
            authenticated = true
            resolve()
          } else if ((frame as { op?: string }).op === 'auth_failed') {
            reject(new Error((frame as { message?: string }).message ?? 'Dev Channel 鉴权失败'))
          }
          return
        }
        react(frame)
      }
      socket.onerror = () => reject(new Error('Dev Channel 连接失败'))
      socket.onclose = () => {
        socket = null
        for (const waiter of pending.values()) waiter.reject(new Error('Dev Channel 连接已关闭'))
        pending.clear()
      }
    })

  const ensureOpen = async () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) await connect()
  }

  const request = async (method: string, params?: Record<string, unknown>): Promise<unknown> => {
    await ensureOpen()
    const id = nextId++
    const frame: RequestFrame = { id, method, params: params ?? {} }
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      socket?.send(JSON.stringify(frame))
    })
  }

  return {
    mode: 'desktop',
    available: true,
    async invoke(command, payload) {
      const result = await request('frontend.invoke', { command, payload })
      return (result as { result?: unknown } | undefined)?.result
    },
    async listen<T>(name: string, handler: (payload: T) => void) {
      const handlers = listeners.get(name) ?? new Set<(payload: unknown) => void>()
      const tracked = handler as (payload: unknown) => void
      handlers.add(tracked)
      listeners.set(name, handlers)
      if (!subscribed.has(name)) {
        subscribed.add(name)
        try {
          await request('frontend.subscribe', { events: [name] })
        } catch (error) {
          subscribed.delete(name)
          throw error
        }
      }
      return () => {
        handlers.delete(tracked)
        if (handlers.size === 0) listeners.delete(name)
      }
    },
    convertFileSrc() {
      return null
    },
  }
}