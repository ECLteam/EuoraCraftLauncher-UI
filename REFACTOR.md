# 前端重构说明

## 当前阶段

第一阶段先固定运行边界，不改变后端命令协议：

- `src/api/transport` 负责选择桌面、展示或不可用 Transport；
- `src/api/client.ts` 是业务代码唯一允许使用的后端入口；
- `src/app/runtime` 负责应用启动、全局事件、窗口操作和桌面交互策略；
- Showcase Transport 使用内存数据，不访问 Python、IPC 或真实文件系统。

## 运行模式

| 模式       | 触发方式                                | 数据来源       |
| ---------- | --------------------------------------- | -------------- |
| `desktop`  | 检测到 PyTauri                          | Python 后端    |
| `showcase` | `vite --mode showcase` 或 `?showcase=1` | 浏览器内存     |
| `browser`  | 普通浏览器开发模式                      | 不提供后端能力 |

业务组件不得自行读取 `window.__TAURI__`。需要判断运行环境时使用
`backend.runtime`；需要执行桌面窗口操作时使用 `src/app/runtime/desktopWindow.ts`。

## 后续迁移方向

1. 按账户、版本安装、游戏启动、插件和设置拆分领域 API；
2. 将页面中的业务流程移动到对应 `features`；
3. 建立统一的应用状态层和异步状态模型；
4. 将大体积页面和 CSS 拆为可独立测试的界面组件；
5. 为 Transport 契约、任务状态和关键页面补充自动化测试。
