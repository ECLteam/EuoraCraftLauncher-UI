import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import GameLaunchBar from './GameLaunchBar.vue'

function mountLaunchBar(overrides: Partial<InstanceType<typeof GameLaunchBar>['$props']> = {}) {
  return mount(GameLaunchBar, {
    global: {
      plugins: [i18n],
    },
    props: {
      versionsCount: 1,
      launching: false,
      selectedVersion: '1.21.1',
      hasAccount: true,
      ...overrides,
    },
  })
}

describe('GameLaunchBar', () => {
  it('没有已安装版本时引导进入版本管理', async () => {
    const wrapper = mountLaunchBar({
      versionsCount: 0,
      selectedVersion: '',
      hasAccount: false,
    })

    await wrapper.get('.fab-launch-btn.no-version').trigger('click')

    expect(wrapper.emitted('manageVersions')).toHaveLength(1)
  })

  it('账户和版本就绪后发出启动事件', async () => {
    const wrapper = mountLaunchBar()
    const launchButton = wrapper.get<HTMLButtonElement>('.fab-launch-btn')

    expect(launchButton.element.disabled).toBe(false)
    await launchButton.trigger('click')

    expect(wrapper.emitted('launch')).toHaveLength(1)
  })

  it('版本管理按钮与启动按钮使用独立布局并保持可操作', async () => {
    const wrapper = mountLaunchBar()

    expect(wrapper.find('.launch-action-row').exists()).toBe(true)
    expect(wrapper.get('.launch-version').text()).toBe('1.21.1')
    expect(wrapper.find('.launch-manage-button .icon-list').exists()).toBe(true)
    await wrapper.get('.launch-manage-button').trigger('click')

    expect(wrapper.emitted('manageVersions')).toHaveLength(1)
  })

  it('未选择版本时禁用版本设置按钮', () => {
    const wrapper = mountLaunchBar({ selectedVersion: '' })

    expect(wrapper.get<HTMLButtonElement>('.launch-settings-button').element.disabled).toBe(true)
  })

  it('选择版本后可以打开版本设置', async () => {
    const wrapper = mountLaunchBar()

    await wrapper.get('.launch-settings-button').trigger('click')

    expect(wrapper.emitted('versionSettings')).toHaveLength(1)
  })

  it('缺少账户时禁用启动按钮', () => {
    const wrapper = mountLaunchBar({ hasAccount: false })

    expect(wrapper.get<HTMLButtonElement>('.fab-launch-btn').element.disabled).toBe(true)
  })
})
