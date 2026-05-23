---
name: dev-flow
description: AI开发全流程自动化Agent技能系统，支持项目调研、需求分析、详细设计、任务拆分、多Agent并行开发、测试验证、Bug修复的完整开发流程
---

# dev-flow

## 描述

dev-flow 是一个AI驱动的开发全流程自动化系统。当用户输入 `/dev-flow <需求描述>` 时，AI 将按照本技能定义的流程逐步执行，完成从项目调研到代码交付的完整开发周期。

## 使用场景

- 需要开发新功能或模块时
- 需要理解现有项目架构并基于此开发时
- 需要自动生成测试用例并验证功能时
- 需要修复Bug并进行回归测试时

## 指令

当用户输入 `/dev-flow <需求描述>` 或 `/dev-flow -<阶段>` 时，按以下流程执行：

### 1. 检查项目记忆
- 读取 `.dev-flow/memory/` 目录下的项目记忆
- 如果没有记忆或用户使用 `--refresh`，先执行 Research 阶段

### 2. 执行指定阶段

#### Research 阶段 (`/dev-flow -research`)
1. 扫描项目目录结构
2. 检测技术栈和依赖
3. 提取编码规范
4. 扫描组件、API、工具函数
5. 将结果写入 `.dev-flow/memory/`
6. 生成调研摘要，等待用户确认

#### Analyze 阶段 (`/dev-flow -analyze`)
1. 解析用户需求，识别需求类型
2. 检索相关项目记忆
3. 识别需求歧义和缺失信息
4. 评估影响范围
5. 生成需求理解文档
6. 等待用户确认

#### Design 阶段 (`/dev-flow -design`)
1. 基于需求理解设计数据层
2. 设计接口层（端点/错误码）
3. 设计组件层（组件树/Props）
4. 设计业务逻辑和样式
5. 生成设计文档
6. 等待用户确认

#### Plan 阶段 (`/dev-flow -plan`)
1. 将设计拆分为可执行任务
2. 分析任务依赖关系
3. 构建依赖图并排序
4. 生成任务列表
5. 等待用户确认

#### Develop 阶段 (`/dev-flow -develop`)
1. 按依赖顺序读取任务
2. 为每个任务选择专家（前端/后端/数据库）
3. 并行执行无依赖任务
4. 每个任务自检代码质量
5. 生成代码，等待用户确认

#### Test 阶段 (`/dev-flow -test`)
1. 生成单元测试用例
2. 生成API测试用例
3. 生成E2E测试用例
4. 执行测试（支持Playwright）
5. 生成测试报告

#### Fix 阶段 (`/dev-flow -fix`)
1. 分析失败的测试用例
2. 定位并修复Bug
3. 回归测试

### 3. 全流程模式 (`/dev-flow <需求>`)
按顺序执行：Research → Analyze → Design → Plan → Develop → Test → Fix
每个阶段完成后等待用户确认。

## 记忆系统使用

执行每个阶段前，必须读取 `.dev-flow/memory/` 中的相关记忆：
- 开发组件前：读取 `components/` 和 `styles/`
- 开发API前：读取 `apis/` 和 `conventions/`
- 编写代码时：遵守 `conventions/` 中的规范

## 示例

**输入**: `/dev-flow 实现用户登录功能`

**执行流程**:
1. Research: 扫描项目，发现已有 Button、Input 组件，/api/auth 接口
2. Analyze: 识别需要登录表单、API调用、状态管理
3. Design: 设计 LoginForm 组件、login API、useAuth hook
4. Plan: 拆分为创建组件、添加API、集成状态管理
5. Develop: 并行开发各任务
6. Test: 生成并执行测试用例
7. Fix: 修复发现的问题
