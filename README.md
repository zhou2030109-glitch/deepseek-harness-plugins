# DeepSeek Harness 插件集合

这里是 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 的第三方插件和增强补丁集合。

## 插件列表

| 插件 | 类型 | 说明 |
|------|------|------|
| [voice-input](./plugins/voice-input/) | 独立插件包 | 本地离线语音输入：sherpa-onnx SenseVoice 流式转写 + CT-Transformer 标点 |
| [message-collapse](./plugins/message-collapse/) | 源码补丁 | 消息折叠：将工具调用和推理过程折叠到可展开的"执行过程"组中 |
| [vision-fallback-display](./plugins/vision-fallback-display/) | 源码补丁 | 视觉模型回退：让聊天流正确显示 vision-fallback 的图片消息 |
| [input-image-optimization](./plugins/input-image-optimization/) | 源码补丁 | 输入图片优化：用原生 FileReader 替代 JS 手动 base64 编码 |

## 两种类型

### 独立插件包（如 voice-input）

完整的 npm 包，包含 host + client 两半。安装方式：
1. 复制包到 DSH runtime 的 `node_modules/@deepseek-ai/`
2. 在 `cordis.patch.yml` 中添加配置行
3. 重启 DSH

### 源码补丁（如 message-collapse / vision-fallback-display / input-image-optimization）

对 DSH 源码的 `.patch` 文件。安装方式：
1. 在 DSH 源码树中 `git apply <patch-file>`
2. 重新构建受影响的包
3. 部署到 runtime 并重启

## License

MIT
