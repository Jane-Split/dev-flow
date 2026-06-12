---
stage: Delivery
type: stage-instruction
---

## 阶段九：Delivery Report（交付报告）

### 🔔 入口 Banner（本阶段开始时输出）

```
▶ Delivery Report（交付报告）
════════════════════════════════════
目标：汇总全流程成果，生成交付报告
输出：delivery-report.md
模式：L0 / L1 / L2 / L3
预计：2-5 分钟
════════════════════════════════════
```

### 触发条件
- Test 阶段通过后
- 用户输入 `/dev-flow -delivery`

### 🔴🔴 主 Agent 零编辑约束（本阶段入口铁律）

> **⚠️ 最高优先级**：主 Agent 在本阶段的唯一角色是**调度器**。
> **主 Agent 绝对禁止直接使用 Edit/Write 工具编辑本阶段的任何产出文件。**
> **所有文件编辑必须由 delivery-expert subagent 执行。**
> **完整零编辑铁律、失败硬阻断规则、交付物协议见 `references/protocol.md`。**

### 目的
汇总全流程成果，生成最终交付清单，记录已知问题和后续优化建议。

### 执行步骤

**Step 1: 汇总各阶段文档**
- 读取 `.dev-flow/deliverables/` 下所有交付物文档
- 提取关键信息：需求概述、设计要点、开发清单、测试结果

**Step 2: 生成交付清单**
- 列出所有新增/修改的文件
- 列出所有新增的 API 接口
- 列出所有新增的数据库表

**Step 3: 记录已知问题**
- 从各阶段的问题记录中汇总
- 标注优先级和计划修复时间

**Step 4: 输出交付报告**

```markdown
# 交付报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: delivered | pending_review -->

## 1. 需求概述
| 项目 | 内容 |
|------|------|
| 需求标题 | {标题} |
| 需求类型 | 新功能 / 功能增强 / Bug 修复 |
| 优先级 | P0/P1/P2/P3 |
| 开发周期 | YYYY-MM-DD ~ YYYY-MM-DD |

## 2. 功能清单
| # | 功能点 | 完成状态 | 备注 |
|---|--------|----------|------|
| 1 | 不合格品登记 | ✅ 已完成 | |
| 2 | 审批流程集成 | ✅ 已完成 | 调用 workflow-service |
| 3 | 处置跟踪 | ✅ 已完成 | |

## 3. 交付清单

### 3.1 文件变更
| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | entity/NonConformingProduct.java | 不合格品实体 |
| 新增 | service/NonConformingProductService.java | 服务接口 |
| ... | ... | ... |

### 3.2 API 接口
| 方法 | 端点 | 说明 |
|------|------|------|
| POST | /api/non-conforming-products | 创建不合格品 |
| GET | /api/non-conforming-products/{id} | 查询不合格品 |

### 3.3 数据库变更
| 表名 | 操作 | 说明 |
|------|------|------|
| qms_non_conforming_product | 新增 | 不合格品表 |

## 4. 测试结果汇总
| 阶段 | 结果 | 通过率 |
|------|------|--------|
| 单元测试 | ✅ 通过 | 100% |
| 冒烟测试 | ✅ 通过 | - |
| E2E 测试 | ✅ 通过 | 100% |
| 集成测试 | ✅ 通过 | 100% |

## 5. 已知问题
| # | 问题描述 | 优先级 | 计划修复时间 |
|---|----------|--------|--------------|
| 1 | 批量导入性能待优化 | P2 | 下个迭代 |

## 6. 后续优化建议
- 建议增加缓存提升查询性能
- 建议增加操作日志审计功能

## 7. 相关文档
- [需求分析](./{需求简称}-需求分析.md)
- [详细设计](./{需求简称}-详细设计.md)
- [任务拆分](./{需求简称}-任务拆分.md)
- [开发报告](./{需求简称}-开发报告.md)
- [统一测试报告](./{需求简称}-测试报告.md)

## 8. 签收确认
- [ ] 开发人员确认
- [ ] 测试人员确认
- [ ] 产品人员确认

**Step 4.5: 部署就绪检查（🔴 企业部署前必须执行）**

> **目的**：在生成交付报告后、正式部署前，执行标准化的部署就绪验证，
> 确保目标环境已具备接收代码变更的条件。
> **⚠️ 本步骤生成独立的部署检查清单文件，供运维/DevOps 团队逐项核验。

**写入路径**：`.dev-flow/deliverables/{需求简称}/10-deployment-checklist.yaml`

**检查清单格式模板**：

```yaml
# deployment-checklist.yaml — 部署就绪检查清单
# 路径: .dev-flow/deliverables/{需求简称}/10-deployment-checklist.yaml
# 生成者: delivery-expert subagent
# 使用者: 运维/DevOps 团队（部署前逐项核验）

meta:
  version: "1.0"
  generated_by: "delivery-expert"
  demand_name: "{需求简称}"
  target_env: "{环境名称: dev/test/staging/prod}"
  timestamp: "YYYY-MM-DDTHH:mm:ss"

# === A. 环境基础检查 ===
environment:
  - id: "ENV-01"
    item: "目标服务器可达性"
    check: "ping/SSH 连接测试"
    expected: "所有目标节点响应时间 < 500ms"
    status: "pending"  # pending / passed / failed / skipped
    evidence: ""

  - id: "ENV-02"
    item: "运行时依赖版本一致性"
    check: "对比目标环境 JDK/Node/Python 版本与项目要求"
    expected: "版本号完全匹配（含小版本）"
    status: "pending"
    evidence: ""

  - id: "ENV-03"
    item: "磁盘空间充足"
    check: "df -h 或 equivalent"
    expected: "可用空间 > 项目部署包大小的 3 倍"
    status: "pending"
    evidence: ""

  - id: "ENV-04"
    item: "内存资源充足"
    check: "free -m 或 equivalent"
    expected: "空闲内存 > 应用最大堆内存的 1.5 倍"
    status: "pending"
    evidence: ""

# === B. 配置检查 ===
configuration:
  - id: "CFG-01"
    item: "应用配置文件存在且格式正确"
    check: "验证 application-{env}.yml / .env.{env} 存在且 YAML/JSON 合法"
    expected: "配置文件可被应用正常加载"
    status: "pending"
    evidence: ""

  - id: "CFG-02"
    item: "敏感配置已注入（非硬编码）"
    check: "扫描配置文件中的密码/密钥/API Key 字段"
    expected: "敏感值引用环境变量或密钥管理服务，无明文硬编码"
    status: "pending"
    evidence: ""

  - id: "CFG-03"
    item: "数据库连接配置正确"
    check: "验证 DB URL/用户名/端口与目标环境匹配"
    expected: "连接串指向目标环境的数据库实例"
    status: "pending"
    evidence: ""

  - id: "CFG-04"
    item: "中间件连接配置正确"
    check: "验证 Redis/RabbitMQ/Elasticsearch/Nacos 等中间件地址"
    expected: "所有中间件地址指向目标环境实例"
    status: "pending"
    evidence: ""

# === C. 数据库变更检查（如有 DDL/DML）===
database:
  - id: "DB-01"
    item: "DDL 变更脚本已准备"
    check: "确认 design-contract.yaml 中 db_changes 的 DDL 已生成独立脚本"
    expected: "每个 DDL 变更有对应的 .sql 迁移脚本（含回滚 SQL）"
    status: "pending"
    evidence: ""
    condition: "仅当 design-contract.db_changes 非空时"

  - id: "DB-02"
    item: "数据备份已完成"
    check: "执行目标库的全量备份或快照"
    expected: "备份文件已创建且大小合理，可用于回滚"
    status: "pending"
    evidence: ""
    condition: "涉及 DDL 变更时必须"

  - id: "DB-03"
    item: "数据迁移脚本已在测试环境通过"
    check: "确认 migration script 在 test/staging 环境执行成功"
    expected: "迁移脚本执行无报错，数据行数符合预期"
    status: "pending"
    evidence: ""
    condition: "涉及 DML 变更时"

# === D. 服务依赖检查 ===
dependencies:
  - id: "DEP-01"
    item: "上游服务可用性"
    check: "HTTP GET /actuator/health 或等效健康检查端点"
    expected: "所有依赖的上游服务返回 UP 状态"
    status: "pending"
    evidence: ""

  - id: "DEP-02"
    item: "消息队列/缓存等基础设施就绪"
    check: "ping Redis / 检查 RabbitMQ Management / ES cluster health"
    expected: "所有基础设施组件状态正常"
    status: "pending"
    evidence: ""

# === E. 回滚方案检查 ===
rollback:
  - id: "RB-01"
    item: "回滚方案已文档化"
    check: "确认回滚步骤已写入回滚脚本或运维手册"
    expected: "包含：回滚命令、预期结果、回滚验证方法、回滚超时时间"
    status: "pending"
    evidence: ""

  - id: "RB-02"
    item: "回滚所需的前一版本 artifact 可用"
    check: "确认上一版本的 JAR/WAR/Docker Image/NPM 包在制品仓库中可获取"
    expected: "前一版本 artifact 存在且 checksum 一致"
    status: "pending"
    evidence: ""

  - id: "RB-03"
    item: "回滚操作已演练（生产环境建议）"
    check: "确认回滚操作在 staging 环境已成功执行过"
    expected: "回滚演练记录存在，RTO < 定义阈值（如 5 分钟）"
    status: "pending"
    evidence: ""
    condition: "生产环境部署时强烈建议"

# === F. 安全检查 ===
security:
  - id: "SEC-01"
    item: "无新增的安全漏洞依赖"
    check: "对比本次新增的 Maven/npm 依赖与已知漏洞数据库"
    expected: "无 Critical/High 级别的已知 CVE（或有官方 mitigation）"
    status: "pending"
    evidence: ""

  - id: "SEC-02"
    item: "日志脱敏规则生效"
    check: "确认日志配置中敏感字段（手机号/身份证/密码）已配置脱敏"
    expected: "日志输出不含明文敏感信息"
    status: "pending"
    evidence: ""

# === 汇总 ===
summary:
  total_checks: 0  # 自动统计上述所有项
  passed: 0
  failed: 0
  skipped: 0
  blocking_issues: []  # failed 项的 id 列表
  verdict: ""  # ready_to_deploy / conditional / not_ready
  verdict_reason: ""
  signed_by: ""  # 运维人员签认
  signed_at: ""
```

**检查项执行规则**：
- 所有 `status != "skipped"` 的项必须逐一核验
- 任何 `blocking_issues` 非空时 `verdict` 不得为 `ready_to_deploy`
- 带 `condition` 条件的检查项在不满足条件时自动标记为 `skipped`
- 生产环境（prod）建议 **全部检查项都必须 passed**
- 开发/测试环境允许 `conditional`（附原因后可继续）

**Step 5: 🔴 生成阶段交付物（v3.1 新增）**

> **目的**：生成独立的阶段交付物文档，供主 Agent 打开给用户审阅。

**交付物路径**：`.dev-flow/deliverables/{需求简称}/11-delivery-report.md`

**交付物内容**：（与 Step 4 交付物内容一致，增加溯源注释头）

```markdown
<!-- @generated-by: delivery-expert subagent | session: {session-id} | stage: delivery -->

# 交付报告：{需求标题}

<!-- last-updated: YYYY-MM-DD HH:mm -->
<!-- status: delivered -->

## 1. 需求概述
...

## 2. 功能完成清单
| # | 功能点 | REQ-ID | 完成状态 |
|---|--------|--------|----------|

## 3. 交付清单
### 文件变更 | API 接口 | 数据库变更

## 4. 全流程测试结果
| 阶段 | 结果 | 通过率 | 交付物 |
|------|------|--------|--------|
| 统一测试 | ✅ 通过 | X% | 06-test-report.md |

## 5. 已知问题与后续优化

## 6. 签收确认
- [ ] 开发确认
- [ ] 测试确认
- [ ] 产品确认
```

**自检**：
- 交付物文件已生成且内容非空
- 包含 `@generated-by: delivery-expert subagent` 溯源注释
- 全流程测试结果已汇总
- 所有交付物引用正确

**暂停，向用户展示交付报告，等待最终确认。**

---

### ✅ 阶段确认清单

| # | 确认项 | 状态 |
|---|--------|------|
| 0 | **执行者审计**：本阶段由 delivery-expert subagent 执行，主 Agent 未直接编辑任何文件 | ⬜ 待确认 |
| 1 | 所有功能点完成状态与需求一致 | ⬜ 待确认 |
| 2 | 文件变更清单完整无遗漏 | ⬜ 待确认 |
| 3 | API 接口清单与设计一致 | ⬜ 待确认 |
| 4 | 所有测试结果汇总正确（统一 Test 阶段报告完整） | ⬜ 待确认 |
| 5 | 已知问题已记录且优先级合理 | ⬜ 待确认 |
| 6 | 相关文档链接完整可访问 | ⬜ 待确认 |
| 7 | **部署就绪检查清单已生成**（Step 4.5，含环境/配置/DB/依赖/回滚/安全 6 类检查） | ⬜ 待确认 |
| 8 | 生产部署时所有 blocking_checks 通过（开发/测试环境可 conditional） | ⬜ 待确认 |

**用户操作**：确认交付 → 签收完成；需要补充 → 指出遗漏项

> **阶段确认机制和交付物协议详见 `references/protocol.md`。**

---
