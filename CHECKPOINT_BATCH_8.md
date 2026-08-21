# CHECKPOINT_BATCH_8 — focus ring 豁免 + 搜索框聚焦高亮

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint 全绿；format:check 仅既有 CHECKPOINT_BATCH_7.md 格式告警，与本次无关）
- 提交：5b49d04（fix: Batch 8 — 输入类豁免全局 focus ring + 搜索框聚焦圆角高亮（folia 作用域））
- 源：EuoraCraftLauncher-UI tryfrontend2 分支 `830a699`（refactor: 优化样式）

## 目标

应用 tryfrontend2 830a699 两处样式修复到 main（aff2361）：

1. 输入类元素（input/textarea/select/contenteditable）不应用全局 `:focus-visible` 矩形 focus ring
2. 搜索框聚焦时外圈圆角高亮（border + ring），覆盖视图层"仅变边框"的 focus-within

## 改动

| 文件                 | 变更                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| src/styles/base.css  | `:focus-visible` 组后追加输入类元素豁免规则（与参考提交逐字一致）                                                                                                                                |
| src/styles/folia.css | naive 控件玻璃组后追加 `[data-ui-skin='folia'] .search-box:focus-within`（源在 glass.css 全局，目标皮肤层为 folia.css，加作用域；消费 Batch 1 已建 --control-border-focus/--control-ring token） |
| MAPPING_TABLE.yaml   | view-surfaces 追加 Batch 8 映射记录                                                                                                                                                              |

## 取舍

- 修复 2 源提交在 glass.css（全局规则），目标项目皮肤层是 folia.css → 加 `[data-ui-skin='folia']` 作用域，classic 皮肤零影响（--control-ring classic=none + 作用域隔离双重保证）
- 视图层已有 `.search-box:focus-within { border-color: var(--border-hover) }`（InstancesTab.css/InstanceDetailModal.css）→ 用 !important 覆盖为边框 + 圆角 ring

## 验证

- `pnpm typecheck`：通过（vue-tsc + tsc 无错误）
- `pnpm lint`：通过（eslint 无错误）
- `pnpm format:check`：仅既有 CHECKPOINT_BATCH_7.md 告警，本次三个文件均格式合规
