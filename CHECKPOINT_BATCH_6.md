# CHECKPOINT_BATCH_6 — folia 视图表面补齐

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint + 66 文件 262 测试全绿；classic 零视觉变化）
- 提交：feat: folia 皮肤迁移 Batch 6 — 视图表面补齐（--card-bg/--bg-surface + 玻璃表面组）

## 目标
补齐全主要视图/组件的 folia 玻璃表面。

## 改动（src/styles/folia.css）
| 变更 | 内容 |
|------|------|
| token 覆盖 | 亮/暗块追加 `--bg-surface`（0.62）与 `--card-bg`（0.6），所有基于 token 的表面自动玻璃化 |
| 玻璃表面组 | 追加 21 个选择器（Connect/OnlineMods/panels/ErrorModal/install/manage/path/about/dev）共用 --folia-glass 玻璃样式 |
| hover 辉光 | connect-room-card/connect-main-card/mod-list-row hover 主色辉光 |
| 边框组 | mods-panel-header/task-queue-body/piv-footer 追加玻璃边框 |

## 验证
- `pnpm typecheck`：通过
- `pnpm lint`：通过
- `pnpm test`：Test Files 66 passed / Tests 262 passed | 1 todo
- classic 零变化：全部改动在 `[data-ui-skin='folia']` 作用域

## 备注
- hover 辉光保守处理（无 translateY 位移），避免破坏布局。
- 视觉最终校验需人工运行展示模式确认（[MANUAL_REQUIRED]）。
