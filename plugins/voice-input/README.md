# DSH Voice Input Plugin

本地离线语音输入插件，集成在 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) Web GUI 的输入框右侧。

**特点：**
- 🔒 完全离线，音频不出本机
- 🎤 流式转写——说话时文字实时更新
- 🔤 自动标点——停止时用 CT-Transformer 加标点
- 📦 可打包分发，集成到 DSH composition

**技术栈：** [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) SenseVoice（语音识别）+ CT-Transformer（标点恢复），通过 [sherpa-onnx-node](https://www.npmjs.com/package/sherpa-onnx-node) 原生绑定在 Host 进程中加载模型（只加载一次，后续转写无进程启动开销）。

## 架构

```
Browser (Client)                    Host (Node.js)
┌─────────────────────┐            ┌──────────────────────────┐
│  VoiceInputButton    │            │  VoiceInputGateway       │
│  (React component)   │            │  (TypertRemoteService)    │
│                      │  RPC       │                          │
│  getUserMedia →      │ ─────────→ │  OfflineRecognizer        │
│  Float32 samples →   │  base64    │  (SenseVoice, loaded once)│
│  base64 encode       │            │                          │
│                      │ ←───────── │  OfflinePunctuation       │
│  更新输入框 draft    │  text      │  (CT-Transformer)         │
└─────────────────────┘            └──────────────────────────┘
```

- **Host 包** `@deepseek-ai/dsh-voice-input`：在 DSH Host 进程中加载模型，暴露 `voiceInput` Remote 服务
- **Client 包** `@deepseek-ai/dsh-client-ui-voice-input`：在浏览器中注册麦克风按钮到 `conversation.input.right` 插槽

## 安装

### 1. 下载模型（约 554MB）

```bash
mkdir -p ~/.voice-stt/model ~/.voice-stt/sherpa-onnx-punct-ct-transformer-zh-en-vocab272727-2024-04-12

# SenseVoice STT 模型 (237MB)
cd ~/.voice-stt/model
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2
tar xjf sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2
# 得到 model.int8.onnx 和 tokens.txt

# CT-Transformer 标点模型 (294MB)
cd ~/.voice-stt/sherpa-onnx-punct-ct-transformer-zh-en-vocab272727-2024-04-12
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/punctuation-models/sherpa-onnx-punct-ct-transformer-zh-en-vocab272727-2024-04-12.tar.bz2
tar xjf sherpa-onnx-punct-ct-transformer-zh-en-vocab272727-2024-04-12.tar.bz2
# 得到 model.onnx 和 tokens.json
```

### 2. 安装 sherpa-onnx-node

在 DSH runtime 的 node_modules 中安装：

```bash
cd <DSH_HOME>/node_modules
npm install sherpa-onnx-node
```

### 3. 安装插件包

将 `packages/voice-input` 和 `packages/ui-voice-input` 复制到 DSH 的 `node_modules/@deepseek-ai/` 下：

```bash
cp -r packages/voice-input <DSH_HOME>/node_modules/@deepseek-ai/dsh-voice-input
cp -r packages/ui-voice-input <DSH_HOME>/node_modules/@deepseek-ai/dsh-client-ui-voice-input
```

### 4. 配置 composition

在你的 DSH profile 的 `cordis.patch.yml` 中添加：

```yaml
# Host 行
- id: voice-input
  name: '@deepseek-ai/dsh-voice-input'
  config:
    sttModel: '/path/to/model.int8.onnx'
    sttTokens: '/path/to/tokens.txt'
    punctModel: '/path/to/punct-model.onnx'
    numThreads: 1

# Client 行 (在 dsh.client 段)
- id: ui-voice-input
  name: '@deepseek-ai/dsh-client-ui-voice-input'
```

并在 web-app 的 `package.json` dependencies 中添加：

```json
"@deepseek-ai/dsh-voice-input": "workspace:^",
"@deepseek-ai/dsh-client-ui-voice-input": "workspace:^"
```

### 5. 挂载 Remote 命名空间

在 `@deepseek-ai/dsh-api-remotes` 的 client 中挂载 voiceInput Remote：

```ts
import voiceInputRemote from '@deepseek-ai/dsh-voice-input/remote'
// 在 apply 中：
disposers.push(await ctx.remote.$mount(voiceInputRemote))
```

### 6. 重启 DSH

重启后，输入框右侧会出现麦克风按钮。

## 配置项

| 字段 | 必填 | 说明 |
|------|------|------|
| `sttModel` | ✅ | SenseVoice 模型路径 (model.int8.onnx) |
| `sttTokens` | ✅ | SenseVoice tokens 文件路径 (tokens.txt) |
| `punctModel` | ❌ | CT-Transformer 标点模型路径 (model.onnx)，留空则不加标点 |
| `numThreads` | ❌ | 推理线程数，默认 1 |

## 支持的语言

SenseVoice 支持：中文、英文、日语、韩语、粤语。

## License

MIT
