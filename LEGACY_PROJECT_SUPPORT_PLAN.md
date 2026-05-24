# dev-flow 老旧项目支持方案 (Legacy Support Plan)

> 版本: v0.3.0 规划
> 目标: 使 dev-flow 能够完美支持纯维护期老旧项目
> 预期适配度提升: 55分 → 85分 (+30分)

---

## 一、老旧项目特点与痛点分析

### 1.1 老旧项目典型特征

| 特征 | 说明 | 影响 |
|------|------|------|
| **技术栈过时** | jQuery、AngularJS、PHP 5.x、Java 6/7、Ruby 1.x | 无法使用现代工具链 |
| **文档缺失** | 无架构文档、无API文档、无注释 | 理解成本高 |
| **代码风格混乱** | 多人协作、风格不统一、无规范 | 维护困难 |
| **依赖版本老旧** | 依赖包版本过低、安全漏洞 | 升级风险高 |
| **测试覆盖低** | 无单元测试或覆盖率<10% | 重构风险高 |
| **架构腐化** | 紧耦合、循环依赖、大泥球 | 扩展困难 |
| **构建工具老旧** | Gulp、Grunt、Makefile、Ant | CI/CD困难 |

### 1.2 开发人员痛点

| 痛点 | 具体表现 | 期望解决 |
|------|---------|----------|
| **不敢改** | 改一处坏三处，无测试保障 | 安全重构 |
| **看不懂** | 代码逻辑复杂，无文档 | 代码理解 |
| **改不动** | 紧耦合，牵一发动全身 | 解耦方案 |
| **升不了** | 依赖老旧，升级风险高 | 渐进升级 |
| **测不了** | 无测试框架，无法验证 | 测试生成 |

---

## 二、Legacy Support 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     dev-flow Legacy Mode                        │
├─────────────────────────────────────────────────────────────────┤
│  /dev-flow --legacy <需求>                                      │
│  /dev-flow -legacy-analyze                                      │
│  /dev-flow -legacy-migrate                                      │
│  /dev-flow -legacy-refactor                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │LegacyAnalyzer│  │LegacyMigrator│  │LegacyRefactor│          │
│  │  老旧代码分析 │  │  渐进式迁移   │  │  安全重构    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│  ┌──────┴─────────────────┴─────────────────┴──────┐            │
│  │              LegacyExpert (新增)                │            │
│  │  - 老旧技术栈代码生成                            │            │
│  │  - 渐进式迁移代码生成                            │            │
│  │  - 测试用例生成（兼容老旧框架）                  │            │
│  └────────────────────────────────────────────────┘            │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │           LegacyScanner (新增)                   │          │
│  │  - 老旧技术栈识别 (jQuery/AngularJS/PHP/Java)   │          │
│  │  - 代码复杂度分析                                │          │
│  │  - 依赖关系分析                                  │          │
│  │  - 技术债务识别                                  │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │           MigrationToolkit (新增)                │          │
│  │  - jQuery → React/Vue 迁移                       │          │
│  │  - AngularJS → Angular 迁移                      │          │
│  │  - PHP → Node.js 迁移                            │          │
│  │  - Java 6/7 → Java 17+ 迁移                      │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 新增核心组件

| 组件 | 职责 | 文件位置 |
|------|------|---------|
| **LegacyScanner** | 老旧技术栈识别、代码分析 | `src/scanners/legacy-scanner.ts` |
| **LegacyExpert** | 老旧技术栈代码生成 | `src/experts/legacy-expert.ts` |
| **LegacyAnalyzer** | 老旧代码深度分析 | `src/agents/legacy-analyzer.ts` |
| **LegacyMigrator** | 渐进式迁移执行 | `src/agents/legacy-migrator.ts` |
| **LegacyRefactor** | 安全重构执行 | `src/agents/legacy-refactor.ts` |
| **MigrationToolkit** | 迁移工具集 | `src/migration/index.ts` |

---

## 三、LegacyScanner 设计

### 3.1 老旧技术栈识别

```typescript
// src/scanners/legacy-scanner.ts

export interface LegacyTechStack {
  type: 'jquery' | 'angularjs' | 'php-legacy' | 'java-legacy' | 'ruby-legacy' | 'python-legacy';
  version: string;
  confidence: number;  // 0-100
  files: string[];
  dependencies: string[];
}

export interface LegacyAnalysisResult {
  techStacks: LegacyTechStack[];
  codeComplexity: {
    average: number;
    hotspots: { file: string; complexity: number }[];
  };
  techDebts: {
    type: string;
    severity: 'high' | 'medium' | 'low';
    files: string[];
    suggestion: string;
  }[];
  migrationPath: {
    from: string;
    to: string;
    difficulty: 'easy' | 'medium' | 'hard';
    steps: string[];
  }[];
}

export class LegacyScanner {
  // 技术栈识别规则
  private readonly TECH_PATTERNS = {
    jquery: {
      files: ['jquery-*.js', 'jquery.min.js'],
      imports: ['$', 'jQuery'],
      packageDeps: ['jquery'],
    },
    angularjs: {
      files: ['angular.js', 'angular.min.js'],
      imports: ['angular.module', 'angular.controller'],
      packageDeps: ['angular'],
    },
    'php-legacy': {
      files: ['*.php'],
      patterns: ['<?php', 'mysql_query', 'mysql_connect'],
    },
    'java-legacy': {
      files: ['*.java'],
      patterns: ['javax.servlet', 'java.util.Date', 'Vector', 'Hashtable'],
    },
  };

  async scan(projectRoot: string): Promise<LegacyAnalysisResult> {
    // 1. 识别技术栈
    const techStacks = await this.identifyTechStacks(projectRoot);
    
    // 2. 分析代码复杂度
    const codeComplexity = await this.analyzeComplexity(projectRoot);
    
    // 3. 识别技术债务
    const techDebts = await this.identifyTechDebts(projectRoot, techStacks);
    
    // 4. 生成迁移路径
    const migrationPath = this.generateMigrationPaths(techStacks);
    
    return { techStacks, codeComplexity, techDebts, migrationPath };
  }
}
```

### 3.2 支持的老旧技术栈

| 技术栈 | 识别方式 | 迁移目标 |
|--------|---------|---------|
| **jQuery** | `$()`、`jQuery()`、jquery.js | React/Vue |
| **AngularJS 1.x** | `angular.module()`、ng-app | Angular 17+ |
| **PHP 5.x** | `mysql_*`、`ereg_*` | PHP 8.x / Node.js |
| **Java 6/7** | `javax.servlet`、`Vector` | Java 17+ / Spring Boot |
| **Ruby 1.x/2.x** | 老旧Gem、Rails 3/4 | Ruby 3.x / Rails 7 |
| **Python 2.x** | `print`语句、`xrange` | Python 3.x |
| **Backbone.js** | `Backbone.Model` | React/Vue |
| **Knockout.js** | `ko.observable` | React/Vue |

---

## 四、LegacyExpert 设计

### 4.1 老旧技术栈代码生成

```typescript
// src/experts/legacy-expert.ts

export class LegacyExpert extends BaseExpert {
  name = 'LegacyExpert';

  canHandle(task: Task): boolean {
    // 1. 显式指定
    if (task.expert === 'LegacyExpert') return true;
    
    // 2. 任务类型
    if (task.type === 'legacy' || task.type === 'migration') return true;
    
    // 3. 关键词匹配
    const legacyKeywords = /老旧|迁移|重构|legacy|migrate|refactor|jQuery|AngularJS|PHP|Java 6|Java 7/i;
    return legacyKeywords.test(task.description) || legacyKeywords.test(task.name);
  }

  async execute(task: Task): Promise<ExpertResult> {
    const context = this.analyzeTaskContext(task);
    
    switch (context.migrationType) {
      case 'jquery-to-react':
        return this.migrateJQueryToReact(task, context);
      case 'angularjs-to-angular':
        return this.migrateAngularJSToAngular(task, context);
      case 'php-to-node':
        return this.migratePhpToNode(task, context);
      case 'java-upgrade':
        return this.upgradeJava(task, context);
      default:
        return this.generateLegacyCode(task, context);
    }
  }

  // jQuery → React 迁移
  private async migrateJQueryToReact(task: Task, context: TaskContext): Promise<ExpertResult> {
    const jqueryCode = await this.readJQueryCode(context.sourceFile);
    const reactCode = this.convertJQueryToReact(jqueryCode);
    const tests = this.generateReactTests(reactCode);
    
    return {
      success: true,
      files: [
        { path: context.targetFile, content: reactCode },
        { path: context.testFile, content: tests },
      ],
      changes: [{
        file: context.sourceFile,
        type: 'migration',
        description: 'jQuery → React 迁移',
      }],
      verification: '运行 npm test 验证功能一致性',
      suggestions: [
        '建议保留原jQuery文件作为备份',
        '建议逐步迁移，先迁移独立组件',
        '建议添加视觉回归测试',
      ],
    };
  }
}
```

### 4.2 迁移模板库

```typescript
// src/migration/migration-templates.ts

export const MIGRATION_TEMPLATES = {
  // jQuery → React
  'jquery-to-react': {
    patterns: [
      {
        jquery: `$('#element').on('click', handler)`,
        react: `<button onClick={handler}>`,
      },
      {
        jquery: `$.ajax({ url: '/api', success: callback })`,
        react: `fetch('/api').then(res => res.json()).then(callback)`,
      },
      {
        jquery: `$('.item').each(function() { $(this).text() })`,
        react: `items.map(item => <span key={item.id}>{item.text}</span>)`,
      },
    ],
  },
  
  // AngularJS → Angular
  'angularjs-to-angular': {
    patterns: [
      {
        angularjs: `$scope.items = []`,
        angular: `items: any[] = []`,
      },
      {
        angularjs: `$http.get('/api').then(response => ...)`,
        angular: `this.http.get<any[]>('/api').subscribe(response => ...)`,
      },
      {
        angularjs: `<div ng-repeat="item in items">`,
        angular: `<div *ngFor="let item of items">`,
      },
    ],
  },
  
  // PHP → Node.js
  'php-to-node': {
    patterns: [
      {
        php: `<?php echo $var; ?>`,
        node: `res.send(var)`,
      },
      {
        php: `mysql_query("SELECT * FROM users")`,
        node: `await db.query('SELECT * FROM users')`,
      },
      {
        php: `$_POST['name']`,
        node: `req.body.name`,
      },
    ],
  },
};
```

---

## 五、渐进式改造策略

### 5.1 改造模式

| 模式 | 说明 | 适用场景 | 风险 |
|------|------|---------|------|
| **绞杀者模式 (Strangler Fig)** | 新功能用新技术，逐步替换旧功能 | 大型系统 | 低 |
| **抽象分支 (Branch by Abstraction)** | 先抽象接口，再替换实现 | 紧耦合系统 | 中 |
| **并行运行 (Parallel Run)** | 新旧系统并行，逐步切换 | 核心系统 | 中 |
| **功能开关 (Feature Toggle)** | 开关控制新旧实现 | 需要快速回滚 | 低 |
| **数据复制 (Data Duplication)** | 新系统复制数据，逐步迁移 | 数据密集型 | 高 |

### 5.2 渐进式改造流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    渐进式改造流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: 分析与规划                                            │
│  ├── /dev-flow -legacy-analyze                                 │
│  │   ├── 识别老旧技术栈                                         │
│  │   ├── 分析代码复杂度                                         │
│  │   ├── 识别技术债务                                           │
│  │   └── 生成迁移路径                                           │
│  └── 输出: 迁移计划文档                                         │
│                                                                 │
│  Phase 2: 测试保障                                              │
│  ├── /dev-flow -legacy-test                                    │
│  │   ├── 为核心功能生成测试                                     │
│  │   ├── 建立测试基线                                           │
│  │   └── 配置CI测试                                             │
│  └── 输出: 测试覆盖率报告                                       │
│                                                                 │
│  Phase 3: 安全重构                                              │
│  ├── /dev-flow -legacy-refactor --module=<模块名>              │
│  │   ├── 选择低风险模块                                         │
│  │   ├── 生成重构代码                                           │
│  │   ├── 运行测试验证                                           │
│  │   └── 代码审查                                               │
│  └── 输出: 重构后的代码                                         │
│                                                                 │
│  Phase 4: 渐进迁移                                              │
│  ├── /dev-flow -legacy-migrate --from=<旧技术> --to=<新技术>   │
│  │   ├── 选择独立模块                                           │
│  │   ├── 生成迁移代码                                           │
│  │   ├── 并行运行验证                                           │
│  │   └── 功能开关控制                                           │
│  └── 输出: 迁移后的代码                                         │
│                                                                 │
│  Phase 5: 验证与清理                                            │
│  ├── /dev-flow -legacy-verify                                  │
│  │   ├── 全量测试                                               │
│  │   ├── 性能对比                                               │
│  │   └── 清理旧代码                                             │
│  └── 输出: 迁移完成报告                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 风险控制矩阵

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 功能回归 | 高 | 测试覆盖率>80%，并行运行验证 |
| 性能下降 | 中 | 性能基准测试，监控告警 |
| 数据丢失 | 高 | 数据备份，事务保护 |
| 用户影响 | 高 | 功能开关，灰度发布 |
| 时间超期 | 中 | 分阶段实施，里程碑验收 |

---

## 六、新增命令设计

### 6.1 命令列表

```bash
# 老旧项目分析
/dev-flow -legacy-analyze                    # 深度分析老旧项目
/dev-flow -legacy-analyze --tech-debt        # 识别技术债务
/dev-flow -legacy-analyze --complexity       # 分析代码复杂度

# 测试生成
/dev-flow -legacy-test                       # 为老旧代码生成测试
/dev-flow -legacy-test --coverage            # 生成测试覆盖率报告

# 安全重构
/dev-flow -legacy-refactor --module=<模块>   # 重构指定模块
/dev-flow -legacy-refactor --safe            # 安全模式（保守重构）

# 渐进迁移
/dev-flow -legacy-migrate --from=jquery --to=react
/dev-flow -legacy-migrate --from=angularjs --to=angular
/dev-flow -legacy-migrate --from=php --to=node

# 验证
/dev-flow -legacy-verify                     # 验证迁移结果
/dev-flow -legacy-verify --performance       # 性能对比验证
```

### 6.2 Legacy Mode 全流程

```bash
# 启动老旧项目改造全流程
/dev-flow --legacy <需求描述>

# 等价于依次执行:
# 1. legacy-analyze  → 分析老旧项目
# 2. legacy-test     → 建立测试保障
# 3. legacy-refactor → 安全重构
# 4. legacy-migrate  → 渐进迁移
# 5. legacy-verify   → 验证结果
```

---

## 七、实现计划

### 7.1 Phase 1: 基础设施 (2周)

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| 创建 LegacyScanner | P0 | 3天 |
| 创建 LegacyExpert | P0 | 3天 |
| 扩展 ResearchAgent 支持老旧技术栈识别 | P0 | 2天 |
| 添加 legacy-analyze 命令 | P0 | 2天 |

### 7.2 Phase 2: 迁移工具 (3周)

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| jQuery → React 迁移模板 | P0 | 4天 |
| AngularJS → Angular 迁移模板 | P1 | 4天 |
| PHP → Node.js 迁移模板 | P1 | 4天 |
| Java 升级模板 | P2 | 3天 |

### 7.3 Phase 3: 重构工具 (2周)

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| LegacyRefactor Agent | P0 | 3天 |
| 代码复杂度分析 | P1 | 2天 |
| 安全重构策略 | P1 | 3天 |
| 测试生成（兼容老旧框架） | P0 | 4天 |

### 7.4 Phase 4: 验证工具 (1周)

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| LegacyVerify Agent | P1 | 2天 |
| 性能对比工具 | P2 | 2天 |
| 迁移报告生成 | P1 | 1天 |

---

## 八、预期效果

### 8.1 适配度提升

| 维度 | 改造前 | 改造后 | 提升 |
|------|--------|--------|------|
| **老旧项目适配度** | 55/100 | **85/100** | **+30** |
| **技术栈适配度** | 82/100 | **90/100** | **+8** |
| **开发阶段适配度** | 90/100 | **95/100** | **+5** |

### 8.2 支持的老旧项目类型

| 项目类型 | 改造前 | 改造后 |
|----------|--------|--------|
| jQuery 项目 | ❌ 不支持 | ✅ 支持 |
| AngularJS 1.x 项目 | ❌ 不支持 | ✅ 支持 |
| PHP 5.x 项目 | ❌ 不支持 | ✅ 支持 |
| Java 6/7 项目 | ❌ 不支持 | ✅ 支持 |
| 混合技术栈项目 | ❌ 不支持 | ✅ 支持 |

### 8.3 核心能力提升

| 能力 | 改造前 | 改造后 |
|------|--------|--------|
| 老旧技术栈识别 | ❌ | ✅ |
| 渐进式迁移 | ❌ | ✅ |
| 安全重构 | ⚠️ 有限 | ✅ 完整 |
| 测试生成（老旧框架） | ❌ | ✅ |
| 迁移路径规划 | ❌ | ✅ |
| 风险评估 | ❌ | ✅ |

---

## 九、使用示例

### 9.1 jQuery 项目迁移

```bash
# 1. 分析项目
/dev-flow -legacy-analyze

# 输出:
# 检测到技术栈: jQuery 1.12.4
# 代码复杂度: 中等 (平均圈复杂度 8)
# 技术债务: 12项 (高严重性 3项)
# 建议迁移路径: jQuery → React (难度: 中等)

# 2. 生成测试
/dev-flow -legacy-test --module=user-management

# 3. 迁移模块
/dev-flow -legacy-migrate --from=jquery --to=react --module=user-management

# 4. 验证
/dev-flow -legacy-verify --module=user-management
```

### 9.2 PHP 项目迁移

```bash
# 1. 分析项目
/dev-flow -legacy-analyze

# 输出:
# 检测到技术栈: PHP 5.6 + MySQL 5.5
# 代码复杂度: 高 (平均圈复杂度 15)
# 技术债务: 28项 (高严重性 8项)
# 安全风险: mysql_* 函数已弃用
# 建议迁移路径: PHP 5.6 → Node.js + PostgreSQL (难度: 高)

# 2. 规划迁移
/dev-flow -legacy-plan --from=php --to=node

# 3. 渐进迁移（按模块）
/dev-flow -legacy-migrate --from=php --to=node --module=auth
/dev-flow -legacy-migrate --from=php --to=node --module=api
/dev-flow -legacy-migrate --from=php --to=node --module=admin
```

---

## 十、总结

### 10.1 方案优势

1. **渐进式改造**: 不需要一次性重写，降低风险
2. **测试先行**: 先建立测试保障，确保安全
3. **智能迁移**: 自动生成迁移代码，减少人工工作
4. **风险评估**: 提前识别风险，制定缓解措施
5. **多技术栈支持**: 覆盖主流老旧技术栈

### 10.2 实施建议

1. **优先级**: 先实现 LegacyScanner 和 LegacyExpert
2. **技术栈优先级**: jQuery → React > AngularJS → Angular > PHP → Node
3. **测试覆盖**: 迁移前确保测试覆盖率 > 60%
4. **团队培训**: 培训团队使用新工具和新技术栈

### 10.3 预期收益

- 老旧项目适配度从 55 分提升到 85 分
- 支持 5+ 种老旧技术栈的渐进式迁移
- 降低老旧项目维护成本 40%+
- 提升开发人员对老旧项目的信心

---

*方案版本: v1.0*
*规划日期: 2026-05-24*
