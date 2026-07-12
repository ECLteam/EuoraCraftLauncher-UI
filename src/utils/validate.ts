// 轻量校验工具，接口风格参考 zod，后续可无缝替换为 zod
// 当前仅覆盖项目最常用场景：非空字符串、最小/最大长度

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: ValidationError[]
}

class StringSchema {
  private minLen = 0
  private maxLen = Infinity
  private msg = ''

  min(length: number, message?: string): this {
    this.minLen = length
    this.msg = message || this.msg
    return this
  }

  max(length: number, message?: string): this {
    this.maxLen = length
    this.msg = message || this.msg
    return this
  }

  safeParse(value: unknown): ValidationResult<string> {
    if (typeof value !== 'string') {
      return { success: false, errors: [{ path: '', message: '必须是字符串' }] }
    }
    if (value.length < this.minLen) {
      return { success: false, errors: [{ path: '', message: this.msg || `至少 ${this.minLen} 个字符` }] }
    }
    if (value.length > this.maxLen) {
      return { success: false, errors: [{ path: '', message: this.msg || `最多 ${this.maxLen} 个字符` }] }
    }
    return { success: true, data: value, errors: [] }
  }
}

class ObjectSchema<T extends Record<string, Schema<unknown>>> {
  constructor(private shape: T) {}

  safeParse(value: unknown): ValidationResult<{ [K in keyof T]: Infer<T[K]> }> {
    const errors: ValidationError[] = []
    const data = {} as { [K in keyof T]: Infer<T[K]> }

    if (!value || typeof value !== 'object') {
      return { success: false, errors: [{ path: '', message: '必须是对象' }] }
    }

    for (const key of Object.keys(this.shape)) {
      const schema = this.shape[key]
      const fieldValue = (value as Record<string, unknown>)[key]
      const result = schema.safeParse(fieldValue)
      if (!result.success) {
        errors.push(...result.errors.map(e => ({ path: e.path ? `${key}.${e.path}` : key, message: e.message })))
      } else {
        data[key as keyof T] = result.data as Infer<T[keyof T]>
      }
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }
    return { success: true, data, errors: [] }
  }
}

type Schema = StringSchema | ObjectSchema<Record<string, Schema>>

type Infer<S> = S extends StringSchema
  ? string
  : S extends ObjectSchema<infer T>
    ? { [K in keyof T]: Infer<T[K]> }
    : never

/**
 * 验证对象构建器。
 */
export const v = {
  /**
   * 创建字符串字段验证器。
   */
  string: () => new StringSchema(),
  /**
   * 创建对象结构验证器。
   * @param shape - 对象字段的验证规则
   */
  object: <T extends Record<string, Schema>>(shape: T) => new ObjectSchema(shape),
}

/**
 * 将验证错误列表格式化为可读的字符串。
 * @param errors - 验证错误数组
 * @returns 错误信息字符串
 */
export function formatErrors(errors: ValidationError[]): string {
  return errors.map(e => e.message).join('；')
}
