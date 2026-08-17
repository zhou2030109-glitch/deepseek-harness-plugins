# Immediate Image Submit Preview — 图片发送即时显示

修复 DeepSeek Harness 中“文字发送后立即出现，但图片发送后要等一会儿才显示”的问题。

## 问题原因

发送图片时，浏览器需要完成图片读取、哈希计算和 Host 请求。原实现会立即清空输入框，但聊天区只能等待 Host 的持久化会话事件返回后才渲染用户图片，因此中间会出现一段空白；仅把 base64 编码换成 `FileReader` 只能减少部分耗时，不能消除请求成功到持久事件投影之间的空窗。

## 修复行为

- 点击发送时，先用浏览器已有的对象 URL 同步显示临时图片气泡。
- Host 的单次请求成功后继续保留气泡，直到匹配的用户/steering 持久事件进入会话时间线。
- 持久消息出现后自动移除临时气泡，避免重复显示。
- 请求失败时立即移除临时气泡，并沿用原有逻辑恢复草稿。
- 取消成功时只移除已取消轮次的预览，保留 Queue 中的图片和取消等待期间新发送的请求；取消失败不移除预览。
- 纯文字发送走原有快速路径，不等待空的图片序列化与哈希任务。
- 缓存图片哈希和预览数据，避免重复读取同一文件。
- 持久事件仍是最终事实来源；临时气泡只负责填补 UI 延迟。

## 基准版本与改动范围

补丁基于 DeepSeek Harness 提交：

```text
47f943859bef60e4160492346772ded9b24f765a
```

仅修改 `packages/client/ui-conversation` 的 6 个文件：

- `src/client/service.ts`
- `src/client/apply.ts`
- `src/client/contract/slots.ts`
- `src/client/chat/ChatView.tsx`
- `src/client/chat/MessageItem.tsx`
- `src/client/chat/MessageItem.module.css`

不包含消息折叠、视觉回退、语音输入等其他功能。

## 安装

从 DeepSeek Harness 源码仓库根目录执行：

```bash
git apply --check <本仓库路径>/plugins/immediate-image-submit-preview/immediate-image-submit-preview.patch
git apply <本仓库路径>/plugins/immediate-image-submit-preview/immediate-image-submit-preview.patch
pnpm run build:lib:client
pnpm run build:web
```

若使用桌面版，还需要按项目原有流程重新打包桌面安装程序并重启应用。

## 兼容性

此补丁已经包含 `input-image-optimization` 的 `FileReader` 优化，并在其上补齐临时气泡的完整生命周期。不要同时应用两个补丁；若旧补丁已应用，请先还原旧补丁，再应用本补丁。

如果你的 DSH 版本不是上述基准提交，请先运行 `git apply --check`。出现冲突时，应手动移植同样的生命周期逻辑，不要使用 `--reject` 强行应用。

## 已验证

- 64 个相关客户端测试通过
- client library 构建通过
- web 构建通过
- scoped lint 通过
- Windows 桌面运行时冒烟检查通过（HTTP 200）
