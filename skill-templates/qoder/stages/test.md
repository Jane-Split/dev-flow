---
stage: Test
type: stage-instruction
---

## 阶段七：Test（统一测试）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Test（统一测试）
════════════════════════════════════
目标：全面验证代码质量（单元+冒烟+E2E+集成）
输出：06-test-report.md
模式：标准 / 企业级
预计：10-40 分钟
════════════════════════════════════
```

### 触发条件
- Develop 阶段确认后
- 用户输入 `/dev-flow -test`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 test-expert subagent 执行。**
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `references/protocol.md`。**

### 执行步骤

> **⚠️ 以下步骤由 test-expert subagent 在独立上下文中执行，主 Agent 不直接执行这些步骤。主 Agent 的职责是：创建 subagent → 传递上下文 → 等待结果 → 向用户汇报。**

---

### Step 1: 读取项目记忆

- 读取 `.dev-flow/memory/conventions.md` - 了解项目测试风格和规范
- 读取 `.dev-flow/memory/modules.md` - 了解模块接口以便编写测试（Java: Service/Mapper/Controller）
- 读取 `.dev-flow/memory/mistakes.md` - 参考历史常见错误，重点测试
- 读取 `.dev-flow/contracts/{需求简称}/test-case-contract.yaml` — 测试用例契约（新增）
- 读取 `.dev-flow/contracts/{需求简称}/runtime-contract.yaml` — 运行时环境契约（新增）
- 读取 `.dev-flow/contracts/{需求简称}/prd-contract.yaml` — PRD 契约（追溯用，新增）
- 读取 `.dev-flow/contracts/{需求简称}/design-contract.yaml` — 设计契约（UI 选择器，新增）

---

### Step 2: 单元测试（Unit Test）

**目的**：编写并执行单元测试，验证代码正确性。

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

**执行单元测试**：
- 运行 `mvn test`（Java 项目）
- 运行 `npm test` / `pytest`（前端/Python 项目）
- 收集测试结果

---

### Step 3: 冒烟测试（Smoke Test）

**目的**：快速验证核心业务流程可运行，不追求覆盖率，追求快速发现问题。

> **⚠️ Smoke Test 使用快速 curl/手动验证，E2E Test（Step 4）才使用完整自动化测试脚本。**
> Smoke Test 重点是"能不能跑起来"，E2E Test 重点是"功能是否正确"。

**3.1: 识别核心业务流程**
- 从需求分析文档中提取核心功能点
- 识别主要业务流程（如：创建订单 → 支付 → 发货）
- 确定冒烟测试覆盖的最小路径

**3.2: 启动服务**
- 启动当前服务（及必要的依赖服务）
- 验证服务健康检查通过
- 验证数据库连接正常
- 验证 Redis 连接正常
- 验证 Nacos 注册成功

**3.3: 执行核心流程测试**

**后端冒烟测试**：
```bash
# 1. 健康检查
curl http://localhost:8084/actuator/health

# 2. 核心接口调用
curl -X POST http://localhost:8084/api/xxx -H "Content-Type: application/json" -d '{"name":"test"}'

# 3. 查询验证
curl http://localhost:8084/api/xxx/1
```

**前端冒烟测试**：
- 页面能否正常加载
- 核心按钮能否点击
- 表单能否提交
- 列表能否渲染

---

### Step 4: E2E 测试（End-to-End Test）

**目的**：从用户视角验证完整业务链路正确性。E2E Test 不同于 Smoke Test（快速冒烟）和 Integration Test（模块联调），它模拟真实用户操作场景，覆盖跨层、跨服务的完整业务流程。

**Step 4.0: 全局集成编译 + Design Contract 契约验证（🔴 并行开发后必须执行）**

> **目的**：在 E2E 测试之前，先确保所有并行开发的产出能够正确编译集成，且接口契约一致。
> 这是并行开发模式的关键检查点，防止不同 subagent 生成的代码之间存在接口不一致。

**触发条件**： Develop 阶段使用了多个 subagent 并行开发（Subagent 模式）

**验证流程**：

```
Step 4.0.1: 全局编译验证
  ├── Java 项目：mvn compile -q（全模块编译）
  ├── 前端项目：npm run build 或 npx tsc --noEmit
  └── 编译失败 → 进入 Fix 阶段，修复后再重新执行 E2E

Step 4.0.2: Design Contract 契约一致性校验
  ├── 读取 .dev-flow/contracts/{需求简称}/design-contract.yaml
  ├── 逐项校验：
  │   ├── API 接口路径是否与 Controller 实现一致
  │   ├── DTO 字段名和类型是否与设计一致
  │   ├── 方法命名是否与 Service 接口一致
  │   ├── 跨服务 Feign Client 是否与目标 Controller 端点匹配
  │   └── Enum 值是否与设计文档一致
  └── 不一致项 → 记录到集成验证报告，进入 Fix 阶段

Step 4.0.3: 接口注册表自动校验
  ├── 读取 task-result.yaml 中每个 subagent 声明的 dependencies_provided
  ├── 验证每个 "provided" 依赖在对应代码中确实存在
  ├── 验证每个 "needs_to_know" 的输入信息已正确传递
  └── 缺失项 → 补充或修复

Step 4.0.4: 输出集成验证报告
  └── 写入 .dev-flow/contracts/{需求简称}/集成验证报告.yaml
```

**集成验证报告模板**：
```markdown
# 集成验证报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->

## 1. 编译验证
| 项目 | 结果 | 说明 |
|------|------|------|
| 全局编译 | ✅/❌ | 编译耗时 Xs，Y 个模块 |

## 2. Design Contract 契约校验
| # | 校验项 | 设计定义 | 实际实现 | 状态 |
|---|--------|---------|---------|------|
| 1 | API 路径 POST /api/xxx | design-contract.yaml | XxxController.java | ✅ 一致 |
| 2 | DTO 字段 XxxDTO.name | String, @NotNull | String, @NotBlank | ⚠️ 注解不一致 |

## 3. Subagent 产出一致性
| Subagent | 产出文件 | 依赖声明 | 校验结果 |
|----------|---------|---------|---------|
| backend-develop-expert-1 | XxxMapper.java | 提供查询方法 | ✅ 已验证 |
| backend-develop-expert-2 | XxxService.java | 依赖 XxxMapper | ✅ 已验证 |

## 4. 不一致项清单
| # | 类型 | 描述 | 影响范围 | 修复建议 |
|---

---

**verification-trace-report.yaml 结构**：

```yaml
# verification-trace-report.yaml — 验证追溯报告
# 路径: .dev-flow/evidence/{需求简称}/verification-trace-report.yaml
# 生成者: test-expert subagent
# 使用者: Delivery 阶段（审计）、Fix 阶段（定位失败）

meta:
  version: "1.0"
  generated_by: "test-expert"
  timestamp: "2026-06-12T10:00:00"
  requirement_id: "{需求简称}"

test_summary:
  total_test_cases: 20
  passed: 18
  failed: 2
  skipped: 0
  pass_rate: "90%"

# 按需求追溯
requirements:
  - req_id: "REQ-001"
    description: "用户登录功能"
    test_cases:
      - tc_id: "TC-001"
        type: "api"
        status: "passed"
        evidence: "screenshots/login_success.png"
      - tc_id: "TC-002"
        type: "ui"
        status: "passed"
        evidence: "screenshots/login_ui.png"
    coverage:
      api: true
      ui: true
      db: true
    status: "verified"

  - req_id: "REQ-002"
    description: "订单创建功能"
    test_cases:
      - tc_id: "TC-003"
        type: "api"
        status: "failed"
        error: "返回 500 错误"
        evidence: "logs/order_create_error.log"
    coverage:
      api: true
      ui: false
      db: true
    status: "tested_with_failures"

# 测试类型汇总
test_types:
  unit:
    total: 10
    passed: 10
    failed: 0
    coverage: "92%"
  smoke:
    total: 3
    passed: 3
    failed: 0
  e2e_api:
    total: 4
    passed: 3
    failed: 1
  e2e_ui:
    total: 2
    passed: 1
    failed: 1
  integration:
    total: 1
    passed: 1
    failed: 0

# 失败用例详情
failures:
  - tc_id: "TC-003"
    req_id: "REQ-002"
    type: "api"
    description: "订单创建失败"
    error_message: "NullPointerException in OrderService.create"
    stack_trace: "..."
    affected_files:
      - "src/main/java/com/xxx/service/impl/OrderServiceImpl.java"
    status: "open"  # open / fixed / wontfix

# 证据文件索引
evidence:
  screenshots:
    - path: "evidence/{需求简称}/screenshots/login_success.png"
      tc_id: "TC-001"
      description: "登录成功页面"
  logs:
    - path: "evidence/{需求简称}/logs/order_create_error.log"
      tc_id: "TC-003"
      description: "订单创建错误日志"
  db_asserts:
    - path: "evidence/{需求简称}/db_asserts/user_created.sql"
      tc_id: "TC-001"
      description: "用户创建 DB 断言"
```