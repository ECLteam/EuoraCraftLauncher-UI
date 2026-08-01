import DOMPurify from 'dompurify'
import { marked } from 'marked'

const MARKDOWN_OPTIONS = {
  async: false,
  breaks: true,
  gfm: true,
} as const

export function renderMarkdown(content: string): string {
  const html = marked.parse(content || '', MARKDOWN_OPTIONS)
  return DOMPurify.sanitize(html, {
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['style'],
  })
}

export function createMarkdownExcerpt(content: string, maxLength = 110, truncatedSuffix = '…'): string {
  const container = document.createElement('div')
  container.innerHTML = renderMarkdown(content)
  const text = (container.textContent || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}${truncatedSuffix}`
}
