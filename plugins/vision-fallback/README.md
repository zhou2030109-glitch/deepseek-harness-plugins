# Vision Fallback — 视觉模型回退

让纯文本对话模型直接接收图片消息：当主模型不支持图片输入时，自动调用配置好的视觉模型生成图片描述，把"描述文本 + 原始图片展示副本"交给对话流，全程无需手动切换模型。

## 背景

原生 DSH 在选中不支持图片的模型后，发送图片会被 `api-proxy` 直接拒绝（`model-unavailable` / `attachment-error`）。本插件在 Host 侧注册 `imageInputFallback` 能力：

1. `api-proxy` 在准入阶段发现"主模型不支持图片"时，询问 fallback 是否就绪；
2. 就绪则放行图片消息，否则维持原有拒绝逻辑；
3. 在 `agent/pre-step` 阶段，插件调用配置的视觉模型生成图片描述；
4. 描述以 `notice` 上下文追加到模型历史（append-only，可复用 KV 缓存）；
5. 原始图片以 `vision-fallback/display` 持久事件保留在会话中，仅供 UI 展示，不进入模型历史。

## 基准版本与组成

基于 DeepSeek Harness 官方 `dsh-0.1.0-rc.8`（提交 `141eb6fef8`）。本插件由三部分组成：

| 部分 | 位置 | 说明 |
|------|------|------|
| 独立插件包 | `packages/vision-fallback/` | `@deepseek-ai/dsh-vision-fallback`，在 Host 进程中注册 `imageInputFallback` 服务 |
| 源码补丁 | `core.patch` | `packages/core/agent/src/model-selection.ts`：新增 `ImageInputFallback` 接口与 `installedModelSelection`；`packages/core/session/src/known-event-types.ts`：注册 `vision-fallback/display` 事件类型 |
| 源码补丁 | `api-proxy.patch` | `packages/host/apiproxy/src/api-proxy.ts`：准入阶段放行 fallback 可处理的图片消息；分页时按 `displaySeq` 归组 |

## 安装

### 1. 应用源码补丁

在 DSH 源码仓库根目录执行：

```bash
git apply <本仓库路径>/plugins/vision-fallback/core.patch
git apply <本仓库路径>/plugins/vision-fallback/api-proxy.patch
```

### 2. 安装插件包

将 `packages/vision-fallback` 复制到 DSH runtime 的 `node_modules/@deepseek-ai/` 下：

```bash
cp -r packages/vision-fallback <DSH_HOME>/node_modules/@deepseek-ai/dsh-vision-fallback
```

### 3. 配置 composition

在 DSH profile 的 `cordis.patch.yml` 中添加：

```yaml
- id: vision-fallback
  name: '@deepseek-ai/dsh-vision-fallback'
  config:
    enabled: true
    provider: '<vision-model-provider>'
    model: '<vision-model-id>'
    maxTokens: 2400
    timeoutMs: 90000
```

其中 `provider` 必须是在 composition 中已注册的 LLM 适配器路由（如 OpenAI 兼容接口），且该模型需声明支持图片输入。`enabled` 默认开启，但 `provider`/`model` 留空时插件保持休眠，并会提示用户配置视觉模型。

### 4. 重新构建并部署

```bash
pnpm run build:lib
pnpm run build:web   # 若使用 Web 端
```

桌面版请按项目原有流程重新打包桌面安装程序，然后重启应用。

## 与 vision-fallback-display 配合

`vision-fallback/display` 事件需要 [vision-fallback-display](../vision-fallback-display/) 补丁才能在聊天流中显示原始图片消息（缩略图 + 描述观察内容）。不安装该补丁时功能仍可工作，但图片展示副本在 UI 中不可见。

## 配置项

| 字段 | 必填 | 说明 |
|------|------|------|
| `enabled` | ❌ | 是否启用回退，默认 `true` |
| `provider` | ✅ | 视觉模型的 LLM 提供方路由 |
| `model` | ✅ | 支持图片输入的模型 id |
| `maxTokens` | ❌ | 单次视觉分析最大输出 token，默认 `2400` |
| `timeoutMs` | ❌ | 单次视觉请求超时（毫秒），默认 `90000` |

## 说明

- 每个包含图片的进入步骤只发起一次辅助视觉请求，观察结果以纯文本追加进历史，后续轮次复用，不重复发送图片字节。
- 视觉模型调用失败时，会转换为模型可见的失败 `notice`，让对话直接向用户解释，而不是静默丢失图片提示。
- 图片展示副本不消耗对话模型 token。
- 若主模型本身支持图片输入，插件不介入，原图原样发送。