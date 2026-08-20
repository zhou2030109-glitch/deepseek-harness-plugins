# DeepSeek Harness 插件集合

这里是 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 的第三方插件和增强补丁集合。所有源码补丁均以官方 `dsh-0.1.0-rc.8`（提交 `141eb6fef8`）为基准，可独立应用；不同补丁互不依赖，可选择性安装。

## 插件列表

| 插件 | 类型 | 说明 |
|------|------|------|
| [voice-input](./plugins/voice-input/) | 独立插件包 | 本地离线语音输入：sherpa-onnx SenseVoice 流式转写 + CT-Transformer 标点 |
| [vision-fallback](./plugins/vision-fallback/) | 独立插件包 + 源码补丁 | 视觉模型回退：文本模型自动调用视觉模型生成图片描述 |
| [message-collapse](./plugins/message-collapse/) | 源码补丁 | 消息折叠：将工具调用和推理过程折叠到可展开的"执行过程"组中 |
| [vision-fallback-display](./plugins/vision-fallback-display/) | 源码补丁 | 让聊天流正确显示 vision-fallback 产生的图片展示消息 |
| [immediate-image-submit-preview](./plugins/immediate-image-submit-preview/) | 源码补丁 | 图片发送即时显示：用本地临时气泡填补提交到持久消息出现前的空窗 |
| [input-image-optimization](./plugins/input-image-optimization/) | 源码补丁（旧） | 仅优化图片读取；若要修复发送后延迟显示，请使用上面的完整补丁 |

## 两种类型

### 独立插件包（如 voice-input / vision-fallback）

完整的 npm 包，包含 host（以及部分 client）两半。安装方式：
1. 复制包到 DSH runtime 的 `node_modules/@deepseek-ai/`
2. 在 `cordis.patch.yml` 中添加配置行
3. 重启 DSH

### 源码补丁（如 message-collapse / vision-fallback-display / immediate-image-submit-preview）

对 DSH 源码的 `.patch` 文件。安装方式：
1. 在 DSH 源码树中 `git apply <patch-file>`
2. 重新构建受影响的包
3. 部署到 runtime 并重启

## License

MIT