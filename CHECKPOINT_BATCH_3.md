# CHECKPOINT_BATCH_3 — 卡片透明度 token + themeId 启动恢复 + folia 对齐

- 日期：2026-08-21
- 状态：✅ 通过（pnpm check 全绿：63 文件 251 测试；build 成功）
- 提交：待提交

## 目标
①表面 token 接入 `--card-opacity` ②themeId 启动无闪烁 ③folia 与源仓库对齐。

## 改动
| 文件 | 变更 |
|------|------|
| src/styles/base.css | classic 亮/暗 6 处表面 token alpha → `calc(<原alpha> * var(--card-opacity,1))` |
| src/styles/folia.css | folia 亮/暗 8 处 token 同上；对齐修正：补 `.n-popconfirm` 悬浮层、segment rail/input/selection 饱和度 1.25→1.35 |
| src/composables/useTheme.ts | saveSnapshot 存 `uiSkin: themeId.value` |
| index.html | 内联脚本恢复 `data-ui-skin`（无闪烁） |
| .prettierignore | +`src/auto-imports.d.ts`（生成文件） |

## folia 对齐审计（对照源 glass.css/base.css）
- --glass-blur 18px ✅、悬浮层 saturate(1.35) ✅（补 n-popconfirm）、segment rail 无边框 ✅、control token ✅、aurora 三色（本地设计）✅
- 主玻璃表面 saturate(1.25) 为本地设计保留（源只管悬浮层）

## 验证
- `pnpm check`：全绿（63 文件 251 测试 | 1 todo）
- `pnpm build`：成功
- `--card-opacity` 未设置回退 1 → 各主题默认透明度不变

## 备注
- 卡片透明度经 CSS `calc(alpha * var(--card-opacity,1))`，前端 slider 20~100% 生效。
