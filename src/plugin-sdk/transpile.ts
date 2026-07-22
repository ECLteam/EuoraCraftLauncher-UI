// 基于 sucrase 的 TypeScript → JavaScript 转译器，用于动态编译插件 TS 代码

import { transform } from 'sucrase'

export function transpileTS(code: string): string {
  return transform(code, { transforms: ['typescript', 'jsx'] }).code
}
