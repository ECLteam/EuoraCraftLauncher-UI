# ECL Frontend Design System

ECL uses Naive UI as the primary component library. Product pages should compose existing Naive UI components before introducing custom controls.

## Visual Principles

- Quiet surfaces: use a light canvas with white cards, or a dark canvas with graphite cards.
- Compact controls: standard controls are 36 px high with 6 px corner radii.
- Clear hierarchy: each page has one header, optional toolbar, and grouped content surfaces.
- Limited emphasis: reserve the primary color for selection, progress, and primary actions.
- Consistent spacing: prefer 4, 8, 12, 16, 24, and 32 px increments.

## Core Tokens

- Primary: `#5B6FF5`
- Light canvas: `#F4F6FA`
- Light surface: `#FFFFFF`
- Dark canvas: `#171A21`
- Dark surface: `#222630`
- Control radius: `6px`
- Card radius: `8px`
- Dialog radius: `10px`

## Page Composition

- `PageHeader`: page title, description, and primary actions.
- `SectionLayout`: pages with a stable secondary navigation.
- `.ecl-page`: full-page vertical layout.
- `.ecl-surface`: standard content surface.
- `.ecl-toolbar`: compact search and filter row.

Custom CSS should only handle page-specific layout. Component states, inputs, buttons, dialogs, menus, lists, tags, switches, sliders, and loading states should use Naive UI.

## Glass Effect（玻璃质感）

外观设置下**两个独立开关**（默认开启，独立 localStorage 记忆，互不依赖，均不走后端）：

- **流体背景**（`auroraEnabled`，key `euoracraft-aurora`）：`.aurora-bg` 光斑层，配色由主色派生（主色 + 色相偏移 ±45°/-35°）；深色模式采用**低调淡光**（低透明度 0.30/0.24/0.18 + 降饱和 + 压暗亮度）。`data-aurora` 控制显隐。
- **玻璃质感**（`glassEffect`，key `euoracraft-glass-effect`）：`.main-content` 统一 `backdrop-filter: blur(var(--glass-blur)) saturate(1.35)`；侧栏/标题栏/弹窗/悬浮层各自带模糊；表面 1px 顶部内高光 `--glass-highlight`。`data-glass` 控制，关闭时 `--glass-blur: 0px`、表面恢复近不透明（0.88~0.92）。

保留：小圆角（6/8/10px）、自定义主题色、明/暗/系统模式、背景图 + 亮度 + 模糊设置均不变。
详见 `docs/junsi-dev-docs/ECL_DESIGN_SYSTEM.md`。

## Controls（控件统一 token）

为消除控件与玻璃质感的割裂，`base.css` 提供主色倾向控件 token，naive-ui overrides 与自定义 ui 组件（UiButton/UiInput/UiSelect/UiSlider/UiCard/UiTag/UiProgress）统一使用：

- `--control-bg`：半透明玻璃底（浅 rgba(255,255,255,.5) / 深 rgba(34,38,48,.5)）
- `--control-bg-hover/-active`：主色 alpha（0.08~0.2）
- `--control-border/-hover/-focus`：rgba(主色, 0.22→0.45→0.6，深色 0.3→0.55→0.7)
- `--control-ring`：聚焦环 `0 0 0 2px rgba(主色,0.18)`
- `--control-glow`：hover 辉光 `0 4px 14px rgba(主色,0.16)`

交互规范：控件玻璃半透明底；边框随主题色递进；hover/focus 带主色辉光；滑块轨道主色 0.18、滑块外圈辉光；开关轨道主色 0.25。圆角保持小圆角。

## 分段标签页（Segment Tabs）

选择型按钮组（主题切换、插件过滤器、账户类型）统一 `NTabs type="segment" size="small"`：

- 尺寸：`min-height: 28px`（对齐普通按钮）、`padding: 4px 12px`
- 激活态：主色背景胶囊 `rgba(主色,0.18)`（深色 0.26）+ inset 主色边框（0.35/深色 0.45）+ 主色加粗文字（`!important` 覆盖 naive rail hover 规则）
- 例外：实例管理卡片/列表视图切换保持原图标按钮组（`.view-switch`）
