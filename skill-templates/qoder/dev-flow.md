# dev-flow

AI开发全流程自动化系统（支持断点续传 + 进度可视化 + 算法专家 + Hotfix）

## 用法

```
/dev-flow <需求描述>              # 执行完整流程
/dev-flow --resume                # 断点续传
/dev-flow -research [--refresh]   # 项目调研
/dev-flow -architecture <需求>    # 架构决策
/dev-flow -analyze                # 需求分析
/dev-flow -design                 # 详细设计
/dev-flow -plan                   # 任务拆分
/dev-flow -develop                # 开发执行
/dev-flow -test                   # 测试验证
/dev-flow -fix                    # Bug修复
/dev-flow -hotfix <错误描述>      # 紧急修复
```

## 执行流程

### 0. 断点续传
全流程自动保存会话到 `.dev-flow/sessions/{sessionId}.json`。
`/dev-flow --resume` 查找最近未完成会话，恢复已保存的阶段结果，从中断处继续。

### 1. 检查记忆
首先检查 `.dev-flow/memory/` 是否存在项目记忆。如果没有，或用户使用 `--refresh`，执行 Research 阶段。

### 2. 阶段执行

**Architecture**: 评估规模 → 技术选型 → 架构模式 → 分层设计 → 部署方案 → 权衡分析 → 生成文档

**Research**: 扫描项目 → 提取规范/组件/API → 写入记忆

**Analyze**: 解析需求 → 关联记忆 → 识别歧义 → 评估影响 → 生成文档

**Design**: 设计数据层 → 接口层 → 组件层 → 业务逻辑 → 样式 → 生成设计文档

**Plan**: 拆分任务 → 分析依赖 → 构建DAG → 生成任务列表

**Develop**: 按序执行任务 → 专家匹配（前端/后端/数据库/算法）→ 并行开发 → 自检 → 生成代码

> **算法专家**: 自动识别算法任务，从20+内置模板生成 TypeScript 实现和测试用例，标注复杂度。

**Test**: 生成测试 → 执行（单元/API/E2E）→ 生成报告

**Fix**: 分析失败 → 定位Bug → 修复 → 回归测试

**Hotfix**: 解析错误类型 → 搜索相关文件 → 分析根因 → 生成修复方案 → 验证步骤（独立模式，无需前置阶段）

### 3. 记忆系统

```
.dev-flow/memory/
├── conventions/    # 编码规范
├── components/     # 组件文档
├── apis/          # API文档
├── utils/         # 工具函数
├── styles/        # 样式系统
├── architecture/  # 架构决策
└── patterns/      # 学习到的模式
```

执行各阶段前读取相关记忆作为上下文。

### 4. 进度报告

全流程自动生成 Markdown 进度报告：
- 保存位置: `.dev-flow/sessions/progress-{sessionId}.md`
- 内容: 进度条、阶段状态/耗时、任务详情、产出文件清单

### 5. 输出位置

```
.dev-flow/sessions/<session-id>/
├── analyze-result.md              # 需求分析结果
├── design-doc.md                  # 设计文档
├── task-list.json                 # 任务列表
├── test-report.md                 # 测试报告
├── architecture-{timestamp}.md    # 架构决策文档
├── {sessionId}.json               # 会话状态（断点续传）
└── progress-{sessionId}.md        # 进度报告
```

### 6. 上下文控制

- 任务控制在 8000 tokens 以内
- 记忆检索限制 4000 tokens
- 阶段间传递摘要而非完整文档

### 7. 学习

从用户反馈中学习，更新 `.dev-flow/memory/patterns/`，后续自动应用。

## 约束

- 遵守项目记忆中的编码规范
- 优先复用已有组件和API
- 代码包含适当注释
- 测试覆盖率：单元 >80%，关键路径 100%
- 每个阶段完成后等待用户确认
- Hotfix 模式无需等待确认，直接输出
- 断点续传自动跳过已完成阶段
