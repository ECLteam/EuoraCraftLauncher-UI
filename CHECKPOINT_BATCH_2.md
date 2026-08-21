# CHECKPOINT_BATCH_2 — ui 组件 token 化

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint 全绿；classic 皮肤解析为原值，视觉不变）
- 提交：feat: folia 皮肤迁移 Batch 2 — ui 组件 token 化

## 目标
7 个 ui 组件 CSS 从硬编码旧变量改为引用 `--control-*` 令牌，folia 皮肤自动玻璃化。

## 改动
| 文件 | 变更 |
|------|------|
| Button.css | btn-secondary/text/ghost/outline/danger 迁移至 --control-*，hover 追加 --control-glow |
| Card.css | .ui-card.hoverable:hover 用 --control-border-hover/--control-glow；.card-footer 用 --control-bg-hover |
| Input.css | 边框/背景用 --control-*，focus 加 --control-ring |
| Select.css | 触发器用 --control-*，dropdown 玻璃化（card-bg + glass-highlight + backdrop blur） |
| Slider.css | 轨道用 --slider-track，thumb 加主色光环，删除 dark 硬编码块 |
| Tag.css | .ui-tag--default 用 text-secondary 混合色 |
| Progress.css | 轨道用 primary-tinted |

## 验证
- `pnpm typecheck`：通过
- `pnpm lint`：通过
- classic 视觉不变（--control-* classic 值 = 原变量别名）

## 映射确认
与 MAPPING_TABLE.yaml `components:` 节一致。
