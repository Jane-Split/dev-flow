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
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `.claude/references/protocol.md`。**

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
| develop-expert-1 | XxxMapper.java | 提供查询方法 | ✅ 已验证 |
| develop-expert-2 | XxxService.java | 依赖 XxxMapper | ✅ 已验证 |

## 4. 不一致项清单
| # | 类型 | 描述 | 影响范围 | 修复建议 |
|---|------|------|---------|---------|
```

**如果集成验证失败**：
1. 不进入 E2E 测试
2. 自动进入 Fix 阶段修复集成问题
3. 修复后重新执行集成验证，通过后再执行 E2E

---

**Step 4.1: 识别端到端测试场景**

> **🔴 基于需求验收标准生成测试场景**：读取 `.dev-flow/contracts/{需求简称}/prd-contract.yaml`，
> 将 `requirements` 章节中每个 `test_level: "e2e"` 的验收标准（acceptance 项）自动转化为 E2E 测试用例。
> 同时补充标准测试场景模板，确保覆盖完整。

- 从需求分析文档中提取核心业务场景
- 识别每个场景的完整调用链路（Controller → Service → Mapper/Feign → DB/外部服务）
- 确定测试优先级（核心流程 > 边界场景 > 异常场景）

**场景识别规则**：

| 场景类型 | 覆盖范围 | 示例 |
|---------|---------|------|
| **正向流程** | 完整 happy path | 创建订单 → 查询订单 → 更新状态 |
| **业务分支** | 条件分支覆盖 | 创建时库存不足 → 触发库存预占失败 |
| **异常处理** | 错误路径覆盖 | 重复创建 → 返回 409 Conflict |
| **跨服务链路** | 多服务调用链 | 下单 → 库存扣减 → 消息通知 |
| **数据一致性** | 读写一致性检查 | 写入后立即读取验证数据正确 |

**🔴 标准测试场景模板（根据需求类型自动应用）**：

| 需求类型 | 必须覆盖的 E2E 测试场景 |
|---------|----------------------|
| **CRUD 操作** | 创建→查询验证→更新→查询验证→删除→查询404 |
| **CRUD 操作** | 重复创建→409、参数校验→400、不存在的ID查询→404 |
| **列表查询** | 空列表→200、单条数据→正确分页、超过pageSize→总数正确 |
| **列表查询** | 排序正确性、筛选条件组合、分页边界（第一页/最后一页） |
| **状态变更** | 正常状态流转→成功、非法状态跳转→409/400、终态操作→409 |
| **权限控制** | 无权限→403、有权限→200、过期Token→401 |
| **文件上传** | 正常上传→200、空文件→400、超大文件→413、错误格式→415 |
| **跨服务调用** | 目标服务正常→成功、目标服务超时→降级、目标服务不可用→fallback |
| **并发操作** | 并发创建同一资源→唯一约束触发、并发更新→乐观锁生效 |

> **使用规则**：根据需求类型选择对应的模板行，确保每个需求至少覆盖该类型的所有必测场景。
> 如果验收标准中已定义了同类型场景，则使用验收标准的描述（更精确）。

**Step 4.2: 生成自动化测试脚本**

> **🔴 必须生成可执行的自动化测试脚本，禁止仅输出 curl 命令列表。**

**后端项目（Java Spring Boot）**：

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
public class XxxE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private XxxMapper xxxMapper;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 场景 1：完整创建 → 查询 → 更新 → 删除流程
     */
    @Test
    @Order(1)
    void testFullLifecycle() throws Exception {
        // 1. 创建
        String createRequest = """
            {
                "name": "测试数据",
                "type": "NORMAL"
            }
            """;
        MvcResult createResult = mockMvc.perform(post("/api/xxx")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequest))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").isNumber())
            .andReturn();

        Long id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        // 2. 查询验证
        mockMvc.perform(get("/api/xxx/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("测试数据"))
            .andExpect(jsonPath("$.data.type").value("NORMAL"));

        // 3. 更新
        String updateRequest = """
            {
                "id": %d,
                "name": "更新后数据"
            }
            """.formatted(id);
        mockMvc.perform(put("/api/xxx")
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateRequest))
            .andExpect(status().isOk());

        // 4. 查询验证更新
        mockMvc.perform(get("/api/xxx/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("更新后数据"));

        // 5. 删除
        mockMvc.perform(delete("/api/xxx/" + id))
            .andExpect(status().isOk());

        // 6. 验证删除
        mockMvc.perform(get("/api/xxx/" + id))
            .andExpect(status().isNotFound());
    }

    /**
     * 场景 2：异常路径 - 重复创建
     */
    @Test
    @Order(2)
    void testDuplicateCreate() throws Exception {
        // 创建第一个
        // ...（同上）
        // 重复创建
        mockMvc.perform(post("/api/xxx")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRequest))
            .andExpect(status().isConflict());
    }

    /**
     * 场景 3：参数校验
     */
    @Test
    @Order(3)
    void testValidation() throws Exception {
        String invalidRequest = """
            {
                "name": "",
                "type": "INVALID"
            }
            """;
        mockMvc.perform(post("/api/xxx")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRequest))
            .andExpect(status().isBadRequest());
    }
}
```

**前端项目（TypeScript + Playwright）**：

```typescript
import { test, expect } from '@playwright/test';

test.describe('用户管理 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('完整创建用户流程', async ({ page }) => {
    await page.goto('/users');
    await page.click('text=新增用户');

    // 填写表单
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="email"]', 'test@example.com');
    await page.selectOption('[name="role"]', 'editor');
    await page.click('text=提交');

    // 验证创建成功
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('table tbody tr')).toContainText('testuser');
  });

  test('用户列表搜索和筛选', async ({ page }) => {
    await page.goto('/users');
    await page.fill('[placeholder="搜索用户名"]', 'admin');
    await page.click('text=搜索');
    await expect(page.locator('table tbody tr')).toContainText('admin');
  });
});
```

**测试脚本放置规则**：

| 项目类型 | 测试文件路径 |
|---------|------------|
| Java Spring Boot | `src/test/java/.../e2e/XxxE2ETest.java` |
| 前端 React/Vue | `e2e/xxx.spec.ts`（Playwright） |
| Node.js | `tests/e2e/xxx.test.ts` |

**Step 4.3: 准备测试数据**

每个 E2E 测试场景需要：

```markdown
### 测试数据准备

| 数据项 | 准备方式 | 清理方式 |
|--------|---------|---------|
| 测试用户 | INSERT 预置数据 / 注册 API | DELETE 或 @Transactional 回滚 |
| 测试配置 | 临时配置文件 | 恢复原配置 |
| Mock 外部服务 | MockServer / WireMock | 关闭 Mock |
| 测试队列 | 内存队列 / 测试 Profile | 清空队列 |
```

**数据准备原则**：
- 每个测试独立准备数据，不依赖其他测试的副作用
- 使用 `@Transactional` 或 `afterEach` 自动清理
- 外部服务使用 Mock，确保测试可重复执行
- 测试数据与生产数据隔离（使用测试数据库）

**Step 4.4: 执行测试并收集结果**

**执行命令**：

| 项目类型 | 执行命令 |
|---------|---------|
| Java | `mvn test -Dtest=XxxE2ETest -pl {module}` |
| 前端 | `npx playwright test e2e/xxx.spec.ts` |
| Node.js | `npx jest tests/e2e/xxx.test.ts` |

**Step 4.4.1: 服务编排启动（新增）**

> **目的**：按 runtime-contract.yaml 自动启动所有服务，为 E2E 测试提供运行时环境。
> **详细协议见 `.claude/references/runtime-protocol.md`。**

**执行流程**：

```
1. 创建 service-orchestrator subagent
2. 读取 runtime-contract.yaml
3. 按 startup_sequence 启动所有服务：
   ├── Phase 1: 基础设施检查（MySQL/Redis/Nacos）
   ├── Phase 2: 后端服务启动（按依赖顺序）
   └── Phase 3: 前端服务启动
4. 等待所有服务健康检查通过
5. 输出 startup-report.yaml
```

> **⚠️ 降级兼容**：如果 runtime-contract.yaml 不存在，跳过本步骤，假设服务已手动启动。

**Step 4.4.2: DB 数据核对（新增）**

> **目的**：在 API 调用后，直接核对数据库数据与预期是否一致，验证数据持久化正确性。
> **详细协议见 `.claude/references/runtime-protocol.md` — DB 断言章节。**

**核对方式**：

```
对 test-case-contract.yaml 中每个包含 db_assert 的测试步骤：
1. API 请求执行完成后
2. 创建 db-verifier subagent（或内联执行）
3. 连接数据库，执行 SQL 查询
4. 比对实际行数与 expected_rows
5. 比对字段值与 expected_values
6. 记录断言结果到 db-assertions-report.yaml
```

**Java E2E 测试中的 DB 核对示例**：

```java
// 在 E2E 测试方法中增加 DB 核对
@Autowired
private UserMapper userMapper;

@Test
void testCreateUser() throws Exception {
    // 1. API 调用
    MvcResult result = mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"张三\"}"))
        .andExpect(status().isOk())
        .andReturn();

    Long id = JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");

    // 2. DB 数据核对（新增）
    User dbUser = userMapper.selectById(id);
    assertNotNull(dbUser, "数据库中应存在该用户");
    assertEquals("张三", dbUser.getName(), "数据库中用户名应正确");
}
```

> **⚠️ 降级兼容**：如果 test-case-contract.yaml 不存在或无 db_assert 定义，跳过 DB 核对，行为与 v3.4.0 一致。

---

### Step 5: 集成测试（Integration Test）

**目的**：验证多模块/多服务联调，验证接口契约，验证数据一致性。

**5.1: 识别集成点**
- 读取 `.dev-flow/memory/dependency-graph.md`
- 识别当前服务调用的其他服务（Feign Client）
- 识别被其他服务调用的接口（Controller）

**5.2: 准备测试环境**
- 启动所有相关服务（或使用 Mock）
- 准备测试数据
- 配置测试数据库（使用独立数据库或 H2）

**5.3: 执行集成测试**

**跨服务调用测试**：
```java
@SpringBootTest
class XxxIntegrationTest {

    @Autowired
    private XxxService xxxService;

    @Test
    void testCrossServiceCall() {
        // 测试调用 basedata-service 获取产品信息
        ProductDTO product = xxxService.getProductById(1L);
        assertNotNull(product);
    }
}
```

**接口契约测试**：
- 验证 Feign Client 接口与目标服务 Controller 匹配
- 验证请求/响应 DTO 字段一致
- 验证错误码处理一致

**数据一致性测试**：
- 验证跨服务事务（如有）
- 验证数据同步（如有）

---

### Step 5.5: E2E 测试 — UI 层验证（新增）

> **目的**：通过浏览器自动化验证 UI 交互和数据展示正确性，实现前端页面的真实用户操作验证。
> **详细协议见 `.claude/references/runtime-protocol.md`。**

**触发条件**：
- 项目包含前端代码（Vue/React/Angular）
- test-case-contract.yaml 中存在 type: "ui" 的测试用例
- 前端服务已启动（startup-report.yaml 中状态为 healthy）

**执行流程**：

```
Step 5.5.1: 创建 e2e-ui-tester subagent
  ├── 传递 test-case-contract.yaml 的 ui_steps
  ├── 传递 design-contract.yaml 的 ui_selectors
  └── 传递 runtime-contract.yaml 的 frontend 配置

Step 5.5.2: e2e-ui-tester 执行浏览器自动化测试
  ├── 调用 agent-browser skill
  ├── 按 ui_steps 逐步执行
  ├── 每步截图存证
  ├── 断言页面元素文本/可见性/状态
  └── 核对 UI 展示数据与 DB 数据一致性

Step 5.5.3: 收集 UI 测试结果
  ├── 读取 ui-test-report.yaml
  └── 截图保存到 evidence 目录
```

**降级处理**（如果 agent-browser 不可用）：
- 仅生成 Playwright 测试脚本（现有行为）
- 在测试报告中标注"UI 验证未执行，已生成 Playwright 脚本"
- 提示用户手动执行 `npx playwright test`

> **⚠️ 降级兼容**：如果项目无前端代码或 test-case-contract.yaml 不存在，跳过本步骤，行为与 v3.4.0 一致。

---

### Step 5.6: 验证结果回写与追溯矩阵更新（新增）

> **目的**：将所有测试结果自动回写到 prd-contract.yaml 的追溯矩阵，实现 PRD 状态自动流转，完成闭环。
> **详细协议见 `.claude/references/runtime-protocol.md` — 追溯矩阵回写协议章节。**

**执行流程**：

```
Step 5.6.1: 汇总所有测试结果
  ├── 单元测试结果（Step 2）
  ├── 冒烟测试结果（Step 3）
  ├── API + DB E2E 测试结果（Step 4）
  ├── UI E2E 测试结果（Step 5.5）
  └── 集成测试结果（Step 5）

Step 5.6.2: 更新 prd-contract.yaml 的 traceability 章节
  ├── 对每个 REQ-XXX：
  │     ├── 收集关联的所有 TC 结果
  │     ├── 计算覆盖率
  │     └── 更新 status：
  │           ├── 所有 TC PASS → status: "verified"
  │           ├── 部分 TC FAIL → status: "tested_with_failures"
  │           └── TC 未执行 → status: "tested"
  └── 写入 verification 详情

Step 5.6.3: 生成验证追溯报告
  └── 写入 .dev-flow/evidence/{需求简称}/verification-trace-report.yaml
```

**PRD 状态流转**：

```
analyzed → designed → developed → tested → verified
                                           ↘ tested_with_failures
```

> **⚠️ 降级兼容**：如果 prd-contract.yaml 不存在或无 traceability 章节，跳过回写，行为与 v3.4.0 一致。

---

### Step 6: 生成阶段交付物

> **🔴 必须输出正式文档**：将测试结果写入独立文档文件，方便用户追溯。

**交付物路径**：`.dev-flow/deliverables/{需求简称}/06-test-report.md`

**交付物内容**：
```markdown
<!-- @generated-by: test-expert subagent | session: {session-id} | stage: test -->

# 统一测试报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: tested -->

## 1. 测试概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 测试时间 | YYYY-MM-DD HH:mm |
| 测试框架 | JUnit 5 + Mockito / Vitest / pytest |
| 测试环境 | 本地开发环境 |

## 2. 单元测试结果
| 层级 | 测试类 | 测试数 | 通过 | 失败 | 覆盖率 |
|------|--------|--------|------|------|--------|
| Controller | XxxControllerTest | X | X | X | X% |
| Service | XxxServiceTest | X | X | X | X% |
| Mapper | XxxMapperTest | X | X | X | X% |

## 3. 冒烟测试结果
| # | 测试场景 | 接口/页面 | 预期结果 | 实际结果 | 状态 |
|---|----------|----------|----------|----------|------|
| 1 | 服务启动 | actuator/health | 返回 UP | 返回 UP | ✅ PASS |

## 4. E2E 测试结果
| # | 测试场景 | 涉及接口/页面 | 预期结果 | 实际结果 | 状态 |
|---|----------|-------------|----------|----------|------|
| 1 | 创建→查询→更新→删除 | POST/GET/PUT/DELETE /api/xxx | 完整流程通过 | 完整流程通过 | ✅ PASS |

## 5. 集成测试结果
| # | 集成点 | 调用方 | 被调用方 | 测试结果 |
|---|--------|--------|----------|----------|
| 1 | Feign Client | 服务A | 服务B | ✅/❌ |

## 5.5 DB 数据核对结果（新增）
| # | 测试用例 | 表 | 条件 | 期望行数 | 实际行数 | 字段比对 | 状态 |
|---|---------|-----|------|---------|---------|---------|------|

## 5.6 UI 层验证结果（新增）
| # | 测试用例 | 步骤数 | 通过 | 失败 | 截图数 | 状态 |
|---|---------|--------|------|------|--------|------|

## 5.7 验证追溯矩阵（新增）
| REQ-ID | 功能点 | 验收标准覆盖 | API 测试 | UI 测试 | DB 断言 | 综合状态 |
|--------|--------|------------|---------|---------|---------|---------|

## 6. 全流程测试汇总
| 测试类型 | 用例数 | 通过 | 失败 | 通过率 |
|---------|--------|------|------|--------|
| 单元测试 | X | X | X | X% |
| 冒烟测试 | X | X | X | X% |
| E2E 测试 | X | X | X | X% |
| 集成测试 | X | X | X | X% |
| **合计** | **X** | **X** | **X** | **X%** |

## 7. 覆盖率评估
| 维度 | 覆盖率 | 阈值 | 状态 |
|------|--------|------|------|
| 行覆盖率 | X% | ≥90% | ✅/❌ |
| 分支覆盖率 | X% | ≥85% | ✅/❌ |
| 方法覆盖率 | X% | ≥95% | ✅/❌ |

## 8. 失败用例分析（如有）
| # | 测试方法 | 所属测试类型 | 失败原因 | 修复状态 |
|---|----------|------------|----------|----------|
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: test-expert subagent` 溯源注释
- 覆盖率和通过率数据完整
- 失败用例已记录（如有）

**暂停，等待用户确认。如果有失败用例，进入 Fix 阶段。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 test-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | **单元测试**：所有 Service 层 public 方法都有对应测试（getter/setter 除外），覆盖率达标（行≥90%、分支≥85%、方法≥95%） | ⬜ 待确认 |
| 2 | **单元测试**：无无效测试（恒真断言/无断言/只测渲染），测试数据使用有意义模拟数据 | ⬜ 待确认 |
| 3 | **冒烟测试**：服务启动成功，基础设施连接正常，核心 API 端点可访问且返回正确 | ⬜ 待确认 |
| 4 | **E2E 测试**：所有核心业务场景已覆盖，测试脚本可执行（非 curl 命令列表），正向流程 + 异常路径 + 边界场景均通过 | ⬜ 待确认 |
| 5 | **集成测试**：所有跨服务接口契约已验证，跨服务数据一致性测试通过 | ⬜ 待确认 |
| 6 | **测试报告**：统一测试报告已输出，全流程测试结果汇总完整 | ⬜ 待确认 |
| 7 | **DB 数据核对**：所有 E2E 测试步骤的 db_assert 已执行，数据库数据与预期一致 | ⬜ 待确认 |
| 8 | **UI 层验证**：所有 UI 测试用例已执行（或已生成 Playwright 脚本），页面交互和数据展示正确 | ⬜ 待确认 |
| 9 | **追溯矩阵**：prd-contract.yaml 的 traceability 已更新，每个 REQ 的验证状态已回写 | ⬜ 待确认 |
| 10 | **验证证据**：截图、DB 断言报告、UI 测试报告已保存到 evidence 目录 | ⬜ 待确认 |

> **阶段确认机制和交付物协议详见 `.claude/references/protocol.md`。**

---
