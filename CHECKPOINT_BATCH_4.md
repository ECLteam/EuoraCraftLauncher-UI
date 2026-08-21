# CHECKPOINT_BATCH_4 — 实例/视图 CSS token 化

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint 全绿；classic 零视觉变化）
- 提交：feat: folia 皮肤迁移 Batch 4 — 实例/视图 CSS token 化

## 目标
实例列表/路径侧栏/实例页/游戏页/联机页/插件页/分区布局迁移到 --control-* 令牌 + 滚动容器 contain。

## 改动
| 文件 | 变更 |
|------|------|
| InstalledInstanceList.css | 工具按钮/view-switch/toolbar-select/search-box 迁移 --control-*；滚动容器 contain |
| InstancePathSidebar.css | .btn-add 迁移 --control-*；.path-list contain |
| InstancesTab.css | .btn-refresh/.search-box/.btn-install 迁移；.version-list-scroll contain |
| SectionLayout.css | .section-layout__viewport contain |
| Game.css | .running-instances-trigger.inactive 迁移 + --glass-backdrop |
| Connect.css | .connect-scroll-area contain |
| Plugins.css | .plugins-page/.plugins-list-body contain |

## 验证
- `pnpm typecheck`：通过
- `pnpm lint`：通过

## 备注
- InstancesTab `.version-count-badge` 仅文本样式无背景/边框，无需迁移。
- Plugins 滚动容器实际选择器为 `.plugins-list-body`（非 .plugins-list）。
