# CHECKPOINT_BATCH_3 — 基础层/外壳玻璃化

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint 全绿；classic 零视觉变化）
- 提交：feat: folia 皮肤迁移 Batch 3 — 基础层/外壳玻璃化

## 目标

弹窗与工具条落地玻璃效果（模糊 + 顶部高光），classic 下经透明令牌零影响。

## 改动

| 文件                | 变更                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| base.css            | 修正 classic `--glass-highlight` 为透明；亮/暗块新增 `--glass-backdrop: none`                                |
| folia.css           | 亮/暗块新增 `--glass-backdrop: blur(var(--glass-blur,18px)) saturate(1.35)`                                  |
| common.css          | .toolbar 与 .panel 追加 inset 顶部高光                                                                       |
| design-system.css   | .ecl-page-header__icon / .ecl-surface / .ecl-toolbar 追加 inset 高光（`.ecl-card` 不存在，适配为实际选择器） |
| Modal.css           | .modal-container 追加 shadow-pop+高光 与 --glass-backdrop 模糊                                               |
| FullscreenModal.css | .fullscreen-modal-wrapper 追加 --glass-backdrop 模糊                                                         |
| Select.css          | 一致性：dropdown 模糊改用 --glass-backdrop                                                                   |

## 验证

- `pnpm typecheck`：通过
- `pnpm lint`：通过
- classic 零变化：--glass-backdrop=none + --glass-highlight=透明

## 备注

- 设计系统参考 `.ecl-card` 在目标项目不存在，映射为 `.ecl-surface`/`.ecl-toolbar`/`.ecl-page-header__icon`（已记入 MAPPING_TABLE）。
