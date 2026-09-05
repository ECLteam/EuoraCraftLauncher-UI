import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWsTransport, resolveWsConnection } from './ws'

/** 模拟 Dev Channel 服务端的伪 WebSocket：鉴权、frontend.invoke/frontend.subscribe 应答与事件推送。 */
class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 3

  readyState = FakeWebSocket.CONNECTING
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  readonly sent: string[] = []

  constructor(public readonly url: string) {
    FakeWebSocket.instances.set(url, this)
    queueMicrotask(() => {
      this.readyState = FakeWebSocket.OPEN
      this.onopen?.()
    })
  }

  send(text: string): void {
    if (this.readyState !== FakeWebSocket.OPEN) throw new Error('socket not open')
    this.sent.push(text)
    const frame = JSON.parse(text) as Record<string, unknown>
    if (frame.op === 'auth') {
      this.incoming({ op: 'auth_ok', protocolVersion: 1, launcherVersion: '0.1.0' })
    } else if (frame.method === 'frontend.invoke') {
      const payload = (frame.params as { payload?: { value?: unknown } }).payload
      this.incoming({ id: frame.id, ok: true, data: { command: (frame.params as { command: string }).command, result: { echo: payload?.value } } })
    } else if (frame.method === 'frontend.subscribe') {
      const names = (frame.params as { events: string[] }).events
      this.incoming({ id: frame.id, ok: true, data: { subscribed: names } })
    }
  }

  incoming(frame: unknown): void {
    this.onmessage?.({ data: JSON.stringify(frame) })
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.()
  }

  static instances = new Map<string, FakeWebSocket>()
}

describe('resolveWsConnection', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, '__ECL_DEV_WS__')
  })

  it('reads the injected connection from the host global', () => {
    window.__ECL_DEV_WS__ = { port: 53891, token: 'secret-token', url: 'ws://127.0.0.1:53891' }
    expect(resolveWsConnection()).toEqual({ port: 53891, token: 'secret-token', url: 'ws://127.0.0.1:53891' })
  })

  it('returns null when the injected connection is incomplete', () => {
    window.__ECL_DEV_WS__ = { port: 53891, token: '' }
    expect(resolveWsConnection()).toBeNull()
    Reflect.deleteProperty(window, '__ECL_DEV_WS__')
    expect(resolveWsConnection()).toBeNull()
  })
})

describe('WebSocket transport', () => {
  beforeEach(() => {
    FakeWebSocket.instances.clear()
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('authenticates and dispatches frontend.invoke to the backend result', async () => {
    const transport = createWsTransport({ port: 53891, token: 'secret-token' })

    const result = await transport.invoke('frontend_ready')

    const socket = FakeWebSocket.instances.get('ws://127.0.0.1:53891')!
    const sent = socket.sent.map((text) => JSON.parse(text))
    expect(sent[0]).toEqual({ op: 'auth', token: 'secret-token' })
    expect(sent[sent.length - 1].method).toBe('frontend.invoke')
    expect(result).toEqual({ echo: undefined })
  })

  it('listens to a frontend event after subscribing and forwards notifications', async () => {
    const transport = createWsTransport({ port: 53891, token: 'secret-token' })
    const handler = vi.fn()

    await transport.listen<{ id: string }>('accounts_changed', handler)

    const socket = FakeWebSocket.instances.get('ws://127.0.0.1:53891')!
    const subscribeFrame = JSON.parse(socket.sent.at(-1)!)
    expect(subscribeFrame.method).toBe('frontend.subscribe')
    expect(subscribeFrame.params).toEqual({ events: ['accounts_changed'] })

    socket.incoming({ event: 'accounts_changed', data: { id: 'a1' } })
    expect(handler).toHaveBeenCalledWith({ id: 'a1' })
  })

  it('unsubscribe stops local dispatch but keeps the socket subscription', async () => {
    const transport = createWsTransport({ port: 53891, token: 'secret-token' })
    const handler = vi.fn()

    const unlisten = await transport.listen<{ id: string }>('accounts_changed', handler)
    const socket = FakeWebSocket.instances.get('ws://127.0.0.1:53891')!

    socket.incoming({ event: 'accounts_changed', data: { id: 'a1' } })
    expect(handler).toHaveBeenCalledTimes(1)

    unlisten()
    socket.incoming({ event: 'accounts_changed', data: { id: 'a2' } })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('exposes desktop mode and available transport', () => {
    const transport = createWsTransport({ port: 53891, token: 'secret-token' })
    expect(transport.mode).toBe('desktop')
    expect(transport.available).toBe(true)
  })
})