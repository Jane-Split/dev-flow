---
name: dev-flow
description: AI开发全流程自动化Agent技能系统，支持架构决策、断点续传、进度可视化、算法专家、紧急Hotfix
---

# dev-flow

## 描述

AI驱动的开发全流程自动化系统，覆盖项目调研、架构决策、需求分析、详细设计、任务拆分、多Agent开发、测试验证、Bug修复的完整周期。支持断点续传和进度可视化。

## 使用场景

- 新功能开发
- 新项目架构设计
- 基于现有架构的功能增强
- 自动化测试生成与执行
- Bug修复与回归测试
- 紧急线上错误修复（Hotfix）
- 算法相关任务开发
- 中断流程恢复（断点续传）

## 命令格式

```
/dev-flow <需求描述>
/dev-flow --resume
/dev-flow -research [--refresh]
/dev-flow -architecture <需求描述>
/dev-flow -analyze
/dev-flow -design
/dev-flow -plan
/dev-flow -develop
/dev-flow -test
/dev-flow -fix
/dev-flow -hotfix <错误描述>
```

## 工作流程

### Stage 0: Architecture (架构决策)
评估项目规模并生成架构方案：
- 规模评估（小型/中型/大型）
- 技术选型（框架/数据库/缓存/消息队列/认证/监控/部署）
- 架构模式选择（单体/分层/微服务）
- 分层设计和目录结构
- 部署方案和权衡分析

输出: `.dev-flow/sessions/architecture-{timestamp}.md`

### Stage 1: Research (项目调研)
扫描项目，提取并存储：
- 目录结构和技术栈
- 编码规范
- 组件库
- API接口
- 工具函数

存储位置: `.dev-flow/memory/`

### Stage 2: Analyze (需求分析)
解析用户需求：
1. 识别需求类型和优先级
2. 检索相关项目记忆
3. 识别歧义和缺失信息
4. 评估影响范围

输出: `.dev-flow/sessions/<id>/analyze-result.md`

### Stage 3: Design (详细设计)
生成技术设计：
- 数据层设计
- 接口层设计
- 组件层设计
- 业务逻辑设计
- 样式设计

输出: `.dev-flow/sessions/<id>/design-doc.md`

### Stage 4: Plan (任务拆分)
将设计拆分为可执行任务：
1. 识别任务单元
2. 分析依赖关系
3. 构建DAG
4. 拓扑排序

输出: `.dev-flow/sessions/<id>/task-list.json`

### Stage 5: Develop (开发执行)
执行开发任务：
1. 按依赖顺序执行
2. 专家匹配（前端/后端/数据库/算法）
3. 并行执行无依赖任务
4. 代码自检

> **算法专家**: 自动识别算法任务，从20+模板生成 TypeScript 实现和测试。

### Stage 6: Test (测试验证)
生成并执行测试：
- 单元测试
- API测试
- E2E测试

输出: `.dev-flow/sessions/<id>/test-report.md`

### Stage 7: Fix (Bug修复)
修复测试发现的问题并回归测试。

### Hotfix 模式（独立）
快速修复线上错误：
1. 解析错误类型（语法/类型/依赖/配置/运行时/逻辑）
2. 搜索相关文件
3. 分析根因
4. 生成修复方案
5. 生成验证步骤

无需前置阶段，直接调用。

### 断点续传
- 全流程自动保存会话到 `.dev-flow/sessions/{sessionId}.json`
- `/dev-flow --resume` 从最近未完成会话继续
- 自动跳过已完成阶段

### 进度可视化
- 自动生成 Markdown 进度报告
- 保存到 `.dev-flow/sessions/progress-{sessionId}.md`
- 包含进度条、阶段状态、任务详情、产出文件

## 记忆系统

```
.dev-flow/memory/
├── conventions/     # 编码规范
├── components/      # 组件
├── apis/           # API接口
├── utils/          # 工具函数
├── styles/         # 样式系统
├── architecture/   # 架构决策
└── patterns/       # 学习到的模式
```

## 上下文控制

- 任务拆分: >8000 tokens 必须拆分
- 记忆检索: 限制 4000 tokens
- 增量加载: 按需加载任务上下文

## 学习机制

从用户确认和修改中提取模式，存储到 `.dev-flow/memory/patterns/`，后续自动应用。

## 约束

1. 遵守项目记忆中的编码规范
2. 优先复用已有组件和API
3. 代码包含适当注释
4. 测试覆盖率: 单元 >80%，关键路径 100%
5. 每个阶段完成后等待用户确认
6. Hotfix 模式无需等待确认
7. 断点续传自动跳过已完成阶段
