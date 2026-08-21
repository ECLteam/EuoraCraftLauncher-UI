# CHECKPOINT_BATCH_5 — 视图控件 NTabs 分段标签化 + tray 菜单玻璃化

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint 全绿；classic 回退保留原控件，零视觉变化）
- 提交：feat: folia 皮肤迁移 Batch 5 — 视图控件 NTabs 化 + tray 玻璃化

## 目标
4 处视图/组件在 folia 下改用 NTabs 分段标签（classic 回退保持原控件），TitleBarTray 弹层迁移玻璃化令牌。

## 改动
| 文件 | 变更 |
|------|------|
| src/views/Plugins.vue | 筛选器 NRadioGroup/NRadioButton → NTabs type=segment（isFolia 条件，classic 回退保留） |
| src/views/settings/AppearanceTab.vue | 主题模式切换 NRadioGroup → NTabs type=segment（isFolia 条件，classic 回退保留） |
| src/features/accounts/components/WardrobeModal.vue | 皮肤/披风/官方 分类 NButtonGroup → NTabs type=segment（isFolia 条件）+ handleTabChange + 分段均分样式 |
| src/components/layout/TitleBarTray.vue | .titlebar-tray-menu 迁移 --card-bg/--control-border/--glass-highlight/--glass-backdrop；菜单项 hover/active → --control-bg-hover/--control-bg-active |

## 验证
- `pnpm typecheck`：通过（vue-tsc + tsc 无错误）
- `pnpm lint`：通过（eslint 无告警）

## 备注
- 与 TitleBar.vue（导航）、Game.vue（账号类型切换）既有 NTabs isFolia 模式保持一致。
- WardrobeModal 分段标签固定 280px 宽度并均分（对齐 tryfrontend2 参考）。
- MAPPING_TABLE.yaml 已含本批 markup/components 映射条目（glass 令牌条目随本批提交补齐）。
