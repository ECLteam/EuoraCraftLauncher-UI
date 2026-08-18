#!/usr/bin/env node
/**
 * 前后端 IPC 命令名对齐校验脚本。
 *
 * 权威来源：
 *  - 后端：ECL/api/registry.py::COMMAND_NAMES
 *  - 前端：src/types/api.ts::COMMAND_NAMES（与 CommandPayloadMap 键由编译期断言绑定）
 *
 * 校验规则：
 *  - connector_* 命令必须在两端完全一致（P1 简化项：IPC 命令名 4 处重复定义）
 *  - 全量命令差异仅输出提示（前端保留历史/废弃命令属正常现象，需人工清理）
 *
 * 用法：在 frontend/ 目录下执行 `pnpm check:commands`（或 `node scripts/check-command-alignment.mjs`）。
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backendRegistryPath = path.resolve(frontendRoot, '..', 'ECL', 'api', 'registry.py')
const frontendTypesPath = path.join(frontendRoot, 'src', 'types', 'api.ts')

/** 提取 registry.py 中 COMMAND_NAMES = ( ... ) 内的全部命令名字符串。 */
function extractBackendCommands(source) {
  const start = source.indexOf('COMMAND_NAMES = (')
  if (start === -1) throw new Error('registry.py 中未找到 COMMAND_NAMES')
  const end = source.indexOf(')', start)
  if (end === -1) throw new Error('registry.py 中 COMMAND_NAMES 元组未闭合')
  const block = source.slice(start, end)
  return [...block.matchAll(/"([a-z][a-z0-9_]*)"/g)].map((match) => match[1])
}

/** 提取 types/api.ts 中 export const COMMAND_NAMES = { ... } 的键。 */
function extractFrontendCommands(source) {
  const start = source.indexOf('export const COMMAND_NAMES = {')
  if (start === -1) throw new Error('types/api.ts 中未找到 COMMAND_NAMES 常量')
  const end = source.indexOf('} as const', start)
  if (end === -1) throw new Error('types/api.ts 中 COMMAND_NAMES 常量未闭合')
  const block = source.slice(start, end)
  return [...block.matchAll(/^\s{2}([a-z][a-z0-9_]*):/gm)].map((match) => match[1])
}

const backendCommands = new Set(extractBackendCommands(readFileSync(backendRegistryPath, 'utf8')))
const frontendCommands = new Set(extractFrontendCommands(readFileSync(frontendTypesPath, 'utf8')))

const onlyBackend = [...backendCommands].filter((command) => !frontendCommands.has(command)).sort()
const onlyFrontend = [...frontendCommands].filter((command) => !backendCommands.has(command)).sort()

console.log(`后端 registry.COMMAND_NAMES : ${backendCommands.size} 个命令`)
console.log(`前端 types/api.ts COMMAND_NAMES: ${frontendCommands.size} 个命令`)

if (onlyBackend.length > 0) {
  console.log('仅后端存在（前端缺失）:')
  for (const command of onlyBackend) console.log(`  - ${command}`)
}
if (onlyFrontend.length > 0) {
  console.log('仅前端存在（后端缺失）:')
  for (const command of onlyFrontend) console.log(`  - ${command}`)
}

// 核心校验：connector_* 命令两端必须一致
const connectorOnlyBackend = onlyBackend.filter((command) => command.startsWith('connector_'))
const connectorOnlyFrontend = onlyFrontend.filter((command) => command.startsWith('connector_'))

if (connectorOnlyBackend.length > 0 || connectorOnlyFrontend.length > 0) {
  console.error('FAIL: connector_* 命令在前后端不一致，请同步 ECL/api/registry.py 与 src/types/api.ts::COMMAND_NAMES')
  for (const command of connectorOnlyBackend) console.error(`  - 仅后端: ${command}`)
  for (const command of connectorOnlyFrontend) console.error(`  - 仅前端: ${command}`)
  process.exit(1)
}

console.log(`PASS: connector_* 命令前后端完全一致（${[...backendCommands].filter((c) => c.startsWith('connector_')).length} 个）`)

if (onlyBackend.length > 0 || onlyFrontend.length > 0) {
  console.log(
    `提示: 全量命令存在 ${onlyBackend.length + onlyFrontend.length} 处差异（多为前端历史/废弃命令，需人工清理，不影响本校验）`
  )
}
