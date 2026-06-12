---
type: reference
name: runtime-protocol
description: 运行时验证协议 - 服务编排、健康检查、DB 验证、UI 验证、追溯矩阵回写
---

# 运行时验证协议（Runtime Protocol）


> **v3.7.0 项目类型适配**：
> - `frontend`：启动 `npm run dev`，健康检查 HTTP GET /
> - `backend (Go)`：启动 `go run ./cmd/...`，健康检查 HTTP GET /health
> - `backend (Python)`：启动 `uvicorn main:app` 或 `flask run`，健康检查 HTTP GET /health
> - `java-microservice`：启动 `mvn spring-boot:run`，健康检查 HTTP GET /actuator/health
> - `fullstack`/`java-fullstack`：分别启动前端和后端，分别健康检查
> **本文件定义运行时验证闭环的共享协议**，包括服务编排、健康检查、DB 数据核对、UI 层验证和追溯矩阵回写。
> 由 Test 阶段、service-orchestrator、db-verifier、e2e-ui-tester 共同引用。

---

## 一、运行时契约格式（runtime-contract.yaml）

> **生成时机**：Analyze 阶段 Step 4.4 自动从 prd-contract.yaml 的 runtime 章节派生。
> **写入路径**：`.dev-flow/contracts/{需求简称}/runtime-contract.yaml`

### 完整格式

```yaml
# runtime-contract.yaml — 运行时环境契约
meta:
  prd_contract: ".dev-flow/contracts/{需求简称}/prd-contract.yaml"
  generated_at: "{ISO 8601}"
  generated_by: "analyze-expert subagent"

infrastructure:
  - name: "{name}"
    type: "database" | "cache" | "registry" | "mq"
    required: true | false
    connection:
      host: "{host}"
      port: N
      database: "{db}"          # type: database
      username: "{user}"
      password: "{pass}"
    health_check:
      method: "sql" | "command" | "http"
      query: "SELECT 1"         # method: sql
      command: "PING"           # method: command
      url: "http://..."         # method: http
      expected_status: 200      # method: http
    init_scripts:
      - path: "{sql_path}"
        description: "{desc}"

services:
  - name: "{name}"
    type: "java-springboot" | "node-express" | "python-flask"
    role: "gateway" | "business" | "auth" | "common"
    working_dir: "{dir}"
    build_command: "{cmd}"
    start_command: "{cmd}"
    stop_command: "{cmd}"
    health_check:
      url: "http://localhost:{port}/actuator/health"
      method: "GET"
      expected_status: 200
      expected_body_contains: "UP"
      timeout_seconds: 120
      retry_interval_seconds: 5
      max_retries: 24
    dependencies: ["{dep_name}"]
    env:
      KEY: "VALUE"
    process_id_file: ".dev-flow/runtime/pids/{name}.pid"

frontend:
  - name: "{name}"
    type: "vue" | "react" | "angular"
    working_dir: "{dir}"
    install_command: "{cmd}"
    start_command: "{cmd}"
    stop_command: "{cmd}"
    health_check:
      url: "http://localhost:{port}"
      method: "GET"
      expected_status: 200
      timeout_seconds: 60
      retry_interval_seconds: 3
      max_retries: 20
    dependencies: ["{dep_name}"]
    env:
      KEY: "VALUE"
    process_id_file: ".dev-flow/runtime/pids/{name}.pid"

startup_sequence:
  phase_1_infrastructure:
    parallel: true
    items: ["{name}"]
    wait_strategy: "all_healthy"
  phase_2_backend:
    parallel: false
    items: ["{name}"]
    wait_strategy: "all_healthy"
  phase_3_frontend:
    parallel: true
    items: ["{name}"]
    wait_strategy: "all_healthy"

cleanup:
  on_success: "stop_all" | "keep_running" | "stop_frontend_only"
  on_failure: "keep_running"
  test_data_cleanup: "transaction_rollback" | "delete_after" | "none"
```

---

## 二、测试用例契约格式（test-case-contract.yaml）

> **生成时机**：Analyze 阶段 Step 4.3 自动从 prd-contract.yaml 派生。
> **写入路径**：`.dev-flow/contracts/{需求简称}/test-case-contract.yaml`

### 核心结构

```yaml
meta:
  prd_contract: ".dev-flow/contracts/{需求简称}/prd-contract.yaml"
  generated_at: "{ISO 8601}"
  generated_by: "analyze-expert subagent"
  total_suites: N
  total_cases: N

config:
  api:
    base_url: "http://localhost:{port}"
    auth_type: "cookie" | "token" | "basic" | "none"
    login_endpoint: "/api/auth/login"
    login_credentials:
      username: "admin"
      password: "admin123"
  ui:
    base_url: "http://localhost:{port}"
    browser: "chromium" | "firefox" | "webkit"
    viewport: {width: 1280, height: 720}
    screenshot_on_step: true
    screenshot_dir: ".dev-flow/evidence/{需求简称}/screenshots"
  db:
    type: "mysql" | "postgresql" | "h2"
    host: "localhost"
    port: 3306
    database: "{db_name}"
    username: "test"
    password: "test"
    cleanup_strategy: "transaction_rollback" | "delete_after" | "none"

test_suites:
  - suite_id: "TS-{NNN}"
    req_id: "REQ-{NNN}"
    title: "{title}"
    cases:
      - case_id: "TC-{NNN}-{MM}"
        acceptance_id: "AC-{NNN}-{MM}"
        title: "{title}"
        type: "api" | "ui" | "db" | "integration"
        priority: "P0" | "P1" | "P2"
        preconditions: ["{cond}"]
        steps:
          - step: N
            action: "POST /api/xxx"
            input: {key: value}
            expected:
              http_status: 200
              response: {key: value}
            db_assert:
              table: "{table}"
              conditions: ["{cond}"]
              expected_rows: N
              expected_values: {key: value}
        ui_steps:
          - step: N
            action: "navigate" | "click" | "fill" | "select" | "wait_for" | "assert_visible" | "assert_table_contains" | "db_verify"
            target: "{selector}"
            value: "{value}"
            expected_text: "{text}"
            timeout_ms: N
            description: "{desc}"
        postconditions: ["{cond}"]

traceability:
  - req_id: "REQ-{NNN}"
    acceptance_ids: ["AC-{NNN}-{MM}"]
    case_ids: ["TC-{NNN}-{MM}"]
    coverage:
      acceptance_to_case: "N%"
      api_channel: "N%"
      ui_channel: "N%"
      db_assertion: "N%"
```

---

## 三、验证证据目录结构

```
.dev-flow/evidence/{需求简称}/
├── ui-test-report.yaml              # UI 测试报告
├── db-assertions-report.yaml        # DB 断言报告
├── verification-trace-report.yaml   # 验证追溯报告
└── screenshots/                     # UI 测试截图
    ├── {case_id}-step{N}-{action}.png
    └── ...
```

---

## 四、追溯矩阵回写协议

> **核心原则**：测试完成后，自动将结果回写到 prd-contract.yaml 的 traceability 章节，实现 PRD 状态自动流转。

### PRD 状态流转

```
analyzed → designed → developed → tested → verified
                                           ↘ tested_with_failures
```

| 状态 | 含义 | 触发条件 |
|------|------|---------|
| analyzed | 需求分析完成 | Analyze 阶段确认 |
| designed | 设计完成 | Design 阶段确认 |
| developed | 开发完成 | Develop 阶段确认 |
| tested | 测试执行完成（含 API + DB） | Test Step 4 完成 |
| verified | 全部验证通过（API + UI + DB） | Test Step 7 确认所有通道 PASS |
| tested_with_failures | 部分验证失败 | Test Step 7 存在 FAIL |

### 回写流程

```
Step 7.1: 汇总所有测试结果
  ├── 单元测试结果（Step 2）
  ├── 冒烟测试结果（Step 3）
  ├── API + DB E2E 测试结果（Step 4）
  ├── UI E2E 测试结果（Step 5）
  └── 集成测试结果（Step 6）

Step 7.2: 更新 prd-contract.yaml 的 traceability 章节
  ├── 对每个 REQ-XXX：
  │     ├── 收集关联的所有 TC 结果
  │     ├── 计算覆盖率
  │     └── 更新 status 和 verification 详情
  └── 写入 verification 详情

Step 7.3: 生成验证追溯报告
  └── 写入 .dev-flow/evidence/{需求简称}/verification-trace-report.yaml
```

### 验证追溯报告格式

```yaml
# verification-trace-report.yaml
report_id: "vtr-{YYYYMMDD}-{NNN}"
generated_at: "{ISO 8601}"

trace_matrix:
  - req_id: "REQ-{NNN}"
    title: "{title}"
    status: "verified" | "tested_with_failures"
    acceptance_coverage:
      total: N
      passed: N
      failed: N
      coverage: "N%"
    api_test_results:
      - case_id: "TC-{NNN}-{MM}"
        title: "{title}"
        result: "PASS" | "FAIL"
        verified_at: "{ISO 8601}"
    ui_test_results:
      - case_id: "TC-{NNN}-{MM}"
        title: "{title}"
        result: "PASS" | "FAIL"
        screenshots: N
        verified_at: "{ISO 8601}"
    db_assertion_results:
      - case_id: "TC-{NNN}-{MM}"
        step: N
        result: "PASS" | "FAIL"
        verified_at: "{ISO 8601}"

overall_summary:
  total_reqs: N
  verified: N
  tested_with_failures: N
  verification_rate: "N%"
  test_coverage:
    acceptance_coverage: "N%"
    api_test_coverage: "N%"
    ui_test_coverage: "N%"
    db_assertion_coverage: "N%"
  evidence:
    api_test_report: ".dev-flow/deliverables/{需求简称}/06-test-report.md"
    ui_test_report: ".dev-flow/evidence/{需求简称}/ui-test-report.yaml"
    db_assertion_report: ".dev-flow/evidence/{需求简称}/db-assertions-report.yaml"
    screenshots_dir: ".dev-flow/evidence/{需求简称}/screenshots/"
```

---

## 五、降级策略

| 场景 | 降级行为 | 影响 |
|------|---------|------|
| agent-browser 不可用 | 仅生成 Playwright 脚本，不执行 UI 验证 | UI 通道标记为 "script_generated" |
| runtime-contract.yaml 不存在 | 跳过服务编排，假设服务已手动启动 | 服务启动步骤跳过 |
| test-case-contract.yaml 不存在 | 按现有逻辑生成测试（无 DB 断言和 UI 步骤） | 回退到 v3.4.0 行为 |
| 数据库不可连接 | 跳过 DB 断言，仅执行 API 响应验证 | DB 断言标记为 "skipped" |
| 前端项目不存在 | 跳过 UI 验证和前端启动 | UI 通道标记为 "not_applicable" |

---

## 六、与现有协议的关系

| 现有协议 | 本协议扩展点 | 兼容性 |
|---------|-------------|--------|
| protocol.md — 阶段交付物协议 | 新增 evidence 目录和验证追溯报告 | 向后兼容，不影响现有交付物 |
| protocol.md — 确认持久化 | 新增确认项（DB/UI/追溯） | 向后兼容，现有确认项不变 |
| protocol.md — 门禁检查 | 新增契约文件存在性检查（可选） | 向后兼容，缺失时降级 |
| task-protocol.md — 任务类型 | 新增 service-orchestrate / e2e-ui-test / db-verify | 向后兼容，新类型可选 |
| design-contract.yaml | 新增 ui_selectors 章节 | 向后兼容，缺失时 UI 验证降级 |
| prd-contract.yaml | 新增 verification 详情到 traceability | 向后兼容，旧字段不变 |
