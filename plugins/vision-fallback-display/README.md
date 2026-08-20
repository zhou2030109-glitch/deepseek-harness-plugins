# Vision Fallback Display Support

让 DSH 对话界面正确显示 vision-fallback 插件产生的图片消息。

## 基准版本

本补丁基于 DeepSeek Harness 官方 `dsh-0.1.0-rc.8`（提交 `141eb6fef8`）。低于该版本请先升级 DSH；其他版本运行 `git apply --check` 验证，冲突时手动移植同样的识别逻辑，不要使用 `--reject` 强行应用。

## 背景

DSH 自带 `@deepseek-ai/dsh-vision-fallback` 插件，当主模型不支持图片输入时，会自动调用配置的视觉模型生成图片描述。但原生 `ui-conversation` 的 `message.ts` 不认识 `vision-fallback/display` 事件类型，导致图片消息在聊天流中不可见。

## 功能

- 识别 `vision-fallback/display` 事件，将其作为用户消息节点显示在聊天流中
- 过滤 `visionFallback: 'model-input'` 的消息（只保留 UI 展示副本，不显示发送给模型的纯文本副本）

## 安装

```bash
cd <DSH source>/packages/client/ui-conversation/src/client/conversation-nodes
git apply message.ts.patch
```

然后重新构建 `ui-conversation` 包并部署到 runtime。

## 前提

需要已在 composition 中配置 `vision-fallback` 插件：

```yaml
- id: vision-fallback
  name: '@deepseek-ai/dsh-vision-fallback'
  config:
    enabled: true
    provider: '<your-vision-model-provider>'
    model: '<your-vision-model-id>'
```
