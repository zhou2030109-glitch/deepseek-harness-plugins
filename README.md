# DeepSeek Harness 插件集合

这里是 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 的第三方插件集合。

每个插件目录下有独立的 README，包含安装步骤和配置说明。

## 插件列表

| 插件 | 说明 | 状态 |
|------|------|------|
| [voice-input](./plugins/voice-input/) | 本地离线语音输入：sherpa-onnx SenseVoice 流式转写 + CT-Transformer 标点 | ✅ 可用 |

## 如何使用

1. 进入对应插件目录，阅读 README
2. 下载所需模型/依赖
3. 将包复制到 DSH runtime 的 `node_modules/@deepseek-ai/` 下
4. 在 `cordis.patch.yml` 中添加配置行
5. 重启 DSH

## 如何开发新插件

参考 [DSH 文档](https://github.com/deepseek-ai/deepseek-harness) 了解插件架构。新插件开发完成后，在 `plugins/` 下新建目录，放入源码和 README，然后提 PR。

## License

MIT
