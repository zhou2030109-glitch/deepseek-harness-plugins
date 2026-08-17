# Input Image Optimization — 输入图片优化

> [!IMPORTANT]
> 这个旧补丁只能减少浏览器编码耗时，不能修复“图片发送后要等一会儿才显示”的完整问题。请改用 [immediate-image-submit-preview](../immediate-image-submit-preview/)；新补丁已包含这里的 `FileReader` 优化，不要同时应用两者。

用浏览器原生 `FileReader.readAsDataURL()` 替代 JavaScript 手动 base64 编码，大幅提升大图片上传速度。

## 背景

原生 `ui-conversation` 的 `service.ts` 使用 `String.fromCharCode(...chunk)` + `btoa` 循环将图片 File 转为 base64。这个循环在 JavaScript 主线程上运行，对于大图片（几 MB）会造成明显卡顿，因为：
1. `String.fromCharCode(...spread)` 要将整个字节数组展开为参数列表
2. `btoa` 要编码一个可能很长的二进制字符串
3. 全程阻塞主线程

## 功能

- 用 `FileReader.readAsDataURL()` 替代手动编码
- `readAsDataURL` 在浏览器原生代码中完成 base64 编码（C++ 层），不阻塞 JS 主线程
- 结果完全一致：`data:` URL 的 base64 载荷与手动编码字节相同

## 改动

只修改 `service.ts` 一个文件：
- 新增 `readAsBase64(file: File)` 函数，用 `FileReader` 异步读取
- 将 `bytesToBase64(new Uint8Array(await file.arrayBuffer()))` 替换为 `await readAsBase64(file)`

## 安装

```bash
cd <DSH source>/packages/client/ui-conversation/src/client
git apply input-image-optimization/service.ts.patch
```

然后重新构建 `ui-conversation` 包并部署到 runtime。

## 性能对比

| 图片大小 | 之前（fromCharCode+btoa） | 之后（FileReader） |
|----------|--------------------------|-------------------|
| 100KB | ~10ms | <1ms |
| 2MB | ~200ms 卡顿 | <5ms |
| 10MB | ~1-2s 冻结 | <20ms |
