import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MarkdownContent from './MarkdownContent.vue'

describe('MarkdownContent', () => {
  it('renders common Markdown syntax', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        content: '# Update\n\n**Important** content with [details](https://example.com).',
      },
    })

    expect(wrapper.get('h1').text()).toBe('Update')
    expect(wrapper.get('strong').text()).toBe('Important')
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com')
  })

  it('removes unsafe HTML and event handlers', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        content: '<script>alert(1)</script><img src="x" onerror="alert(2)">',
      },
    })

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.get('img').attributes('onerror')).toBeUndefined()
  })
})
