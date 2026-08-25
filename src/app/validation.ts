import { type BaseIssue, type GenericSchema, safeParse } from 'valibot'

/**
 * 使用 valibot schema 校验运行时参数，校验失败时抛出带字段路径的错误消息。
 * 成功时返回已剥离多余字段的纯净输出。
 */
export function assertParams(
  schema: GenericSchema,
  input: unknown,
  label: string
): Record<string, unknown> {
  const result = safeParse(schema, input)
  if (!result.success) {
    const details = result.issues
      .map((issue: BaseIssue<unknown>) => {
        const path = issue.path?.map((p) => String(p.key)).join('.') ?? ''
        return path ? `${path}: ${issue.message}` : issue.message
      })
      .join('; ')
    throw new Error(`${label} 参数校验失败: ${details}`)
  }
  return result.output as Record<string, unknown>
}
