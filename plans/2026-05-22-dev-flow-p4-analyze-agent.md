# P4: 需求分析Agent 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现AnalyzeAgent，能够接收需求描述或文档，结合项目记忆进行深度分析，输出结构化的需求理解文档，包括功能点拆解、验收标准、影响范围分析、歧义检测等。

**Architecture:** AnalyzeAgent接收需求输入，从记忆系统检索相关上下文，执行结构化分析流程，生成Markdown格式的需求理解文档。

**Tech Stack:** TypeScript

**依赖:** P2（记忆系统）, P3（项目调研Agent）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── agents/
│   │   └── analyze-agent.ts       # 需求分析Agent
│   ├── analyzers/
│   │   ├── index.ts               # 分析器导出
│   │   ├── requirement-parser.ts   # 需求解析器
│   │   ├── context-linker.ts       # 上下文关联器
│   │   ├── impact-analyzer.ts      # 影响分析器
│   │   └── ambiguity-detector.ts   # 歧义检测器
│   └── templates/
│       └── requirement-doc.md      # 需求文档模板
└── tests/
    └── agents/
        └── analyze-agent.test.ts
```

---

### Task 1: 需求解析器

**Files:**
- Create: `src/analyzers/requirement-parser.ts`

- [ ] **Step 1: 创建需求解析器**

```typescript
// src/analyzers/requirement-parser.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileExists } from '../utils/fs-utils.js';

export interface ParsedRequirement {
  raw: string;
  type: 'feature' | 'modification' | 'refactor' | 'bugfix' | 'optimization';
  title: string;
  description: string;
  constraints: string[];
  priority: 'P0' | 'P1' | 'P2';
  source?: string;
}

export class RequirementParser {
  async parse(input: string, projectRoot: string): Promise<ParsedRequirement> {
    let raw = input;
    let source: string | undefined;

    // 检查是否是文件路径
    if (input.endsWith('.md') || input.endsWith('.txt')) {
      const filePath = path.join(projectRoot, input);
      if (await fileExists(filePath)) {
        raw = await fs.readFile(filePath, 'utf-8');
        source = input;
      }
    }

    const type = this.detectType(raw);
    const title = this.extractTitle(raw);
    const description = this.extractDescription(raw);
    const constraints = this.extractConstraints(raw);
    const priority = this.detectPriority(raw);

    return {
      raw,
      type,
      title,
      description,
      constraints,
      priority,
      source,
    };
  }

  private detectType(content: string): ParsedRequirement['type'] {
    const lower = content.toLowerCase();

    if (lower.includes('bug') || lower.includes('修复') || lower.includes('fix')) {
      return 'bugfix';
    }
    if (lower.includes('refactor') || lower.includes('重构')) {
      return 'refactor';
    }
    if (lower.includes('optimiz') || lower.includes('优化') || lower.includes('性能')) {
      return 'optimization';
    }
    if (lower.includes('修改') || lower.includes('update') || lower.includes('change')) {
      return 'modification';
    }
    return 'feature';
  }

  private extractTitle(content: string): string {
    // 尝试提取标题
    const lines = content.split('\n').filter(l => l.trim());

    // Markdown标题
    const h1Match = lines.find(l => l.startsWith('# '));
    if (h1Match) {
      return h1Match.replace(/^#\s+/, '').trim();
    }

    // 第一行作为标题
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100) {
        return firstLine;
      }
      return firstLine.slice(0, 50) + '...';
    }

    return '未命名需求';
  }

  private extractDescription(content: string): string {
    // 移除标题行，提取描述
    const lines = content.split('\n');
    const descLines: string[] = [];
    let foundTitle = false;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        foundTitle = true;
        continue;
      }
      if (foundTitle) {
        descLines.push(line);
      }
    }

    return descLines.join('\n').trim() || content;
  }

  private extractConstraints(content: string): string[] {
    const constraints: string[] = [];

    // 查找约束关键词
    const patterns = [
      /必须[：:]\s*(.+)/g,
      /约束[：:]\s*(.+)/g,
      /限制[：:]\s*(.+)/g,
      /constraint[：:]\s*(.+)/gi,
      /must[：:]\s*(.+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        constraints.push(match[1].trim());
      }
    }

    return constraints;
  }

  private detectPriority(content: string): ParsedRequirement['priority'] {
    const lower = content.toLowerCase();

    if (lower.includes('p0') || lower.includes('紧急') || lower.includes('urgent')) {
      return 'P0';
    }
    if (lower.includes('p2') || lower.includes('低优先级') || lower.includes('low priority')) {
      return 'P2';
    }
    return 'P1';
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/analyzers/requirement-parser.ts
git commit -m "feat(analyzers): add requirement parser"
```

---

### Task 2: 上下文关联器

**Files:**
- Create: `src/analyzers/context-linker.ts`

- [ ] **Step 1: 创建上下文关联器**

```typescript
// src/analyzers/context-linker.ts
import type { MemoryManager } from '../memory/index.js';
import type { ComponentInfo, ApiEndpoint, DataModel } from '../memory/types.js';

export interface ContextLink {
  type: 'component' | 'api' | 'model' | 'util';
  name: string;
  path: string;
  relation: 'reuse' | 'modify' | 'depend' | 'conflict';
  description: string;
}

export interface ContextLinkResult {
  links: ContextLink[];
  relatedComponents: ComponentInfo[];
  relatedApis: ApiEndpoint[];
  relatedModels: DataModel[];
  suggestions: string[];
}

export class ContextLinker {
  private memory: MemoryManager;

  constructor(memory: MemoryManager) {
    this.memory = memory;
  }

  async link(requirement: string): Promise<ContextLinkResult> {
    const links: ContextLink[] = [];
    const suggestions: string[] = [];

    // 从记忆中检索相关组件
    const relatedComponents = await this.findRelatedComponents(requirement);
    for (const comp of relatedComponents) {
      links.push({
        type: 'component',
        name: comp.name,
        path: comp.path,
        relation: 'reuse',
        description: comp.description,
      });
    }

    // 从记忆中检索相关API
    const relatedApis = await this.findRelatedApis(requirement);
    for (const api of relatedApis) {
      links.push({
        type: 'api',
        name: api.path,
        path: api.path,
        relation: 'depend',
        description: api.description,
      });
    }

    // 从记忆中检索相关模型
    const relatedModels = await this.findRelatedModels(requirement);
    for (const model of relatedModels) {
      links.push({
        type: 'model',
        name: model.name,
        path: model.name,
        relation: 'depend',
        description: model.description,
      });
    }

    // 生成建议
    if (relatedComponents.length > 0) {
      suggestions.push(`可复用现有组件: ${relatedComponents.map(c => c.name).join(', ')}`);
    }
    if (relatedApis.length > 0) {
      suggestions.push(`需要对接现有API: ${relatedApis.map(a => a.path).join(', ')}`);
    }

    return {
      links,
      relatedComponents,
      relatedApis,
      relatedModels,
      suggestions,
    };
  }

  private async findRelatedComponents(requirement: string): Promise<ComponentInfo[]> {
    const components = await this.memory.getComponents();
    if (!components) return [];

    // 关键词匹配
    const keywords = this.extractKeywords(requirement);
    return components.filter(comp => {
      const text = `${comp.name} ${comp.description}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 10);
  }

  private async findRelatedApis(requirement: string): Promise<ApiEndpoint[]> {
    const apis = await this.memory.getApis();
    if (!apis) return [];

    const keywords = this.extractKeywords(requirement);
    return apis.filter(api => {
      const text = `${api.path} ${api.description}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 10);
  }

  private async findRelatedModels(requirement: string): Promise<DataModel[]> {
    const models = await this.memory.getModels();
    if (!models) return [];

    const keywords = this.extractKeywords(requirement);
    return models.filter(model => {
      const text = `${model.name} ${model.description}`.toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 10);
  }

  private extractKeywords(text: string): string[] {
    // 简单的关键词提取
    const stopWords = new Set(['的', '是', '在', '和', '了', '有', '我', '你', '他', 'the', 'a', 'an', 'is', 'are', 'was', 'were']);

    return text
      .split(/[\s,，。.!！?？;；:：""''「」【】()（）\[\]{}]+/)
      .filter(word => word.length >= 2 && !stopWords.has(word.toLowerCase()));
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/analyzers/context-linker.ts
git commit -m "feat(analyzers): add context linker for memory retrieval"
```

---

### Task 3: 影响分析器

**Files:**
- Create: `src/analyzers/impact-analyzer.ts`

- [ ] **Step 1: 创建影响分析器**

```typescript
// src/analyzers/impact-analyzer.ts
import type { ContextLink } from './context-linker.js';

export interface ImpactItem {
  type: 'file' | 'api' | 'model' | 'config' | 'database';
  path: string;
  operation: 'create' | 'modify' | 'delete';
  description: string;
  risk?: 'low' | 'medium' | 'high';
}

export interface ImpactResult {
  items: ImpactItem[];
  risks: string[];
  dependencies: string[];
}

export class ImpactAnalyzer {
  analyze(requirement: string, contextLinks: ContextLink[]): ImpactResult {
    const items: ImpactItem[] = [];
    const risks: string[] = [];
    const dependencies: string[] = [];

    // 分析上下文链接
    for (const link of contextLinks) {
      if (link.relation === 'modify') {
        items.push({
          type: link.type as any,
          path: link.path,
          operation: 'modify',
          description: `修改现有${link.type}: ${link.name}`,
          risk: 'medium',
        });
        risks.push(`修改${link.type} ${link.name} 可能影响现有功能`);
      } else if (link.relation === 'depend') {
        dependencies.push(link.name);
      }
    }

    // 根据需求关键词推断影响
    const lower = requirement.toLowerCase();

    if (lower.includes('登录') || lower.includes('login')) {
      items.push(
        { type: 'file', path: 'src/pages/Login/', operation: 'create', description: '登录页面' },
        { type: 'api', path: '/api/auth/login', operation: 'create', description: '登录接口' },
        { type: 'model', path: 'User', operation: 'modify', description: '用户模型扩展' },
      );
    }

    if (lower.includes('用户') || lower.includes('user')) {
      items.push(
        { type: 'model', path: 'User', operation: 'modify', description: '用户相关模型' },
      );
    }

    if (lower.includes('数据库') || lower.includes('database') || lower.includes('表')) {
      items.push(
        { type: 'database', path: 'migration', operation: 'create', description: '数据库迁移' },
      );
      risks.push('数据库变更需要谨慎处理，建议做好备份');
    }

    return { items, risks, dependencies };
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/analyzers/impact-analyzer.ts
git commit -m "feat(analyzers): add impact analyzer"
```

---

### Task 4: 歧义检测器

**Files:**
- Create: `src/analyzers/ambiguity-detector.ts`

- [ ] **Step 1: 创建歧义检测器**

```typescript
// src/analyzers/ambiguity-detector.ts

export interface Ambiguity {
  type: 'vague' | 'missing' | 'conflict' | 'undefined';
  description: string;
  location: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

export class AmbiguityDetector {
  detect(requirement: string): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    const lower = requirement.toLowerCase();

    // 检测模糊词汇
    const vaguePatterns = [
      { pattern: /等\s*等|etc|等等/, word: '等等', suggestion: '请明确列出所有项目' },
      { pattern: /可能|maybe|perhaps/, word: '可能', suggestion: '请明确是否需要此功能' },
      { pattern: /大概|大约|approximately/, word: '大概', suggestion: '请提供具体的数值或范围' },
      { pattern: /一些|若干|some/, word: '一些', suggestion: '请明确具体数量' },
      { pattern: /尽量|尽可能/, word: '尽量', suggestion: '请明确是否必须实现' },
    ];

    for (const { pattern, word, suggestion } of vaguePatterns) {
      if (pattern.test(lower)) {
        ambiguities.push({
          type: 'vague',
          description: `发现模糊词汇: "${word}"`,
          location: this.findLocation(requirement, word),
          suggestion,
          severity: 'medium',
        });
      }
    }

    // 检测缺失信息
    const missingPatterns = [
      { pattern: /登录/, missing: '登录方式', suggestion: '请明确登录方式（账号密码/手机验证码/第三方登录）' },
      { pattern: /支付/, missing: '支付方式', suggestion: '请明确支付方式（微信/支付宝/银行卡）' },
      { pattern: /通知/, missing: '通知方式', suggestion: '请明确通知方式（站内信/邮件/短信/推送）' },
      { pattern: /导出/, missing: '导出格式', suggestion: '请明确导出格式（Excel/PDF/CSV）' },
    ];

    for (const { pattern, missing, suggestion } of missingPatterns) {
      if (pattern.test(lower)) {
        // 检查是否已经明确
        if (!lower.includes('方式') && !lower.includes('格式')) {
          ambiguities.push({
            type: 'missing',
            description: `缺少${missing}说明`,
            location: '整体需求',
            suggestion,
            severity: 'high',
          });
        }
      }
    }

    // 检测未定义的术语
    const termPatterns = [
      { pattern: /vip|会员/, term: 'VIP等级规则', suggestion: '请定义VIP等级划分和权益' },
      { pattern: /积分/, term: '积分规则', suggestion: '请定义积分获取和使用规则' },
    ];

    for (const { pattern, term, suggestion } of termPatterns) {
      if (pattern.test(lower)) {
        ambiguities.push({
          type: 'undefined',
          description: `未定义的业务术语: ${term}`,
          location: '整体需求',
          suggestion,
          severity: 'medium',
        });
      }
    }

    return ambiguities;
  }

  private findLocation(text: string, word: string): string {
    const index = text.indexOf(word);
    if (index === -1) return '未知位置';

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + word.length + 20);
    return '...' + text.slice(start, end) + '...';
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/analyzers/ambiguity-detector.ts
git commit -m "feat(analyzers): add ambiguity detector"
```

---

### Task 5: AnalyzeAgent整合

**Files:**
- Create: `src/agents/analyze-agent.ts`
- Create: `src/analyzers/index.ts`
- Create: `src/templates/requirement-doc.md`
- Test: `tests/agents/analyze-agent.test.ts`

- [ ] **Step 1: 创建分析器导出**

```typescript
// src/analyzers/index.ts
export { RequirementParser, type ParsedRequirement } from './requirement-parser.js';
export { ContextLinker, type ContextLinkResult } from './context-linker.js';
export { ImpactAnalyzer, type ImpactResult } from './impact-analyzer.js';
export { AmbiguityDetector, type Ambiguity } from './ambiguity-detector.js';
```

- [ ] **Step 2: 创建需求文档模板**

```markdown
<!-- src/templates/requirement-doc.md -->
# 需求理解文档

## 1. 需求概述
- **原始需求**: {{title}}
- **需求类型**: {{type}}
- **优先级**: {{priority}}

## 2. 功能点拆解
{{#each features}}
### 2.{{@index}} {{name}} ({{priority}}, 复杂度: {{complexity}})
- **用户故事**: 作为{{role}}，我希望{{action}}，以便{{value}}
- **验收标准**:
{{#each acceptances}}
  - Given {{given}}
  - When {{when}}
  - Then {{then}}
{{/each}}
- **关联组件**: {{relatedComponents}}
- **关联API**: {{relatedApis}}
- **关联Model**: {{relatedModels}}

{{/each}}

## 3. 影响范围分析
| 类型 | 文件 | 操作 | 说明 |
|------|------|------|------|
{{#each impacts}}
| {{type}} | {{path}} | {{operation}} | {{description}} |
{{/each}}

## 4. 技术约束
{{#each constraints}}
- {{this}}
{{/each}}

## 5. 风险点
{{#each risks}}
- ⚠️ {{this}}
{{/each}}

## 6. 待确认问题
{{#each ambiguities}}
- [ ] **{{description}}**
  - 建议: {{suggestion}}
{{/each}}
```

- [ ] **Step 3: 创建AnalyzeAgent**

```typescript
// src/agents/analyze-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import {
  RequirementParser,
  ContextLinker,
  ImpactAnalyzer,
  AmbiguityDetector,
} from '../analyzers/index.js';
import { logger } from '../utils/logger.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';

export interface Feature {
  name: string;
  priority: string;
  complexity: 'high' | 'medium' | 'low';
  role: string;
  action: string;
  value: string;
  acceptances: { given: string; when: string; then: string }[];
  relatedComponents: string;
  relatedApis: string;
  relatedModels: string;
}

export interface AnalyzeResult {
  title: string;
  type: string;
  priority: string;
  features: Feature[];
  impacts: { type: string; path: string; operation: string; description: string }[];
  constraints: string[];
  risks: string[];
  ambiguities: { description: string; suggestion: string }[];
  documentPath: string;
}

export class AnalyzeAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('AnalyzeAgent', context);
  }

  async execute(requirement: string): Promise<AgentResult<AnalyzeResult>> {
    try {
      logger.title('需求分析');

      const projectRoot = this.getProjectRoot();
      const memory = this.getMemory();

      // Step 1: 解析需求
      logger.step(1, 6, '解析需求...');
      const parser = new RequirementParser();
      const parsed = await parser.parse(requirement, projectRoot);
      logger.success(`需求类型: ${parsed.type}, 优先级: ${parsed.priority}`);

      // Step 2: 关联项目上下文
      logger.step(2, 6, '关联项目上下文...');
      const linker = new ContextLinker(memory);
      const contextResult = await linker.link(parsed.raw);
      logger.success(`发现 ${contextResult.links.length} 个关联项`);

      // Step 3: 影响分析
      logger.step(3, 6, '分析影响范围...');
      const impactAnalyzer = new ImpactAnalyzer();
      const impactResult = impactAnalyzer.analyze(parsed.raw, contextResult.links);
      logger.success(`影响 ${impactResult.items.length} 个文件/API`);

      // Step 4: 歧义检测
      logger.step(4, 6, '检测歧义...');
      const ambiguityDetector = new AmbiguityDetector();
      const ambiguities = ambiguityDetector.detect(parsed.raw);
      logger.success(`发现 ${ambiguities.length} 个待确认问题`);

      // Step 5: 生成功能点
      logger.step(5, 6, '拆分功能点...');
      const features = this.generateFeatures(parsed, contextResult);
      logger.success(`拆分出 ${features.length} 个功能点`);

      // Step 6: 生成文档
      logger.step(6, 6, '生成需求理解文档...');
      const documentPath = await this.generateDocument({
        parsed,
        features,
        impacts: impactResult.items,
        constraints: parsed.constraints,
        risks: impactResult.risks,
        ambiguities,
      });
      logger.success(`文档已保存: ${documentPath}`);

      return {
        success: true,
        data: {
          title: parsed.title,
          type: parsed.type,
          priority: parsed.priority,
          features,
          impacts: impactResult.items,
          constraints: parsed.constraints,
          risks: impactResult.risks,
          ambiguities: ambiguities.map(a => ({
            description: a.description,
            suggestion: a.suggestion,
          })),
          documentPath,
        },
        artifacts: [documentPath],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Error: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  private generateFeatures(
    parsed: any,
    contextResult: any
  ): Feature[] {
    const features: Feature[] = [];
    const lower = parsed.raw.toLowerCase();

    // 根据需求关键词生成功能点
    if (lower.includes('登录') || lower.includes('login')) {
      features.push({
        name: '账号密码登录',
        priority: 'P0',
        complexity: 'medium',
        role: '用户',
        action: '使用账号密码登录',
        value: '访问个人空间',
        acceptances: [
          { given: '用户在登录页面', when: '输入正确的账号密码并点击登录', then: '成功跳转到首页' },
          { given: '用户在登录页面', when: '输入错误的密码', then: '显示错误提示' },
        ],
        relatedComponents: 'LoginForm, Input, Button',
        relatedApis: 'POST /api/auth/login',
        relatedModels: 'User',
      });

      if (lower.includes('验证码') || lower.includes('短信')) {
        features.push({
          name: '手机验证码登录',
          priority: 'P1',
          complexity: 'medium',
          role: '用户',
          action: '使用手机验证码登录',
          value: '更便捷地登录',
          acceptances: [
            { given: '用户在登录页面', when: '输入手机号并获取验证码', then: '收到验证码短信' },
            { given: '用户在登录页面', when: '输入正确验证码并登录', then: '成功跳转到首页' },
          ],
          relatedComponents: 'LoginForm, CaptchaButton',
          relatedApis: 'POST /api/auth/sms-login, POST /api/auth/send-code',
          relatedModels: 'User',
        });
      }
    }

    // 如果没有识别到特定功能，创建通用功能点
    if (features.length === 0) {
      features.push({
        name: parsed.title,
        priority: parsed.priority,
        complexity: 'medium',
        role: '用户',
        action: parsed.description.slice(0, 50),
        value: '满足业务需求',
        acceptances: [
          { given: '系统正常运行', when: '执行该功能', then: '达到预期效果' },
        ],
        relatedComponents: contextResult.relatedComponents.map((c: any) => c.name).join(', ') || '待确定',
        relatedApis: contextResult.relatedApis.map((a: any) => a.path).join(', ') || '待确定',
        relatedModels: contextResult.relatedModels.map((m: any) => m.name).join(', ') || '待确定',
      });
    }

    return features;
  }

  private async generateDocument(data: {
    parsed: any;
    features: Feature[];
    impacts: any[];
    constraints: string[];
    risks: string[];
    ambiguities: any[];
  }): Promise<string> {
    const { parsed, features, impacts, constraints, risks, ambiguities } = data;

    const doc = `# 需求理解文档

## 1. 需求概述
- **原始需求**: ${parsed.title}
- **需求类型**: ${parsed.type}
- **优先级**: ${parsed.priority}

## 2. 功能点拆解
${features.map((f, i) => `
### 2.${i + 1} ${f.name} (${f.priority}, 复杂度: ${f.complexity})
- **用户故事**: 作为${f.role}，我希望${f.action}，以便${f.value}
- **验收标准**:
${f.acceptances.map(a => `  - Given ${a.given}\n  - When ${a.when}\n  - Then ${a.then}`).join('\n')}
- **关联组件**: ${f.relatedComponents}
- **关联API**: ${f.relatedApis}
- **关联Model**: ${f.relatedModels}
`).join('\n')}

## 3. 影响范围分析
| 类型 | 文件 | 操作 | 说明 |
|------|------|------|------|
${impacts.map(i => `| ${i.type} | ${i.path} | ${i.operation} | ${i.description} |`).join('\n')}

## 4. 技术约束
${constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : '- 无特殊约束'}

## 5. 风险点
${risks.length > 0 ? risks.map(r => `- ⚠️ ${r}`).join('\n') : '- 暂无明显风险'}

## 6. 待确认问题
${ambiguities.length > 0 ? ambiguities.map(a => `- [ ] **${a.description}**\n  - 建议: ${a.suggestion}`).join('\n') : '- 无待确认问题'}
`;

    const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
    const docPath = path.join(sessionsDir, `requirement-${Date.now()}.md`);
    await writeText(docPath, doc);

    return docPath;
  }
}
```

- [ ] **Step 4: 编写测试**

```typescript
// tests/agents/analyze-agent.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { MemoryManager } from '../../src/memory/index.js';
import { AnalyzeAgent } from '../../src/agents/analyze-agent.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-analyze-test-' + Date.now());
let memory: MemoryManager;

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(path.join(tmpDir, '.dev-flow', 'sessions'), { recursive: true });
  memory = new MemoryManager(tmpDir);
});

afterEach(async () => {
  memory.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('AnalyzeAgent', () => {
  it('analyzes login requirement', async () => {
    const agent = new AnalyzeAgent({
      projectRoot: tmpDir,
      memory,
      sessionId: 'test-session',
    });

    const result = await agent.execute('实现用户登录功能，支持账号密码登录');

    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('feature');
    expect(result.data?.features.length).toBeGreaterThan(0);
    expect(result.data?.features[0].name).toContain('登录');
  });

  it('detects ambiguities', async () => {
    const agent = new AnalyzeAgent({
      projectRoot: tmpDir,
      memory,
      sessionId: 'test-session',
    });

    const result = await agent.execute('实现登录功能，可能需要支持多种方式');

    expect(result.success).toBe(true);
    expect(result.data?.ambiguities.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: 运行测试**

Run: `npx vitest run tests/agents/analyze-agent.test.ts`
Expected: 所有测试通过

- [ ] **Step 6: 最终提交**

```bash
git add src/agents/analyze-agent.ts src/analyzers/ src/templates/ tests/agents/analyze-agent.test.ts
git commit -m "feat(agents): P4 complete - analyze agent with requirement parsing and context linking"
```
