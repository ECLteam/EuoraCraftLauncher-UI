import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { MAX_PINNED_ITEMS, type RecentInstance } from '@/composables/useRecentInstances'
import { i18n } from '@/i18n'
import GameLaunchBar from './GameLaunchBar.vue'

function mountLaunchBar(overrides: Partial<InstanceType<typeof GameLaunchBar>['$props']> = {}) {
  return mount(GameLaunchBar, {
    global: {
      plugins: [i18n, createPinia()],
    },
    props: {
      versionsCount: 1,
      launching: false,
      selectedVersion: '1.21.1',
      currentGamePath: '',
      hasAccount: true,
      recentInstances: [],
      ...overrides,
    },
  })
}

function makeRecent(count: number, pinnedCount = 0): RecentInstance[] {
  return Array.from({ length: count }, (_, index) => ({
    versionId: `v${index}`,
    versionName: `版本${index}`,
    gamePath: `C:/games/path${index}`,
    timestamp: index,
    pinned: index < pinnedCount,
  }))
}

async function openRecentPopover(wrapper: ReturnType<typeof mountLaunchBar>) {
  await wrapper.get('.split-arrow').trigger('click')
  await nextTick()
  await nextTick()
}

describe('GameLaunchBar', () => {
  it('渲染真实插件插槽宿主而不是未解析组件标签', () => {
    const wrapper = mountLaunchBar()

    expect(wrapper.find('[data-plugin-slot="plugin-slot-game-launch-before"]').exists()).toBe(true)
    expect(wrapper.find('.plugin-slot-host').exists()).toBe(true)
  })

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
    const launchButton = wrapper.get<HTMLButtonElement>('.split-main')

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

    expect(wrapper.get<HTMLButtonElement>('.split-main').element.disabled).toBe(true)
  })

  it('最近实例不超过 5 个时单列展示', async () => {
    const wrapper = mountLaunchBar({ recentInstances: makeRecent(3) })
    await openRecentPopover(wrapper)

    const list = document.body.querySelector('.recent-instances-list')
    expect(list).not.toBeNull()
    expect(list?.classList.contains('two-columns')).toBe(false)
    expect(document.body.querySelectorAll('.recent-instance-item')).toHaveLength(3)
  })

  it('最近实例超过 5 个时以两列展示', async () => {
    const wrapper = mountLaunchBar({ recentInstances: makeRecent(6) })
    await openRecentPopover(wrapper)

    const list = document.body.querySelector('.recent-instances-list')
    expect(list?.classList.contains('two-columns')).toBe(true)
    expect(document.body.querySelectorAll('.recent-instance-item')).toHaveLength(6)
  })

  it('固定与删除操作发出对应事件且不影响选中', async () => {
    const wrapper = mountLaunchBar({ recentInstances: makeRecent(2) })
    await openRecentPopover(wrapper)

    const items = document.body.querySelectorAll('.recent-instance-item')
    // 第一项：固定（pin）+ 第二项：删除（delete）
    const firstPin = items[0]?.querySelectorAll('.recent-action-btn')[0] as HTMLElement | undefined
    const secondDelete = items[1]?.querySelectorAll('.recent-action-btn')[1] as HTMLElement | undefined
    expect(firstPin).toBeDefined()
    expect(secondDelete).toBeDefined()
    firstPin?.click()
    secondDelete?.click()
    await nextTick()

    expect(wrapper.emitted('togglePin')).toHaveLength(1)
    expect(wrapper.emitted('togglePin')?.[0]).toEqual([makeRecent(2)[0]])
    expect(wrapper.emitted('removeRecent')).toHaveLength(1)
    expect(wrapper.emitted('removeRecent')?.[0]).toEqual([makeRecent(2)[1]])
    expect(wrapper.emitted('selectVersion')).toBeUndefined()
  })

  it('已固定条目展示固定标记，达到上限后未固定条目的固定按钮被禁用', async () => {
    const wrapper = mountLaunchBar({ recentInstances: makeRecent(MAX_PINNED_ITEMS + 1, MAX_PINNED_ITEMS) })
    await openRecentPopover(wrapper)

    const items = document.body.querySelectorAll('.recent-instance-item')
    expect(items[0]?.classList.contains('pinned')).toBe(true)
    expect(items[0]?.querySelector('.recent-pin-flag')).not.toBeNull()

    const unpinnedItem = items[MAX_PINNED_ITEMS]
    expect(unpinnedItem).toBeDefined()
    const unpinnedPinButton = unpinnedItem?.querySelectorAll('.recent-action-btn')[0] as HTMLElement
    expect(unpinnedPinButton.classList.contains('disabled')).toBe(true)
    unpinnedPinButton.click()
    await nextTick()
    expect(wrapper.emitted('togglePin')).toBeUndefined()
  })
})
