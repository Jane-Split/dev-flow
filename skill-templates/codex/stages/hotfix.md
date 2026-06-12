---
stage: Hotfix
type: stage-instruction
---

## Hotfix 模式（独立）

### 触发条件
- 用户输入 `/dev-flow -hotfix <错误信息>`

### 执行步骤

**Step 1: 解析错误（按项目类型）**

**如果是 Java 项目，识别以下错误类型：**
| 错误类型 | 特征 | 常见原因 |
|----------|------|----------|
| NullPointerException | 空指针异常 | 未做空值检查、方法返回 null |
| ClassCastException | 类型转换异常 | 错误的强制类型转换 |
| IndexOutOfBoundsException | 数组越界 | 索引计算错误、并发修改 |
| IllegalArgumentException | 非法参数 | 参数校验遗漏 |
| IllegalStateException | 非法状态 | 状态机错误、重复操作 |
| NumberFormatException | 数字格式异常 | 字符串转数字失败 |
| SQLException | SQL 异常 | SQL 语法错误、约束违反 |
| BusinessException | 业务异常 | 业务规则冲突 |
| ValidationException | 校验异常 | 参数校验失败 |
| HttpMessageNotReadableException | 请求体解析异常 | JSON 格式错误 |
| MethodArgumentNotValidException | 参数校验异常 | @Valid 校验失败 |
| NoSuchElementException | 元素不存在 | Optional.get() 空值 |

**如果是前端项目，识别以下错误类型：**
- TypeError/ReferenceError/SyntaxError/ModuleNotFound/...

**如果是 Java 微服务（多服务模式），额外识别以下跨服务错误类型：**
| 错误类型 | 特征 | 常见原因 |
|----------|------|----------|
| FeignException | Feign 调用异常 | 目标服务不可用、超时、参数错误 |
| FeignException.ServiceUnavailable | 503 服务不可用 | 目标服务宕机或未注册 |
| FeignException.BadRequest | 400 请求错误 | 请求参数与目标服务不匹配 |
| FeignException.InternalServerError | 500 内部错误 | 目标服务内部异常 |
| DecodeException | 响应解码异常 | 返回值类型不匹配、序列化失败 |
| RetryableException | 可重试异常 | 网络超时、连接被拒绝 |

**Step 2: 定位相关代码**
- 读取错误文件
- 分析错误上下文
- **如果是 Java 微服务（多服务模式）：**
  - 根据错误堆栈判断错误发生在哪个服务
  - 如果是 Feign 调用异常，同时检查调用方和被调用方的代码
  - 检查 service-registry.md 确认服务间依赖关系

**Step 3: 生成修复方案**
- 说明根因分析
- 提供修复代码
- 提供验证步骤

**Java 微服务（多服务模式）常见跨服务修复模式：**

**Feign 调用超时处理：**
```java
// 修复前：无超时和降级处理
@FeignClient(name = "xxx-service")
public interface XxxClient {
    @GetMapping("/api/xxx/{id}")
    ApiResponse<XxxDTO> getById(@PathVariable Long id);
}

// 修复后：添加 fallback 降级
@FeignClient(name = "xxx-service", fallbackFactory = XxxClientFallbackFactory.class)
public interface XxxClient {
    @GetMapping("/api/xxx/{id}")
    ApiResponse<XxxDTO> getById(@PathVariable Long id);
}

@Component
public class XxxClientFallbackFactory implements FallbackFactory<XxxClient> {
    @Override
    public XxxClient create(Throwable cause) {
        return new XxxClient() {
            @Override
            public ApiResponse<XxxDTO> getById(Long id) {
                log.error("调用 xxx-service 失败, id={}, 原因: {}", id, cause.getMessage());
                return ApiResponse.fail("服务暂时不可用，请稍后重试");
            }
        };
    }
}
```

**跨服务错误码传播：**
```java
// 修复前：直接抛出 Feign 异常，丢失目标服务的错误信息
XxxDTO result = xxxClient.getById(id);

// 修复后：检查返回的错误码并正确处理
ApiResponse<XxxDTO> response = xxxClient.getById(id);
if (!response.isSuccess()) {
    throw new BusinessException(response.getCode(), response.getMessage());
}
XxxDTO result = response.getData();
```

**Java 项目常见修复模式：**

**空指针防护：**
```java
// 修复前
String name = user.getName().trim();

// 修复后
String name = user.getName();
if (name != null) {
    name = name.trim();
}
// 或使用 Optional
String name = Optional.ofNullable(user.getName())
    .map(String::trim)
    .orElse("");
```

**集合空值防护：**
```java
// 修复前
for (Item item : order.getItems()) { ... }

// 修复后
List<Item> items = order.getItems();
if (items != null && !items.isEmpty()) {
    for (Item item : items) { ... }
}
// 或使用 Stream
Optional.ofNullable(order.getItems())
    .orElse(Collections.emptyList())
    .forEach(item -> { ... });
```

**直接输出，无需等待确认。**

---

## 断点续传

### 触发条件
- 用户输入 `/dev-flow --resume`

### 执行步骤

1. 读取 `.dev-flow/sessions/` 目录下的会话文件
2. 找到最近的未完成会话
3. 读取已完成的阶段和当前进度
4. 从下一个未完成的阶段继续执行

**会话写入时机**：
- 每个阶段完成后立即更新会话文件
- 写入内容包括：阶段名称、完成时间、关键产出摘要
- 如果阶段失败：记录错误信息和重试次数

### 会话文件格式

`.dev-flow/sessions/{sessionId}.md`：
```markdown
# 会话：{需求标题}
- 状态：进行中
- 当前阶段：Design
- 已完成：Research ✅ → Analyze ✅
- 开始时间：2026-05-24 10:00

## Research 摘要
[调研结果摘要]

## Analyze 摘要
[需求分析摘要]
```

---
