import { describe, expect, it } from 'vitest'
import { createMarkdownExcerpt, renderMarkdown } from './markdown'

describe('markdown utilities', () => {
  it('creates plain text excerpts from Markdown', () => {
    expect(createMarkdownExcerpt('**Short** content', 20, '... more')).toBe('Short content')
    expect(createMarkdownExcerpt('**Long** announcement content', 10, '... more')).toBe('Long annou... more')
  })

  it('sanitizes unsafe Markdown HTML', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src="x" onerror="alert(2)">')

    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })
})
