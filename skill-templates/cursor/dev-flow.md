# dev-flow

AI开发全流程自动化Agent技能系统

## 使用方法

在 Cursor 输入框中输入：
- `/dev-flow <需求描述>` - 执行完整开发流程
- `/dev-flow -research` - 项目调研
- `/dev-flow -analyze` - 需求分析
- `/dev-flow -design` - 详细设计
- `/dev-flow -plan` - 任务拆分
- `/dev-flow -develop` - 开发执行
- `/dev-flow -test` - 测试验证
- `/dev-flow -fix` - Bug修复

## 工作流程

### 1. 项目记忆

项目记忆存储在 `.dev-flow/memory/` 目录。执行任何阶段前，先读取相关记忆：

```
.dev-flow/memory/
├── conventions/     # 编码规范
├── components/      # 组件库文档
├── apis/           # API接口文档
├── utils/          # 工具函数文档
├── styles/         # 样式系统
└── patterns/       # 学习到的模式
```

### 2. 阶段执行

#### Research 阶段
扫描项目结构，提取：
- 目录结构和技术栈
- 编码规范（ESLint/TSConfig）
- 组件（Props/Events/Slots）
- API接口（端点/模型）
- 工具函数和Hooks

将结果写入 `.dev-flow/memory/` 各目录。

#### Analyze 阶段
解析用户需求：
1. 识别需求类型（功能/重构/优化）
2. 检索相关项目记忆
3. 识别歧义和缺失信息
4. 评估影响范围

输出：`.dev-flow/sessions/<id>/analyze-result.md`

#### Design 阶段
基于需求分析生成设计：
1. 数据层设计（模型/校验）
2. 接口层设计（端点/错误码）
3. 组件层设计（组件树/Props）
4. 业务逻辑设计（流程/状态）
5. 样式设计（主题/响应式）

输出：`.dev-flow/sessions/<id>/design-doc.md`

#### Plan 阶段
将设计拆分为任务：
1. 识别可执行单元
2. 分析依赖关系
3. 构建DAG并拓扑排序
4. 划分执行批次

输出：`.dev-flow/sessions/<id>/task-list.json`

#### Develop 阶段
执行开发任务：
1. 按依赖顺序读取任务
2. 匹配专家（前端/后端/数据库）
3. 并行执行无依赖任务
4. 每个任务自检
5. 生成代码变更

#### Test 阶段
生成并执行测试：
1. 单元测试（Vitest）
2. API测试
3. E2E测试（Playwright）
4. 生成测试报告

#### Fix 阶段
修复测试发现的问题：
1. 分析失败用例
2. 定位Bug
3. 生成修复
4. 回归测试

### 3. 上下文控制

- 任务拆分：单个任务控制在 8000 tokens 以内
- 记忆检索：使用向量索引，限制 4000 tokens
- 增量加载：按需加载任务相关上下文

### 4. 学习机制

从用户确认和修改中学习：
- 提取代码模式
- 记录用户反馈
- 更新 `.dev-flow/memory/patterns/`
- 后续任务自动应用

## 注意事项

1. 每个阶段完成后等待用户确认
2. 严格遵守项目记忆中的编码规范
3. 优先复用已有组件和API
4. 代码必须包含适当注释
5. 测试覆盖率目标：单元 >80%，关键路径 100%
