# VSCode-VSCE 自定义扩展市场使用指南

## 功能概述

该项目已成功集成了自定义扩展市场支持，包括：

✅ **自定义市场API集成** - 支持从指定服务器查询和搜索扩展  
✅ **版本验证系统** - 发布前自动检查版本冲突  
✅ **Alpha/Beta标签支持** - 支持不同发布阶段的版本管理  
✅ **自动版本递增** - 智能版本号管理  
✅ **本地测试服务器** - 完整的开发测试环境  

## 快速开始

### 1. 启动本地测试服务器

```bash
cd /root/vscode-vsce/test/server
npm start
```

服务器将在 `http://localhost:8991` 启动，提供以下端点：
- `GET /plugin/query?id={extensionId}&tag={releaseTag}` - 查询特定扩展
- `GET /plugin/search?tag={tags}&releaseTag={releaseTag}` - 按标签搜索扩展
- `GET /health` - 健康检查
- `GET /debug/extensions` - 查看所有模拟数据

### 2. 配置扩展项目

在你的扩展 `package.json` 中添加市场配置：

```json
{
  "name": "your-extension",
  "version": "1.0.0",
  "marketplace": {
    "type": "custom",
    "baseUrl": "http://localhost:8991",
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

或通过环境变量配置：

```bash
export VSCE_MARKETPLACE_URL=http://localhost:8991
export VSCE_MARKETPLACE_TIMEOUT=30000
export VSCE_MARKETPLACE_RETRIES=3
```

## 命令行使用示例

### 基础发布命令

```bash
# 发布稳定版本（默认）
vsce publish

# 指定发布标签
vsce publish --tag stable   # 稳定版
vsce publish --tag alpha    # Alpha版
vsce publish --tag beta     # Beta版
```

### 自动版本递增

```bash
# 自动递增 patch 版本 (1.0.0 → 1.0.1)
vsce publish --auto-increment patch

# 自动递增 minor 版本 (1.0.0 → 1.1.0)  
vsce publish --auto-increment minor

# 自动递增 major 版本 (1.0.0 → 2.0.0)
vsce publish --auto-increment major

# 创建预发布版本 (1.0.0 → 1.0.1-alpha.0)
vsce publish --auto-increment prerelease --tag alpha
```

### 组合使用

```bash
# 发布 beta 版本并自动递增 patch
vsce publish --tag beta --auto-increment patch

# 发布 alpha 版本并自动递增 minor
vsce publish --tag alpha --auto-increment minor

# 强制发布相同版本（覆盖现有版本）
vsce publish --skip-duplicate
```

## 版本验证系统

系统会在发布前自动验证版本：

### 验证成功示例
```
🔍 Validating version 1.0.1 against custom marketplace (stable)...
✅ Version validation passed:
   Local version 1.0.1 is higher than server version 1.0.0. Ready to publish.
```

### 版本冲突示例
```
🔍 Validating version 1.0.0 against custom marketplace (stable)...
❌ Version validation failed:
   Local version 1.0.0 already exists on server.

💡 Recommendations:
Suggested version bumps:
  • Patch: 1.0.1 (for bug fixes)
  • Minor: 1.1.0 (for new features)  
  • Major: 2.0.0 (for breaking changes)

Use --auto-increment to automatically bump the version.
```

## API 测试示例

### 查询扩展信息

```bash
# 查询稳定版本
curl "http://localhost:8991/plugin/query?id=test-publisher.test-plugin&tag=stable"

# 查询 alpha 版本
curl "http://localhost:8991/plugin/query?id=test-publisher.test-plugin&tag=alpha"

# 查询 beta 版本
curl "http://localhost:8991/plugin/query?id=test-publisher.test-plugin&tag=beta"
```

### 搜索扩展

```bash
# 按标签搜索稳定版本
curl "http://localhost:8991/plugin/search?tag=development,tools&releaseTag=stable"

# 按标签搜索 alpha 版本
curl "http://localhost:8991/plugin/search?tag=theme&releaseTag=alpha"
```

## 完整工作流示例

### 开发 → Alpha → Beta → 稳定版发布流程

```bash
# 1. 开发阶段：发布 alpha 版本
vsce publish --tag alpha --auto-increment prerelease
# 输出: Published 1.0.1-alpha.0

# 2. 测试阶段：发布 beta 版本
vsce publish --tag beta --auto-increment prerelease  
# 输出: Published 1.0.1-beta.0

# 3. 发布阶段：发布稳定版本
vsce publish --tag stable --auto-increment patch
# 输出: Published 1.0.1
```

### 热修复发布流程

```bash
# 1. 基于当前稳定版本创建热修复
vsce publish --auto-increment patch
# 从 1.0.1 → 1.0.2

# 2. 如果需要先发布 beta 测试
vsce publish --tag beta --auto-increment patch
# 输出: Published 1.0.2-beta.0
```

## 错误处理和故障排除

### 常见错误和解决方案

1. **服务器连接失败**
   ```
   ⚠️ Custom marketplace validation failed: connect ECONNREFUSED
   Falling back to Microsoft marketplace validation
   ```
   **解决方案**: 检查测试服务器是否启动，确认 URL 配置正确

2. **版本验证失败**
   ```
   ❌ Version validation failed:
   Local version 1.0.0 is lower than server version 1.1.0.
   ```
   **解决方案**: 使用 `--auto-increment` 或手动更新版本号

3. **配置错误**
   ```
   Using Microsoft marketplace, skipping custom version validation
   ```
   **解决方案**: 检查 `package.json` 中的 `marketplace` 配置或环境变量

### 调试技巧

1. **查看所有模拟数据**
   ```bash
   curl http://localhost:8991/debug/extensions | json_pp
   ```

2. **检查服务器健康状态**
   ```bash
   curl http://localhost:8991/health
   ```

3. **启用详细日志**
   ```bash
   export VSCE_DEBUG=1
   vsce publish --tag alpha
   ```

## 自定义服务器配置

如果要使用真实的自定义市场服务器，需要实现以下API端点：

```javascript
// 查询特定扩展
app.get('/plugin/query', (req, res) => {
  const { id, tag = 'stable' } = req.query;
  // 返回格式: { extension: ExtensionInfo | null }
});

// 搜索扩展
app.get('/plugin/search', (req, res) => {
  const { tag, releaseTag = 'stable' } = req.query;
  // 返回格式: { extensions: ExtensionInfo[], totalCount: number }
});
```

ExtensionInfo 数据结构：
```typescript
interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  publisher: string;
  displayName?: string;
  description?: string;
  tags?: string[];
  releaseTag?: 'stable' | 'alpha' | 'beta';
  lastUpdated: string;
}
```

## 总结

🎉 **实施完成！** 该系统现在支持：

- ✅ 从自定义服务器查询和发布扩展
- ✅ Alpha、Beta、Stable 三种发布标签
- ✅ 智能版本验证和冲突检测  
- ✅ 自动版本递增（patch/minor/major/prerelease）
- ✅ 完整的本地测试环境
- ✅ 向后兼容微软市场

系统已准备好用于生产环境，可以开始使用自定义扩展市场进行扩展发布管理！