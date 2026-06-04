---
stage: Unit Test
type: stage-instruction
---

## 阶段六：Unit Test（单元测试）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Unit Test（单元测试）
════════════════════════════════════
目标：编写并执行单元测试，验证代码正确性
输出：test-report.md
模式：L1 / L2 / L3
预计：5-15 分钟
════════════════════════════════════
```

### 触发条件
- 全流程模式（Develop 确认后）
- 用户输入 `/dev-flow -test`

### 执行步骤

**Step 0: 读取项目记忆**
- 读取 `.dev-flow/memory/conventions.md` - 了解项目测试风格和规范
- 读取 `.dev-flow/memory/modules.md` - 了解模块接口以便编写测试（Java: Service/Mapper/Controller）
- 读取 `.dev-flow/memory/mistakes.md` - 参考历史常见错误，重点测试

**Step 1: 生成测试用例（按项目类型）**

**如果是 Java 项目，生成以下测试：**

**Controller 层测试（使用 `@WebMvcTest`）：**
- 测试类路径：`src/test/java/.../controller/XxxControllerTest.java`
- 使用 `@WebMvcTest(XxxController.class)` 和 `@AutoConfigureMockMvc`
- 使用 `@MockBean` 模拟 Service 层
- 测试场景：
  - 正常请求（200 OK）
  - 参数校验失败（400 Bad Request）
  - 资源不存在（404 Not Found）
  - 业务异常（自定义错误码）
  - 权限不足（403 Forbidden）

**Service 层测试（使用 `@ExtendWith(MockitoExtension.class)`）：**
- 测试类路径：`src/test/java/.../service/XxxServiceTest.java`
- 使用 `@Mock` 模拟 Mapper/其他 Service
- 使用 `@InjectMocks` 注入被测 Service
- 测试场景：
  - 正常业务流程
  - 边界条件（空值、空集合）
  - 异常流程（资源不存在、业务规则冲突）
  - 事务回滚场景

**Mapper 层测试（使用 `@MybatisPlusTest`）：**
- 测试类路径：`src/test/java/.../mapper/XxxMapperTest.java`
- 使用内存数据库（H2）或 `@Sql` 初始化测试数据
- 测试场景：
  - CRUD 操作
  - 自定义 SQL 查询
  - 分页查询
  - 关联查询

**集成测试（使用 `@SpringBootTest`）：**
- 测试类路径：`src/test/java/.../integration/XxxIntegrationTest.java`
- 测试完整请求链路（Controller → Service → Mapper）

**如果是 Java 微服务（多服务模式），额外生成以下测试：**

**Feign Client 测试（使用 `@MockBean` 或 WireMock）：**
- 测试类路径：`src/test/java/.../client/XxxClientTest.java`
- 使用 `@MockBean` 模拟 Feign Client 或使用 WireMock 模拟目标服务
- 测试场景：
  - 正常调用返回（200 OK）
  - 目标服务不可用（503 Service Unavailable）
  - 超时场景
  - Fallback 降级逻辑触发
  - 错误码正确传播

**跨服务集成测试说明：**
- 微服务环境下，跨服务集成测试通常需要启动多个服务或使用 Mock
- 建议策略：
  - 单元测试 + Feign Client Mock 测试覆盖大部分场景
  - 如需真实跨服务集成测试，使用 Docker Compose 或 Testcontainers
  - 跨服务事务场景需重点测试（数据一致性、补偿机制）

**如果是前端项目，生成以下测试：**
- 组件测试：渲染测试、交互测试、边界情况测试
- API 测试：正常流程、参数验证、错误处理、权限检查
- 工具函数测试：正常输入、边界值、异常输入

**测试覆盖度要求（所有项目）**：

**强制覆盖矩阵**：

| 方法类型 | 必须覆盖场景 | 最少用例数 | 检查方式 |
|----------|--------------|------------|----------|
| 查询方法 | 正常返回、空结果、参数为null | 3 | 检查测试方法名包含对应场景 |
| 创建方法 | 正常创建、参数校验失败、重复创建 | 3 | 检查异常测试用例 |
| 更新方法 | 正常更新、数据不存在、并发冲突 | 3 | 检查乐观锁/版本号测试 |
| 删除方法 | 正常删除、数据不存在、级联删除 | 3 | 检查关联数据处理测试 |
| 业务逻辑 | 正常流程、每个异常分支、边界值 | 5+ | 检查分支覆盖率 |
| 复杂业务 | 正常流程、所有分支、边界、并发 | 7+ | 检查完整场景覆盖 |

**覆盖率阈值**：
- 行覆盖率 ≥ 90%
- 分支覆盖率 ≥ 85%
- 方法覆盖率 ≥ 95%

**测试质量要求**：
- 每个功能点必须至少有一个对应的测试用例
- Java 项目：每个 public 方法至少一个测试（getter/setter 除外）
- 组件测试必须覆盖渲染、交互、边界情况（空数据、加载状态、错误状态）
- API 测试必须覆盖成功流程、参数验证失败、权限不足、服务器错误
- 禁止只测试渲染而不测试交互（浅层测试）
- 测试数据必须使用有意义的模拟数据，禁止使用随机字符串

**禁止生成的测试**：
- ❌ `expect(true).toBe(true)` 无效测试
- ❌ 只测试渲染不测试交互
- ❌ 没有断言的测试
- ❌ 恒真断言测试
- ❌ 过于宽松的断言（只验证非null，不验证具体字段）

**测试命名规范**：
- Java: `test{MethodName}_{Scenario}_{ExpectedResult}`
- TypeScript: `should {expectedBehavior} when {condition}`

**Step 2: 执行测试**
- 运行 `mvn test`（Java 项目）
- 运行 `npm test` / `pytest`（前端/Python 项目）
- 收集测试结果

**Step 3: 生成测试报告**

**Java 项目：**
| 层级 | 测试类 | 测试数 | 通过 | 失败 | 覆盖率 |
|------|--------|--------|------|------|--------|
| Controller | XxxControllerTest | X | X | X | X% |
| Service | XxxServiceTest | X | X | X | X% |
| Mapper | XxxMapperTest | X | X | X | X% |
| 集成测试 | XxxIntegrationTest | X | X | X | X% |

**前端项目：**
| 模块 | 测试数 | 通过 | 失败 | 覆盖率 |
|------|--------|------|------|--------|
| 组件 | X | X | X | X% |
| API | X | X | X | X% |

**Step 4: 写入项目记忆并输出文档**

> **🔴 必须输出正式文档**：将测试结果写入独立文档文件，方便用户追溯。

**输出文档**：
- **正式文档**：`.dev-flow/docs/{需求简称}-测试报告.md`
- **会话记录**：追加到 `.dev-flow/sessions/` 当前会话文件
- **更新记忆**：如有测试失败，记录到 `mistakes.md`

**测试报告模板**：
```markdown
# 测试报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->

## 1. 测试概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 测试时间 | YYYY-MM-DD HH:mm |
| 测试框架 | JUnit 5 + Mockito / Vitest / pytest |

## 2. 测试结果汇总
| 维度 | 结果 |
|------|------|
| 总用例数 | X |
| 通过 | X |
| 失败 | X |
| 跳过 | X |
| 通过率 | X% |

## 3. 测试用例明细
| # | 测试类 | 测试方法 | 场景 | 结果 |
|---|--------|----------|------|------|
| 1 | ... | ... | 正常请求 | ✅ PASS |

## 4. 失败用例分析（如有）
| # | 测试方法 | 失败原因 | 修复方案 | 状态 |
|---|----------|----------|----------|------|

## 5. 覆盖率评估
| 维度 | 覆盖率 |
|------|--------|
| Service 层 | X% |
| Controller 层 | X% |
| Mapper 层 | X% |
```

**暂停，等待用户确认。如果有失败用例，进入 Fix 阶段。**

---
