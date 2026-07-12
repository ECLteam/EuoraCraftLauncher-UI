/**
 * 轻量 TypeScript → JavaScript 转译器
 * 用于在浏览器中动态编译插件注入的 TS 代码。
 * 支持的 TS 特性: 类型注解、接口、类型别名、枚举、泛型、as 断言、import type
 */

// ── 公共 API ──

/**
 * 将 TypeScript 代码转译为 JavaScript。
 * 这是一个简化版转译器，适合插件脚本场景。
 */
export function transpileTS(code: string): string {
  let result = code

  // 按顺序处理，确保转换正确
  result = removeImportType(result)
  result = removeInterfaces(result)
  result = removeTypeAliases(result)
  result = convertEnums(result)
  result = stripTypeAnnotations(result)
  result = stripAsAssertions(result)

  return result
}

// ── 内部转换函数 ──

/** 移除 import type 语句 */
function removeImportType(code: string): string {
  return code.replace(/^import\s+type\s+.*?;?\s*$/gm, '')
}

/** 移除 interface 声明 */
function removeInterfaces(code: string): string {
  // 匹配 interface Name { ... } 或 interface Name extends Other { ... }
  const result = code.replace(
    /export\s+interface\s+\w+(?:\s+extends\s+[\w.,\s]+)?\s*\{[\s\S]*?\n\}/g,
    ''
  )
  return result.replace(
    /interface\s+\w+(?:\s+extends\s+[\w.,\s]+)?\s*\{[\s\S]*?\n\}/g,
    ''
  )
}

/** 移除 type 别名声明 */
function removeTypeAliases(code: string): string {
  return code.replace(/^(export\s+)?type\s+\w+(?:<[^>]*>)?\s*=\s*.*$/gm, '')
}

/** 转换 enum 声明为对象字面量 */
function convertEnums(code: string): string {
  return code.replace(
    /(export\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g,
    (_match, _export, name, body) => {
      const prefix = _export ? 'export ' : ''
      const entries = body
        .split(/[,\n]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .map((s: string, i: number) => {
          const eq = s.indexOf('=')
          if (eq > -1) {
            const key = s.substring(0, eq).trim()
            const val = s.substring(eq + 1).trim()
            return `  ${key}: ${val}`
          }
          return `  ${s}: ${i}`
        })
      return `${prefix}const ${name} = {\n${entries.join(',\n')}\n}`
    }
  )
}

/** 剥离类型注解（参数类型、返回值类型、泛型） */
function stripTypeAnnotations(code: string): string {
  let result = code

  // 处理函数参数的类型注解: (param: Type) => (param)
  // 需要处理嵌套泛型如 Map<string, number>
  result = stripParamTypes(result)

  // 处理返回值类型: function foo(): Type { -> function foo() {
  result = result.replace(/\)\s*:\s*(?:[\w<>[\],\s|&]+|\([^)]*\))\s*\{/g, ') {')
  result = result.replace(/\)\s*:\s*(?:Promise<[\w<>[\],\s|&]+>|[\w<>[\],\s|&]+)\s*=>/g, ') =>')

  // 处理变量类型注解: const x: Type = ... -> const x = ...
  result = result.replace(/\b(let|const|var)\s+(\w+)\s*:\s*(?:[\w<>[\],\s|&'"`]+|\([^)]*\))\s*=/g, '$1 $2 =')

  // 处理泛型函数声明: function foo<T>(...) -> function foo(...)
  result = result.replace(/\bfunction\s+(\w+)\s*<[^>]+>/g, 'function $1')
  result = result.replace(/\b(async\s+)?function\s+(\w+)\s*<[^>]+>/g, '$1function $2')

  // 处理泛型箭头函数: const foo = <T>(...) => -> const foo = (...) =>
  result = result.replace(/=\s*<[^>]+>\s*\(/g, '= (')

  return result
}

/** 剥离函数参数中的类型注解 */
function stripParamTypes(code: string): string {
  // 逐行处理参数列表中的类型注解
  const lines = code.split('\n')
  const result: string[] = []

  for (const line of lines) {
    // 检查是否包含参数列表
    if (line.includes('(') && (line.includes(': string') || line.includes(': number') || line.includes(': boolean') || line.includes(': any') || line.includes(': void') || line.includes(': Record') || line.includes(': Map') || line.includes(': Array') || line.includes(': Promise') || line.includes(': Partial') || line.includes(': Pick') || line.includes(': Omit') || /\w+\s*:\s*[\w<>[\],\s|&'"]+[\s,)]/.test(line))) {
      result.push(stripLineParamTypes(line))
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

/** 剥离单行中的参数类型注解 */
function stripLineParamTypes(line: string): string {
  // 简化处理：匹配 (paramName: Type, paramName: Type) 的模式
  // 使用状态机方式处理，避免正则表达式过度匹配
  const parts: string[] = []
  let depth = 0
  let i = 0
  let current = ''

  while (i < line.length) {
    const ch = line[i]

    if (ch === '(' && depth === 0) {
      // 进入参数列表
      parts.push(current)
      current = ''
      depth++
      i++
      continue
    }

    if (depth > 0) {
      if (ch === '<' || ch === '[' || ch === '{') {
        depth++
      } else if (ch === '>' || ch === ']' || ch === '}') {
        depth--
      } else if (ch === ')' && depth === 1) {
        // 找到参数列表结束，处理类型剥离
        const cleaned = stripParamsInParens(current)
        parts.push(cleaned)
        current = ')'
        depth = 0
        i++
        continue
      }
    }

    current += ch
    i++
  }

  if (current) parts.push(current)
  return parts.join('')
}

/** 处理括号内的参数，剥离类型 */
function stripParamsInParens(params: string): string {
  let depth = 0
  let current = ''

  for (let i = 0; i < params.length; i++) {
    const ch = params[i]

    if (ch === '<' || ch === '[' || ch === '{' || ch === '(') {
      depth++
      current += ch
    } else if (ch === '>' || ch === ']' || ch === '}' || ch === ')') {
      depth--
      current += ch
    } else if (ch === ':' && depth === 0) {
      // 找到类型注解的冒号，清除后续类型直到 , 或行尾
      let j = i + 1
      let typeDepth = 0
      while (j < params.length) {
        const tch = params[j]
        if (tch === '<' || tch === '[' || tch === '{' || tch === '(') {
          typeDepth++
        } else if (tch === '>' || tch === ']' || tch === '}' || tch === ')') {
          typeDepth--
        } else if (tch === ',' && typeDepth === 0) {
          break
        } else if (tch === '=' && typeDepth === 0) {
          // 默认值，保留
          current += ' '
          j++
          while (j < params.length) {
            const eqch = params[j]
            if (eqch === ',' && typeDepth === 0) break
            if (eqch === '<' || eqch === '[' || eqch === '{' || eqch === '(') typeDepth++
            else if (eqch === '>' || eqch === ']' || eqch === '}' || eqch === ')') typeDepth--
            current += eqch
            j++
          }
          i = j - 1
          break
        }
        j++
      }
      i = j
      if (params[i] === ',') {
        current += ','
        i++
      }
      continue
    } else {
      current += ch
    }
  }

  // 最终清理：移除残留的独立类型注解
  const cleaned = current
    .replace(/:\s*[\w<>[\],\s|&'"`]+(?=\s*,|\s*\)|$)/g, '')
    .replace(/:\s*\([^)]*\)(?=\s*,|\s*\)|$)/g, '')

  return cleaned
}

/** 剥离 as 类型断言 */
function stripAsAssertions(code: string): string {
  // 处理 `expr as Type` 模式
  return code.replace(/\s+as\s+[\w<>[\],\s|&'"]+(?=[\s,;)\]}]|$)/g, '')
}