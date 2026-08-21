# CHECKPOINT_BATCH_2 — 前端核心移除自定义主题系统

- 日期：2026-08-21
- 状态：✅ 通过（pnpm check 全绿：63 文件 251 测试；build 成功）
- 提交：7903f46 + 待提交

## 目标
前端核心移除自定义主题：删除 features/themes/、精简主题类型、useTheme 改双内置主题 + 独立外观。

## 改动
| 文件 | 变更 |
|------|------|
| src/types/api.ts | ThemeAppearanceConfig 精简（+card_opacity），ThemeConfig +theme_id 去 scheme，删除 11 个设计器类型，删 theme_* 命令/事件/theme-studio，删插件 theme 贡献 |
| src/config/theme.ts | 新增 BUILTIN_THEMES + CARD_OPACITY_* |
| src/composables/useUiSkin.ts | UiSkin 类型本地化 |
| src/composables/useTheme.ts | +themeId/setThemeId（写 data-ui-skin），删 scheme/custom/appearance 多余字段，card_opacity 写 --card-opacity |
| src/features/themes/ | 整个目录删除（api/runtime/components/stores/测试） |
| src/App.vue | 移除 ThemeDesignerCanvas + initialize |
| src/views/settings/AppearanceTab.vue/.css | 重写：+主题选择器(classic/folia)+卡片透明度滑块，移除 designer/library/scheme/semantic/custom css/density |
| src/api/transport/showcase | 移除 theme_* 模拟 |
| src/app/AppProviders.vue | 移除 ThemeStudioWindow |
| src/components/instances/InstalledInstanceList.vue | 移除 themeInstanceKey/data-theme-instance |
| i18n | +themeClassic/themeFolia/cardOpacity/cardOpacityDesc |
| .prettierignore | +MAPPING_TABLE.yaml/CHECKPOINT_BATCH_*（追踪文档不参与 prettier） |

## 验证
- `pnpm check`：全绿（63 文件 251 测试 | 1 todo）
- `pnpm build`：成功

## 备注
- 卡片透明度经 `--card-opacity`（0~1）写 documentElement，表面 token 的接入在 Batch 4（folia 完整迁移）一并处理。
- 语义色/密度/减少动效已移除，naive 语义色回退主题默认色。
