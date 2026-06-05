---
stage: Integration Test
type: stage-instruction
---

## 阶段九：Integration Test（集成测试）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Integration Test（集成测试）
════════════════════════════════════
目标：验证跨服务/跨模块集成是否正常
输出：integration-test-report.md
模式：L3
预计：5-20 分钟
════════════════════════════════════
```

### 触发条件
- Smoke Test 阶段通过后
- 用户输入 `/dev-flow -integration`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 integration-test-expert subagent 执行。**

### 目的
验证多模块/多服务联调，验证接口契约，验证数据一致性。

### 执行步骤

**Step 1: 识别集成点**
- 读取 `.dev-flow/memory/dependency-graph.md`
- 识别当前服务调用的其他服务（Feign Client）
- 识别被其他服务调用的接口（Controller）

**Step 2: 准备测试环境**
- 启动所有相关服务（或使用 Mock）
- 准备测试数据
- 配置测试数据库（使用独立数据库或 H2）

**Step 3: 执行集成测试**

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

**Step 4: 记录测试结果**

**输出文档**：`.dev-flow/docs/{需求简称}-集成测试报告.md`

**文档模板**：
```markdown
# 集成测试报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->

## 1. 测试概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 测试时间 | YYYY-MM-DD HH:mm |
| 涉及服务 | quality-management, basedata-service, workflow-service |

## 2. 集成点清单
| # | 集成类型 | 调用方 | 被调用方 | 接口 |
|---|----------|--------|----------|------|
| 1 | Feign | quality | basedata | ProductApi.getById() |
| 2 | Feign | quality | workflow | WorkflowApi.startProcess() |

## 3. 测试用例
| # | 测试场景 | 涉及服务 | 预期结果 | 实际结果 | 状态 |
|---|----------|----------|----------|----------|------|
| 1 | 创建不合格品并启动流程 | quality, workflow | 流程启动成功 | 流程启动成功 | ✅ PASS |

## 4. 接口契约验证
| Feign Client | 目标 Controller | 契约一致 | 备注 |
|-------------|-----------------|----------|------|
| ProductApi | ProductController | ✅ | 字段完全匹配 |

## 5. 问题记录
| # | 问题描述 | 涉及服务 | 严重程度 | 状态 |
|---|----------|----------|----------|------|

## 6. 结论
- 集成测试结果：通过 / 不通过
- 可否交付：是 / 否
```

**🔴 生成阶段交付物（v3.1 新增）**

> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**交付物路径**：`.dev-flow/deliverables/10-integration-test-report.md`

**交付物内容**：
```markdown
<!-- @generated-by: integration-test-expert subagent | session: {session-id} | stage: integration-test -->

# 集成测试报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: integration-tested -->

## 1. 测试概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 测试时间 | YYYY-MM-DD HH:mm |
| 测试框架 | Spring Boot Test / Testcontainers |
| 涉及服务 | {服务列表} |

## 2. 集成点测试
| # | 集成点 | 调用方 | 被调用方 | 测试结果 |
|---|--------|--------|----------|----------|
| 1 | Feign Client | 服务A | 服务B | ✅/❌ |
| 2 | 数据库 | XxxService | MySQL | ✅/❌ |
| 3 | 缓存 | XxxService | Redis | ✅/❌ |
| 4 | 消息队列 | XxxService | RocketMQ | ✅/❌ |

## 3. 测试结果汇总
| 维度 | 结果 |
|------|------|
| 集成点总数 | X |
| 通过 | X |
| 失败 | X |

## 4. 数据一致性验证
| 验证项 | 结果 | 说明 |
|--------|------|------|
| 跨服务数据一致性 | ✅/❌ | ... |
| 事务回滚验证 | ✅/❌ | ... |

## 5. 失败分析（如有）
| # | 集成点 | 失败原因 | 修复状态 |
|---|--------|----------|----------|
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: integration-test-expert subagent` 溯源注释
- 所有集成点已测试
- 数据一致性已验证

**暂停，等待用户确认。如有问题，进入 Fix 阶段。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 integration-test-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 所有跨服务接口契约已验证 | ⬜ 待确认 |
| 2 | 跨服务数据一致性测试通过 | ⬜ 待确认 |
| 3 | 接口契约文档与实际接口一致 | ⬜ 待确认 |
| 4 | 发现的问题已记录并评估严重程度 | ⬜ 待确认 |
| 5 | 可进入 Delivery 交付阶段 | ⬜ 待确认 |

---
