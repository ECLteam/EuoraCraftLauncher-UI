import { createCommand } from './commands'
import { createConfig } from './config'
import { createEvents } from './events'
import { createFile, createFs } from './fs'
import { createRuntime } from './runtime'

export const backend = {
  ...createRuntime(),
  config: createConfig(),
  command: createCommand(),
  ...createEvents(),
  fs: createFs(),
  file: createFile(),
}

export default backend
