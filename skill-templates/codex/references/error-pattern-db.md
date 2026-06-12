# 错误模式库 (Error Pattern Database)

> 本文档包含所有已识别的错误模式定义（P001-P009）、对应的预防策略（S001-S009）以及自动应用规则。
> 由 `error-pattern-learner` Agent 在 Step 5 模式提取完成后、Step 6 自动应用时读取。

---

## 一、错误模式定义 (Error Patterns)

```yaml
# error-pattern-db.yaml
error_patterns:
  - pattern_id: "P001"
    name: "Entity 字段 getter 方法名不匹配"
    category: "compile_errors.symbol_not_found"
    severity: high
    prevention_priority: high
    
  - pattern_id: "P002"
    name: "DTO 校验注解缺失"
    category: "contract_violations.implementation_incomplete"
    severity: medium
    prevention_priority: medium
    
  - pattern_id: "P003"
    name: "Mapper 方法返回类型错误"
    category: "compile_errors.type_mismatch"
    severity: high
    prevention_priority: high
    
  - pattern_id: "P004"
    name: "Service 方法参数顺序错误"
    category: "contract_violations.signature_mismatch"
    severity: high
    prevention_priority: high
    
  - pattern_id: "P005"
    name: "Import 路径错误"
    category: "compile_errors.import_error"
    severity: medium
    prevention_priority: high  # 🔴 提升优先级（从 medium 改为 high）
    
    # 🔴 新增：自动修复策略
    auto_fix:
      enabled: true
      trigger: "编译错误：找不到符号: 类 Xxx"
      steps:
        - step: 1
          action: "extract_class_name"
          description: "从错误信息中提取类名"
        - step: 2
          action: "grep_search"
          command: "Grep 'class {ClassName}' --glob='**/*.java'"
          description: "搜索类定义的实际位置"
        - step: 3
          action: "analyze_results"
          description: "分析搜索结果，确定正确包路径"
        - step: 4
          action: "auto_fix_import"
          description: "自动修正 import 语句"
        - step: 5
          action: "record_to_verification_table"
          description: "记录到 import-verification-table.md"
      
    # 🔴 新增：预防策略
    prevention:
      strategy_id: "S005"
      name: "Import 路径强制验证"
      target_agent: "backend-develop-expert"
      location: "Step 2.5.2"
      rule: "禁止根据类名猜测包路径，必须通过 Grep 搜索确认"
    
  - pattern_id: "P006"
    name: "空指针风险 - 未检查 null"
    category: "logic_errors.null_pointer_risk"
    severity: high
    prevention_priority: high
    
  - pattern_id: "P007"
    name: "事务注解缺失"
    category: "contract_violations.implementation_incomplete"
    severity: medium
    prevention_priority: medium
    
  - pattern_id: "P009"
    name: "日志占位替代业务逻辑"
    category: "logic_errors.placeholder_instead_of_logic"
    severity: critical
    prevention_priority: high
    
    description: |
      AI 用 log.info()/log.warn() 等日志调用替代实际业务逻辑（如 SAP 推送、消息发送等），
      导致代码能编译通过、测试可能通过，但实际功能完全缺失。
    
    examples:
      - invalid: |
          public void pushToSap(OrderDTO order) {
              log.info("推送订单到SAP: {}", order);
          }
        reason: "仅包含日志，无实际 SAP 推送调用"
      - valid: |
          public void pushToSap(OrderDTO order) {
              log.info("推送订单到SAP: {}", order);
              SapResponse response = sapFeignClient.pushOrder(order);
              if (!response.isSuccess()) {
                  throw new BusinessException("SAP推送失败");
              }
          }
        reason: "包含日志和实际业务调用"
    
    detection:
      - pattern: "方法体仅包含 log.info/log.warn/log.debug 调用"
      - pattern: "设计文档中的 call action 在代码中无对应的外部调用"
      - pattern: "方法注释描述业务操作，但实现只有日志"
    
    auto_fix:
      enabled: true
      trigger: "检测到方法体仅包含日志调用"
      steps:
        - step: 1
          action: "read_design_document"
          description: "读取设计文档，查找该方法的 logic 定义"
        - step: 2
          action: "extract_call_action"
          description: "提取 call 类型的 action，获取 target 和 method"
        - step: 3
          action: "search_target_class"
          description: "Grep 搜索 target 类的实际位置"
        - step: 4
          action: "generate_actual_call"
          description: "生成实际的业务调用代码，替换日志占位"
        - step: 5
          action: "verify_implementation"
          description: "验证实现包含实质性业务操作"
    
    prevention:
      strategy_id: "S009"
      name: "禁止日志占位替代业务逻辑"
      target_agent: "backend-develop-expert"
      location: "禁止事项表格"
      rule: "禁止用 log.info()/log.warn() 替代业务逻辑，必须实现完整的业务调用"
    
  - pattern_id: "P008"
    name: "日志记录缺失"
    category: "contract_violations.implementation_incomplete"
    severity: low
    prevention_priority: low
```

---

## 二、预防策略定义 (Prevention Strategies)

### S001 - Entity 方法名强制验证（针对 P001）

```yaml
prevention_strategy:
  strategy_id: "S001"
  name: "Entity 方法名强制验证"
  target_pattern: "P001"
  target_agent: "backend-develop-expert"

  strategy_type: "process_enhancement"

  implementation:
    location: "Step 2.5.3 方法签名验证"
    enhancement: |
      添加专门的 Entity 方法验证子步骤：
      
      #### Step 2.5.3.1: Entity Getter 方法验证
      
      对于每个 Entity 字段访问：
      1. 读取 Entity 实际定义
      2. 提取所有 getter 方法列表
      3. 验证调用的 getter 存在于列表中
      4. 如果不存在，搜索相似方法名（模糊匹配）
      5. 提示正确的 getter 方法名
      
      **输出验证表**：
      ```markdown
      | Entity | 字段 | 猜测方法 | 实际方法 | 状态 |
      |--------|------|---------|---------|------|
      | User | status | getStatus() | getUserStatus() | ❌ 需修正 |
      ```
  
  validation:
    - check: "所有 Entity 方法调用都经过验证"
    - check: "无猜测方法名的情况"
    
  effectiveness_metrics:
    - metric: "P001 发生率"
      target: "降低 90%"
    - metric: "编译错误总数"
      target: "降低 50%"
```

### S003 - Mapper 方法签名一致性检查（针对 P003）

```yaml
prevention_strategy:
  strategy_id: "S003"
  name: "Mapper 方法签名一致性检查"
  target_pattern: "P003"
  target_agent: "backend-develop-expert"

  strategy_type: "checklist"

  implementation:
    location: "Step 3 代码实现前"
    checklist: |
      ### Mapper 方法实现检查清单
      
      - [ ] 已读取 Mapper 接口定义
      - [ ] 方法名与 Mapper 接口完全一致
      - [ ] 参数类型与 Mapper 接口一致
      - [ ] 返回类型与 Mapper 接口一致
      - [ ] SQL 注解与数据库字段匹配
      - [ ] 已验证 resultType 指向正确的 Entity
```

### S005 - Import 路径强制验证（针对 P005）

```yaml
prevention_strategy:
  strategy_id: "S005"
  name: "Import 路径强制验证"
  target_pattern: "P005"
  target_agent: "backend-develop-expert"

  strategy_type: "process_enhancement"

  implementation:
    location: "Step 2.5.2 Import 路径验证"
    enhancement: |
      #### 🔴 Import 路径验证（错误模式 P005 预防）
      
      > **历史错误**：曾发生多次因猜测 import 路径导致的编译错误
      > **典型场景**：
      > - 类名含 ReworkSop → 猜测路径 entity.rework → 实际 entity.entity
      > - 类名含 Exception → 猜测路径 common.exception → 实际 common.i18n
      
      **禁止行为**：
      - ❌ 根据类名中的关键词猜测子包（如 ReworkSop → rework 子包）
      - ❌ 根据类名语义猜测包名（如 Exception → exception 包）
      - ❌ 根据命名习惯猜测路径（如 XxxService → service.xxx 子包）
      
      **强制步骤**：
      1. 提取需要 import 的类名
      2. 执行 Grep 搜索：`Grep "class {ClassName}" --glob="**/*.java"`
      3. 读取搜索结果中的文件，提取完整包路径
      4. 记录猜测路径 vs 实际路径到 import-verification-table.md
      5. 使用实际路径生成 import 语句
      
      **验证输出**：
      ```markdown
      | 类名 | 猜测路径 | 实际路径 | Grep 结果 | 状态 |
      |------|---------|---------|----------|------|
      | ReworkSopRegister | entity.rework | entity.entity | 找到 1 个 | ✅ 已修正 |
      ```
      
      **常见错误模式对照表**：
      | 类名特征 | 错误猜测 | 实际路径示例 | 验证结果 |
      |---------|---------|-------------|---------|
      | ReworkSopXxx | entity.rework.Xxx | entity.entity.Xxx | 必须通过 Grep 确认 |
      | XxxException | common.exception.Xxx | common.i18n.Xxx | 必须通过 Grep 确认 |
      | XxxService | service.xxx.XxxService | service.XxxService | 必须通过 Grep 确认 |
  
  validation:
    - check: "import-verification-table.md 已生成"
    - check: "所有 import 都通过 Grep 搜索确认"
    - check: "无根据类名猜测的路径"
    
  effectiveness_metrics:
    - metric: "P005 发生率"
      target: "降低 95%"
    - metric: "Import 猜测错误"
      target: "0 次"
```

---

## 三、自动更新规则 (Auto-Update Rules)

### 按模式配置的自动更新规则

```yaml
auto_update_rules:
  - pattern_id: "P001"
    name: "Entity getter 方法名不匹配"
    
    auto_update_conditions:
      occurrences: ">= 2"
      
    target_files:
      - file: "backend-develop-expert.md"
        location: "Step 2.5.1"
        action: "append_warning"
        content_template: |
          #### 🔴 历史错误提醒（自动添加）
          
          > **模式 P001**: Entity getter 方法名猜测错误
          > **发生次数**: {occurrences}
          > **影响项目**: {affected_projects}
          
          **常见错误**：
          - 猜测 `getStatus()`，实际为 `getInspectionBatchStatus()`
          
          **预防措施**：
          1. 必须读取 Entity 实际定义
          2. 不要根据字段名猜测 getter 方法名
          3. 使用 Grep 确认方法存在
      
      - file: "conventions.md"
        location: "auto_learned_naming"
        action: "append_entry"
        content_template: |
          | {entity_name} | {field_name} | {expected_getter} | {actual_getter} | {timestamp} |
```

---

## 四、知识库更新

### 错误模式数据库更新格式

```yaml
# error-pattern-db.yaml (更新后)
database_info:
  version: "1.0.3"
  last_updated: "2026-05-29"
  total_patterns: 8
  
error_patterns:
  - pattern_id: "P001"
    name: "Entity 字段 getter 方法名不匹配"
    # ... 原有内容 ...
    prevention_strategies_applied: ["S001"]
    auto_applied: true           # 🔴 新增：自动应用标记
    auto_apply_date: "2026-05-29" # 🔴 新增：自动应用时间
    effectiveness:
      before: 5
      after: 0
      monitoring_period: "7d"    # 🔴 新增：监控周期
      
  # 新增模式
  - pattern_id: "P009"
    name: "新增模式示例"
    category: "compile_errors"
    discovered_from:
      - error_id: "E010"
      - error_id: "E011"
    # ...
```
