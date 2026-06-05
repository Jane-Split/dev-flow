---
stage: E2E Test
type: stage-instruction
---

## 阶段九：E2E Test（端到端测试）

### 入口 Banner（本阶段开始时输出）

```
▶ E2E Test（端到端测试）
════════════════════════════════════
目标：从用户视角验证完整业务链路正确性
输出：e2e-test-report.md + 自动化测试脚本
模式：L2 / L3
预计：5-20 分钟
════════════════════════════════════
```

### 触发条件
- Smoke Test 阶段通过后
- 用户输入 `/dev-flow -e2e`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 e2e-test-expert subagent 执行。**

### 目的
验证从 API 调用 → 业务逻辑处理 → 数据持久化 → 响应返回的完整链路正确性。E2E Test 不同于 Smoke Test（快速冒烟）和 Integration Test（模块联调），它模拟真实用户操作场景，覆盖跨层、跨服务的完整业务流程。

### 执行步骤

**Step 0: 全局集成编译 + Design Contract 契约验证（🔴 并行开发后必须执行）**

> **目的**：在 E2E 测试之前，先确保所有并行开发的产出能够正确编译集成，且接口契约一致。
> 这是并行开发模式的关键检查点，防止不同 subagent 生成的代码之间存在接口不一致。

**触发条件**： Develop 阶段使用了多个 subagent 并行开发（Subagent 模式）

**验证流程**：

```
Step 0.1: 全局编译验证
  ├── Java 项目：mvn compile -q（全模块编译）
  ├── 前端项目：npm run build 或 npx tsc --noEmit
  └── 编译失败 → 进入 Fix 阶段，修复后再重新执行 E2E

Step 0.2: Design Contract 契约一致性校验
  ├── 读取 .dev-flow/docs/{需求简称}-design-contract.yaml
  ├── 逐项校验：
  │   ├── API 接口路径是否与 Controller 实现一致
  │   ├── DTO 字段名和类型是否与设计一致
  │   ├── 方法命名是否与 Service 接口一致
  │   ├── 跨服务 Feign Client 是否与目标 Controller 端点匹配
  │   └── Enum 值是否与设计文档一致
  └── 不一致项 → 记录到集成验证报告，进入 Fix 阶段

Step 0.3: 接口注册表自动校验
  ├── 读取 task-result.yaml 中每个 subagent 声明的 dependencies_provided
  ├── 验证每个 "provided" 依赖在对应代码中确实存在
  ├── 验证每个 "needs_to_know" 的输入信息已正确传递
  └── 缺失项 → 补充或修复

Step 0.4: 输出集成验证报告
  └── 写入 .dev-flow/docs/{需求简称}-集成验证报告.md
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

**Step 1: 识别端到端测试场景**

> **🔴 基于需求验收标准生成测试场景**：读取 `.dev-flow/docs/{需求简称}-acceptance-criteria.yaml`，
> 将每个 `test_level: "e2e"` 的验收标准自动转化为 E2E 测试用例。
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

**Step 2: 生成自动化测试脚本**

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

**Step 3: 准备测试数据**

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

**Step 4: 执行测试并收集结果**

**执行命令**：

| 项目类型 | 执行命令 |
|---------|---------|
| Java | `mvn test -Dtest=XxxE2ETest -pl {module}` |
| 前端 | `npx playwright test e2e/xxx.spec.ts` |
| Node.js | `npx jest tests/e2e/xxx.test.ts` |

**Step 5: 输出测试报告**

**输出文档**：`.dev-flow/docs/{需求简称}-e2e测试报告.md`

**文档模板**：
```markdown
# E2E 测试报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->

## 1. 测试概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 测试时间 | YYYY-MM-DD HH:mm |
| 测试环境 | 本地开发环境 |
| 测试框架 | SpringBootTest + MockMvc / Playwright |
| 测试脚本路径 | `src/test/java/.../e2e/XxxE2ETest.java` |

## 2. 测试场景覆盖
| # | 场景 | 类型 | 测试方法 | 状态 |
|---|------|------|---------|------|
| 1 | 创建→查询→更新→删除 | 正向流程 | testFullLifecycle | ✅ PASS |
| 2 | 重复创建 | 异常处理 | testDuplicateCreate | ✅ PASS |
| 3 | 参数校验 | 边界场景 | testValidation | ✅ PASS |
| 4 | 跨服务链路 | 集成链路 | testCrossService | ✅ PASS |

## 3. 测试结果汇总
| 指标 | 值 |
|------|-----|
| 总测试数 | X |
| 通过 | X |
| 失败 | X |
| 跳过 | X |
| 通过率 | X% |
| 执行时间 | Xs |

## 4. 失败分析（如有）
| # | 测试方法 | 失败原因 | 错误信息 | 严重程度 |
|---|---------|---------|---------|---------|

## 5. 未覆盖风险
| 风险项 | 说明 | 建议 |
|--------|------|------|

## 6. 结论
- E2E 测试结果：通过 / 不通过
- 可否进入 Integration Test：是 / 否
```

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 e2e-test-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 所有核心业务场景都已覆盖 | ⬜ 待确认 |
| 2 | 测试脚本可执行（非 curl 命令列表） | ⬜ 待确认 |
| 3 | 测试数据准备和清理方案完整 | ⬜ 待确认 |
| 4 | 正向流程 + 异常路径 + 边界场景均通过 | ⬜ 待确认 |
| 5 | 测试通过率 ≥ 100%（E2E 测试不允许失败） | ⬜ 待确认 |

**🔴 生成阶段交付物（v3.1 新增）**

> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**交付物路径**：`.dev-flow/deliverables/09-e2e-test-report.md`

**交付物内容**：
```markdown
<!-- @generated-by: e2e-test-expert subagent | session: {session-id} | stage: e2e-test -->

# E2E 测试报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: e2e-tested -->

## 1. 测试概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 测试时间 | YYYY-MM-DD HH:mm |
| 测试工具 | Playwright / Selenium / Cypress |
| 测试环境 | {环境描述} |

## 2. 测试场景覆盖
| # | 测试场景 | 涉及接口/页面 | 预期结果 | 实际结果 | 状态 |
|---|----------|-------------|----------|----------|------|

## 3. 测试结果汇总
| 维度 | 结果 |
|------|------|
| 场景总数 | X |
| 通过 | X |
| 失败 | X |
| 通过率 | X% |

## 4. 失败场景分析（如有）
| # | 失败场景 | 失败步骤 | 根因 | 修复状态 |
|---|----------|----------|------|----------|

## 5. 测试脚本
- 脚本位置：`src/test/e2e/`
- 执行命令：...
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: e2e-test-expert subagent` 溯源注释
- 所有核心用户场景已覆盖
- 失败场景已记录

**暂停，等待用户确认。如有失败，进入 Fix 阶段修复后重新执行。**
**用户确认后，系统自动写入 `e2e-test.confirmed` 确认文件。**
