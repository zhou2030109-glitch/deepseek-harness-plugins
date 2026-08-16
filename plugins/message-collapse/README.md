# Message Collapse — 消息折叠

将 AI 的工具调用和思考过程折叠到可展开的"执行过程"组中，只显示最终回答。

## 背景

原生 DSH 聊天视图将所有节点平铺排列：用户消息、AI 回答、工具调用、推理过程全部在同一层级展示。对话一长就很难找到 AI 的实际回答。

## 功能

- **执行过程分组**：将工具调用（tool-call）和推理过程（reasoning）折叠到一个可展开的"执行过程（N 步）"组中
- **最终回答突出**：AI 的 text/image 回答仍然平铺展示，与执行过程视觉分离
- **可折叠展开**：点击"执行过程"标题行展开/折叠组内内容
- **失败标记**：包含失败的执行组会标红显示

## 改动内容

### 新增文件

- `ChatFlow.tsx` — 聊天流重组器，将平铺节点列表重新分组为 `node` 行和 `execution` 组

### 修改文件

| 文件 | 改动 |
|------|------|
| `ChatView.tsx` | 用 `ChatFlow` 替代平铺的 `order.map(ChatNodeSeat)` |
| `ChatNodeSeat.tsx` | 新增 `presentation` 和 `anchored` 属性，支持执行组内子项 |
| `AssistantMarkdown.tsx` | 支持 `presentation` 参数，按 'full'/'answer'/'execution' 筛选渲染的 block |
| `AssistantNodeView.tsx` | 传递 `presentation` 到 `AssistantMarkdown` |
| `ChatView.module.css` | 新增执行组样式（`.executionGroup` / `.executionHeader` / `.executionBody`） |
| `slots.ts` | `ChatNodeOwnerProps` 新增 `presentation` 字段 |
| `locales.ts` | 新增 `chat.executionProcess` / `chat.executionProcessOne` 中英文文案 |

## 安装

```bash
cd <DSH source>/packages/client/ui-conversation/src/client

# 1. 复制新文件
cp message-collapse/ChatFlow.tsx chat/ChatFlow.tsx

# 2. 应用 patches
git apply message-collapse/message-collapse.patch
git apply message-collapse/AssistantNodeView.tsx.patch

# 3. 重新构建并部署
```

## 效果

```
之前：
  用户：帮我看看这个文件
  🔧 read_file(...)
  🤔 thinking...
  AI：这个文件的内容是...
  🔧 edit_file(...)
  🤔 thinking...
  AI：已修改完成

之后：
  用户：帮我看看这个文件
  ▶ 执行过程（4 步）     ← 可展开
  AI：这个文件的内容是...
  ▶ 执行过程（2 步）     ← 可展开
  AI：已修改完成
```
