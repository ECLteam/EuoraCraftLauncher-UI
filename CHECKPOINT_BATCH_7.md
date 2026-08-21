# CHECKPOINT_BATCH_7 — classic 严格回退

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint + 66 文件 262 测试全绿）
- 提交：fix: classic 严格回退 — 玻璃效果限定 folia 作用域

## 目标

QA 快照比对发现 classic 皮肤被迁移顺带改变（B1-B17 共 17 项）。用户决策「严格回退」：classic 像素级不变，玻璃效果只作用于 folia。

## 改动

| 文件                      | 恢复项                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| base.css                  | `--control-ring`/`--control-glow` classic 值 → none；`--slider-track` light → #e0e0e0（原硬编码值） |
| Tag.css                   | .ui-tag--default 恢复 ecl-hover/ecl-text-secondary                                                  |
| Progress.css              | track 恢复 ecl-hover-strong                                                                         |
| Modal.css                 | 删除 ecl-shadow-pop 投影（保留 backdrop-filter 零影响）                                             |
| Button.css                | 删除 btn-danger 红投影                                                                              |
| Slider.css                | 删除 thumb 光晕                                                                                     |
| Select.css                | trigger hover→shadow-hover、open→glow-focus、dropdown bg→bg-elevated + shadow→shadow-md             |
| Game.css                  | running-instances-trigger.inactive border→border-strong                                             |
| InstalledInstanceList.css | hover/active 组与 btn-install-version:hover 恢复 primary/primary-alpha                              |
| InstancePathSidebar.css   | btn-add:hover 恢复 primary/primary-alpha                                                            |
| InstancesTab.css          | btn-refresh:hover 恢复 primary（无 bg）；btn-install:hover 恢复 primary/primary-alpha               |
| TitleBarTray.vue          | tray-menu bg→bg-elevated、shadow→shadow-lg                                                          |
| folia.css                 | 新增 14 条 `[data-ui-skin='folia']` 作用域覆盖承接上述玻璃效果                                      |

## 验证

- `pnpm check`：全绿（format + lint + typecheck + 66 文件 262 测试）

## 备注

- 零影响项保留：backdrop-filter: var(--glass-backdrop)（classic=none）、inset var(--glass-highlight)（classic=透明）。
