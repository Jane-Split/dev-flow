---
name: "on-demand-loader"
description: "按需加载协议。当核心依赖文件超过上下文预算时，subagent 在运行时按需读取文件内容，而非一次性加载。Invoke when task-brief contains ON_DEMAND_LOAD_REQUIRED marker."
---

# @on-demand-loader 按需读取协议

## 使用场景

当完整性门控检测到核心依赖文件超过单文件预算（默认 30KB）时，会触发 ON_DEMAND_LOAD 策略。此时 task-brief 中会包含 `ON_DEMAND_LOAD_REQUIRED` 标记和文件列表。

## 读取约束

1. **次数限制**: 每个 subagent 最多 5 次按需读取
2. **大小限制**: 单次读取最多 100 行或 10KB
3. **内容优先级**: 
   - 优先读取方法签名和类型定义
   - 跳过私有方法实现体
   - 跳过注释和空行
4. **缓存**: 读取后内容缓存到 `.dev-flow/cache/`，避免重复读取

## 读取命令格式

```
Read: {"file_path": "src/main/java/com/example/service/OrderService.java", "offset": 1, "limit": 50}
```

## Task-Brief 注入格式

当触发按需加载时，task-brief 末尾会追加：

```markdown
## ON_DEMAND_LOAD_REQUIRED

以下文件因大小超过预算未完整加载，如需使用请按需读取：

- `src/main/java/com/example/service/OrderService.java` (85KB)
  - 已知方法: createOrder, cancelOrder, getOrderStatus
  - 已知字段: id, userId, items, status, createTime
  - 按需读取: `Read: {"file_path": "...", "offset": 1, "limit": 50}`

- `src/main/java/com/example/entity/Order.java` (45KB)
  - 已知字段: id, userId, items, status, createTime
  - 按需读取: `Read: {"file_path": "...", "offset": 1, "limit": 50}`

> ⚠️ 按需读取会增加上下文占用。如果频繁需要读取，说明任务可能过大，应触发拆分。
```

## 使用流程

1. **开发前**: 检查 task-brief 是否有 `ON_DEMAND_LOAD_REQUIRED` 标记
2. **需要依赖时**: 使用 Read 命令按需读取，优先读取方法签名
3. **读取后**: 将关键签名记录到当前上下文中，避免重复读取
4. **超过 5 次**: 停止读取，记录 "上下文不足，需要拆分任务"

## 风险提示

- 按需读取会占用 subagent 的上下文空间
- 频繁读取（>3 次）说明任务设计不合理
- 超大文件（>150KB）即使按需读取也可能不足，应考虑拆分
