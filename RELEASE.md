# dev-flow v3.0.0 Release Notes

Release Date: 2026-06-05

## Overview

v3.0.0 是 dev-flow 的一次质量革命级更新，核心解决了两个长期存在的根本性问题：

1. **Subagent 上下文不足** → 新增上下文自动注入系统（prepare-context.cjs）
2. **大代码文件生成质量下降** → 新增结构化分段生成协议（segment-code.cjs）

同时全面移除了 50KB 硬约束，新增自动产出校验系统，将综合达标率从 81% 提升至 91%。

## What's New

### 上下文自动注入系统（prepare-context.cjs）

Subagent 派发前自动收集完整上下文（任务信息、设计文档、契约定义、编码规范、依赖类），生成 task-brief.md。

### 结构化代码分段生成（segment-code.cjs）

当预估代码输出 > 20KB 时，自动启用"骨架 + 逐方法填充"四阶段协议：
- Phase 0: 代码架构规划
- Phase 1: 骨架生成（imports + class + 方法签名）
- Phase 2: 逐方法填充（每次 5-10KB，质量保持 85-95%）
- Phase 3: 全量验证（编译 + 契约校验）

### 自动产出校验（validate-result.cjs）

Subagent 完成后自动校验：文件存在性、TODO/FIXME、空方法体、log-only 体、Design Contract 一致性。

### 50KB 硬约束全面移除

移除 `minimum_safe_context: "50KB"` 硬限制，改为基于模型窗口和任务需求的动态计算。

## Changed

- context-manager.md: 50KB → auto，新增上下文注入模式，升级分段执行为主动规划
- develop.md: 新增 Step 0.5（分段决策）、Step 1.1（上下文注入读取）、Step 3.1（分段执行）
- develop-expert.md: 新增结构化分段生成协议
- orchestrator.md: 新增 Step 0.4（prepare-context 集成）、Step 0.5（segment-code 规划）、Step 5.0（validate-result 校验）
- task-protocol.md: 新增 4.3 Context Injection Protocol
- dispatch.cjs: 集成 prepare-context + validate-result，YAML 解析器增强
- SKILL.md Router: 移除 50KB 硬约束描述，新增上下文自动注入说明

## Upgrade Guide

```bash
npm install Jane-Split/dev-flow@3.0.0 --save-dev
npx dev-flow install
```

No breaking changes. All existing workflows continue to work. New features (prepare-context, segment-code, validate-result) are automatically triggered in subagent mode.

## Compatibility

- Cursor: Compatible
- Trae: Compatible
- Claude Code: Compatible
- OpenAI Codex: Compatible
- Qoder: Compatible
- Node.js: >= 18.0.0
