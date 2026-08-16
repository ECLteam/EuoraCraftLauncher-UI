import { beforeEach, describe, expect, it, vi } from 'vitest'
import { okResponse } from '@/test/mockBackend'
import { connectorApi } from './connectorApi'

const command = vi.hoisted(() => vi.fn())

vi.mock('@/api/client', () => ({
  default: { command },
}))

describe('connectorApi', () => {
  beforeEach(() => {
    command.mockReset()
    command.mockResolvedValue(okResponse({ status: 'ok' }))
  })

  it.each([
    ['status', [], 'connector_status', undefined],
    ['hostPort', [25565], 'connector_host_port', { port: 25565 }],
    [
      'hostInstance',
      [{ game_path: 'C:\\Games\\.minecraft', version_id: 'Fabric 1.21.5' }],
      'connector_host_instance',
      { game_path: 'C:\\Games\\.minecraft', version_id: 'Fabric 1.21.5' },
    ],
    ['join', ['U/ECL7-W9KM-4R2P-X8QA'], 'connector_join', { code: 'U/ECL7-W9KM-4R2P-X8QA' }],
    ['leave', [], 'connector_leave', undefined],
    ['kick', ['machine-1'], 'connector_kick', { machine_id: 'machine-1' }],
    ['matchInstances', [], 'connector_match_instances', undefined],
    ['easyTierStatus', [], 'connector_easytier_status', undefined],
    ['downloadEasyTier', [], 'connector_easytier_download', undefined],
    ['scanPorts', [], 'connector_scan_ports', undefined],
    ['natType', [], 'connector_nat_type', undefined],
  ] as const)('%s uses the typed IPC contract', async (method, args, expectedCommand, expectedPayload) => {
    await (connectorApi[method] as (...params: never[]) => Promise<unknown>)(...(args as unknown as never[]))

    if (expectedPayload === undefined) expect(command).toHaveBeenCalledWith(expectedCommand)
    else expect(command).toHaveBeenCalledWith(expectedCommand, expectedPayload)
  })
})
