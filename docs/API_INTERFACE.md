# 前端 API 接口文档（供后端对接）

> 本文档列出前端 `EuoraCraft-UI` 期望后端提供的所有 API 接口。  
> 通信方式：`window.pywebview.api`（PyWebview js_api）。  
> 统一返回格式：`{ success: boolean, data?: any, message?: string }`

---

## 一、已对接 API（无需改动）

以下接口当前已正常工作，不需要重新对接：

| 接口 | 说明 |
|------|------|
| `ping()` | 心跳检测 |
| `minimize_window()` / `close_window()` | 窗口控制 |
| `get_window_position()` / `set_window_position(x, y)` | 窗口位置 |
| `get_launcher_config()` | 启动器配置 |
| `get_game_config()` / `update_game_config(config)` | 游戏配置（路径、Java、内存） |
| `get_theme_config()` / `update_theme_config(config)` | 主题配置 |
| `get_background_config()` / `update_background_config(config)` / `get_background_image()` / `update_background_image(type, path)` | 背景配置 |
| `get_download_config()` / `update_download_config(config)` | 下载配置 |
| `get_locale_config()` / `update_locale_config(locale)` | 语言配置 |
| `get_mouse_effect_config()` / `update_mouse_effect_config(config)` | 鼠标特效配置 |
| `get_java_list()` | 扫描本机 Java |
| `select_directory()` / `select_file(filters)` / `select_local_image()` / `select_java_executable()` | 文件选择对话框 |
| `load_image_from_url(url)` / `fetch_image_data_url(url)` | 图片加载 |
| `get_accounts()` / `get_current_account()` / `add_offline_account(username)` / `start_microsoft_login()` / `poll_microsoft_login()` / `complete_microsoft_login()` / `switch_account(accountId)` / `remove_account(accountId)` / `refresh_account_profile(accountId)` | 账户管理 |
| `get_avatar_data_url(uuid, typeName, customServer, size, useDefaultSkin)` | 皮肤/头像获取 |
| `get_user_agreement_status()` / `save_user_agreement()` / `clear_user_agreement()` | 用户协议 |
| `diagnose_api()` | API 诊断 |

---

## 二、待对接 API（需要重新实现）

### 2.1 启动游戏

#### `launch_instance(params: object)` → `{ success, data: { instanceId, version } }`

**前端调用场景：** Game.vue / ManageTab.vue 的"启动"按钮

**参数：**
```typescript
{
  version: string;        // 必填，游戏版本ID，如 "1.20.1"
  gamePath?: string;      // 可选，游戏目录路径，默认使用配置中的第一个路径
  javaPath?: string;      // 可选，Java 可执行文件路径，为空时自动检测
  memory?: { min: number; max: number }; // 可选，内存分配，默认 {min:512, max:4096}
  javaArgs?: string;      // 可选，额外 JVM 参数
}
```

**返回值：**
```typescript
{
  success: boolean;
  data?: {
    instanceId: string;   // 进程实例ID，后续用于查询进度和终止
    version: string;      // 启动的版本
  };
  message?: string;       // 错误信息（当 success=false 时）
}
```

**期望行为：**
- 异步启动游戏进程
- 返回进程 `instanceId`
- 前端通过 `get_launch_status(instanceId)` 轮询进度

---

#### `get_launch_status(instanceId: string)` → `{ success, data: { stage, percent, message, completed, error? } }`

**前端调用场景：** Game.vue 启动后每 500ms 轮询一次

**参数：** `instanceId: string`

**返回值：**
```typescript
{
  success: boolean;
  data?: {
    stage: string;        // 当前阶段描述，如 "checking_files" / "downloading_assets" / "launching"
    percent: number;      // 0-100 的整数
    message: string;      // 附加信息，如当前下载的文件名
    completed: boolean;   // 是否已完成（成功或失败）
    error?: string;       // 如果有错误，返回错误描述
  };
}
```

**阶段建议（stage 字段）：**
| stage 值 | 前端显示文本 |
|----------|-------------|
| `prepare` | 准备启动... |
| `checking_files` | 检查游戏文件完整性... |
| `completing_files` | 补全缺失文件... |
| `downloading_assets` | 下载游戏资源... |
| `building_params` | 构建启动参数... |
| `launching` | 启动游戏进程... |
| `completed` | 启动成功！ |
| `error` | 启动失败 |

---

#### `stop_instance(instanceId: string)` → `{ success, message }`

**前端调用场景：** Instances.vue 的"停止"按钮

**参数：** `instanceId: string`

**返回值：** 标准响应 `{ success: boolean, message?: string }`

**期望行为：** 强制终止对应进程

---

### 2.2 安装版本

#### `install_version(versionId: string, options?: object)` → `{ success, data: { version, loader, gamePath } }`

**前端调用场景：** VersionsTab.vue 的"安装"/"高级安装"按钮

**参数：**
```typescript
versionId: string;       // 必填，要安装的版本，如 "1.20.1"
options?: {
  gamePath?: string;     // 可选，安装路径
  loader?: string;       // 可选，加载器类型：vanilla / fabric / forge / neoforge / quilt
  loaderVersion?: string;// 可选，加载器版本号
}
```

**返回值：**
```typescript
{
  success: boolean;
  data?: {
    version: string;
    loader: string;
    gamePath: string;
  };
  message?: string;
}
```

**期望行为：** 异步安装，返回任务ID；前端通过 `get_install_status(taskId)` 轮询进度

---

#### `get_install_status(taskId: string)` → `{ success, data: { stage, percent, message, completed, error? } }`

**前端调用场景：** VersionsTab.vue 安装过程中轮询

**参数：** `taskId: string`

**返回值：** 结构同 `get_launch_status`

---

#### `uninstall_version(versionId: string, game_path?: string)` → `{ success, message }`

**前端调用场景：** ManageTab.vue 的"删除"按钮

**参数：**
```typescript
versionId: string;       // 必填，要删除的版本
// 可选 game_path 参数（当前前端未传递）
```

**返回值：** 标准响应

**期望行为：** 删除对应版本文件夹

---

### 2.3 版本列表

#### `get_minecraft_versions(filter?: object)` → `{ success, data: MinecraftVersion[] }`

**前端调用场景：** VersionsTab.vue 页面加载时

**返回值：**
```typescript
{
  success: boolean;
  data: Array<{
    id: string;           // 版本ID，如 "1.20.1"
    type: string;         // 类型：release / snapshot / old_beta / old_alpha
    releaseTime: string;  // ISO 时间字符串
    url: string;          // 版本 JSON 地址
  }>;
}
```

**期望行为：** 返回官方 Minecraft 版本列表（可缓存）

---

#### `get_fabric_versions()` → `{ success, data: string[] }`

**前端调用场景：** VersionsTab.vue 选择 Fabric 加载器时

**返回值：**
```typescript
{
  success: boolean;
  data: string[];         // Fabric Loader 版本号列表
}
```

---

#### `scan_versions_in_path(paths: string[] | Array<{path: string}>)` → `{ success, data: ScannedVersion[] }`

**前端调用场景：** Game.vue / ManageTab.vue 页面加载时

**参数：** 路径数组或对象数组，如 `["./.minecraft"]` 或 `[{path: "./.minecraft"}]`

**返回值：**
```typescript
{
  success: boolean;
  data: Array<{
    folder: string;       // 版本文件夹名
    version: string;      // 版本ID
    loader_type: string;  // 加载器类型，如 "release" / "fabric" / "forge"
    status: "success" | "failure";
    error?: string;       // status=failure 时的错误信息
  }>;
}
```

**期望行为：** 扫描本地 `versions/` 目录，读取每个版本的 JSON 文件，返回已安装版本列表

---

### 2.4 实例/进程管理

#### `get_game_instances()` → `{ success, data: GameInstance[] }`

**前端调用场景：** Instances.vue 每 2s 轮询

**返回值：**
```typescript
{
  success: boolean;
  data: Array<{
    id: string;           // 进程实例ID
    name: string;         // 实例/版本名称
    version: string;      // 版本号
    isRunning: boolean;   // 是否运行中
    type?: string;        // 实例类型，如 "MinecraftClient"
  }>;
}
```

**期望行为：** 返回当前运行中的游戏进程列表

---

## 三、前端组件说明

### LaunchProgressModal（启动进度弹窗）

前端已内置启动进度弹窗组件，启动游戏时自动显示：
- 显示当前阶段文本和百分比
- 带进度条动画
- 支持取消按钮

**触发方式：** 点击"启动"按钮后自动弹出，无需后端干预。

**前端轮询逻辑示例（伪代码）：**
```typescript
const result = await api.launch_instance({ version: "1.20.1" })
if (result.success) {
  const instanceId = result.data.instanceId
  const interval = setInterval(async () => {
    const status = await api.get_launch_status(instanceId)
    if (status.success) {
      updateProgress(status.data.percent, status.data.stage, status.data.message)
      if (status.data.completed || status.data.error) {
        clearInterval(interval)
        hideProgress()
      }
    }
  }, 500)
}
```

---

## 四、注意事项

1. **异步处理：** 启动和安装都是耗时操作，后端应异步执行并立即返回 `instanceId` / `taskId`
2. **错误处理：** 所有接口都应返回 `success: false` 和 `message` 字段，前端会显示错误提示
3. **进度精度：** `percent` 为 0-100 整数即可，不需要非常精确
4. **进程状态：** `get_game_instances` 应实时反映当前运行中的进程，进程退出后自动从列表移除
5. **兼容性：** 前端仍保留所有旧接口的方法签名，后端只需按本文档实现即可
