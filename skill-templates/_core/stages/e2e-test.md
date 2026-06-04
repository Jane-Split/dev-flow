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

### 目的
验证从 API 调用 → 业务逻辑处理 → 数据持久化 → 响应返回的完整链路正确性。E2E Test 不同于 Smoke Test（快速冒烟）和 Integration Test（模块联调），它模拟真实用户操作场景，覆盖跨层、跨服务的完整业务流程。

### 执行步骤

**Step 1: 识别端到端测试场景**
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
| 1 | 所有核心业务场景都已覆盖 | ⬜ 待确认 |
| 2 | 测试脚本可执行（非 curl 命令列表） | ⬜ 待确认 |
| 3 | 测试数据准备和清理方案完整 | ⬜ 待确认 |
| 4 | 正向流程 + 异常路径 + 边界场景均通过 | ⬜ 待确认 |
| 5 | 测试通过率 ≥ 100%（E2E 测试不允许失败） | ⬜ 待确认 |

**暂停，等待用户确认。如有失败，进入 Fix 阶段修复后重新执行。**
