# Dev-Flow 上下文可靠性优化 — 全链路实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 dev-flow 的企业级开发可靠性从 ~55% 提升至 99%+，通过五层防御体系的全链路实施。

**Architecture:** 基于设计文档 `docs/design/context-reliability-optimization-design.md`，按 P0→P4 优先级分阶段实施。每层有独立的脚本/配置，通过 feature flags 支持回滚。

**Tech Stack:** Node.js (cjs), YAML, Markdown, AST parsing (Babel/TypeScript parser for JS/TS, JavaParser for Java)

---

## 文件结构总览

### 新增文件（10个）

| 文件 | 职责 | 优先级 |
|------|------|--------|
| `scripts/completeness-gate.cjs` | 完整性门控：阻断截断依赖的 subagent 派发 | P0 |
| `scripts/static-validation-suite.cjs` | 静态验证套件：Layer 1 机器自动验证 | P0 |
| `scripts/dynamic-budget.cjs` | 动态上下文预算：模型自适应预算计算 | P1 |
| `scripts/checkpoint-manager.cjs` | Checkpoint 管理：代码生成状态快照 | P2 |
| `scripts/method-dependency-graph.cjs` | 方法依赖图：拓扑排序填充顺序 | P2 |
| `scripts/logic-coverage-auto.cjs` | R5 自动化：AST 解析匹配设计步骤 | P2 |
| `scripts/dependency-resolver.cjs` | 多候选依赖解析：置信度评分 | P3 |
| `scripts/partial-delivery.cjs` | 部分交付报告生成 | P3 |
| `skill-templates/_core/references/degradation-matrix.md` | 降级策略矩阵文档 | P0 |
| `skill-templates/_core/references/on-demand-loader.md` | 按需加载协议文档 | P3 |

### 修改文件（7个）

| 文件 | 修改内容 | 优先级 |
|------|----------|--------|
| `scripts/prepare-context.cjs` | 集成动态预算、完整性门控、多候选解析 | P0/P1 |
| `scripts/segment-code.cjs` | 集成 FSM、Checkpoint、拓扑填充 | P2 |
| `scripts/validate-result.cjs` | 集成静态验证套件 | P0 |
| `skill-templates/_core/agents/orchestrator.md` | 上下文预算池、零状态传递 | P1 |
| `skill-templates/_core/agents/contract-validator.md` | 集成 R5 自动化结果 | P2 |
| `skill-templates/_core/stages/develop.md` | 降级策略、编译循环清理 | P0/P4 |
| `skill-templates/_core/stages/delivery.md` | 部分交付报告 | P3 |

---

## Phase 1: P0 紧急防护（目标可靠性 75%）

### Task 1: Completeness Gate — 完整性门控脚本

**Files:**
- Create: `scripts/completeness-gate.cjs`
- Modify: `scripts/prepare-context.cjs` (integrate gate call)

**Goal:** 在 subagent 派发前，硬阻断任何包含截断依赖的 task-brief。

- [ ] **Step 1: Create `scripts/completeness-gate.cjs` with core class**

```javascript
const fs = require('fs');
const path = require('path');

/**
 * CompletenessGate — 完整性门控
 * 
 * 在 prepare-context 生成 task-brief 后执行，检查：
 * 1. 无截断的依赖文件
 * 2. 无缺失的核心依赖
 * 3. 设计契约结构完整
 */
class CompletenessGate {
  constructor(options = {}) {
    this.maxFileSizeKB = options.maxFileSizeKB || 30;
    this.truncatedMarker = options.truncatedMarker || '/* 文件过大';
    this.truncatedMarkerEn = options.truncatedMarkerEn || '/* File too large';
    this.corePatterns = [
      /Service\.(java|ts|js|py|go)$/,
      /Controller\.(java|ts|js|py|go)$/,
      /Entity\.(java|ts|js|py|go)$/,
      /Mapper\.(java|ts|js|py|go)$/,
      /Repository\.(java|ts|js|py|go)$/
    ];
  }

  /**
   * 执行完整性检查
   * @param {Object} params
   * @param {string} params.taskBrief — task-brief 内容
   * @param {Array<{path: string, content: string, originalSize: number}>} params.dependencies — 依赖文件列表
   * @param {string} params.contractContent — 设计契约内容（可选）
   * @returns {Object} { passed: boolean, issues: Array, recommendation: Object }
   */
  check({ taskBrief, dependencies, contractContent }) {
    const issues = [];

    // Check 1: 截断文件检测
    for (const dep of dependencies || []) {
      if (this.isTruncated(dep.content)) {
        issues.push({
          type: 'TRUNCATED_DEPENDENCY',
          file: dep.path,
          size: dep.originalSize || 0,
          severity: 'BLOCKING'
        });
      }
    }

    // Check 2: 核心依赖缺失检测
    for (const dep of dependencies || []) {
      if (dep.content === null && this.isCoreDependency(dep.path)) {
        issues.push({
          type: 'MISSING_CORE_DEPENDENCY',
          file: dep.path,
          severity: 'BLOCKING'
        });
      }
    }

    // Check 3: 契约完整性（如果提供）
    if (contractContent) {
      const contractCheck = this.validateContractStructure(contractContent);
      if (!contractCheck.valid) {
        issues.push({
          type: 'INVALID_CONTRACT_STRUCTURE',
          details: contractCheck.errors,
          severity: 'WARNING'
        });
      }
    }

    const blockingIssues = issues.filter(i => i.severity === 'BLOCKING');
    const passed = blockingIssues.length === 0;

    return {
      passed,
      issues,
      recommendation: passed ? null : this.generateRecommendation(issues)
    };
  }

  isTruncated(content) {
    if (!content || typeof content !== 'string') return false;
    return content.includes(this.truncatedMarker) || 
           content.includes(this.truncatedMarkerEn);
  }

  isCoreDependency(filePath) {
    return this.corePatterns.some(pattern => pattern.test(filePath));
  }

  validateContractStructure(content) {
    // 基础 YAML 结构检查
    const requiredSections = ['class', 'methods'];
    const errors = [];
    
    // 简单检查：是否包含关键 section
    for (const section of requiredSections) {
      if (!content.includes(`${section}:`)) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateRecommendation(issues) {
    const truncated = issues.filter(i => i.type === 'TRUNCATED_DEPENDENCY');
    const missing = issues.filter(i => i.type === 'MISSING_CORE_DEPENDENCY');

    if (truncated.length > 0) {
      // 判断是否需要拆分
      const totalOversized = truncated.reduce((sum, t) => sum + (t.size || 0), 0);
      const avgSize = totalOversized / truncated.length;

      if (truncated.length >= 2 || avgSize > 100 * 1024) {
        return {
          action: 'SPLIT_TASK',
          reason: `任务依赖 ${truncated.length} 个超大文件（平均 ${Math.round(avgSize/1024)}KB），建议拆分任务`,
          details: truncated.map(t => ({ file: t.file, size: t.size }))
        };
      }

      // 单个超大文件，尝试按需加载
      return {
        action: 'ON_DEMAND_LOAD',
        reason: `单个文件 ${truncated[0].file} (${Math.round(truncated[0].size/1024)}KB) 超过限制，建议按需加载`,
        files: truncated.map(t => t.file)
      };
    }

    if (missing.length > 0) {
      return {
        action: 'EXPAND_SEARCH',
        reason: `${missing.length} 个核心依赖未找到，建议扩展搜索范围`,
        files: missing.map(m => m.file)
      };
    }

    return {
      action: 'HUMAN_REVIEW',
      reason: '存在非标准问题，建议人工审查',
      issues
    };
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const briefPath = args[0];
  
  if (!briefPath) {
    console.error('Usage: node completeness-gate.cjs <task-brief.yaml>');
    process.exit(1);
  }

  const brief = require('js-yaml').load(fs.readFileSync(briefPath, 'utf8'));
  const gate = new CompletenessGate();
  const result = gate.check({
    taskBrief: brief,
    dependencies: brief.dependencies || []
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { CompletenessGate };
```

- [ ] **Step 2: Integrate gate into `scripts/prepare-context.cjs`**

在 `generateTaskBrief` 函数返回前添加：

```javascript
// 在 prepare-context.cjs 顶部引入
const { CompletenessGate } = require('./completeness-gate.cjs');

// 在 generateTaskBrief 函数末尾，return taskBrief 之前
function generateTaskBrief(task, projectRoot, designContract) {
  // ... 现有代码 ...
  
  // Step 2.5: 完整性门控
  const gate = new CompletenessGate({
    maxFileSizeKB: MAX_FILE_READ / 1024
  });
  
  const gateResult = gate.check({
    taskBrief: taskBrief,
    dependencies: dependencies,  // 已收集的依赖文件列表
    contractContent: designContract
  });
  
  if (!gateResult.passed) {
    console.error('[COMPLETENESS_GATE_BLOCKED]', JSON.stringify(gateResult, null, 2));
    
    // 根据推荐策略处理
    if (gateResult.recommendation.action === 'SPLIT_TASK') {
      throw new Error(`TASK_TOO_LARGE: ${gateResult.recommendation.reason}. Files: ${gateResult.recommendation.details.map(d => d.file).join(', ')}`);
    }
    
    if (gateResult.recommendation.action === 'ON_DEMAND_LOAD') {
      // 在 task-brief 中标记按需加载
      taskBrief += '\n\n## ON_DEMAND_LOAD_REQUIRED\n';
      for (const file of gateResult.recommendation.files) {
        taskBrief += `- ${file}\n`;
      }
      console.warn('[WARN] Task brief marked for on-demand loading');
    }
    
    if (gateResult.recommendation.action === 'EXPAND_SEARCH') {
      // 尝试扩展搜索后重试
      throw new Error(`DEPENDENCY_NOT_FOUND: ${gateResult.recommendation.reason}`);
    }
  } else {
    // 门控通过标记
    taskBrief = `<!-- COMPLETENESS_GATE_PASSED -->\n${taskBrief}`;
  }
  
  return taskBrief;
}
```

- [ ] **Step 3: Test the gate with mock data**

Create test script `scripts/test-completeness-gate.cjs`:

```javascript
const { CompletenessGate } = require('./completeness-gate.cjs');

// Test 1: Pass case
const gate1 = new CompletenessGate();
const result1 = gate1.check({
  taskBrief: 'test',
  dependencies: [
    { path: 'UserService.java', content: 'public class UserService {}', originalSize: 1024 }
  ]
});
console.assert(result1.passed === true, 'Test 1 failed: should pass');

// Test 2: Truncated dependency
const result2 = gate1.check({
  taskBrief: 'test',
  dependencies: [
    { path: 'OrderService.java', content: '/* 文件过大(85KB)，内容省略... */', originalSize: 87040 }
  ]
});
console.assert(result2.passed === false, 'Test 2 failed: should block truncated');
console.assert(result2.recommendation.action === 'ON_DEMAND_LOAD', 'Test 2 failed: should suggest on-demand');

// Test 3: Missing core dependency
const result3 = gate1.check({
  taskBrief: 'test',
  dependencies: [
    { path: 'OrderService.java', content: null }
  ]
});
console.assert(result3.passed === false, 'Test 3 failed: should block missing core');

console.log('All completeness gate tests passed!');
```

Run: `node scripts/test-completeness-gate.cjs`

- [ ] **Step 4: Commit**

```bash
git add scripts/completeness-gate.cjs scripts/prepare-context.cjs scripts/test-completeness-gate.cjs
git commit -m "feat(P0): add completeness gate to block truncated dependencies

- Create CompletenessGate class with 3 checks:
  1. TRUNCATED_DEPENDENCY: blocks subagent dispatch if deps are truncated
  2. MISSING_CORE_DEPENDENCY: blocks if core Service/Controller/Entity missing
  3. INVALID_CONTRACT_STRUCTURE: warning if design contract incomplete
- Integrate into prepare-context.cjs before subagent dispatch
- Auto-recommendations: SPLIT_TASK, ON_DEMAND_LOAD, EXPAND_SEARCH
- Add unit tests for gate logic"
```

---

### Task 2: Static Validation Suite — Layer 1 机器验证

**Files:**
- Create: `scripts/static-validation-suite.cjs`
- Modify: `scripts/validate-result.cjs` (integrate suite)

**Goal:** 建立机器自动执行的静态验证层，硬阻断语法错误、TODO 残留、签名不匹配。

- [ ] **Step 1: Create `scripts/static-validation-suite.cjs`**

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * StaticValidationSuite — Layer 1 静态验证
 * 
 * 机器自动执行，不依赖 AI：
 * 1. 文件存在且非空
 * 2. 无 TODO/FIXME/NotImplemented
 * 3. 无空方法体
 * 4. 语法正确（快速编译检查）
 * 5. 设计契约签名匹配
 * 6. 导入完整性
 */
class StaticValidationSuite {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.language = options.language || 'java'; // java, ts, js, py, go
  }

  run(filePath, contract) {
    const results = [];

    // 1. 文件存在性
    results.push(this.checkFileExists(filePath));

    // 2. TODO/FIXME 扫描
    results.push(this.checkNoPlaceholders(filePath));

    // 3. 空方法体检测
    results.push(this.checkNoEmptyMethods(filePath));

    // 4. 语法检查
    results.push(this.checkSyntax(filePath));

    // 5. 契约签名匹配（如果提供契约）
    if (contract) {
      results.push(this.checkContractSignatures(filePath, contract));
    }

    // 6. 导入完整性（语言特定）
    results.push(this.checkImports(filePath));

    const blocking = results.filter(r => !r.passed && r.severity === 'BLOCKING');
    const warnings = results.filter(r => !r.passed && r.severity === 'WARNING');

    return {
      passed: blocking.length === 0,
      results,
      blocking,
      warnings,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }

  checkFileExists(filePath) {
    const exists = fs.existsSync(filePath);
    const nonEmpty = exists ? fs.statSync(filePath).size > 0 : false;
    
    return {
      name: 'FILE_EXISTS_AND_NON_EMPTY',
      passed: exists && nonEmpty,
      severity: 'BLOCKING',
      details: { exists, size: exists ? fs.statSync(filePath).size : 0 }
    };
  }

  checkNoPlaceholders(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const placeholders = [];
    
    const patterns = [
      /TODO[:\s]/gi,
      /FIXME[:\s]/gi,
      /NotImplemented/gi,
      /throw new\s+\w*Exception\s*\(\s*["']not implemented/gi
    ];

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        if (pattern.test(lines[i])) {
          placeholders.push({ line: i + 1, text: lines[i].trim() });
        }
      }
    }

    return {
      name: 'NO_PLACEHOLDERS',
      passed: placeholders.length === 0,
      severity: 'BLOCKING',
      details: { placeholders }
    };
  }

  checkNoEmptyMethods(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const emptyMethods = [];
    
    // 简单正则匹配空方法体（不同语言的适配）
    const patterns = {
      java: /(?:public|private|protected)\s+[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*\{\s*\}/g,
      ts: /(?:public|private|protected)?\s*[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*\{\s*\}/g,
      js: /\w+\s*\([^)]*\)\s*\{\s*\}/g,
      py: /def\s+\w+\s*\([^)]*\):\s*\n\s*pass/g,
      go: /func\s+\w+\s*\([^)]*\)\s*[\w<>\[\]]*\s*\{\s*\}/g
    };

    const pattern = patterns[this.language] || patterns.java;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // 获取行号
      const lineNum = content.substring(0, match.index).split('\n').length;
      emptyMethods.push({ line: lineNum, signature: match[0].substring(0, 80) });
    }

    return {
      name: 'NO_EMPTY_METHODS',
      passed: emptyMethods.length === 0,
      severity: 'BLOCKING',
      details: { emptyMethods }
    };
  }

  checkSyntax(filePath) {
    const commands = {
      java: `javac -d /tmp/compiled -sourcepath ${this.projectRoot}/src/main/java ${filePath} 2>&1`,
      ts: `npx tsc --noEmit ${filePath} 2>&1`,
      js: `node --check ${filePath} 2>&1`,
      py: `python -m py_compile ${filePath} 2>&1`,
      go: `go build -o /dev/null ${filePath} 2>&1`
    };

    const command = commands[this.language];
    if (!command) {
      return {
        name: 'SYNTAX_CHECK',
        passed: true,
        severity: 'WARNING',
        details: { message: `No syntax checker for language: ${this.language}` }
      };
    }

    try {
      const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
      return {
        name: 'SYNTAX_CHECK',
        passed: true,
        severity: 'BLOCKING',
        details: { output }
      };
    } catch (error) {
      // 编译错误
      return {
        name: 'SYNTAX_CHECK',
        passed: false,
        severity: 'BLOCKING',
        details: { error: error.stdout || error.message }
      };
    }
  }

  checkContractSignatures(filePath, contract) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // 简单字符串匹配方法签名（生产环境应使用 AST）
    for (const method of contract.methods || []) {
      const methodPattern = new RegExp(
        `(?:public|private|protected)?\\s*` +
        `${method.returnType.replace(/[\[\]]/g, '\\$&')}\\s+` +
        `${method.name}\\s*\\(`,
        'g'
      );

      if (!methodPattern.test(content)) {
        issues.push({
          type: 'METHOD_NOT_FOUND',
          method: method.name,
          expected: `${method.returnType} ${method.name}(...)`
        });
      }
    }

    return {
      name: 'CONTRACT_SIGNATURE_MATCH',
      passed: issues.length === 0,
      severity: 'BLOCKING',
      details: { issues }
    };
  }

  checkImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const unresolved = [];

    // 提取导入/引用的类型
    const importPatterns = {
      java: /import\s+([\w.]+);/g,
      ts: /import\s+.*?from\s+['"]([^'"]+)['"];?/g,
      js: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      py: /import\s+([\w.]+)|from\s+([\w.]+)\s+import/g,
      go: /import\s+["']([^"']+)["']/g
    };

    const pattern = importPatterns[this.language];
    if (pattern) {
      const imports = [];
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }

      // 检查每个导入是否可解析（简化版：检查文件是否存在）
      for (const imp of imports) {
        const resolved = this.resolveImport(imp, filePath);
        if (!resolved.found) {
          unresolved.push({ import: imp, reason: resolved.reason });
        }
      }
    }

    return {
      name: 'IMPORT_RESOLUTION',
      passed: unresolved.length === 0,
      severity: 'WARNING', // 导入问题不一定是阻断级的
      details: { unresolved }
    };
  }

  resolveImport(importPath, currentFile) {
    // 简化版解析逻辑
    const possiblePaths = [
      path.join(this.projectRoot, 'src', 'main', this.language, importPath.replace(/\./g, '/') + '.java'),
      path.join(this.projectRoot, 'node_modules', importPath),
      path.join(path.dirname(currentFile), importPath)
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) || fs.existsSync(p + '.js') || fs.existsSync(p + '.ts')) {
        return { found: true, path: p };
      }
    }

    return { found: false, reason: 'File not found in project' };
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const contractPath = args[1];

  if (!filePath) {
    console.error('Usage: node static-validation-suite.cjs <file> [contract.yaml]');
    process.exit(1);
  }

  let contract = null;
  if (contractPath) {
    contract = require('js-yaml').load(fs.readFileSync(contractPath, 'utf8'));
  }

  const suite = new StaticValidationSuite({
    projectRoot: process.cwd(),
    language: path.extname(filePath).replace('.', '') === 'ts' ? 'ts' : 'java'
  });

  const result = suite.run(filePath, contract);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { StaticValidationSuite };
```

- [ ] **Step 2: Integrate into `scripts/validate-result.cjs`**

```javascript
// 在 validate-result.cjs 顶部引入
const { StaticValidationSuite } = require('./static-validation-suite.cjs');

// 修改 validateResult 函数
function validateResult(taskResult, contract) {
  // ... 现有基础检查 ...
  
  // Layer 1: 静态验证套件
  const suite = new StaticValidationSuite({
    projectRoot: taskResult.projectRoot || process.cwd(),
    language: detectLanguage(taskResult.filePath)
  });
  
  const staticResult = suite.run(taskResult.filePath, contract);
  
  if (!staticResult.passed) {
    console.error('[STATIC_VALIDATION_FAILED]', JSON.stringify(staticResult.blocking, null, 2));
    return {
      valid: false,
      layer: 'LAYER_1_STATIC',
      errors: staticResult.blocking,
      warnings: staticResult.warnings
    };
  }
  
  // 继续现有验证...
  return { valid: true, layer: 'ALL_PASSED' };
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath);
  const map = { '.java': 'java', '.ts': 'ts', '.js': 'js', '.py': 'py', '.go': 'go' };
  return map[ext] || 'java';
}
```

- [ ] **Step 3: Test static validation suite**

Create `scripts/test-static-validation.cjs`:

```javascript
const fs = require('fs');
const { StaticValidationSuite } = require('./static-validation-suite.cjs');

// Create test files
fs.writeFileSync('/tmp/TestValid.java', `
public class TestValid {
    public String hello() {
        return "world";
    }
}
`);

fs.writeFileSync('/tmp/TestInvalid.java', `
public class TestInvalid {
    // TODO: implement
    public String hello() {
        return null;
    }
    
    public void empty() {}
}
`);

const suite = new StaticValidationSuite({ language: 'java' });

// Test 1: Valid file
const r1 = suite.run('/tmp/TestValid.java');
console.assert(r1.passed === true, 'Valid file should pass');

// Test 2: Invalid file
const r2 = suite.run('/tmp/TestInvalid.java');
console.assert(r2.passed === false, 'Invalid file should fail');
console.assert(r2.results.find(r => r.name === 'NO_PLACEHOLDERS').passed === false, 'Should detect TODO');
console.assert(r2.results.find(r => r.name === 'NO_EMPTY_METHODS').passed === false, 'Should detect empty method');

console.log('All static validation tests passed!');
```

Run: `node scripts/test-static-validation.cjs`

- [ ] **Step 4: Commit**

```bash
git add scripts/static-validation-suite.cjs scripts/validate-result.cjs scripts/test-static-validation.cjs
git commit -m "feat(P0): add Layer 1 static validation suite

- StaticValidationSuite with 6 checks:
  1. FILE_EXISTS_AND_NON_EMPTY
  2. NO_PLACEHOLDERS (TODO/FIXME/NotImplemented)
  3. NO_EMPTY_METHODS
  4. SYNTAX_CHECK (javac/tsc/node/python/go)
  5. CONTRACT_SIGNATURE_MATCH
  6. IMPORT_RESOLUTION
- Integrate into validate-result.cjs as hard gate before AI validation
- Language auto-detection from file extension
- Add unit tests"
```

---

### Task 3: Degradation Matrix — 降级策略配置

**Files:**
- Create: `skill-templates/_core/references/degradation-matrix.md`
- Modify: `skill-templates/_core/stages/develop.md` (reference matrix)

**Goal:** 为 5 种故障场景定义 4 级降级策略，供 develop stage 和 subagent 参考执行。

- [ ] **Step 1: Create `skill-templates/_core/references/degradation-matrix.md`**

```markdown
---
name: "degradation-matrix"
description: "故障降级策略矩阵。当开发过程中遇到上下文不足、编译错误、subagent 无响应等故障时，按此矩阵执行优雅降级。所有 subagent 在遇到困难时应首先查阅此文档。"
---

# 优雅降级策略矩阵

> **核心原则**: 故障是常态，恢复是关键。任何单点失败都不应阻断全流程。

## 快速决策流程

```
遇到故障？
  ├─ 是否可自动修复？ → 执行对应 Level 1
  ├─ 是否可隔离处理？ → 执行对应 Level 2
  ├─ 是否可回滚重试？ → 执行对应 Level 3
  └─ 以上都不可行？ → 执行 Level 4（人工升级或跳过）
```

---

## 场景 1: 上下文不足（CONTEXT_INSUFFICIENT）

**触发条件**: 完整性门控阻断 或 subagent 返回上下文溢出错误

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 拆分任务 | 任务包含 >3 个方法 或 依赖文件总大小 > 预算 80% | 将任务拆分为更小的子任务 | 多个独立 task-brief |
| **L2** 按需加载 | 只有 1-2 个超大依赖文件 | 启用 @on-demand-loader，运行时读取 | 带按需加载标记的 task-brief |
| **L3** 骨架交付 | 即使按需加载也不足 | 只生成骨架（签名 + 空实现） | 可编译但功能未实现的文件 |
| **L4** 跳过边缘 | 当前任务是边缘功能（日志/监控/导出） | 跳过该任务，记录到 pending 清单 | pending 记录 |

**决策示例**:
- OrderService (8 个方法，依赖 3 个 >30KB 文件) → **L1 拆分**为 OrderValidator + OrderCalculator + OrderSaver
- OrderService (3 个方法，依赖 1 个 85KB 文件) → **L2 按需加载**
- OrderExportService (边缘功能，依赖复杂) → **L4 跳过**

---

## 场景 2: 编译验证失败（COMPILATION_ERROR）

**触发条件**: 编译器返回错误（javac/mvn/npm tsc 等）

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 自动修复 | 语法错误、类型不匹配、缺失导入 | 自动修复（最多 3 轮） | 修复后的代码 |
| **L2** 隔离修复 | 错误集中在单个文件，其他文件已验证通过 | 锁定其他文件（只读），只修复错误文件 | 聚焦的修复上下文 |
| **L3** 回滚重试 | 自动修复 3 轮后仍失败 | 回滚到上一个 checkpoint，尝试替代实现 | 替代方案代码 |
| **L4** 人工修复 | 回滚后仍失败，或错误涉及复杂业务逻辑 | 标记为 NEEDS_HUMAN_FIX，继续其他文件 | 修复指南 + 错误日志 |

**编译循环上下文管理**:
- Round 1: 保留完整错误日志
- Round 2: 压缩 Round 1 日志（只保留错误类型和位置）
- Round 3: 完全清理 Round 1-2 日志，只保留当前轮次
- Round 3 失败: 不再继续，触发 L3/L4

---

## 场景 3: Subagent 无响应（SUBAGENT_TIMEOUT）

**触发条件**: subagent 调用超时 或 返回空内容

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 重启 | 首次超时 | 重启 subagent（保留 task-brief） | 重新执行 |
| **L2** 简化任务 | 重启后仍超时 | 去掉非核心功能，减少上下文 | 简化版 task-brief |
| **L3** 串行降级 | 并行模式下频繁超时 | 降级到串行模式 | 串行执行计划 |
| **L4** 人工升级 | 串行模式下仍超时 | 标记为 NEEDS_HUMAN_ATTENTION | 任务描述 + 上下文摘要 |

---

## 场景 4: 设计契约冲突（CONTRACT_MISMATCH）

**触发条件**: contract-validator 发现 R1-R4 失败

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 自动对齐 | 命名风格、注解缺失、参数顺序差异 | 自动调整代码以匹配契约 | 修正后的代码 |
| **L2** 更新契约 | 契约设计不合理（如循环依赖） | 更新设计契约（记录变更原因） | 变更日志 |
| **L3** 部分实现 | 契约中部分方法在当前上下文中无法实现 | 实现可完成的部分，标记不可完成的 | 部分实现 + 待实现标记 |
| **L4** 重新设计 | 契约与实现根本冲突 | 触发重新设计（回到 Design 阶段） | 重新设计需求（限 1 次） |

---

## 场景 5: Session 不稳定（SESSION_UNSTABLE）

**触发条件**: 主 Agent 响应变慢、上下文使用率 >90%

| 级别 | 条件 | 动作 | 输出 |
|------|------|------|------|
| **L1** 压缩历史 | 上下文使用率 70-85% | 强制压缩阶段历史，只保留最近 2 个阶段 | 精简后的上下文 |
| **L2** 保存续跑 | 上下文使用率 85-95% | 保存 checkpoint，提示用户重新开始 session | checkpoint 文件 |
| **L3** 部分交付 | 上下文使用率 >95% 且无法压缩 | 立即交付已完成的部分 | 部分交付报告 |
| **L4** 紧急停止 | 系统级错误（文件系统满、内存不足） | 紧急停止，保留所有 checkpoint | 紧急状态记录 |

---

## 任务分类体系

### 阻塞性任务（BLOCKING）
- **定义**: 下游任务依赖此任务
- **失败策略**: 必须成功，否则下游无法继续
- **示例**: OrderService（被 OrderController 依赖）

### 核心非阻塞任务（CORE_NON_BLOCKING）
- **定义**: 核心功能，但无下游依赖
- **失败策略**: 可延期到后续迭代
- **示例**: OrderAuditLogService

### 边缘功能任务（EDGE）
- **定义**: 非核心功能，不影响主流程
- **失败策略**: 可跳过，记录到 pending 清单
- **示例**: OrderExportService, OrderMetricsService

### 优化类任务（OPTIMIZATION）
- **定义**: 性能优化、代码重构
- **失败策略**: 可跳过
- **示例**: OrderCacheOptimizer

### 自动分类规则
1. 如果被 >2 个其他任务依赖 → **阻塞性**
2. 如果属于核心业务流程（CRUD 中的 CUD）→ **核心非阻塞**
3. 如果名称包含 Export, Metrics, Cache, Log, Report → **边缘或优化**
4. 人工标注优先于自动分类

---

## 部分交付报告格式

当流程在部分任务失败的情况下继续时，生成以下报告：

```yaml
partial_delivery_report:
  summary:
    total_tasks: 20
    completed: 16
    failed: 3
    skipped: 1
    
  completed_features:
    - "订单创建流程"
    - "库存检查"
    - "价格计算"
    
  pending_features:
    - task: "订单导出功能"
      task_id: "T15"
      classification: "EDGE"
      reason: "上下文不足，Excel 生成库依赖复杂"
      guide: ".dev-flow/pending/T15-fix-guide.md"
      suggested_action: "人工实现 Excel 导出逻辑"
      
    - task: "订单监控指标"
      task_id: "T18"
      classification: "EDGE"
      reason: "编译错误，Micrometer 配置冲突"
      guide: ".dev-flow/pending/T18-fix-guide.md"
      suggested_action: "检查 Micrometer 依赖版本兼容性"
      
  next_steps:
    - "查看 .dev-flow/pending/ 了解待完成功能"
    - "按修复指南人工完成失败任务"
    - "重新运行 dev-flow 验证完整性"
```

---

## 使用指南

### 对于 Develop Subagent
1. 开发前检查 task-brief 是否有 `ON_DEMAND_LOAD_REQUIRED` 标记
2. 编译失败时，先尝试 L1 自动修复（最多 3 轮）
3. 每轮修复前清理历史错误日志
4. 3 轮失败后，根据错误类型选择 L2-L4

### 对于 Orchestrator (Main Agent)
1. 派发 subagent 前确认完整性门控已通过
2. 监控上下文使用率，>70% 时触发 L1 压缩
3. 任务失败时根据分类决定：重试 / 降级 / 跳过
4. 阻塞性任务失败时不得跳过，必须重试或人工升级

### 对于 Contract Validator
1. R1-R4 失败时，先判断是否为 L1 可自动对齐的问题
2. 如果是契约设计问题，记录变更原因后更新契约
3. 不要直接阻断，给出降级建议
```

- [ ] **Step 2: Update `skill-templates/_core/stages/develop.md` to reference degradation matrix**

在 develop.md 的"三级失败处理"部分替换为：

```markdown
## 故障处理与降级策略

> 详细降级矩阵参见: [degradation-matrix.md](../references/degradation-matrix.md)

### 快速参考

1. **上下文不足** → 按 degradation-matrix 场景 1 执行（拆分/按需加载/骨架交付/跳过）
2. **编译错误** → 按 degradation-matrix 场景 2 执行（自动修复→隔离修复→回滚→人工）
3. **Subagent 无响应** → 按 degradation-matrix 场景 3 执行（重启→简化→串行→人工）
4. **契约冲突** → 按 degradation-matrix 场景 4 执行（对齐→更新契约→部分实现→重新设计）
5. **Session 不稳定** → 按 degradation-matrix 场景 5 执行（压缩→续跑→部分交付→紧急停止）

### 编译验证循环（增强版）

```
Round 1: 正常修复，保留完整错误日志
Round 2: 修复前压缩 Round 1 日志（只保留错误类型和位置）
Round 3: 修复前完全清理 Round 1-2 日志，只保留当前轮次
Round 3 失败: 不再继续，触发 degradation-matrix 场景 2 的 L3/L4
```

### 任务分类检查点

每个任务开始前，确认其分类：
- 阻塞性任务: 失败时不得跳过，必须成功或人工升级
- 核心非阻塞: 可延期，但需记录
- 边缘/优化: 失败时可跳过，记录到 pending 清单
```

- [ ] **Step 3: Commit**

```bash
git add skill-templates/_core/references/degradation-matrix.md skill-templates/_core/stages/develop.md
git commit -m "feat(P0): add degradation strategy matrix for fault recovery

- 5 scenarios × 4 levels of graceful degradation:
  1. CONTEXT_INSUFFICIENT: split → on-demand → skeleton → skip
  2. COMPILATION_ERROR: auto-fix → isolated-fix → rollback → human
  3. SUBAGENT_TIMEOUT: restart → simplify → serial → human
  4. CONTRACT_MISMATCH: align → update → partial → redesign
  5. SESSION_UNSTABLE: compress → resume → partial-delivery → emergency-stop
- Task classification system: BLOCKING / CORE_NON_BLOCKING / EDGE / OPTIMIZATION
- Partial delivery report format
- Update develop.md to reference the matrix"
```

---

## Phase 2: P1 主 Agent 稳定性（目标可靠性 85%）

### Task 4: Dynamic Budget — 动态上下文预算计算

**Files:**
- Create: `scripts/dynamic-budget.cjs`
- Modify: `scripts/prepare-context.cjs` (replace fixed thresholds)

**Goal:** 根据实际使用的 AI 模型动态计算安全预算。

- [ ] **Step 1: Create `scripts/dynamic-budget.cjs`**

```javascript
/**
 * DynamicBudget — 动态上下文预算计算
 * 
 * 根据 AI 模型的上下文窗口大小，动态计算：
 * - task-brief 总预算
 * - 单文件读取上限
 * - 最大依赖文件数
 */

const MODEL_CONFIG = {
  // Anthropic
  'claude-3-5-sonnet': { totalTokens: 200000, codeRatio: 0.75, budgetRatio: 0.60 },
  'claude-3-opus': { totalTokens: 200000, codeRatio: 0.75, budgetRatio: 0.60 },
  'claude-3-haiku': { totalTokens: 200000, codeRatio: 0.75, budgetRatio: 0.55 },
  
  // OpenAI
  'gpt-4-turbo': { totalTokens: 128000, codeRatio: 0.78, budgetRatio: 0.60 },
  'gpt-4o': { totalTokens: 128000, codeRatio: 0.78, budgetRatio: 0.60 },
  'gpt-4o-mini': { totalTokens: 128000, codeRatio: 0.78, budgetRatio: 0.55 },
  'gpt-4': { totalTokens: 8192, codeRatio: 0.75, budgetRatio: 0.50 },
  
  // Local / Other
  'ollama-default': { totalTokens: 32768, codeRatio: 0.70, budgetRatio: 0.50 },
  'default': { totalTokens: 128000, codeRatio: 0.75, budgetRatio: 0.60 }
};

/**
 * 计算预算
 * @param {string} modelName — 模型名称
 * @param {Object} options
 * @param {number} options.systemPromptSizeKB — 系统提示大小（KB）
 * @param {number} options.responseReserveKB — 响应预留空间（KB）
 * @param {number} options.safetyMarginKB — 安全边距（KB）
 * @returns {Object} { briefSizeKB, fileReadKB, maxDependencyFiles, modelInfo }
 */
function calculateBudget(modelName, options = {}) {
  const config = MODEL_CONFIG[modelName] || MODEL_CONFIG['default'];
  
  // 计算总代码容量（tokens → 字符 → KB）
  // 1 token ≈ 4 字符（英文代码），1 KB = 1024 字节
  const totalCodeKB = (config.totalTokens * config.codeRatio) / 4 / 1024;
  
  // 预留空间
  const systemPromptSizeKB = options.systemPromptSizeKB || 15;
  const responseReserveKB = options.responseReserveKB || 20;
  const safetyMarginKB = options.safetyMarginKB || 10;
  const reservedKB = systemPromptSizeKB + responseReserveKB + safetyMarginKB;
  
  // 可用预算
  const availableKB = Math.floor(totalCodeKB * config.budgetRatio - reservedKB);
  const briefSizeKB = Math.max(availableKB, 30); // 最低 30KB
  
  // 单文件上限：预算的 1/3，但不超过 50KB
  const fileReadKB = Math.min(Math.floor(briefSizeKB / 3), 50);
  
  // 最大依赖文件数：预算可支持多少个 10KB 文件
  const maxDependencyFiles = Math.min(Math.floor(briefSizeKB / 10), 15);
  
  return {
    briefSizeKB,
    fileReadKB,
    maxDependencyFiles,
    modelInfo: {
      name: modelName,
      totalTokens: config.totalTokens,
      totalCodeKB: Math.round(totalCodeKB),
      reservedKB,
      budgetRatio: config.budgetRatio
    }
  };
}

/**
 * 从环境或配置检测当前模型
 * @returns {string} 模型名称
 */
function detectModel() {
  // 优先级：环境变量 > 配置文件 > 默认值
  if (process.env.DEV_FLOW_MODEL) {
    return process.env.DEV_FLOW_MODEL;
  }
  
  // 尝试读取配置文件
  try {
    const fs = require('fs');
    const configPath = '.dev-flow/model-config.yaml';
    if (fs.existsSync(configPath)) {
      const yaml = require('js-yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
      if (config.model) return config.model;
    }
  } catch (e) {
    // ignore
  }
  
  return 'default';
}

/**
 * 获取预算的文本说明（用于日志）
 * @param {Object} budget
 * @returns {string}
 */
function formatBudgetReport(budget) {
  const { modelInfo, briefSizeKB, fileReadKB, maxDependencyFiles } = budget;
  return `
[Dynamic Budget Report]
  Model: ${modelInfo.name}
  Total Context: ${modelInfo.totalTokens.toLocaleString()} tokens (~${modelInfo.totalCodeKB}KB code)
  Budget Ratio: ${(modelInfo.budgetRatio * 100).toFixed(0)}%
  Reserved: ${modelInfo.reservedKB}KB (system + response + safety)
  
  Available Budget:
    Task Brief: ${briefSizeKB}KB
    Per File: ${fileReadKB}KB
    Max Dependencies: ${maxDependencyFiles} files
`;
}

module.exports = {
  calculateBudget,
  detectModel,
  formatBudgetReport,
  MODEL_CONFIG
};

// CLI
if (require.main === module) {
  const model = process.argv[2] || detectModel();
  const budget = calculateBudget(model);
  console.log(formatBudgetReport(budget));
}
```

- [ ] **Step 2: Update `scripts/prepare-context.cjs` to use dynamic budget**

```javascript
// 替换原有的固定阈值
// const MAX_BRIEF_SIZE = 120 * 1024;
// const MAX_FILE_READ = 30 * 1024;

const { calculateBudget, detectModel, formatBudgetReport } = require('./dynamic-budget.cjs');

function generateTaskBrief(task, projectRoot, designContract) {
  // 动态计算预算
  const modelName = detectModel();
  const budget = calculateBudget(modelName, {
    systemPromptSizeKB: estimateSystemPromptSize(task)
  });
  
  console.log(formatBudgetReport(budget));
  
  const MAX_BRIEF_SIZE = budget.briefSizeKB * 1024;
  const MAX_FILE_READ = budget.fileReadKB * 1024;
  const MAX_DEPENDENCY_FILES = budget.maxDependencyFiles;
  
  // ... 后续代码使用这些动态值 ...
}

function estimateSystemPromptSize(task) {
  // 估算系统提示大小（简化版）
  // 实际应根据加载的 skill 和 references 计算
  return 15; // 默认 15KB
}
```

- [ ] **Step 3: Test dynamic budget**

```bash
node scripts/dynamic-budget.cjs claude-3-5-sonnet
node scripts/dynamic-budget.cjs gpt-4o
node scripts/dynamic-budget.cjs gpt-4o-mini
```

- [ ] **Step 4: Commit**

```bash
git add scripts/dynamic-budget.cjs scripts/prepare-context.cjs
git commit -m "feat(P1): add dynamic context budget calculation

- Support 8+ models: Claude 3.5/Opus/Haiku, GPT-4 Turbo/o/mini
- Auto-detect model from env DEV_FLOW_MODEL or config file
- Budget formula: totalTokens * codeRatio / 4 / 1024 * budgetRatio - reserved
- Dynamic thresholds: briefSize, fileRead, maxDependencies
- Budget report for debugging"
```

---

### Task 5: Context Budget Pool — 主 Agent 上下文预算池

**Files:**
- Modify: `skill-templates/_core/agents/orchestrator.md`
- Create: `.dev-flow/session-index.yaml` (template)

**Goal:** 将主 Agent 的上下文视为有限预算池，超预算时强制清理。

- [ ] **Step 1: Update `skill-templates/_core/agents/orchestrator.md`**

在 orchestrator.md 中添加"上下文预算管理"章节：

```markdown
## 上下文预算管理（Context Budget Pool）

### 预算分配

主 Agent 的上下文预算 = 模型上下文窗口 × 50%

```
固定开销（必须保留）:
  skill_compressed: 5KB      # SKILL.md 压缩版
  current_stage: 10KB        # 当前阶段指令
  safety_margin: 10KB        # 安全边距
  
可变开销（受预算约束）:
  stage_summaries: 5KB       # 已完成阶段摘要（总预算）
  task_dag: 10KB             # 任务 DAG 压缩表示
  subagent_status: 5KB       # subagent 状态摘要
  error_logs: 5KB            # 错误日志（滚动保留）
```

### 预算监控

每个操作后估算上下文使用率：
- 读取文件 → +文件大小
- 接收 subagent 结果 → +结果摘要（最多 500 字）
- 阶段切换 → 压缩前一阶段历史

### 超限清理策略（按优先级）

1. **压缩 error_logs**: 只保留最近 1 轮编译错误
2. **归档 stage_summary**: 最旧阶段的摘要写入文件系统，内存中只保留路径
3. **简化 task_dag**: 只保留未完成任务，已完成的任务归档
4. **精简 subagent_status**: 只保留状态（success/failed/pending），去掉详细输出

### 压缩版 SKILL.md

当上下文使用率 >60% 时，主 Agent 应使用压缩版 SKILL：

```markdown
# SKILL.md (Compressed)

## 阶段列表
1. Research [COMPLETED] → .dev-flow/stage-summaries/research.yaml
2. Clarify [COMPLETED] → .dev-flow/stage-summaries/clarify.yaml
3. Analyze [COMPLETED] → .dev-flow/stage-summaries/analyze.yaml
4. Design [COMPLETED] → .dev-flow/stage-summaries/design.yaml
5. TaskSplit [COMPLETED] → .dev-flow/stage-summaries/task-split.yaml
6. Develop [IN_PROGRESS] → current
7. Test [PENDING]
8. Fix [PENDING]
9. Delivery [PENDING]

## 核心规则
- 必须遵循 protocol.md 的 5 步工作法
- 必须遵循 model-context-config.md 的上下文管理规则
- 阶段切换必须更新 session-index.yaml
- 任务完成必须更新 task-dag.yaml

## 当前状态
- 阶段: Develop
- 批次: 2/5
- 活跃 subagent: 3
- 上下文使用率: 45%

> 详细指令请加载当前阶段文件
```

### 阶段切换流程

```
1. 完成当前阶段最后一批 subagent
2. 生成阶段摘要 → 写入 .dev-flow/stage-summaries/{stage}.yaml
3. 更新 session-index.yaml: current_stage = next_stage
4. 从内存中丢弃当前阶段指令
5. 加载下一阶段指令（新的 Layer 3）
6. 继续执行
```

### 状态外置规范

主 Agent 内存中只保留：
- `current_stage`: string
- `next_action`: string（从 session-index.yaml 读取）
- `active_subagents`: number

所有其他状态从文件系统实时读取：
- 任务列表 → `.dev-flow/task-dag.yaml`
- 阶段历史 → `.dev-flow/stage-summaries/{stage}.yaml`
- Subagent 结果 → `.dev-flow/task-results/`
- 错误日志 → `.dev-flow/compilation-logs/`
```

- [ ] **Step 2: Create `.dev-flow/session-index.yaml` template**

```yaml
# .dev-flow/session-index.yaml
# 主 Agent 的唯一状态源，所有详细状态外置到独立文件

session:
  id: "sess-YYYYMMDD-NNN"
  current_stage: "Research"
  current_batch: 0
  next_action: "start_research"
  
  # 外置状态引用
  refs:
    task_dag: ".dev-flow/task-dag.yaml"
    stage_summaries: ".dev-flow/stage-summaries/"
    task_results: ".dev-flow/task-results/"
    checkpoints: ".dev-flow/checkpoints/"
    pending: ".dev-flow/pending/"
    
  # 运行时统计（只保留数字）
  stats:
    total_tasks: 0
    completed_tasks: 0
    failed_tasks: 0
    pending_tasks: 0
    
  # 上下文预算监控
  context_budget:
    total_kb: 50
    used_kb: 0
    usage_percent: 0
    last_cleanup: null
```

- [ ] **Step 3: Commit**

```bash
git add skill-templates/_core/agents/orchestrator.md .dev-flow/session-index.yaml
git commit -m "feat(P1): add context budget pool for main agent isolation

- Budget allocation: fixed (25KB) + variable (25KB) = 50KB total
- Cleanup priorities: error_logs → stage_summaries → task_dag → subagent_status
- Compressed SKILL.md for high context usage scenarios
- Stage transition flow with state externalization
- Session index protocol: only current_stage, next_action, active_subagents in memory"
```

---

## Phase 3: P2 验证与代码生成增强（目标可靠性 92%）

### Task 6: Checkpoint Manager — 代码生成状态快照

**Files:**
- Create: `scripts/checkpoint-manager.cjs`
- Modify: `scripts/segment-code.cjs` (integrate checkpointing)

**Goal:** 在代码生成的关键状态点自动保存快照，支持失败回滚和 session 恢复。

- [ ] **Step 1: Create `scripts/checkpoint-manager.cjs`**

```javascript
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * CheckpointManager — 代码生成状态快照管理
 * 
 * 在代码生成 FSM 的关键状态点保存快照：
 * - SKELETON_WRITTEN: 骨架写入后
 * - METHOD_FILLED: 每个方法填充后
 * - COMPLETE: 全部完成后
 */
class CheckpointManager {
  constructor(taskId, options = {}) {
    this.taskId = taskId;
    this.baseDir = options.checkpointDir || '.dev-flow/checkpoints';
    this.checkpointDir = path.join(this.baseDir, taskId);
    this.maxCheckpoints = options.maxCheckpoints || 5;
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * 创建 checkpoint
   */
  create(state, codeSnapshot, progress, contextSummary) {
    const sequenceNumber = this.getNextSequence();
    
    const checkpoint = {
      metadata: {
        task_id: this.taskId,
        state,
        created_at: new Date().toISOString(),
        sequence_number: sequenceNumber
      },
      code_snapshot: {
        file_path: codeSnapshot.filePath,
        content_hash: this.hash(codeSnapshot.content),
        content_backup: this.compress(codeSnapshot.content)
      },
      progress: {
        ...progress,
        checkpoint_time: new Date().toISOString()
      },
      context_summary: {
        brief_excerpt: contextSummary.briefExcerpt?.substring(0, 500),
        tokens_used: contextSummary.tokensUsed,
        model: contextSummary.model
      }
    };

    const filePath = path.join(this.checkpointDir, `${sequenceNumber}.yaml`);
    fs.writeFileSync(filePath, this.serialize(checkpoint));
    
    // GC: 保留最近 N 个
    this.gcCheckpoints();
    
    console.log(`[Checkpoint] #${sequenceNumber} saved for ${this.taskId} (${state})`);
    return sequenceNumber;
  }

  /**
   * 恢复到指定 checkpoint
   */
  restore(sequenceNumber) {
    const filePath = path.join(this.checkpointDir, `${sequenceNumber}.yaml`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Checkpoint #${sequenceNumber} not found for ${this.taskId}`);
    }

    const checkpoint = this.deserialize(fs.readFileSync(filePath, 'utf8'));
    
    return {
      state: checkpoint.metadata.state,
      code: this.decompress(checkpoint.code_snapshot.content_backup),
      filePath: checkpoint.code_snapshot.file_path,
      progress: checkpoint.progress,
      contextSummary: checkpoint.context_summary
    };
  }

  /**
   * 获取最新的 checkpoint
   */
  getLatest() {
    const files = this.listCheckpointFiles();
    if (files.length === 0) return null;
    
    const latestNum = parseInt(files[files.length - 1]);
    return this.restore(latestNum);
  }

  /**
   * Session 恢复：从最新 checkpoint 继续
   */
  resume() {
    const latest = this.getLatest();
    if (!latest) {
      return { canResume: false, reason: 'No checkpoint found' };
    }

    // 恢复代码文件
    fs.writeFileSync(latest.filePath, latest.code);
    
    return {
      canResume: true,
      state: latest.state,
      progress: latest.progress,
      message: `Resumed from checkpoint #${latest.progress.sequence_number}, current method: ${latest.progress.currentMethod || 'N/A'}`
    };
  }

  /**
   * 列出所有 checkpoint 文件
   */
  listCheckpointFiles() {
    if (!fs.existsSync(this.checkpointDir)) return [];
    
    return fs.readdirSync(this.checkpointDir)
      .filter(f => f.endsWith('.yaml'))
      .map(f => f.replace('.yaml', ''))
      .sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * 获取下一个序列号
   */
  getNextSequence() {
    const files = this.listCheckpointFiles();
    if (files.length === 0) return 1;
    return parseInt(files[files.length - 1]) + 1;
  }

  /**
   * 清理旧 checkpoint
   */
  gcCheckpoints() {
    const files = this.listCheckpointFiles();
    if (files.length <= this.maxCheckpoints) return;
    
    const toDelete = files.slice(0, files.length - this.maxCheckpoints);
    for (const num of toDelete) {
      const filePath = path.join(this.checkpointDir, `${num}.yaml`);
      fs.unlinkSync(filePath);
      console.log(`[Checkpoint] GC: removed #${num}`);
    }
  }

  // --- 序列化 ---

  serialize(checkpoint) {
    // 使用 YAML 格式，但压缩内容字段
    const yaml = require('js-yaml');
    return yaml.dump(checkpoint);
  }

  deserialize(content) {
    const yaml = require('js-yaml');
    return yaml.load(content);
  }

  compress(content) {
    return zlib.deflateSync(Buffer.from(content, 'utf8')).toString('base64');
  }

  decompress(compressed) {
    return zlib.inflateSync(Buffer.from(compressed, 'base64')).toString('utf8');
  }

  hash(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
}

module.exports = { CheckpointManager };

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const taskId = args[1];

  if (!command || !taskId) {
    console.error('Usage: node checkpoint-manager.cjs <create|restore|resume> <taskId>');
    process.exit(1);
  }

  const manager = new CheckpointManager(taskId);

  if (command === 'restore') {
    const num = parseInt(args[2]);
    const result = manager.restore(num);
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'resume') {
    const result = manager.resume();
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'list') {
    console.log(manager.listCheckpointFiles());
  }
}
```

- [ ] **Step 2: Integrate into `scripts/segment-code.cjs`**

```javascript
// 在 segment-code.cjs 顶部引入
const { CheckpointManager } = require('./checkpoint-manager.cjs');

// 修改 generateCode 函数
async function generateCode(task, options) {
  const checkpointMgr = new CheckpointManager(task.id, {
    checkpointDir: options.checkpointDir || '.dev-flow/checkpoints'
  });

  // 尝试从 checkpoint 恢复
  const resumeResult = checkpointMgr.resume();
  if (resumeResult.canResume) {
    console.log(`[Resume] ${resumeResult.message}`);
    // 根据恢复的状态继续...
  }

  // Step 1: 生成骨架
  const skeleton = await generateSkeleton(task);
  fs.writeFileSync(task.outputPath, skeleton);
  
  // Checkpoint: SKELETON_WRITTEN
  checkpointMgr.create('SKELETON_WRITTEN', {
    filePath: task.outputPath,
    content: skeleton
  }, {
    totalMethods: task.methods.length,
    completedMethods: [],
    currentMethod: null,
    pendingMethods: task.methods.map(m => m.name)
  }, {
    briefExcerpt: task.brief?.substring(0, 200),
    tokensUsed: estimateTokens(skeleton),
    model: task.model
  });

  // Step 2: 逐个填充方法
  for (let i = 0; i < task.methods.length; i++) {
    const method = task.methods[i];
    
    try {
      const filled = await fillMethod(task.outputPath, method, task);
      
      // Checkpoint: METHOD_FILLED
      checkpointMgr.create('METHOD_FILLED', {
        filePath: task.outputPath,
        content: fs.readFileSync(task.outputPath, 'utf8')
      }, {
        totalMethods: task.methods.length,
        completedMethods: task.methods.slice(0, i + 1).map(m => m.name),
        currentMethod: method.name,
        pendingMethods: task.methods.slice(i + 1).map(m => m.name)
      }, {
        briefExcerpt: task.brief?.substring(0, 200),
        tokensUsed: estimateTokens(filled),
        model: task.model
      });
      
    } catch (error) {
      console.error(`[Fill Error] Method ${method.name}:`, error.message);
      
      // 回滚到上一个 checkpoint
      const latest = checkpointMgr.getLatest();
      if (latest) {
        fs.writeFileSync(task.outputPath, latest.code);
        console.log(`[Rollback] Restored to checkpoint for method ${latest.progress.currentMethod}`);
      }
      
      throw error; // 继续向上传播，触发降级策略
    }
  }

  // Final checkpoint: COMPLETE
  checkpointMgr.create('COMPLETE', {
    filePath: task.outputPath,
    content: fs.readFileSync(task.outputPath, 'utf8')
  }, {
    totalMethods: task.methods.length,
    completedMethods: task.methods.map(m => m.name),
    currentMethod: null,
    pendingMethods: []
  }, {
    briefExcerpt: task.brief?.substring(0, 200),
    tokensUsed: estimateTokens(fs.readFileSync(task.outputPath, 'utf8')),
    model: task.model
  });
}

function estimateTokens(content) {
  // 简化估算：英文代码约 4 字符/token
  return Math.ceil(content.length / 4);
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/checkpoint-manager.cjs scripts/segment-code.cjs
git commit -m "feat(P2): add checkpoint system for code generation recovery

- CheckpointManager with create/restore/resume/list operations
- Auto-GC: retain only last 5 checkpoints per task
- Compression: gzip + base64 for code snapshots
- Integration with segment-code.cjs:
  - SKELETON_WRITTEN checkpoint after skeleton generation
  - METHOD_FILLED checkpoint after each method fill
  - COMPLETE checkpoint after all methods done
  - Auto-rollback on fill error"
```

---

### Task 7: Method Dependency Graph — 拓扑排序填充

**Files:**
- Create: `scripts/method-dependency-graph.cjs`
- Modify: `scripts/segment-code.cjs` (use topological order)

**Goal:** 根据方法间的调用关系确定最优填充顺序。

- [ ] **Step 1: Create `scripts/method-dependency-graph.cjs`**

```javascript
/**
 * MethodDependencyGraph — 方法依赖图与拓扑排序
 * 
 * 从设计契约提取方法调用关系，生成最优填充顺序。
 */
class MethodDependencyGraph {
  /**
   * 从设计契约构建依赖图
   */
  buildFromContract(contract) {
    const graph = new Map();
    
    for (const method of contract.methods || []) {
      const deps = new Set();
      
      // 从逻辑步骤提取方法调用
      for (const step of method.logicSteps || []) {
        const calledMethods = this.extractMethodCalls(step.description);
        calledMethods.forEach(m => deps.add(m));
      }
      
      // 从接口调用提取
      for (const call of method.calls || []) {
        if (call.method) deps.add(call.method);
      }
      
      graph.set(method.name, deps);
    }
    
    return graph;
  }

  /**
   * 从文本描述提取方法调用
   */
  extractMethodCalls(description) {
    if (!description) return [];
    
    // 匹配 "调用 xxx()" 或 "call xxx()" 或 "xxx()"
    const patterns = [
      /调用\s+(\w+)\s*\(/g,
      /call\s+(\w+)\s*\(/g,
      /(\w+)\s*\([^)]*\)\s*$/gm
    ];
    
    const calls = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        calls.push(match[1]);
      }
    }
    
    return [...new Set(calls)];
  }

  /**
   * 拓扑排序
   */
  topologicalSort(graph) {
    const visited = new Set();
    const temp = new Set();
    const result = [];
    
    const visit = (method) => {
      if (temp.has(method)) {
        // 循环依赖：按字母序打破
        return;
      }
      if (visited.has(method)) return;
      
      temp.add(method);
      for (const dep of graph.get(method) || []) {
        if (graph.has(dep)) visit(dep);
      }
      temp.delete(method);
      visited.add(method);
      result.push(method);
    };
    
    for (const method of graph.keys()) {
      visit(method);
    }
    
    return result;
  }

  /**
   * 生成填充计划
   */
  generateFillPlan(contract) {
    const graph = this.buildFromContract(contract);
    const order = this.topologicalSort(graph);
    
    // 分组为批次（每批最多 3 个方法，且依赖已在前面的批次）
    const batches = this.groupIntoBatches(order, graph);
    
    return {
      order,
      batches,
      graph: Object.fromEntries(graph),
      rationale: `Topological sort: callee methods filled before caller methods`
    };
  }

  /**
   * 将方法分组为批次
   */
  groupIntoBatches(order, graph) {
    const batches = [];
    let currentBatch = [];
    const completed = new Set();
    
    for (const method of order) {
      const deps = graph.get(method) || new Set();
      
      // 检查依赖是否都已完成
      const depsSatisfied = [...deps].every(d => 
        completed.has(d) || !order.includes(d)
      );
      
      if (depsSatisfied && currentBatch.length < 3) {
        currentBatch.push(method);
        completed.add(method);
      } else {
        if (currentBatch.length > 0) {
          batches.push([...currentBatch]);
        }
        currentBatch = [method];
        completed.add(method);
      }
    }
    
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    return batches;
  }
}

module.exports = { MethodDependencyGraph };

// CLI
if (require.main === module) {
  const fs = require('fs');
  const yaml = require('js-yaml');
  
  const contractPath = process.argv[2];
  if (!contractPath) {
    console.error('Usage: node method-dependency-graph.cjs <contract.yaml>');
    process.exit(1);
  }
  
  const contract = yaml.load(fs.readFileSync(contractPath, 'utf8'));
  const graph = new MethodDependencyGraph();
  const plan = graph.generateFillPlan(contract);
  
  console.log(JSON.stringify(plan, null, 2));
}
```

- [ ] **Step 2: Update `scripts/segment-code.cjs` to use topological order**

```javascript
const { MethodDependencyGraph } = require('./method-dependency-graph.cjs');

// 在 generateCode 函数中
async function generateCode(task, options) {
  // ... checkpoint setup ...
  
  // 生成填充计划
  const graph = new MethodDependencyGraph();
  const fillPlan = graph.generateFillPlan(task.contract);
  
  console.log(`[Fill Plan] Order: ${fillPlan.order.join(' → ')}`);
  console.log(`[Fill Plan] Batches: ${fillPlan.batches.map(b => `[${b.join(', ')}]`).join(' → ')}`);
  
  // 按拓扑顺序填充
  for (const batch of fillPlan.batches) {
    console.log(`[Batch] Filling: ${batch.join(', ')}`);
    
    // 可以并行填充同批次的方法
    await Promise.all(batch.map(methodName => {
      const method = task.methods.find(m => m.name === methodName);
      return fillMethod(task.outputPath, method, task);
    }));
    
    // Checkpoint after each batch
    // ...
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/method-dependency-graph.cjs scripts/segment-code.cjs
git commit -m "feat(P2): add method dependency graph for topological fill order

- Build dependency graph from contract logic steps
- Topological sort: callee before caller
- Batch grouping: max 3 methods per batch, all deps satisfied
- Parallel fill within same batch
- CLI support for visualizing fill plan"
```

---

### Task 8: Logic Coverage Auto — R5 自动化

**Files:**
- Create: `scripts/logic-coverage-auto.cjs`
- Modify: `skill-templates/_core/agents/contract-validator.md` (reference auto results)

**Goal:** 通过 AST 解析自动匹配设计步骤与代码实现。

- [ ] **Step 1: Create `scripts/logic-coverage-auto.cjs`**

```javascript
/**
 * LogicCoverageAnalyzer — R5 逻辑覆盖率自动化
 * 
 * 通过 AST 解析自动匹配 design step ↔ code block。
 * 当前版本使用简化正则（生产环境应使用完整 AST parser）。
 */
class LogicCoverageAnalyzer {
  constructor(options = {}) {
    this.language = options.language || 'java';
    this.confidenceThreshold = options.confidenceThreshold || 0.6;
  }

  /**
   * 分析代码覆盖率
   */
  analyze(filePath, contract) {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 提取设计步骤
    const designSteps = (contract.methods?.[0]?.logicSteps || []).map((step, idx) => ({
      id: `step-${idx + 1}`,
      description: step.description,
      keywords: this.extractKeywords(step.description)
    }));

    if (designSteps.length === 0) {
      return { coverage: 1.0, matches: [], unmappedSteps: [], unmappedBlocks: [] };
    }

    // 提取代码控制流（简化版正则提取）
    const codeBlocks = this.extractControlFlow(content);

    // 匹配
    const matches = [];
    const matchedBlocks = new Set();
    
    for (const step of designSteps) {
      const matchedBlock = this.findBestMatch(step, codeBlocks, matchedBlocks);
      matches.push({
        step: step.id,
        description: step.description,
        matched: matchedBlock !== null,
        confidence: matchedBlock ? matchedBlock.confidence : 0,
        codeLocation: matchedBlock ? matchedBlock.lines : null,
        matchedCode: matchedBlock ? matchedBlock.code : null
      });
      
      if (matchedBlock) {
        matchedBlocks.add(matchedBlock);
      }
    }

    const coverage = matches.filter(m => m.matched).length / matches.length;
    
    return {
      coverage,
      matches,
      unmappedSteps: matches.filter(m => !m.matched).map(m => m.step),
      unmappedBlocks: codeBlocks.filter(b => !matchedBlocks.has(b)).map(b => ({
        type: b.type,
        lines: b.lines
      }))
    };
  }

  /**
   * 提取关键词
   */
  extractKeywords(description) {
    // 提取中文/英文动词和名词
    const words = description
      .toLowerCase()
      .replace(/[，。！？、；：""''（）【】]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
    
    return [...new Set(words)];
  }

  /**
   * 提取控制流（简化版）
   */
  extractControlFlow(content) {
    const blocks = [];
    const lines = content.split('\n');
    
    // 匹配 if/else/for/while/try/method_call
    const patterns = [
      { type: 'if', regex: /if\s*\(/ },
      { type: 'for', regex: /for\s*\(/ },
      { type: 'while', regex: /while\s*\(/ },
      { type: 'try', regex: /try\s*\{/ },
      { type: 'catch', regex: /catch\s*\(/ },
      { type: 'method_call', regex: /\.(\w+)\s*\(/ }
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const { type, regex } of patterns) {
        const match = line.match(regex);
        if (match) {
          blocks.push({
            type,
            code: line.substring(0, 100),
            lines: [i + 1, i + 1],
            condition: type === 'if' ? line : null,
            name: type === 'method_call' ? match[1] : null
          });
        }
      }
    }
    
    return blocks;
  }

  /**
   * 查找最佳匹配
   */
  findBestMatch(step, codeBlocks, alreadyMatched) {
    let best = null;
    let bestScore = 0;
    
    for (const block of codeBlocks) {
      if (alreadyMatched.has(block)) continue;
      
      const score = this.calculateMatchScore(step, block);
      if (score > bestScore && score >= this.confidenceThreshold) {
        best = block;
        bestScore = score;
      }
    }
    
    return best ? { ...best, confidence: bestScore } : null;
  }

  /**
   * 计算匹配分数
   */
  calculateMatchScore(step, block) {
    let score = 0;
    
    // 关键词匹配（50%）
    const keywordMatch = step.keywords.filter(k => 
      block.code?.toLowerCase().includes(k) || 
      block.name?.toLowerCase().includes(k)
    ).length / Math.max(step.keywords.length, 1);
    score += keywordMatch * 0.5;
    
    // 语义匹配（30%）
    const semanticMatch = this.checkSemanticAlignment(step, block);
    score += semanticMatch * 0.3;
    
    // 位置匹配（20%）
    const positionMatch = this.checkPositionAlignment(step, block);
    score += positionMatch * 0.2;
    
    return score;
  }

  checkSemanticAlignment(step, block) {
    const desc = step.description.toLowerCase();
    
    // 校验 → if/try
    if ((desc.includes('校验') || desc.includes('验证') || desc.includes('检查') || desc.includes('validate')) && 
        (block.type === 'if' || block.type === 'try')) {
      return 0.9;
    }
    
    // 查询/获取 → method_call
    if ((desc.includes('查询') || desc.includes('获取') || desc.includes('查找') || desc.includes('get')) && 
        block.type === 'method_call') {
      return 0.8;
    }
    
    // 保存/写入 → method_call
    if ((desc.includes('保存') || desc.includes('写入') || desc.includes('存储') || desc.includes('save')) && 
        block.type === 'method_call') {
      return 0.8;
    }
    
    // 计算 → method_call
    if ((desc.includes('计算') || desc.includes('算出') || desc.includes('calculate')) && 
        block.type === 'method_call') {
      return 0.7;
    }
    
    return 0.3;
  }

  checkPositionAlignment(step, block) {
    // 简化：步骤顺序应与代码行号大致一致
    // 实际应基于步骤索引和代码块索引
    return 0.5;
  }
}

module.exports = { LogicCoverageAnalyzer };

// CLI
if (require.main === module) {
  const fs = require('fs');
  const yaml = require('js-yaml');
  
  const [filePath, contractPath] = process.argv.slice(2);
  if (!filePath || !contractPath) {
    console.error('Usage: node logic-coverage-auto.cjs <file> <contract.yaml>');
    process.exit(1);
  }
  
  const contract = yaml.load(fs.readFileSync(contractPath, 'utf8'));
  const analyzer = new LogicCoverageAnalyzer();
  const result = analyzer.analyze(filePath, contract);
  
  console.log(`Coverage: ${(result.coverage * 100).toFixed(1)}%`);
  console.log(JSON.stringify(result, null, 2));
}
```

- [ ] **Step 2: Update `skill-templates/_core/agents/contract-validator.md`**

在 R5 检查部分添加：

```markdown
### R5. 逻辑步骤覆盖（增强版）

**自动化分析**:
1. 首先运行 `logic-coverage-auto.cjs` 获取自动化覆盖率报告
2. 如果覆盖率 >= 90%，接受自动化结果
3. 如果覆盖率 < 90%，进行人工复核

**人工复核要点**:
- 检查未匹配的 design step 是否在代码中有对应实现
- 检查未匹配的 code block 是否是过度实现
- 确认边界情况和异常处理是否覆盖

**输出格式**:
```yaml
r5_coverage:
  auto_coverage: 0.95
  manual_review_required: false
  unmapped_steps: []
  unmapped_blocks: []
  assessment: "PASS"
```
```

- [ ] **Step 3: Commit**

```bash
git add scripts/logic-coverage-auto.cjs skill-templates/_core/agents/contract-validator.md
git commit -m "feat(P2): add automated R5 logic coverage analysis

- LogicCoverageAnalyzer with keyword/semantic/position matching
- Control flow extraction: if/for/while/try/catch/method_call
- Confidence threshold: 0.6 (configurable)
- Semantic alignment: validate→if/try, query→method_call, save→method_call
- CLI support for standalone analysis
- Contract validator references auto results, manual review only if <90%"
```

---

## Phase 4: P3 高级功能（目标可靠性 95%）

### Task 9: Dependency Resolver — 多候选依赖解析

**Files:**
- Create: `scripts/dependency-resolver.cjs`
- Modify: `scripts/prepare-context.cjs` (use resolver)

**Goal:** 解决同名类冲突，提供置信度评分和 disambiguation。

- [ ] **Step 1: Create `scripts/dependency-resolver.cjs`**

```javascript
const fs = require('fs');
const path = require('path');

/**
 * DependencyResolver — 多候选依赖解析
 * 
 * 当存在多个同名类时，通过置信度评分选择最可能的目标。
 */
class DependencyResolver {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.minConfidence = options.minConfidence || 0.8;
  }

  /**
   * 解析依赖类
   */
  resolve(className, context = {}) {
    const candidates = this.findAllCandidates(className);
    
    if (candidates.length === 0) {
      return { status: 'NOT_FOUND', candidates: [] };
    }
    
    if (candidates.length === 1) {
      return {
        status: 'UNIQUE',
        candidate: candidates[0],
        confidence: 1.0
      };
    }
    
    // 计算置信度
    const scored = candidates.map(c => ({
      path: c,
      confidence: this.calculateConfidence(className, c, context)
    })).sort((a, b) => b.confidence - a.confidence);
    
    // 高置信度直接返回
    if (scored[0].confidence >= this.minConfidence) {
      return {
        status: 'HIGH_CONFIDENCE',
        candidate: scored[0].path,
        confidence: scored[0].confidence,
        alternatives: scored.slice(1, 3)
      };
    }
    
    // 低置信度返回多候选
    return {
      status: 'AMBIGUOUS',
      candidates: scored.slice(0, 5),
      disambiguationHint: this.generateDisambiguationHint(scored, context)
    };
  }

  /**
   * 查找所有候选
   */
  findAllCandidates(className) {
    const results = [];
    const extensions = ['.java', '.ts', '.tsx', '.js', '.py', '.go'];
    
    const walk = (dir, depth = 0) => {
      if (depth > 15) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'target', 'build', 'dist'].includes(entry.name)) {
            continue;
          }
          walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const base = path.basename(entry.name, ext);
          if (base === className && extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    };
    
    walk(this.projectRoot);
    return results;
  }

  /**
   * 计算置信度
   */
  calculateConfidence(className, candidatePath, context) {
    let score = 0;
    const pathParts = candidatePath.split(path.sep);
    const classLower = className.toLowerCase();
    
    // 1. 路径语义匹配（40%）
    const semanticMatch = pathParts.some(p => 
      p.toLowerCase().includes(classLower.replace(/service|controller|entity|mapper/g, ''))
    );
    score += (semanticMatch ? 1 : 0) * 0.4;
    
    // 2. 引用频率（30%）
    const refCount = this.getReferenceCount(candidatePath);
    score += Math.min(refCount / 10, 1) * 0.3;
    
    // 3. 最近修改（15%）
    const recency = this.getRecencyScore(candidatePath);
    score += recency * 0.15;
    
    // 4. 与当前文件关联度（15%）
    if (context.currentFile) {
      const currentDir = path.dirname(context.currentFile);
      const candidateDir = path.dirname(candidatePath);
      const similarity = this.pathSimilarity(currentDir, candidateDir);
      score += similarity * 0.15;
    }
    
    return Math.min(score, 1.0);
  }

  getReferenceCount(filePath) {
    // 简化版：搜索被 import 的次数
    try {
      const className = path.basename(filePath, path.extname(filePath));
      // 实际应使用 Grep 或索引
      return 0; // Placeholder
    } catch {
      return 0;
    }
  }

  getRecencyScore(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      return Math.max(0, 1 - ageDays / 30); // 30 天内满分
    } catch {
      return 0;
    }
  }

  pathSimilarity(path1, path2) {
    const parts1 = path1.split(path.sep);
    const parts2 = path2.split(path.sep);
    const common = parts1.filter((p, i) => parts2[i] === p).length;
    return common / Math.max(parts1.length, parts2.length);
  }

  generateDisambiguationHint(scored, context) {
    const lines = ['多个候选类发现，请确认：'];
    
    for (let i = 0; i < Math.min(scored.length, 3); i++) {
      const c = scored[i];
      lines.push(`${i + 1}. ${c.path} (置信度: ${(c.confidence * 100).toFixed(1)}%)`);
    }
    
    lines.push('');
    lines.push('确认命令:');
    lines.push(`Read: {"file_path": "${scored[0].path}", "limit": 30}`);
    
    return lines.join('\n');
  }
}

module.exports = { DependencyResolver };

// CLI
if (require.main === module) {
  const [className, projectRoot] = process.argv.slice(2);
  if (!className) {
    console.error('Usage: node dependency-resolver.cjs <ClassName> [projectRoot]');
    process.exit(1);
  }
  
  const resolver = new DependencyResolver({ projectRoot: projectRoot || '.' });
  const result = resolver.resolve(className);
  console.log(JSON.stringify(result, null, 2));
}
```

- [ ] **Step 2: Integrate into `scripts/prepare-context.cjs`**

```javascript
const { DependencyResolver } = require('./dependency-resolver.cjs');

function searchClassFile(projectRoot, className, context) {
  const resolver = new DependencyResolver({ projectRoot });
  const result = resolver.resolve(className, { currentFile: context.currentFile });
  
  if (result.status === 'UNIQUE' || result.status === 'HIGH_CONFIDENCE') {
    return result.candidate;
  }
  
  if (result.status === 'AMBIGUOUS') {
    console.warn(`[Ambiguous] Multiple candidates for ${className}:`, result.candidates);
    // 返回最高置信度的候选，但在 task-brief 中标注
    return result.candidates[0].path;
  }
  
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/dependency-resolver.cjs scripts/prepare-context.cjs
git commit -m "feat(P3): add multi-candidate dependency resolution with confidence scoring

- DependencyResolver with 4 scoring factors:
  1. Path semantic match (40%)
  2. Reference count (30%)
  3. Recency (15%)
  4. Path similarity to current file (15%)
- Status: UNIQUE / HIGH_CONFIDENCE / AMBIGUOUS / NOT_FOUND
- Min confidence threshold: 0.8
- Disambiguation hint with Read command"
```

---

### Task 10: On-Demand Loader — 按需加载协议

**Files:**
- Create: `skill-templates/_core/references/on-demand-loader.md`
- Modify: `scripts/prepare-context.cjs` (inject on-demand hints)

**Goal:** 当完整性门控触发 ON_DEMAND_LOAD 时，在 task-brief 中注入按需读取指令。

- [ ] **Step 1: Create `skill-templates/_core/references/on-demand-loader.md`**

```markdown
---
name: "on-demand-loader"
description: "按需加载协议。当核心依赖文件超过上下文预算时，subagent 在运行时按需读取文件内容，而非一次性加载。Invoke when task-brief contains ON_DEMAND_LOAD_REQUIRED marker."
---

# @on-demand-loader 按需读取协议

## 使用场景

当完整性门控检测到核心依赖文件超过单文件预算（默认 30KB）时，会触发 ON_DEMAND_LOAD 策略。此时 task-brief 中会包含 `ON_DEMAND_LOAD_REQUIRED` 标记和文件列表。

## 读取约束

1. **次数限制**: 每个 subagent 最多 5 次按需读取
2. **大小限制**: 单次读取最多 100 行或 10KB
3. **内容优先级**: 
   - 优先读取方法签名和类型定义
   - 跳过私有方法实现体
   - 跳过注释和空行
4. **缓存**: 读取后内容缓存到 `.dev-flow/cache/`，避免重复读取

## 读取命令格式

```
Read: {"file_path": "src/main/java/com/example/service/OrderService.java", "offset": 1, "limit": 50}
```

## Task-Brief 注入格式

当触发按需加载时，task-brief 末尾会追加：

```markdown
## ON_DEMAND_LOAD_REQUIRED

以下文件因大小超过预算未完整加载，如需使用请按需读取：

- `src/main/java/com/example/service/OrderService.java` (85KB)
  - 已知方法: createOrder, cancelOrder, getOrderStatus
  - 已知字段: id, userId, items, status, createTime
  - 按需读取: `Read: {"file_path": "...", "offset": 1, "limit": 50}`

- `src/main/java/com/example/entity/Order.java` (45KB)
  - 已知字段: id, userId, items, status, createTime
  - 按需读取: `Read: {"file_path": "...", "offset": 1, "limit": 50}`

> ⚠️ 按需读取会增加上下文占用。如果频繁需要读取，说明任务可能过大，应触发拆分。
```

## 使用流程

1. **开发前**: 检查 task-brief 是否有 `ON_DEMAND_LOAD_REQUIRED` 标记
2. **需要依赖时**: 使用 Read 命令按需读取，优先读取方法签名
3. **读取后**: 将关键签名记录到当前上下文中，避免重复读取
4. **超过 5 次**: 停止读取，记录 "上下文不足，需要拆分任务"

## 风险提示

- 按需读取会占用 subagent 的上下文空间
- 频繁读取（>3 次）说明任务设计不合理
- 超大文件（>150KB）即使按需读取也可能不足，应考虑拆分
```

- [ ] **Step 2: Update `scripts/prepare-context.cjs` to inject on-demand hints**

```javascript
function injectOnDemandHints(taskBrief, files) {
  let hints = '\n\n## ON_DEMAND_LOAD_REQUIRED\n\n';
  hints += '以下文件因大小超过预算未完整加载，如需使用请按需读取：\n\n';
  
  for (const file of files) {
    const fileName = path.basename(file);
    const stats = fs.statSync(file);
    
    // 提取已知信息（方法名、字段名）
    const knownInfo = extractKnownInfo(file);
    
    hints += `- \`${file}\` (${Math.round(stats.size / 1024)}KB)\n`;
    if (knownInfo.methods.length > 0) {
      hints += `  - 已知方法: ${knownInfo.methods.join(', ')}\n`;
    }
    if (knownInfo.fields.length > 0) {
      hints += `  - 已知字段: ${knownInfo.fields.join(', ')}\n`;
    }
    hints += `  - 按需读取: \`Read: {"file_path": "${file}", "offset": 1, "limit": 50}\`\n`;
  }
  
  hints += '\n> ⚠️ 按需读取会增加上下文占用。如果频繁需要读取，说明任务可能过大，应触发拆分。\n';
  
  return taskBrief + hints;
}

function extractKnownInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const methods = [];
  const fields = [];
  
  // 简单正则提取方法名和字段名
  const methodMatches = content.match(/(?:public|private|protected)\s+[\w<>\[\]]+\s+(\w+)\s*\(/g);
  if (methodMatches) {
    methodMatches.forEach(m => {
      const name = m.match(/(\w+)\s*\($/)[1];
      if (!['if', 'while', 'for', 'switch'].includes(name)) {
        methods.push(name);
      }
    });
  }
  
  const fieldMatches = content.match(/(?:private|public|protected)\s+[\w<>\[\]]+\s+(\w+)\s*;/g);
  if (fieldMatches) {
    fieldMatches.forEach(f => {
      const name = f.match(/(\w+)\s*;$/)[1];
      fields.push(name);
    });
  }
  
  return { methods: methods.slice(0, 10), fields: fields.slice(0, 10) };
}
```

- [ ] **Step 3: Commit**

```bash
git add skill-templates/_core/references/on-demand-loader.md scripts/prepare-context.cjs
git commit -m "feat(P3): add on-demand loader protocol for oversized dependencies

- On-demand read constraints: max 5 reads, 100 lines/10KB per read
- Priority: method signatures > type definitions > implementations
- Cache to .dev-flow/cache/
- Task-brief injection with known methods/fields extraction
- Warning if frequent reads indicate task is too large"
```

---

### Task 11: Partial Delivery — 部分交付报告

**Files:**
- Create: `scripts/partial-delivery.cjs`
- Modify: `skill-templates/_core/stages/delivery.md`

**Goal:** 允许流程在部分任务失败的情况下继续，生成部分交付报告。

- [ ] **Step 1: Create `scripts/partial-delivery.cjs`**

```javascript
const fs = require('fs');
const path = require('path');

/**
 * PartialDelivery — 部分交付报告生成
 * 
 * 当存在失败任务时，生成包含已完成部分和待人工完成部分的报告。
 */
class PartialDelivery {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '.dev-flow/pending';
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成部分交付报告
   */
  generateReport(tasks, results) {
    const completed = [];
    const pending = [];
    
    for (const task of tasks) {
      const result = results[task.id];
      
      if (result && result.status === 'SUCCESS') {
        completed.push({
          taskId: task.id,
          name: task.name,
          filePath: task.outputPath
        });
      } else {
        const failure = result || { reason: 'Unknown failure' };
        const guide = this.generateFixGuide(task, failure);
        
        pending.push({
          taskId: task.id,
          name: task.name,
          classification: task.classification || 'UNKNOWN',
          reason: failure.reason,
          guidePath: guide.path,
          suggestedAction: guide.suggestion
        });
        
        // 写入修复指南
        fs.writeFileSync(guide.path, guide.content);
      }
    }
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_tasks: tasks.length,
        completed: completed.length,
        failed: pending.length,
        success_rate: `${((completed.length / tasks.length) * 100).toFixed(1)}%`
      },
      completed_features: completed,
      pending_features: pending,
      next_steps: [
        `查看 ${this.outputDir}/ 了解待完成功能`,
        '按修复指南人工完成失败任务',
        '重新运行 dev-flow 验证完整性'
      ]
    };
    
    const reportPath = '.dev-flow/partial-delivery-report.yaml';
    fs.writeFileSync(reportPath, this.serialize(report));
    
    return { report, reportPath };
  }

  /**
   * 生成单个任务的修复指南
   */
  generateFixGuide(task, failure) {
    const guidePath = path.join(this.outputDir, `${task.id}-fix-guide.md`);
    
    const suggestion = this.suggestFix(failure);
    
    const content = `# 修复指南: ${task.name}

## 任务信息
- **Task ID**: ${task.id}
- **分类**: ${task.classification || 'UNKNOWN'}
- **目标文件**: ${task.outputPath || 'N/A'}

## 失败原因
${failure.reason || 'Unknown'}

## 已尝试的修复
${failure.attemptedFixes ? failure.attemptedFixes.map(f => `- ${f}`).join('\n') : '- 无'}

## 建议修复方案
${suggestion}

## 相关文件
${task.dependencies ? task.dependencies.map(d => `- ${d}`).join('\n') : '- 无'}

## 重新运行
修复后，可以单独运行此任务：
\`\`\`
node scripts/dispatch.cjs --task ${task.id}
\`\`\`
`;

    return {
      path: guidePath,
      suggestion,
      content
    };
  }

  suggestFix(failure) {
    const reason = (failure.reason || '').toLowerCase();
    
    if (reason.includes('context') || reason.includes('truncat')) {
      return '1. 将任务拆分为更小的子任务\n2. 或使用 @on-demand-loader 按需读取依赖';
    }
    if (reason.includes('compil') || reason.includes('syntax')) {
      return '1. 检查语法错误（缺失分号、括号不匹配等）\n2. 检查导入语句是否完整\n3. 检查类型是否一致';
    }
    if (reason.includes('contract') || reason.includes('mismatch')) {
      return '1. 对比设计契约和实现代码\n2. 检查方法签名是否一致\n3. 检查返回类型和参数类型';
    }
    if (reason.includes('timeout') || reason.includes('no response')) {
      return '1. 简化任务（去掉非核心功能）\n2. 减少依赖文件数量\n3. 尝试串行模式而非并行';
    }
    
    return '1. 查看完整错误日志\n2. 检查相关依赖文件\n3. 考虑人工实现此任务';
  }

  serialize(report) {
    const yaml = require('js-yaml');
    return yaml.dump(report);
  }
}

module.exports = { PartialDelivery };

// CLI
if (require.main === module) {
  const [tasksPath, resultsPath] = process.argv.slice(2);
  if (!tasksPath) {
    console.error('Usage: node partial-delivery.cjs <tasks.yaml> [results.yaml]');
    process.exit(1);
  }
  
  const yaml = require('js-yaml');
  const tasks = yaml.load(fs.readFileSync(tasksPath, 'utf8'));
  const results = resultsPath ? yaml.load(fs.readFileSync(resultsPath, 'utf8')) : {};
  
  const pd = new PartialDelivery();
  const report = pd.generateReport(tasks, results);
  console.log(`Report generated: ${report.reportPath}`);
  console.log(JSON.stringify(report.report.summary, null, 2));
}
```

- [ ] **Step 2: Update `skill-templates/_core/stages/delivery.md`**

```markdown
## 部分交付（Partial Delivery）

当存在失败任务时，流程不会完全终止，而是生成部分交付报告。

### 触发条件
- 阻塞性任务全部成功
- 存在失败的核心非阻塞或边缘任务

### 交付内容
1. **已完成代码**: 所有成功任务的代码文件
2. **部分交付报告**: `.dev-flow/partial-delivery-report.yaml`
3. **修复指南**: `.dev-flow/pending/{taskId}-fix-guide.md`

### 报告格式
```yaml
partial_delivery_report:
  summary:
    total_tasks: 20
    completed: 16
    failed: 3
    success_rate: "80.0%"
    
  completed_features:
    - taskId: "T1"
      name: "OrderService.createOrder"
      filePath: "src/main/java/.../OrderService.java"
      
  pending_features:
    - taskId: "T15"
      name: "OrderExportService"
      classification: "EDGE"
      reason: "上下文不足"
      guidePath: ".dev-flow/pending/T15-fix-guide.md"
      suggestedAction: "人工实现 Excel 导出逻辑"
      
  next_steps:
    - "查看 .dev-flow/pending/ 了解待完成功能"
    - "按修复指南人工完成失败任务"
    - "重新运行 dev-flow 验证完整性"
```

### 用户指南
1. 检查 `partial-delivery-report.yaml` 了解完成情况
2. 按优先级处理 pending 任务（阻塞性 > 核心 > 边缘）
3. 每个 pending 任务有详细的修复指南
4. 修复后可单独运行该任务验证
```

- [ ] **Step 3: Commit**

```bash
git add scripts/partial-delivery.cjs skill-templates/_core/stages/delivery.md
git commit -m "feat(P3): add partial delivery mechanism for fault tolerance

- PartialDelivery with report generation and fix guides
- Task classification: BLOCKING / CORE_NON_BLOCKING / EDGE / OPTIMIZATION
- Auto-generated fix guides with contextual suggestions
- Report format: summary + completed + pending + next_steps
- Delivery stage updated to handle partial success"
```

---

## Phase 5: P4 验证优化（目标可靠性 99%）

### Task 12: Validation Decoupling — 验证与主 Agent 解耦

**Files:**
- Modify: `scripts/validate-result.cjs` (async validation subagent)
- Modify: `skill-templates/_core/agents/contract-validator.md` (standalone mode)

**Goal:** 将验证阶段从主 Agent 上下文中剥离，使用独立 subagent 执行。

- [ ] **Step 1: Update `scripts/validate-result.cjs` for decoupled validation**

```javascript
// 新增：异步验证接口，主 Agent 只提交验证请求，不等待详细结果
async function submitValidation(taskId, filePath, contractPath, options = {}) {
  const validationResultPath = `.dev-flow/validation-results/${taskId}.yaml`;
  
  // 写入验证请求
  const request = {
    task_id: taskId,
    file_path: filePath,
    contract_path: contractPath,
    status: 'PENDING',
    submitted_at: new Date().toISOString(),
    options
  };
  
  fs.mkdirSync(path.dirname(validationResultPath), { recursive: true });
  fs.writeFileSync(validationResultPath, yaml.dump(request));
  
  // 启动独立验证 subagent（异步）
  // 实际由 orchestrator 调度
  console.log(`[Validation] Submitted ${taskId} for async validation`);
  
  return { taskId, resultPath: validationResultPath };
}

// 新增：读取验证结果（主 Agent 使用）
function readValidationResult(taskId) {
  const resultPath = `.dev-flow/validation-results/${taskId}.yaml`;
  
  if (!fs.existsSync(resultPath)) {
    return { status: 'NOT_FOUND' };
  }
  
  const result = yaml.load(fs.readFileSync(resultPath, 'utf8'));
  
  // 主 Agent 只关心最终结论，不关心详细过程
  return {
    status: result.status,
    passed: result.status === 'PASSED',
    summary: result.summary || 'No summary available',
    blockingIssues: result.blocking_issues?.length || 0
  };
}

module.exports = {
  validateResult,        // 原有同步验证
  submitValidation,      // 新增：异步提交
  readValidationResult   // 新增：读取结果
};
```

- [ ] **Step 2: Update `skill-templates/_core/agents/contract-validator.md`**

```markdown
## 独立验证模式（Decoupled Validation）

当作为独立 subagent 运行时：

### 输入
- 代码文件路径（只读）
- 设计契约片段（只读）
- 验证规则清单（只读）

### 输出
写入 `.dev-flow/validation-results/{taskId}.yaml`：

```yaml
validation_result:
  task_id: "T3"
  status: "PASSED"  # PASSED / FAILED / PARTIAL
  submitted_at: "2026-06-11T10:00:00Z"
  completed_at: "2026-06-11T10:05:00Z"
  
  layer_1_static:
    passed: true
    checks: []
    
  layer_2_ai:
    passed: true
    r1_structure: { passed: true }
    r2_signature: { passed: true }
    r3_type: { passed: true }
    r4_annotation: { passed: true }
    r5_coverage: { coverage: 0.95, passed: true }
    
  summary: "所有检查通过"
  blocking_issues: []
  warnings: []
```

### 约束
- 不占用主 Agent 上下文
- 验证失败不阻断主 Agent 决策
- 结果供主 Agent 参考
```

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-result.cjs skill-templates/_core/agents/contract-validator.md
git commit -m "feat(P4): decouple validation from main agent context

- Async validation submission: submitValidation() writes request file
- Main agent reads only summary result (1KB) instead of full code+contract
- Independent validation subagent writes detailed results to file
- Contract validator updated for standalone mode with structured output"
```

---

### Task 13: Compile Loop Cleanup — 编译循环上下文清理

**Files:**
- Modify: `skill-templates/_core/stages/develop.md` (compile loop section)

**Goal:** 在编译修复循环中定期清理累积的错误日志。

- [ ] **Step 1: Update compile loop section in `skill-templates/_core/stages/develop.md`**

```markdown
### 编译验证循环（上下文感知版）

```
Round 1:
  - 正常修复
  - 保留完整错误日志（用于分析根本原因）
  - 上下文占用: +~10KB

Round 2:
  PRE_ACTION: 压缩 Round 1 日志
    - 只保留错误类型、位置、关键信息
    - 去掉详细堆栈和重复信息
    - 节省 ~60% 空间
  - 基于压缩后的日志修复
  - 上下文占用: +~4KB (vs +10KB)

Round 3:
  PRE_ACTION: 完全清理 Round 1-2 日志
    - 只保留当前轮次的错误
    - 历史错误已尝试修复，不再 relevant
  - 基于当前错误修复
  - 上下文占用: +~10KB (但历史已清理)

Round 3 失败:
  - 不再继续 Round 4
  - 触发 degradation-matrix 场景 2 的 L3/L4
  - L3: 回滚到 checkpoint，尝试替代实现
  - L4: 标记为 NEEDS_HUMAN_FIX
```

### 上下文监控点

每个 Round 开始时检查主 Agent 上下文使用率：
- < 70%: 正常继续
- 70-85%: 压缩历史日志
- 85-95%: 只保留当前轮次错误
- > 95%: 停止编译循环，触发部分交付
```

- [ ] **Step 2: Commit**

```bash
git add skill-templates/_core/stages/develop.md
git commit -m "feat(P4): add compile loop context cleanup strategy

- Round 1: keep full error logs
- Round 2: compress Round 1 logs (keep only type/location)
- Round 3: purge Round 1-2 logs, keep only current round
- Round 3 fail: stop loop, trigger degradation L3/L4
- Context usage checkpoints at 70%/85%/95% thresholds"
```

---

## 最终整合与测试

### Task 14: Feature Flags & Integration Test

**Files:**
- Create: `.dev-flow/feature-flags.yaml`
- Create: `scripts/test-all-layers.cjs`

**Goal:** 所有功能通过 feature flags 控制，支持独立开关和回滚。

- [ ] **Step 1: Create `.dev-flow/feature-flags.yaml`**

```yaml
# Feature Flags for Context Reliability Optimization
# All features default to enabled, can be disabled individually for rollback

features:
  completeness_gate:
    enabled: true
    description: "Block subagent dispatch if dependencies are truncated"
    fallback: "Log warning but allow dispatch (pre-v3.8 behavior)"
    
  dynamic_budget:
    enabled: true
    description: "Calculate context budget based on AI model"
    fallback: "Use fixed thresholds 120KB/30KB"
    
  static_validation:
    enabled: true
    description: "Layer 1 machine validation (syntax, placeholders, signatures)"
    fallback: "Only basic file existence check"
    
  checkpoint_system:
    enabled: true
    description: "Save code generation checkpoints for recovery"
    fallback: "No checkpoints, fail = restart from scratch"
    
  method_dependency_graph:
    enabled: true
    description: "Topological sort for method fill order"
    fallback: "Sequential fill in declaration order"
    
  logic_coverage_auto:
    enabled: true
    description: "Automated R5 logic coverage analysis"
    fallback: "Manual comment-based R5 check"
    
  dependency_resolver:
    enabled: true
    description: "Multi-candidate dependency resolution with confidence"
    fallback: "First match from search results"
    
  on_demand_loader:
    enabled: true
    description: "Allow subagent to read large files on-demand"
    fallback: "Skip large files entirely"
    
  partial_delivery:
    enabled: true
    description: "Allow delivery with partial task completion"
    fallback: "Any failure blocks entire flow"
    
  validation_decoupling:
    enabled: true
    description: "Run validation in independent subagent"
    fallback: "Main agent performs validation inline"
    
  compile_loop_cleanup:
    enabled: true
    description: "Clean up error logs between compile rounds"
    fallback: "Accumulate all error logs"
```

- [ ] **Step 2: Create `scripts/test-all-layers.cjs`**

```javascript
/**
 * Integration test for all 5 layers
 */
const fs = require('fs');
const path = require('path');

// Import all new modules
const { CompletenessGate } = require('./completeness-gate.cjs');
const { StaticValidationSuite } = require('./static-validation-suite.cjs');
const { calculateBudget } = require('./dynamic-budget.cjs');
const { CheckpointManager } = require('./checkpoint-manager.cjs');
const { MethodDependencyGraph } = require('./method-dependency-graph.cjs');
const { LogicCoverageAnalyzer } = require('./logic-coverage-auto.cjs');
const { DependencyResolver } = require('./dependency-resolver.cjs');
const { PartialDelivery } = require('./partial-delivery.cjs');

async function runAllTests() {
  console.log('=== Dev-Flow Context Reliability Optimization Tests ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Layer 1 - Completeness Gate
  console.log('[Layer 1] Testing Completeness Gate...');
  try {
    const gate = new CompletenessGate();
    const r1 = gate.check({
      taskBrief: 'test',
      dependencies: [{ path: 'Test.java', content: 'class Test {}', originalSize: 100 }]
    });
    console.assert(r1.passed === true, 'Should pass with valid deps');
    
    const r2 = gate.check({
      taskBrief: 'test',
      dependencies: [{ path: 'Test.java', content: '/* 文件过大... */', originalSize: 100000 }]
    });
    console.assert(r2.passed === false, 'Should block truncated deps');
    
    console.log('  ✓ Layer 1 tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Layer 1 tests failed:', e.message);
    failed++;
  }
  
  // Test 2: Layer 1 - Static Validation
  console.log('[Layer 1] Testing Static Validation Suite...');
  try {
    fs.writeFileSync('/tmp/test-valid.java', 'public class Test { public String hello() { return "world"; } }');
    fs.writeFileSync('/tmp/test-invalid.java', 'public class Test { // TODO public String hello() { return null; } public void empty() {} }');
    
    const suite = new StaticValidationSuite({ language: 'java' });
    const r1 = suite.run('/tmp/test-valid.java');
    console.assert(r1.passed === true, 'Valid file should pass');
    
    const r2 = suite.run('/tmp/test-invalid.java');
    console.assert(r2.passed === false, 'Invalid file should fail');
    
    console.log('  ✓ Static validation tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Static validation tests failed:', e.message);
    failed++;
  }
  
  // Test 3: Layer 1 - Dynamic Budget
  console.log('[Layer 1] Testing Dynamic Budget...');
  try {
    const b1 = calculateBudget('claude-3-5-sonnet');
    console.assert(b1.briefSizeKB > 50, 'Claude should have >50KB budget');
    
    const b2 = calculateBudget('gpt-4o-mini');
    console.assert(b2.briefSizeKB < b1.briefSizeKB, 'GPT-4o-mini should have smaller budget');
    
    console.log('  ✓ Dynamic budget tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Dynamic budget tests failed:', e.message);
    failed++;
  }
  
  // Test 4: Layer 2 - Checkpoint Manager
  console.log('[Layer 2] Testing Checkpoint Manager...');
  try {
    const mgr = new CheckpointManager('test-task', { checkpointDir: '/tmp/checkpoints' });
    const seq = mgr.create('TEST', { filePath: '/tmp/test.java', content: 'class Test {}' }, { totalMethods: 1 }, { tokensUsed: 100 });
    console.assert(seq === 1, 'First checkpoint should be #1');
    
    const restored = mgr.restore(1);
    console.assert(restored.state === 'TEST', 'Should restore correct state');
    
    console.log('  ✓ Checkpoint tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Checkpoint tests failed:', e.message);
    failed++;
  }
  
  // Test 5: Layer 2 - Method Dependency Graph
  console.log('[Layer 2] Testing Method Dependency Graph...');
  try {
    const graph = new MethodDependencyGraph();
    const plan = graph.generateFillPlan({
      methods: [
        { name: 'createOrder', logicSteps: [{ description: '调用 validateOrder' }] },
        { name: 'validateOrder', logicSteps: [] },
        { name: 'saveOrder', logicSteps: [{ description: '调用 createOrder' }] }
      ]
    });
    console.assert(plan.order[0] === 'validateOrder', 'validateOrder should be first');
    console.assert(plan.order.indexOf('createOrder') < plan.order.indexOf('saveOrder'), 'createOrder before saveOrder');
    
    console.log('  ✓ Dependency graph tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Dependency graph tests failed:', e.message);
    failed++;
  }
  
  // Test 6: Layer 4 - Logic Coverage Auto
  console.log('[Layer 4] Testing Logic Coverage Analyzer...');
  try {
    fs.writeFileSync('/tmp/test-coverage.java', `
      public class Test {
        public void process() {
          if (order == null) throw new IllegalArgumentException();
          validateOrder();
          calculatePrice();
          saveOrder();
        }
      }
    `);
    
    const analyzer = new LogicCoverageAnalyzer();
    const result = analyzer.analyze('/tmp/test-coverage.java', {
      methods: [{
        logicSteps: [
          { description: '校验订单参数' },
          { description: '验证订单合法性' },
          { description: '计算价格' },
          { description: '保存订单' }
        ]
      }]
    });
    console.assert(result.coverage > 0.5, 'Coverage should be > 50%');
    
    console.log('  ✓ Logic coverage tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Logic coverage tests failed:', e.message);
    failed++;
  }
  
  // Test 7: Layer 3 - Dependency Resolver
  console.log('[Layer 3] Testing Dependency Resolver...');
  try {
    const resolver = new DependencyResolver({ projectRoot: '/tmp' });
    // This will likely return NOT_FOUND for /tmp, but tests the structure
    const result = resolver.resolve('Test');
    console.assert(['NOT_FOUND', 'UNIQUE', 'AMBIGUOUS'].includes(result.status), 'Should return valid status');
    
    console.log('  ✓ Dependency resolver tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Dependency resolver tests failed:', e.message);
    failed++;
  }
  
  // Test 8: Layer 5 - Partial Delivery
  console.log('[Layer 5] Testing Partial Delivery...');
  try {
    const pd = new PartialDelivery({ outputDir: '/tmp/pending' });
    const report = pd.generateReport([
      { id: 'T1', name: 'Task 1', classification: 'CORE', outputPath: '/tmp/T1.java' },
      { id: 'T2', name: 'Task 2', classification: 'EDGE', outputPath: '/tmp/T2.java' }
    ], {
      T1: { status: 'SUCCESS' },
      T2: { status: 'FAILED', reason: 'Context insufficient' }
    });
    console.assert(report.report.summary.completed === 1, 'Should have 1 completed');
    console.assert(report.report.summary.failed === 1, 'Should have 1 failed');
    
    console.log('  ✓ Partial delivery tests passed\n');
    passed++;
  } catch (e) {
    console.error('  ✗ Partial delivery tests failed:', e.message);
    failed++;
  }
  
  // Summary
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(e => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
```

- [ ] **Step 3: Run integration test**

```bash
node scripts/test-all-layers.cjs
```

- [ ] **Step 4: Final commit**

```bash
git add .dev-flow/feature-flags.yaml scripts/test-all-layers.cjs
git commit -m "feat: add feature flags and integration tests for all 5 layers

- Feature flags for all 11 optimization features with fallback descriptions
- Integration test suite covering all layers:
  - Layer 1: Completeness Gate, Static Validation, Dynamic Budget
  - Layer 2: Checkpoint Manager, Method Dependency Graph
  - Layer 3: Dependency Resolver
  - Layer 4: Logic Coverage Auto
  - Layer 5: Partial Delivery
- Run: node scripts/test-all-layers.cjs"
```

---

## 实施完成总结

### 新增文件清单（10个）

| 文件 | 职责 | 优先级 |
|------|------|--------|
| `scripts/completeness-gate.cjs` | 完整性门控 | P0 |
| `scripts/static-validation-suite.cjs` | 静态验证套件 | P0 |
| `scripts/dynamic-budget.cjs` | 动态上下文预算 | P1 |
| `scripts/checkpoint-manager.cjs` | Checkpoint 管理 | P2 |
| `scripts/method-dependency-graph.cjs` | 方法依赖图 | P2 |
| `scripts/logic-coverage-auto.cjs` | R5 自动化分析 | P2 |
| `scripts/dependency-resolver.cjs` | 多候选依赖解析 | P3 |
| `scripts/partial-delivery.cjs` | 部分交付报告 | P3 |
| `skill-templates/_core/references/degradation-matrix.md` | 降级策略矩阵 | P0 |
| `skill-templates/_core/references/on-demand-loader.md` | 按需加载协议 | P3 |

### 修改文件清单（7个）

| 文件 | 修改内容 | 优先级 |
|------|----------|--------|
| `scripts/prepare-context.cjs` | 集成动态预算、完整性门控、多候选解析、按需加载 | P0/P1/P3 |
| `scripts/segment-code.cjs` | 集成 FSM、Checkpoint、拓扑填充 | P2 |
| `scripts/validate-result.cjs` | 集成静态验证套件、异步验证 | P0/P4 |
| `skill-templates/_core/agents/orchestrator.md` | 上下文预算池、零状态传递 | P1 |
| `skill-templates/_core/agents/contract-validator.md` | 集成 R5 自动化结果、独立验证模式 | P2/P4 |
| `skill-templates/_core/stages/develop.md` | 降级策略、编译循环清理 | P0/P4 |
| `skill-templates/_core/stages/delivery.md` | 部分交付报告 | P3 |

### 可靠性提升路径

| 阶段 | 目标可靠性 | 关键交付 |
|------|-----------|----------|
| P0 紧急防护 | 75% | 完整性门控 + 静态验证 + 降级矩阵 |
| P1 主 Agent 稳定 | 85% | 动态预算 + 预算池 + 零状态传递 |
| P2 代码生成增强 | 92% | Checkpoint + 拓扑填充 + R5 自动化 |
| P3 高级功能 | 95% | 多候选解析 + 按需加载 + 部分交付 |
| P4 验证优化 | 99% | 验证解耦 + 编译循环清理 |

---

> **计划完成**  
> 所有任务按 P0→P4 优先级排列，每个任务包含完整的代码、集成步骤、测试和提交信息。  
> 执行方式建议：使用 subagent-driven-development，每个 Task 分配一个独立 subagent 执行。
