# Context Manager - 模型配置与上下文分配策略

> 本文档从 context-manager.md 中外置，包含模型上下文窗口配置和动态分配策略。
> 读取时机：context-manager 需要计算动态阈值时、分配上下文预算时。

## 基于模型的动态阈值

> **目的**：不固定 50KB，而是根据当前使用的模型上下文窗口动态计算

```yaml
model_adaptive_thresholds:
  # 模型上下文窗口映射表
  model_context_windows:
    - model_pattern: "claude-3-5-sonnet|claude-3-opus"
      context_window: "200KB"
      safe_minimum: "50KB"
      warning_threshold: "70%"
      critical_threshold: "85%"
    - model_pattern: "gpt-4|gpt-4-turbo"
      context_window: "128KB"
      safe_minimum: "32KB"
      warning_threshold: "70%"
      critical_threshold: "85%"
    - model_pattern: "gpt-3.5|default"
      context_window: "16KB"
      safe_minimum: "8KB"
      warning_threshold: "75%"
      critical_threshold: "90%"
    - model_pattern: "deepseek|qwen"
      context_window: "128KB"
      safe_minimum: "32KB"
      warning_threshold: "70%"
      critical_threshold: "85%"
      
  # 动态计算规则
  calculation:
    step_1: "识别当前使用的模型（从环境变量或配置获取）"
    step_2: "查找匹配的 context_window 配置"
    step_3: "计算 safe_minimum = context_window * 25%"
    step_4: "计算 warning_threshold = context_window * 70%"
    step_5: "计算 critical_threshold = context_window * 85%"
    
  # 上下文使用率可操作化计算
  context_usage_calculation:
    method: "estimated_token_count"
    formula: |
      estimated_usage = (
        system_prompt_size +           # 系统提示词大小
        design_doc_size +              # 设计文档大小
        code_read_size +               # 读取的代码大小
        code_generated_size +          # 已生成的代码大小
        conversation_history_size      # 对话历史大小
      )
      usage_rate = estimated_usage / model_context_window
    estimation_commands:
      - "统计已读取文件的总大小: find .dev-flow -name '*.md' -o -name '*.yaml' -o -name '*.java' | xargs wc -c | tail -1"
      - "统计已生成代码的大小: find src -name '*.java' -newer .dev-flow/session-start | xargs wc -c | tail -1"
```

## 动态上下文分配

```yaml
dynamic_allocation:
  simple_task:  # 简单任务（1-2 个依赖类）
    context: "40-45KB"
    examples: ["develop-entity", "develop-enum"]
    
  medium_task:  # 中等任务（3-5 个依赖类）
    context: "50-60KB"
    examples: ["develop-dto", "develop-mapper", "develop-service"]
    
  complex_task:  # 复杂任务（6+ 个依赖类）
    context: "60-70KB"
    examples: ["develop-complex-service", "develop-controller-with-logic"]
    
  enforcement:
    - 无论任务多简单，不得低于 40KB
    - 无论任务多复杂，优先拆分而非增加上下文
```

## 分层设计文档（精准裁剪）

### 三层设计文档结构

```yaml
layered_design_document:
  layer_1_essential:  # 必须加载（10-15KB）
    content:
      - 当前类的完整定义（字段、方法签名）
      - 直接依赖类的接口签名（只读）
      - 关键业务逻辑步骤（结构化决策表）
    loading: "always"
    priority: "critical"
    
  layer_2_reference:  # 按需加载（5-10KB）
    content:
      - 间接依赖类的字段列表
      - 工具类的方法签名
      - 编码规范详细说明
    loading: "on_demand"
    trigger: "需要时通过 On-Demand Loader 加载"
    
  layer_3_extended:  # 延迟加载（0-10KB）
    content:
      - 完整的依赖类实现
      - 详细的业务规则说明
      - 历史设计决策记录
    loading: "explicit_request"
    trigger: "AI 明确请求时才加载"
```

### 设计文档大小控制

```yaml
design_doc_size_control:
  target_size: "15KB"
  max_size: "20KB"
  
  compression_rules:
    - rule: "字段精简"
      action: "只列出当前子任务使用的字段"
      example: "Entity 有 20 个字段，但当前任务只用 5 个，只列出 5 个"
      
    - rule: "方法精简"
      action: "只列出当前子任务调用的方法"
      example: "Service 有 10 个方法，但当前任务只调用 2 个，只列出 2 个"
      
    - rule: "依赖引用"
      action: "不重复定义依赖类，只保留接口契约"
      example: "引用 UserService 的契约，不重复定义 UserService 的字段"
      
    - rule: "自然语言转结构化"
      action: "用 YAML/JSON 替代自然语言描述"
      saving: "节省 50-70% 空间"
```
