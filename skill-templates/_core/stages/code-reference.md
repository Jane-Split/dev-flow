---
stage: Code Reference
type: stage-instruction
---

## 长期记忆系统

长期记忆让 AI 能够记住项目的深层知识，包括常见错误模式、用户的偏好设置、历史决策等，实现"越用越好用"。

### 长期记忆文件

`.dev-flow/memory/` 目录下新增以下长期记忆文件：

```
.dev-flow/memory/
├── ...                     # 基础记忆文件（已有）
├── patterns.md            # 常见代码模式（新增）
├── mistakes.md            # 常见错误及修复方案（新增）
├── preferences.md         # 用户偏好设置（新增）
└── decisions.md           # 历史架构决策记录（新增）
```

### patterns.md - 常见代码模式

记录项目中反复出现的代码模式，供后续开发复用：

**Java 项目示例：**
<!-- LANGUAGE-ONLY: java -->
```markdown
# 常见代码模式

## Service 层标准模板
```java
@Service
@RequiredArgsConstructor
public class XxxServiceImpl implements XxxService {
    
    private final XxxMapper xxxMapper;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public ApiResponse<Xxx> create(XxxRequest request) {
        // 1. 参数校验
        if (request == null) {
            throw new BusinessException("请求参数不能为空");
        }
        
        // 2. 业务逻辑处理
        Xxx entity = new Xxx();
        BeanUtils.copyProperties(request, entity);
        
        // 3. 数据库操作
        xxxMapper.insert(entity);
        
        // 4. 返回结果
        return ApiResponse.success(entity);
    }
}
```
- 使用场景：所有 Service 实现类
- 添加时间：2026-05-24
- 使用次数：8

## Controller 层标准模板
```java
@RestController
@RequestMapping("/api/xxx")
@RequiredArgsConstructor
public class XxxController {
    
    private final XxxService xxxService;
    
    @PostMapping
    public ApiResponse<Xxx> create(@RequestBody @Valid XxxRequest request) {
        return xxxService.create(request);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<Xxx> getById(@PathVariable Long id) {
        return xxxService.getById(id);
    }
}
```
- 使用场景：所有 REST API 控制器
- 添加时间：2026-05-24
- 使用次数：6

## 分页查询模式
```java
@Override
public ApiResponse<PageResult<Xxx>> list(PageQueryRequest request) {
    // 1. 构建分页参数
    Page<Xxx> page = new Page<>(request.getPageNum(), request.getPageSize());
    
    // 2. 构建查询条件
    LambdaQueryWrapper<Xxx> wrapper = new LambdaQueryWrapper<>();
    if (StringUtils.isNotBlank(request.getKeyword())) {
        wrapper.like(Xxx::getName, request.getKeyword());
    }
    wrapper.orderByDesc(Xxx::getCreateTime);
    
    // 3. 执行查询
    Page<Xxx> result = xxxMapper.selectPage(page, wrapper);
    
    // 4. 返回分页结果
    return ApiResponse.success(PageResult.of(result));
}
```
- 使用场景：列表查询接口
- 添加时间：2026-05-24
- 使用次数：5
```
<!-- /LANGUAGE-ONLY: java -->

**前端项目示例：**
<!-- LANGUAGE-ONLY: typescript -->
```markdown
# 常见代码模式

## API 错误处理模式
```typescript
// 标准错误处理包装器
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  if (error.response?.status === 401) {
    return { success: false, error: '未授权，请重新登录' };
  }
  return { success: false, error: error.message || '服务器错误' };
}
```
- 使用场景：所有 API 调用
- 添加时间：2026-05-24
- 使用次数：5

## 表单验证模式
```typescript
// Zod 验证模式
const schema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少6位'),
});
```
- 使用场景：用户输入表单
- 添加时间：2026-05-24
- 使用次数：3
```
<!-- /LANGUAGE-ONLY: typescript -->

### mistakes.md - 常见错误及修复

记录项目中反复出现的 Bug 及其修复方案：

**Java 项目示例：**
<!-- LANGUAGE-ONLY: java -->
```markdown
# 常见错误及修复

## 空指针异常：未做空值检查
**错误模式**：`String name = user.getName().trim();`（name 可能为 null）
**修复方案**：
```java
String name = user.getName();
if (name != null) {
    name = name.trim();
}
// 或使用 Optional
String name = Optional.ofNullable(user.getName())
    .map(String::trim)
    .orElse("");
```
**出现次数**：5
**最后出现**：2026-05-24
**预防措施**：使用 `@NonNull` 注解、IDE 空值检查、Optional

## 事务失效：同类方法调用
**错误模式**：Service 中 `this.update()` 导致 `@Transactional` 失效
**修复方案**：
```java
// 错误
@Transactional
public void process(Order order) {
    this.update(order); // 事务失效！
}

// 正确：注入自身或使用 AopContext
@Transactional
public void process(Order order) {
    orderService.update(order); // 通过注入的实例调用
}
```
**出现次数**：3
**最后出现**：2026-05-24
**预防措施**：避免同类方法调用、使用构造器注入自身

## 🔴 编译错误：未读取定义就生成代码（高频！）

**错误模式**：根据命名习惯猜测方法名、类型、import 路径，而不是读取实际定义。

**具体表现**：

| 错误类型 | 错误示例 | 实际定义 |
|---------|---------|---------|
| 方法名错误 | `batch.getStatus()` | `batch.getInspectionBatchStatus()` |
| 类型错误 | `status = 1`（Integer） | `status = (byte) 1`（byte） |
| import 路径错误 | `import ...service.rework.Xxx` | `import ...service.Xxx` |
| 参数错误 | `service.save(dto)` | `service.save(dto, userId)` |

**根本原因**：未执行 Step 1.5-1.8 的强制读取验证流程。

**修复方案**：

```markdown
1. 在生成代码前，必须执行 Step 1.5：强制读取依赖定义
   - Read Entity 定义 → 确认字段名、类型、方法名
   - Read Service 定义 → 确认方法签名、参数
   - Grep 搜索类位置 → 确认 import 路径

2. 在生成代码后，必须执行 Step 4：编译前自检
   - 每个 import 都通过 Grep 确认存在
   - 每个方法调用都与 Step 1.5 读取结果一致
   - 每个字段赋值都类型兼容

3. 输出检查报告，确认所有检查项通过
```

**出现次数**：10+
**最后出现**：2026-05-26
**预防措施**：
- 严格执行 Step 1.5-1.8 的强制读取验证流程
- 禁止根据命名习惯猜测
- 每个文件生成后必须输出检查报告

## 并发问题：非线程安全的 SimpleDateFormat
**错误模式**：静态 SimpleDateFormat 被多线程使用
**修复方案**：
```java
// 错误
private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

// 正确：使用 DateTimeFormatter（线程安全）
private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
```
**出现次数**：2
**最后出现**：2026-05-24
**预防措施**：使用 Java 8 日期时间 API

## MyBatis 映射错误：字段名不匹配
**错误模式**：SQL 返回的列名与实体类字段名不一致
**修复方案**：
```java
// 使用 @TableField 指定映射
@TableField("user_name")
private String userName;

// 或在 XML 中使用 resultMap
<resultMap id="userMap" type="User">
    <result column="user_name" property="userName"/>
</resultMap>
```
**出现次数**：2
**最后出现**：2026-05-24
**预防措施**：开启驼峰自动映射、使用 Lambda 查询避免手写 SQL
```
<!-- /LANGUAGE-ONLY: java -->

**前端项目示例：**
<!-- LANGUAGE-ONLY: typescript -->
```markdown
# 常见错误及修复

## 类型错误：Promise 未 await
**错误模式**：`const data = fetchUser();`（忘记 await）
**修复方案**：`const data = await fetchUser();`
**出现次数**：3
**最后出现**：2026-05-24
**预防措施**：ESLint 规则 @typescript-eslint/no-floating-promises

## 逻辑错误：数组空值检查遗漏
**错误模式**：`items.map(...)` 未检查 items 是否为 null
**修复方案**：`items?.map(...) || []`
**出现次数**：2
**最后出现**：2026-05-24
```
<!-- /LANGUAGE-ONLY: typescript -->

### preferences.md - 用户偏好

记录用户的编码偏好和习惯：

```markdown
# 用户偏好

## 代码风格
- 引号：单引号（'）
- 分号：必须
- 缩进：2 空格
- 最大行宽：100

## 架构偏好
- 状态管理：React Context + useReducer（不喜欢 Redux）
- 样式方案：Tailwind CSS（不喜欢 CSS Modules）
- 表单处理：React Hook Form + Zod

## 质量要求
- 必须包含单元测试
- 必须包含 JSDoc 注释
- 错误处理必须友好（中文错误消息）

## 更新历史
- 2026-05-24：确定使用 Tailwind CSS
```

### decisions.md - 历史架构决策

记录项目中的重要架构决策及其原因：

```markdown
# 架构决策记录

## ADR-001：选择 React Hook Form 而非 Formik
**日期**：2026-05-24
**决策**：使用 React Hook Form 处理表单
**原因**：
- 性能更好（减少重渲染）
- 与 TypeScript 集成更顺畅
- 包体积更小
**影响**：所有表单组件

## ADR-002：API 错误码规范
**日期**：2026-05-24
**决策**：使用 6 位数字错误码，前三位表示模块，后三位表示具体错误
**原因**：便于错误追踪和国际化
**影响**：所有 API 端点
```

### 长期记忆使用规则

**读取时机**：
- Develop 前：读取 patterns.md（复用已有模式）
- Fix 前：读取 mistakes.md（参考历史修复方案）
- 所有阶段前：读取 preferences.md（遵守用户偏好）
- Design 前：读取 decisions.md（遵守架构决策）

**更新时机**：
- Develop 完成后：更新 patterns.md（记录新模式）
- Fix 完成后：更新 mistakes.md（记录新错误模式）
- 用户明确反馈后：更新 preferences.md（记录偏好）
- 重大决策后：更新 decisions.md（记录决策）

**记忆强化机制**：
- 每个模式/错误/偏好记录使用次数
- 使用次数 > 3 次标记为"高频"，优先推荐
- 使用次数 > 5 次标记为"标准"，必须遵守

---
