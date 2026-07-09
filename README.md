# EuoraCraft-UI

EuoraCraft Launcher 的前端界面，基于 Vue 3 + TypeScript + Vite 构建，通过 PyWebview 与 Python 后端通信。

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | 前端框架，Composition API |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Naive UI | UI 组件库 |
| Tailwind CSS | 原子化 CSS |
| vue-i18n | 国际化（zh-CN / en-US）|
| GSAP | 动画效果 |
| vue-router | 路由管理 |

## 目录结构

```
src/
├── components/       # 组件
│   ├── layout/       # 布局（TitleBar, SideBar）
│   ├── ui/           # 基础组件（Button, Card, Input 等）
│   ├── modals/       # 弹窗
│   └── bits/         # 文本动画
├── composables/      # 组合式函数（useTheme, useAnimation 等）
├── views/            # 页面
│   ├── Game.vue      # 主页（账户、版本选择、启动）
│   ├── Versions.vue  # 版本管理
│   ├── Instances.vue # 运行中的进程管理
│   ├── Settings.vue  # 设置
│   └── DevTools.vue  # 开发调试
├── utils/api.ts      # 后端 API 客户端
├── i18n/             # 多语言
├── router/           # 路由
└── styles/           # 样式
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（http://localhost:5173）
pnpm dev

# 构建生产版本
pnpm build
```

## 前后端通信

前端通过 `window.pywebview.api` 调用后端 API，封装在 `src/utils/api.ts` 中。

开发模式下，PyWebview 会加载 `http://localhost:5173`；生产模式下加载打包后的 `dist/` 目录。

```typescript
// 示例：调用后端
const result = await api.launchInstance({ version: '1.20.1' })
if (result.success) {
  // 处理成功
}
```

## 问题反馈

如果你遇到任何问题，欢迎通过以下方式反馈：

- 提交 [Issue](../../issues)
- 描述问题时请包含：操作系统、复现步骤、错误截图或日志

## 贡献

欢迎提交 Pull Request！

## 开源协议

本项目采用 [GPL-3.0](../LICENSE) 协议开源。

## 联系

- 项目主页：[EuoraCraft-Launcher](../../)
- 如有问题或建议，欢迎提交 Issue 或 Pull Request
