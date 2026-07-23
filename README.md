# EuoraCraftLauncher-UI

EuoraCraft Launcher 的 Vue 3 + TypeScript 前端，通过 PyTauri 与 Python 后端通信。

## 开发

```bash
pnpm install
pnpm dev
```

提交代码前运行统一质量检查：

```bash
pnpm check
```

常用命令：

- `pnpm format`：自动格式化代码和文档。
- `pnpm format:check`：检查格式，不修改文件。
- `pnpm lint`：检查 Vue、TypeScript 和导入顺序。
- `pnpm lint:fix`：自动修复可安全修复的 Lint 问题。
- `pnpm typecheck`：执行严格 TypeScript 类型检查。
- `pnpm build`：类型检查并构建生产版本。

目录、命名、Vue、TypeScript、样式和 Git 约定见 [CONTRIBUTING.md](./CONTRIBUTING.md)。后端接口见 [BACKEND_API.md](./BACKEND_API.md)。
