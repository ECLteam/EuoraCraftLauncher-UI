// 轻量校验工具，基于 valibot 封装，接口风格参考 zod

import { type BaseIssue, type GenericSchema, maxLength, minLength, object, pipe, safeParse, string } from 'valibot'

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: ValidationError[]
}

function toValidationError(issue: BaseIssue<unknown>): ValidationError {
  const path = issue.path?.map((p) => String(p.key)).join('.') ?? ''
  return { path, message: issue.message }
}

class StringSchema {
  private minLen = 0
  private maxLen = Infinity
  private minMsg: string | undefined
  private maxMsg: string | undefined
  private hasMin = false
  private hasMax = false

  min(length: number, message?: string): this {
    this.minLen = length
    this.minMsg = message
    this.hasMin = true
    return this
  }

  max(length: number, message?: string): this {
    this.maxLen = length
    this.maxMsg = message
    this.hasMax = true
    return this
  }

  toSchema(): GenericSchema {
    if (this.hasMin && this.hasMax) {
      return pipe(
        string(),
        this.minMsg ? minLength(this.minLen, this.minMsg) : minLength(this.minLen),
        this.maxMsg ? maxLength(this.maxLen, this.maxMsg) : maxLength(this.maxLen),
      )
    }
    if (this.hasMin) {
      return pipe(string(), this.minMsg ? minLength(this.minLen, this.minMsg) : minLength(this.minLen))
    }
    if (this.hasMax) {
      return pipe(string(), this.maxMsg ? maxLength(this.maxLen, this.maxMsg) : maxLength(this.maxLen))
    }
    return string()
  }

  safeParse(value: unknown): ValidationResult<string> {
    const result = safeParse(this.toSchema(), value)
    if (result.success) {
      return { success: true, data: result.output as string, errors: [] }
    }
    return { success: false, errors: result.issues.map(toValidationError) }
  }
}

class ObjectSchema<T extends Record<string, Schema>> {
  private shape: T

  constructor(shape: T) {
    this.shape = shape
  }

  toSchema(): GenericSchema {
    const vShape: Record<string, GenericSchema> = {}
    for (const key of Object.keys(this.shape)) {
      const field = this.shape[key]
      if (field) {
        vShape[key] = field.toSchema()
      }
    }
    return object(vShape)
  }

  safeParse(value: unknown): ValidationResult<{ [K in keyof T]: Infer<T[K]> }> {
    const result = safeParse(this.toSchema(), value)
    if (result.success) {
      return { success: true, data: result.output as { [K in keyof T]: Infer<T[K]> }, errors: [] }
    }
    return { success: false, errors: result.issues.map(toValidationError) }
  }
}

type Schema = StringSchema | ObjectSchema<Record<string, Schema>>

type Infer<S> = S extends StringSchema
  ? string
  : S extends ObjectSchema<infer T>
    ? { [K in keyof T]: Infer<T[K]> }
    : never

export const v = {
  string: () => new StringSchema(),
  object: <T extends Record<string, Schema>>(shape: T) => new ObjectSchema(shape),
}

export function formatErrors(errors: ValidationError[]): string {
  return errors.map((e) => e.message).join('；')
}
