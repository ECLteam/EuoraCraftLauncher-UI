# CHECKPOINT_BATCH_1 — 令牌地基

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint 全绿，classic 皮肤渲染不变）
- 提交：chore: 主题系统与 folia 皮肤迁移基线（Batch 1 令牌地基）

## 目标
把 tryfrontend2 的玻璃化 token 设计迁入 folia 皮肤，保持 classic 视觉不变。

## 改动
| 文件 | 变更 |
|------|------|
| src/styles/base.css | :root 与 dark 块各新增 8 个 `--control-*` 令牌（classic 默认 = 原变量引用）+ `--glass-blur:0px`/`--glass-highlight`/`--aurora-opacity` |
| src/styles/folia.css | 亮/暗块新增 `--control-*` 玻璃值、`--slider-track`、`--glass-blur:18px`、`--aurora-*` 三色；删除旧 `--folia-control-*` 并迁移引用 |

## 验证
- `pnpm typecheck`：通过（无错误）
- `pnpm lint`：通过（无错误）
- classic 皮肤零影响：`--control-*` 值仅别名已有变量，folia 值全在 `[data-ui-skin='folia']` 作用域

## 映射确认
与 MAPPING_TABLE.yaml `tokens:` 节完全一致，无新增条目。
