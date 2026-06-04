# dev-flow 改进方案 v1.0.6

> 本文档针对 v1.0.5 版本发现的 6 个可改进方向，逐一提供可选方案及优缺点分析。
> 待确认方案后，再进入实施阶段。

---

## 问题 1：Router 仍偏大（27KB）

**现状**：`SKILL.md`（Router）始终加载，当前 27KB（655 行）。其中记忆系统（约 12KB，333-548 行）和学习能力（约 8KB，565-655 行）占据了约 74% 的体积。

**目标**：将 Router 压缩到 15KB 以下，为代码生成释放更多上下文空间。

---

### 方案 1-A：轻度外置 — 仅外置「学习能力」章节

**做法**：将 SKILL.md 第 565-655 行的「学习能力」章节整体迁移到 `references/learning-system.md`，Router 中保留一段简要说明 + 文件引用指令。

```markdown
<!-- Router 中替换为 -->
## 学习能力

> dev-flow 具备从用户反馈中学习的能力。详细机制见 `{{REFERENCES_PATH}}learning-system.md`。
> 在 Research / Develop / Fix 阶段结束后，按需读取该文件执行学习动作。
```

| 维度 | 评价 |
|------|------|
| **Router 减负** | 约 -8KB（27KB → 19KB） |
| **改动范围** | 极小，仅 SKILL.md + 新增 1 个文件 |
| **兼容性** | ✅ 完美兼容现有构建系统，无需改 build.cjs |
| **加载策略复杂度** | 低，仅在阶段结束时按需加载 |
| **风险** | 几乎无风险 |

**优点**：
- 改动最小，构建脚本零修改
- 学习能力不是每个阶段都必须加载的内容，外置合理
- 回滚简单

**缺点**：
- 减负效果有限（仅 8KB），Router 仍接近 20KB
- 未解决记忆系统部分（12KB）的体积问题

---

### 方案 1-B：中度外置 — 外置「记忆系统」+「学习能力」两大部分

**做法**：
1. 将「记忆系统」章节（12KB）迁移到 `references/memory-system.md`
2. 将「学习能力」章节（8KB）迁移到 `references/learning-system.md`
3. Router 中保留目录结构索引（约 2KB），详细内容外置

```markdown
<!-- Router 中替换为 -->
## 记忆系统

> 详细记忆目录结构、使用规则、文件格式见 `{{REFERENCES_PATH}}memory-system.md`。
> Research 阶段完成后读取以生成记忆文件；Develop/Design/Analyze 前按需读取。

## 学习能力

> 详细学习机制见 `{{REFERENCES_PATH}}learning-system.md`。
```

| 维度 | 评价 |
|------|------|
| **Router 减负** | 约 -18KB（27KB → 9KB） |
| **改动范围** | SKILL.md + 新增 2 个 references 文件 + build.cjs 路径替换 |
| **兼容性** | ✅ 兼容，需确认各平台 references 路径 |
| **加载策略复杂度** | 中，需要明确 3 个读取时机（Research 后、阶段切换时） |
| **风险** | 低，但需确保 AI 不会遗漏读取 references |

**优点**：
- Router 压缩效果显著（降至 ~9KB），代码生成空间大幅提升
- 记忆系统本身是"参考性"内容，不是路由决策必需的
- 符合 Progressive Disclosure 原则

**缺点**：
- 需要修改 build.cjs，处理 `{{REFERENCES_PATH}}` 占位符
- 各平台 references 文件存放路径需要确认（`.trae/references/` ? `.cursor/references/` ?）
- AI 如果不按指令读取 references，会导致记忆系统无法使用
- 需要新增 references 目录到 `files` 字段（npm 发布）

---

### 方案 1-C：深度重构 — Router 仅保留「命令路由 + 阶段索引 + 核心规则」

**做法**：将 Router 拆分为 3 层：
1. **Core Router**（~5KB）：命令表、阶段路由、强制规则摘要
2. **System References**（按需加载）：记忆系统、学习能力、上下文管理策略
3. **Platform Overrides**（可选）：平台特有规则

```
_core/
  SKILL.md          # 5KB 超精简 Router
  references/
    memory-system.md
    learning-system.md
    context-policy.md
```

| 维度 | 评价 |
|------|------|
| **Router 减负** | 约 -22KB（27KB → 5KB） |
| **改动范围** | 极大，涉及 SKILL.md 重写、build.cjs 新增 references 处理逻辑、所有平台目录结构调整 |
| **兼容性** | ⚠️ 不兼容现有输出目录结构，需要大改构建系统 |
| **加载策略复杂度** | 高，需要设计多层按需加载机制 |
| **风险** | 中高，重构可能引入新的路径解析问题 |

**优点**：
- Router 达到理论最小值，上下文空间最大化
- 架构更清晰，Router / References / Stages / Agents 四层职责分明
- 为未来的平台扩展提供更好的基础

**缺点**：
- 工作量巨大，相当于半重写构建系统
- 测试验证成本高
- 收益边际递减（从 9KB → 5KB 的意义不如从 27KB → 9KB 大）
- 可能影响现有用户的安装路径

---

### 问题 1 方案对比总表

| 方案 | Router 体积 | 改动量 | 风险 | 推荐度 |
|------|------------|--------|------|--------|
| 1-A 轻度外置 | 19KB | 小 | 极低 | ⭐⭐⭐ |
| 1-B 中度外置 | 9KB | 中 | 低 | ⭐⭐⭐⭐⭐ **推荐** |
| 1-C 深度重构 | 5KB | 大 | 中高 | ⭐⭐ |

> **建议**：选择方案 1-B。它在减负效果、改动量和风险之间取得最佳平衡。9KB 的 Router 对于代码生成阶段来说已经相当充裕。

---

## 问题 2：Agent 文件体量不均

**现状**：
| Agent | 体积 | 占比 |
|-------|------|------|
| develop-expert.md | ~27KB | 最大 |
| error-pattern-learner.md | ~26KB | 次大 |
| context-manager.md | ~22KB | 第三 |
| ... | ... | ... |
| structure-analyzer.md | ~938B | 最小 |

问题：大文件在 Subagent 模式下会一次性加载到上下文中，成为瓶颈。

---

### 方案 2-A：按语言拆分 develop-expert

**做法**：将 develop-expert.md 中的多语言实现规范（TS/Node.js ~180 行、Python ~130 行、Go ~150 行）拆分为独立文件：

```
agents/
  develop-expert.md              # 核心流程（Java + 通用规则）~18KB
  develop-expert-ts.md           # TypeScript/Node.js 扩展 ~8KB
  develop-expert-py.md           # Python 扩展 ~6KB
  develop-expert-go.md           # Go 扩展 ~7KB
```

Router 中通过 `language` 字段决定加载哪个扩展文件。

| 维度 | 评价 |
|------|------|
| **减负效果** | develop-expert 降至 ~18KB，按需再加载语言扩展 |
| **改动范围** | develop-expert.md 重构 + 新增 3 个文件 + Router 加载逻辑调整 |
| **兼容性** | ✅ 兼容 |
| **风险** | 低 |

**优点**：
- 直接减少 develop-expert 常驻上下文（-9KB）
- 多数项目只用一种语言，语言扩展按需加载很合理
- 新增语言支持时只需新增文件，不改动核心

**缺点**：
- 构建系统需要支持条件加载逻辑（根据项目类型选择语言扩展）
- 每个 Subagent 启动时需要额外判断语言类型
- 不能解决 error-pattern-learner 和 context-manager 的体积问题

---

### 方案 2-B：将 error-pattern-learner 拆分为「核心 + 模式库」

**做法**：
1. `error-pattern-learner.md` 保留核心工作流（Step 1-5）和框架定义（~12KB）
2. 将具体的错误模式库（P001-P009 详细定义，~14KB）迁移到 `references/error-pattern-db.md`

```
agents/
  error-pattern-learner.md       # 核心框架 ~12KB
references/
  error-pattern-db.md            # 具体模式库 ~14KB
```

| 维度 | 评价 |
|------|------|
| **减负效果** | error-pattern-learner 降至 ~12KB |
| **改动范围** | 1 个文件拆分 + 新增 1 个 references |
| **兼容性** | ✅ 兼容 |
| **风险** | 低 |

**优点**：
- 模式库是增量增长的，拆出后核心框架更稳定
- 新发现的模式只需改 references，不动 agent 定义
- 其他 agent 也可以引用模式库

**缺点**：
- 模式库通常需要配合 agent 一起使用，拆分后需要确保同时加载
- 收益相对有限（仅解决一个 agent）

---

### 方案 2-C：综合拆分策略（推荐组合）

**做法**：同时执行以下拆分：

```
# develop-expert：按语言拆分
develop-expert.md → develop-expert.md（核心-Java） + develop-expert-ts.md + develop-expert-py.md + develop-expert-go.md

# error-pattern-learner：拆出模式库
error-pattern-learner.md → error-pattern-learner.md（核心） + references/error-pattern-db.md

# context-manager：拆出模型配置表
context-manager.md → context-manager.md（核心策略） + references/model-context-config.md

# 合并小 agent：structure-analyzer + config-analyzer
# 考虑是否合并为 project-structure-expert.md
```

| 维度 | 评价 |
|------|------|
| **减负效果** | 3 个大 agent 均降至 ~12-18KB |
| **改动范围** | 大，涉及 3 个 agent 重构 + 新增 5+ 个文件 |
| **兼容性** | ✅ 兼容，但构建系统需要增强 |
| **风险** | 中，需要充分测试各平台输出 |

**优点**：
- 系统性解决所有大 agent 的体积问题
- 架构更模块化，便于后续维护

**缺点**：
- 工作量大，需要多轮验证
- 拆分粒度需要仔细把握，过度拆分反而增加加载复杂度

---

### 方案 2-D：不动文件结构，改为「智能加载指令」

**做法**：不拆分文件，而是在每个大 agent 头部增加「上下文控制指令」，指导 AI 只读取需要的部分。

```markdown
<!-- develop-expert.md 头部增加 -->
## ⚠️ 上下文控制

本文件总大小 27KB。加载时请根据项目类型选择性关注：
- Java 项目：重点阅读「Java 实现规范」章节，TS/Python/Go 章节可快速浏览标题即可
- TypeScript 项目：重点阅读「TS 实现规范」章节，其他章节快速浏览
- 以此类推

不需要一次性完整理解所有内容，按需深入即可。
```

| 维度 | 评价 |
|------|------|
| **减负效果** | 无（文件物理大小不变） |
| **改动范围** | 极小，每个大 agent 加几行提示 |
| **兼容性** | ✅ 完全兼容 |
| **风险** | 依赖 AI 的"理解"能力，效果不稳定 |

**优点**：
- 零结构性改动
- 实施成本极低

**缺点**：
- 不解决根本问题（文件物理大小不变，Subagent 仍会全量加载）
- AI 可能不遵守"选择性阅读"的指令
- 治标不治本

---

### 问题 2 方案对比总表

| 方案 | 核心思路 | 工作量 | 效果 | 推荐度 |
|------|---------|--------|------|--------|
| 2-A 按语言拆分 | develop-expert 语言拆分 | 中 | 好 | ⭐⭐⭐⭐ |
| 2-B 模式库拆分 | error-pattern-learner 拆出模式库 | 小 | 中等 | ⭐⭐⭐ |
| 2-C 综合拆分 | 多 agent 同时拆分 | 大 | 最好 | ⭐⭐⭐⭐⭐ **推荐** |
| 2-D 智能加载 | 加提示不改结构 | 极小 | 差 | ⭐⭐ |

> **建议**：选择方案 2-C（综合拆分）。虽然工作量大，但可以一次性系统性地解决 agent 体积不均问题。如果希望分阶段实施，可以先做 2-A（develop-expert 语言拆分），这是收益最明显的单项改进。

---

## 问题 3：测试覆盖缺失

**现状**：
- `build.cjs` 有 `--verify` 模式，但仅做「生成后文件与现有文件对比」
- 没有单元测试、集成测试、构建验证测试
- 缺乏 CI/CD 流程

---

### 方案 3-A：最小可行 — 仅增加构建验证测试

**做法**：
1. 创建 `tests/build.test.js` — 测试 build.cjs 的核心功能
2. 验证：生成文件存在、占位符已替换、Trae-Only 内容正确剥离
3. 在 `package.json` 中添加 `test` 脚本

```json
{
  "scripts": {
    "test": "node tests/build.test.js",
    "test:verify": "node scripts/build.cjs --verify"
  }
}
```

| 维度 | 评价 |
|------|------|
| **覆盖范围** | 构建输出验证 |
| **工作量** | 小（1-2 小时） |
| **CI 就绪度** | 可以在 GitHub Actions 中运行 |
| **维护成本** | 低 |

**优点**：
- 快速实施，立即可用
- 能捕获 80% 的构建回归问题
- 不引入额外依赖

**缺点**：
- 仅覆盖构建脚本，不测试 SKILL.md 的逻辑正确性
- 不测试各平台安装后的行为

---

### 方案 3-B：中等覆盖 — 构建测试 + 静态检查 + 格式校验

**做法**：
1. **构建测试**（同 3-A）
2. **Markdown 格式检查**：验证所有 .md 文件的前置元数据（`---` 包裹的 YAML frontmatter）格式正确
3. **占位符完整性检查**：确保所有 `{{STAGES_PATH}}`、`{{AGENTS_PATH}}` 在输出文件中已被替换
4. **链接有效性检查**：确保 Router 中引用的 stages/agents 文件实际存在
5. **文件大小预警**：任何输出文件 >50KB 时告警

```json
{
  "scripts": {
    "test": "node tests/run-all.js",
    "test:build": "node tests/build.test.js",
    "test:links": "node tests/links.test.js",
    "test:size": "node tests/size-warning.test.js"
  }
}
```

| 维度 | 评价 |
|------|------|
| **覆盖范围** | 构建 + 格式 + 链接 + 大小 |
| **工作量** | 中（半天） |
| **CI 就绪度** | ✅ 完整 |
| **维护成本** | 中 |

**优点**：
- 覆盖构建质量和内容质量
- 能提前发现链接失效、占位符遗漏等常见问题
- 文件大小预警防止 Router/Agent 膨胀回归

**缺点**：
- 仍不测试 SKILL 的"语义正确性"（比如指令是否逻辑自洽）
- 需要维护测试用例

---

### 方案 3-C：完整覆盖 — 以上全部 + GitHub Actions CI

**做法**：在方案 3-B 基础上增加：

1. **GitHub Actions 工作流**（`.github/workflows/ci.yml`）：
   ```yaml
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '18' }
         - run: npm test
         - run: npm run test:verify
   ```

2. **发布前检查清单**（`scripts/pre-publish.js`）：
   - 版本号一致性检查（package.json vs README）
   - 所有平台文件已生成且最新
   - CHANGELOG.md 已更新

3. **PR 模板**（`.github/pull_request_template.md`）：
   - 提醒更新 CHANGELOG、运行测试、检查版本号

| 维度 | 评价 |
|------|------|
| **覆盖范围** | 完整（构建 + 格式 + 链接 + CI + 发布检查） |
| **工作量** | 中（1 天） |
| **CI 就绪度** | ✅ 完全就绪 |
| **维护成本** | 中 |

**优点**：
- 自动化保障质量
- PR 自动跑测试，防止回归
- 发布前自动检查版本号一致性（直接解决问题 5）

**缺点**：
- 需要 GitHub 仓库权限配置 Actions
- 初期 setup 需要时间

---

### 问题 3 方案对比总表

| 方案 | 覆盖范围 | 工作量 | CI 支持 | 推荐度 |
|------|---------|--------|---------|--------|
| 3-A 最小可行 | 构建验证 | 小 | 需手动 | ⭐⭐⭐ |
| 3-B 中等覆盖 | 构建+格式+链接+大小 | 中 | 需手动 | ⭐⭐⭐⭐ |
| 3-C 完整覆盖 | 全部 + GitHub Actions | 中 | 自动 | ⭐⭐⭐⭐⭐ **推荐** |

> **建议**：选择方案 3-C。GitHub Actions 是免费的，setup 成本低，但能带来持续的质量保障。而且发布前版本号检查可以直接防止问题 5 的再次发生。

---

## 问题 4：_platforms 目录单薄

**现状**：
- `_platforms/` 下只有 `trae/` 有额外内容
- Cursor、Claude、Qoder、Codex 完全依赖 `stripTraeOnly: true` 去除 Trae 专有内容
- 各平台差异仅体现在输出路径和文件格式上，没有平台特有优化

---

### 方案 4-A：保持现状，补充平台说明文档

**做法**：不改动结构，仅在 README 中说明各平台差异，让用户理解为何 `_platforms/` 看起来"单薄"。

**优点**：
- 零工作量
- 现有设计其实够用（大多数平台确实不需要额外 agent）

**缺点**：
- 没有实质改进
- 无法利用各平台的特有功能（如 Cursor 的 @ 符号、Claude 的 artifacts 等）

---

### 方案 4-B：为 Codex 添加平台特有格式

**做法**：Codex 已经使用了 `formatCodex: true`，但 `_platforms/codex/` 下没有额外文件。可以补充：

```
_platforms/
  codex/
    AGENTS.md          # Codex 特有的 agent 格式（将 agents 嵌入 AGENTS.md）
    format-rules.md    # Codex 格式转换规则说明
```

**优点**：
- Codex 的 agent 格式与其他平台差异最大，最需要平台特有处理
- `formatCodex: true` 已有逻辑，只需补充规则文档

**缺点**：
- Codex 用户量可能不如 Cursor/Trae，投入产出比待评估
- 需要了解 Codex 最新格式规范

---

### 方案 4-C：识别各平台差异，按需补充

**做法**：调研各平台当前最新能力，针对性补充：

| 平台 | 特有功能 | 可能的平台优化 |
|------|---------|--------------|
| **Trae** | Subagent、技能系统 | ✅ 已有 `_platforms/trae/agents/` |
| **Cursor** | @ 符号引用、Composer | 可补充 cursor-composer 集成规则 |
| **Claude Code** | Artifacts、长上下文 | 可补充 artifact 输出格式 |
| **Qoder** | 中文优化、国产模型 | 可补充中文提示词优化 |
| **Codex** | AGENTS.md 格式 | 可补充格式转换规则 |

```
_platforms/
  trae/          # 已有
    agents/
  cursor/        # 新增
    composer-integration.md
  claude/        # 新增
    artifact-format.md
  qoder/         # 新增
    i18n-optimizations.md
  codex/         # 新增
    format-rules.md
```

**优点**：
- 充分利用各平台特性，提升用户体验
- 平台差异化是竞争优势

**缺点**：
- 需要深入了解每个平台的最新能力
- 维护成本增加（5 个平台都要跟踪更新）
- 部分平台（如 Qoder）文档可能不完善

---

### 方案 4-D：反向简化 — 移除 _platforms，全部内联到 build.cjs

**做法**：既然 `_platforms/` 只有一个平台有内容，不如将其逻辑全部内联到构建脚本中。

**优点**：
- 减少一个目录层级，结构更简单
- 逻辑集中，不用跨目录查找

**缺点**：
- 与未来扩展方向相反
- build.cjs 会变得更臃肿
- 不推荐

---

### 问题 4 方案对比总表

| 方案 | 思路 | 工作量 | 效果 | 推荐度 |
|------|------|--------|------|--------|
| 4-A 保持现状 | 仅补文档 | 极小 | 无实质改进 | ⭐⭐ |
| 4-B Codex 优化 | 仅补 Codex | 小 | 中等 | ⭐⭐⭐ |
| 4-C 全平台优化 | 5 平台全部优化 | 大 | 最好 | ⭐⭐⭐⭐ |
| 4-D 反向简化 | 移除 _platforms | 小 | 负面 | ⭐ |

> **建议**：选择方案 4-B 或 4-C。如果资源有限，先做 4-B（Codex 格式优化）是性价比最高的。Codex 的 `AGENTS.md` 格式与标准 Markdown 差异最大，最需要平台特有处理。如果希望长期发展，逐步推进 4-C。

---

## 问题 5：版本号不一致

**现状**：
- `package.json`: `"version": "0.1.0"`
- `README.md`: `v1.0.5`
- `CHANGELOG.md`: 记录到 v1.0.5
- `RECOVERY_DESIGN_DOC_v1.0.5.md`: v1.0.5

---

### 方案 5-A：手动修复 — 将 package.json 改为 "1.0.5"

**做法**：直接修改 `package.json` 中的 `version` 字段为 `"1.0.5"`。

**优点**：
- 1 分钟完成
- 立即解决不一致

**缺点**：
- 未来仍可能再次不一致
- 没有机制防止回归

---

### 方案 5-B：自动化检查 — 增加版本号校验脚本

**做法**：
1. 创建 `scripts/version-check.js`，读取 package.json 和 README.md，比较版本号
2. 在 `package.json` 的 `test` 脚本中调用
3. 在 CI 中自动运行

```javascript
// version-check.js 核心逻辑
const pkg = JSON.parse(fs.readFileSync('package.json'));
const readme = fs.readFileSync('README.md', 'utf8');
const readmeVersion = readme.match(/version-v([\d.]+)/)?.[1];
if (pkg.version !== readmeVersion) {
  console.error(`版本不一致: package.json=${pkg.version}, README=${readmeVersion}`);
  process.exit(1);
}
```

**优点**：
- 自动化防止回归
- 可以作为 CI 的一环
- 在发布前自动拦截

**缺点**：
- 需要维护正则表达式匹配逻辑
- CHANGELOG 中的版本号也要考虑

---

### 方案 5-C：单一真相源 — 版本号从 package.json 自动生成 README 徽章

**做法**：
1. README.md 中的版本号改为占位符：`{{VERSION}}`
2. build.cjs 在生成各平台文件时，将 `{{VERSION}}` 替换为 package.json 中的版本号
3. 本地开发时运行 `npm run sync-version` 生成最新 README

**优点**：
- 彻底消除不一致的可能
- package.json 是唯一需要手动修改版本号的地方

**缺点**：
- README.md 不能直接渲染（需要先生成）
- GitHub 上看到的 README 可能是占位符版本

---

### 问题 5 方案对比总表

| 方案 | 工作量 | 防止回归 | 推荐度 |
|------|--------|---------|--------|
| 5-A 手动修复 | 1 分钟 | ❌ | ⭐⭐ |
| 5-B 自动检查 | 30 分钟 | ✅ | ⭐⭐⭐⭐⭐ **推荐** |
| 5-C 单一真相源 | 1 小时 | ✅ | ⭐⭐⭐⭐ |

> **建议**：选择方案 5-B。它工作量小，且能防止回归。结合问题 3 的 CI 方案，可以确保每次 PR 都自动检查版本一致性。方案 5-C 虽然更彻底，但会让 README 在 GitHub 上的显示不够友好。

---

## 问题 6：记忆系统缺少回收机制

**现状**：
- 12 个基础记忆文件 + 4 个长期记忆文件 = 16 个文件
- 文件只增不减，长期运行后 `.dev-flow/memory/` 会膨胀
- 没有归档、压缩、清理策略

---

### 方案 6-A：时间衰减机制 — 旧记忆自动降权

**做法**：
1. 在每个记忆文件头部增加 `last_updated` 和 `relevance_score` 字段
2. Research 阶段更新文件时，新内容标记为 `score: 1.0`
3. 旧内容每月衰减 `score *= 0.9`
4. 当 `score < 0.3` 时，内容移入 `.dev-flow/memory/archive/` 归档

```markdown
---
last_updated: "2026-06-02"
relevance_score: 0.95
---
```

**优点**：
- 渐进式回收，不影响当前使用
- 实现简单，只需修改 Research 阶段的更新逻辑

**缺点**：
- 需要 AI 维护 score，增加复杂度
- "旧"不等于"不重要"，可能误删核心架构信息
- 需要新增 archive 目录管理

---

### 方案 6-B：会话级清理 — 自动清理临时会话记忆

**做法**：
1. 区分「长期记忆」（conventions.md, patterns.md, mistakes.md, preferences.md）和「会话记忆」（modules.md, apis.md 等每次 Research 都会重建的文件）
2. 新增 `.dev-flow/memory/session/` 目录存放临时会话文件
3. 每次新 Research 开始时，清空 `session/` 目录，保留长期记忆

```
.dev-flow/memory/
  # 长期记忆（跨会话保留）
  conventions.md
  patterns.md
  mistakes.md
  preferences.md
  # 会话记忆（每次 Research 重建）
  session/
    modules.md
    apis.md
    models.md
    ...
```

**优点**：
- 12 个基础记忆文件中的大部分是会话级的，可以安全重建
- 逻辑清晰：长期记忆保留，会话记忆刷新
- 实现简单，只需修改 Research 阶段的写入路径

**缺点**：
- 需要区分哪些文件是长期、哪些是会话级
- 频繁 Research 同一项目时，重复扫描成本

---

### 方案 6-C：大小阈值机制 — 按文件大小自动压缩/归档

**做法**：
1. 设定单个记忆文件大小阈值（如 50KB）
2. 超过阈值时，自动将旧内容压缩为 `.dev-flow/memory/archive/{file}-{date}.md.gz`
3. 保留最近 3 个月的归档，更早的删除
4. 提供 `.dev-flow/memory/archive/index.md` 记录归档索引

**优点**：
- 按需触发，不频繁操作
- 物理空间回收明确

**缺点**：
- 压缩后的文件 AI 无法直接读取
- 阈值选择困难（太小频繁触发，太大回收不及时）

---

### 方案 6-D：手动归档指令 — 提供用户可控的清理命令

**做法**：新增 `/dev-flow -cleanup` 命令：

```
/dev-flow -cleanup          # 清理所有会话级记忆，保留长期记忆
/dev-flow -cleanup --all    # 清理全部记忆（重置）
/dev-flow -archive          # 手动归档当前记忆
```

**优点**：
- 用户完全可控
- 实现最简单
- 不引入自动机制的副作用

**缺点**：
- 依赖用户主动执行
- 没有自动防止膨胀的机制

---

### 问题 6 方案对比总表

| 方案 | 机制 | 自动化 | 安全性 | 推荐度 |
|------|------|--------|--------|--------|
| 6-A 时间衰减 | 按时间降权 | 自动 | 中（可能误删） | ⭐⭐⭐ |
| 6-B 会话清理 | 区分长期/会话 | 自动 | 高（可重建） | ⭐⭐⭐⭐⭐ **推荐** |
| 6-C 大小阈值 | 按大小压缩 | 自动 | 中（压缩后不可读） | ⭐⭐⭐ |
| 6-D 手动指令 | 用户控制 | 手动 | 高 | ⭐⭐⭐⭐ |

> **建议**：选择方案 6-B（会话级清理）。这是最安全、最合理的策略 —— 会话记忆本就可以通过重新 Research 重建，长期记忆才是真正需要保留的。同时可以辅以方案 6-D（手动指令），给用户一个主动清理的入口。

---

## 综合实施建议

如果 6 个问题需要排优先级，建议按以下顺序实施：

| 优先级 | 问题 | 推荐方案 | 预估工作量 | 收益 |
|--------|------|---------|------------|------|
| P0 | 版本号不一致 | 5-B 自动检查 | 30 分钟 | 防止发布混乱 |
| P1 | Router 偏大 | 1-B 中度外置 | 2 小时 | 释放 ~18KB 上下文 |
| P2 | Agent 不均 | 2-A 语言拆分（先） | 3 小时 | 降低 develop-expert 体积 |
| P3 | 测试缺失 | 3-C 完整覆盖 | 1 天 | 质量保障 + CI |
| P4 | 记忆回收 | 6-B 会话清理 | 2 小时 | 防止文件膨胀 |
| P5 | 平台单薄 | 4-B Codex 优化 | 2 小时 | 补齐最大差异平台 |

---

> 以上方案请审阅。确认后，我将按优先级逐条实施。
