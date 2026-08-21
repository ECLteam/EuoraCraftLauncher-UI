# CHECKPOINT_BATCH_9 — 侧边栏 active 状态修复（tryfrontend2 57b2529/c46f33c）

- 日期：2026-08-21
- 状态：✅ 通过（typecheck + lint + 66 文件 262 测试全绿）
- 提交：fix: 侧边栏 active 状态修复（子菜单定位父级 + 胶囊隐藏无滑动 + footer 高亮）

## 目标
补上 tryfrontend2 侧边栏 active 状态修复（此前迁移遗漏）：
- 子菜单路由激活胶囊定位到父级（getActivePath 返回 parentPath）
- 胶囊隐藏→显示先无过渡定位避免滑动（updateActivePosition）
- footer 项（胶囊覆盖不到）激活时自身高亮

## 改动
| 文件 | 变更 |
|------|------|
| SideBar.vue | getActivePath 子菜单命中返回 parentPath；updateActivePosition 对 activeBg 加隐藏无滑动逻辑（indicator 保持原偏移） |
| SideBar.css | 新增 .sidebar-footer .sidebar-item.active 高亮规则（!important） |
| folia.css | 从透明规则移除 .sidebar-footer .sidebar-item.active，避免压制新 footer 高亮 |

## 验证
- `pnpm check`：全绿（66 文件 262 测试）

## 备注
- launcher 特有：保留 indicator（classic ::before 细线），与 tryfrontend2 移除 indicator 的做法不同，故无滑动逻辑只作用于 activeBg 胶囊。
