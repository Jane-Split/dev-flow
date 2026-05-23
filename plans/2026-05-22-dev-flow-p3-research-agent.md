# P3: 项目调研Agent 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现ResearchAgent，能够深度扫描项目，提取项目架构、结构、规范、组件、API、工具函数、样式等信息，持久化到记忆系统，并生成调研报告。

**Architecture:** ResearchAgent作为阶段Agent，协调多个扫描器（Scanner）完成不同类型信息的提取。采用分片扫描策略，按目录逐步扫描，控制上下文大小。

**Tech Stack:** TypeScript, glob, chokidar

**依赖:** P1（项目脚手架）, P2（记忆系统）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── agents/
│   │   ├── base-agent.ts          # Agent基类
│   │   └── research-agent.ts      # 调研Agent
│   ├── scanners/
│   │   ├── index.ts               # 扫描器导出
│   │   ├── structure-scanner.ts   # 结构扫描器
│   │   ├── dependency-scanner.ts  # 依赖扫描器
│   │   ├── convention-scanner.ts  # 规范扫描器
│   │   ├── component-scanner.ts   # 组件扫描器
│   │   ├── api-scanner.ts         # API扫描器
│   │   ├── util-scanner.ts        # 工具函数扫描器
│   │   └── style-scanner.ts       # 样式扫描器
│   └── ...
└── tests/
    └── agents/
        └── research-agent.test.ts
```

---

### Task 1: Agent基类

**Files:**
- Create: `src/agents/base-agent.ts`

- [ ] **Step 1: 创建Agent基类**

```typescript
// src/agents/base-agent.ts
import type { MemoryManager } from '../memory/index.js';

export interface AgentContext {
  projectRoot: string;
  memory: MemoryManager;
  sessionId: string;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  artifacts?: string[];
}

export abstract class BaseAgent {
  protected context: AgentContext;
  protected name: string;

  constructor(name: string, context: AgentContext) {
    this.name = name;
    this.context = context;
  }

  abstract execute(): Promise<AgentResult>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected getMemory(): MemoryManager {
    return this.context.memory;
  }

  protected getProjectRoot(): string {
    return this.context.projectRoot;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/agents/base-agent.ts
git commit -m "feat(agents): add base agent class"
```

---

### Task 2: 结构扫描器

**Files:**
- Create: `src/scanners/structure-scanner.ts`

- [ ] **Step 1: 创建结构扫描器**

```typescript
// src/scanners/structure-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { ProjectStructure, DirectoryNode, RouteInfo } from '../memory/types.js';

const IGNORE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.git/**',
  '.dev-flow/**',
  'coverage/**',
  '**/*.min.js',
  '**/*.map',
];

export class StructureScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<ProjectStructure> {
    const directories = await this.scanDirectories();
    const entryFiles = await this.findEntryFiles();
    const routes = await this.extractRoutes();

    return {
      root: this.projectRoot,
      directories,
      entryFiles,
      routes,
    };
  }

  private async scanDirectories(): Promise<DirectoryNode[]> {
    const pattern = '**/*';
    const files = await glob(pattern, {
      cwd: this.projectRoot,
      ignore: IGNORE_PATTERNS,
      nodir: false,
    });

    const rootNodes: DirectoryNode[] = [];
    const nodeMap = new Map<string, DirectoryNode>();

    // 构建目录树
    for (const file of files.sort()) {
      const parts = file.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const isFile = i === parts.length - 1 && part.includes('.');
          const node: DirectoryNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'directory',
          };

          nodeMap.set(currentPath, node);

          if (parentPath === '') {
            rootNodes.push(node);
          } else {
            const parent = nodeMap.get(parentPath);
            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(node);
            }
          }
        }
      }
    }

    return rootNodes;
  }

  private async findEntryFiles(): Promise<string[]> {
    const entryPatterns = [
      'src/index.{ts,tsx,js,jsx}',
      'src/main.{ts,tsx,js,jsx}',
      'src/App.{ts,tsx,js,jsx}',
      'pages/_app.{ts,tsx,js,jsx}',
      'app/layout.{ts,tsx,js,jsx}',
    ];

    const entries: string[] = [];
    for (const pattern of entryPatterns) {
      const files = await glob(pattern, { cwd: this.projectRoot });
      entries.push(...files);
    }

    return entries;
  }

  private async extractRoutes(): Promise<RouteInfo[] | undefined> {
    // 尝试查找路由配置文件
    const routePatterns = [
      'src/router/**/*.{ts,tsx,js,jsx}',
      'src/routes/**/*.{ts,tsx,js,jsx}',
      'pages/**/*.{ts,tsx,js,jsx}',
    ];

    for (const pattern of routePatterns) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: IGNORE_PATTERNS,
      });

      if (files.length > 0) {
        // 简化版：返回文件路径作为路由
        return files.map(file => ({
          path: this.fileToRoute(file),
          component: file,
        }));
      }
    }

    return undefined;
  }

  private fileToRoute(file: string): string {
    // 将文件路径转换为路由路径
    const route = file
      .replace(/^pages|^src\/routes?|^src\/router/, '')
      .replace(/\.(ts|tsx|js|jsx)$/, '')
      .replace(/\/index$/, '/')
      .replace(/\[([^\]]+)\]/g, ':$1');

    return route.startsWith('/') ? route : `/${route}`;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/structure-scanner.ts
git commit -m "feat(scanners): add structure scanner"
```

---

### Task 3: 依赖扫描器

**Files:**
- Create: `src/scanners/dependency-scanner.ts`

- [ ] **Step 1: 创建依赖扫描器**

```typescript
// src/scanners/dependency-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import type { ProjectMeta, TechStack } from '../memory/types.js';
import { fileExists, readJson } from '../utils/fs-utils.js';

export class DependencyScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<ProjectMeta> {
    const pkgJson = await this.readPackageJson();
    const techStack = this.detectTechStack(pkgJson);
    const packageManager = await this.detectPackageManager();

    return {
      name: pkgJson.name || 'unknown',
      version: pkgJson.version || '0.0.0',
      techStack,
      packageManager,
      framework: techStack.framework,
      buildTool: await this.detectBuildTool(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private async readPackageJson(): Promise<any> {
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (await fileExists(pkgPath)) {
      return readJson(pkgPath);
    }
    return {};
  }

  private detectTechStack(pkgJson: any): TechStack {
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

    const techStack: TechStack = {
      language: 'JavaScript',
      framework: 'Unknown',
    };

    // 检测语言
    if (deps.typescript) {
      techStack.language = 'TypeScript';
    }

    // 检测框架
    if (deps.react || deps['react-dom']) {
      techStack.framework = 'React';
    } else if (deps.vue) {
      techStack.framework = 'Vue';
    } else if (deps.angular || deps['@angular/core']) {
      techStack.framework = 'Angular';
    } else if (deps.svelte) {
      techStack.framework = 'Svelte';
    } else if (deps.next) {
      techStack.framework = 'Next.js';
    } else if (deps.nuxt) {
      techStack.framework = 'Nuxt';
    } else if (deps.express) {
      techStack.framework = 'Express';
    } else if (deps.nestjs || deps['@nestjs/core']) {
      techStack.framework = 'NestJS';
    }

    // 检测UI库
    if (deps['antd'] || deps['ant-design-vue']) {
      techStack.uiLibrary = 'Ant Design';
    } else if (deps['element-plus'] || deps['element-ui']) {
      techStack.uiLibrary = 'Element';
    } else if (deps['@mui/material'] || deps['@material-ui/core']) {
      techStack.uiLibrary = 'Material UI';
    } else if (deps['@chakra-ui/react']) {
      techStack.uiLibrary = 'Chakra UI';
    }

    // 检测状态管理
    if (deps.redux || deps['@reduxjs/toolkit']) {
      techStack.stateManagement = 'Redux';
    } else if (deps.zustand) {
      techStack.stateManagement = 'Zustand';
    } else if (deps.pinia) {
      techStack.stateManagement = 'Pinia';
    } else if (deps.vuex) {
      techStack.stateManagement = 'Vuex';
    } else if (deps.mobx) {
      techStack.stateManagement = 'MobX';
    }

    // 检测CSS方案
    if (deps.tailwindcss) {
      techStack.cssSolution = 'Tailwind CSS';
    } else if (deps['styled-components']) {
      techStack.cssSolution = 'Styled Components';
    } else if (deps['@emotion/react']) {
      techStack.cssSolution = 'Emotion';
    } else if (deps.sass || deps['node-sass']) {
      techStack.cssSolution = 'Sass';
    }

    // 检测测试框架
    if (deps.jest || deps.vitest) {
      techStack.testFramework = deps.vitest ? 'Vitest' : 'Jest';
    } else if (deps['@playwright/test']) {
      techStack.testFramework = 'Playwright';
    } else if (deps.cypress) {
      techStack.testFramework = 'Cypress';
    }

    return techStack;
  }

  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    if (await fileExists(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    } else if (await fileExists(path.join(this.projectRoot, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }

  private async detectBuildTool(): Promise<string> {
    if (await fileExists(path.join(this.projectRoot, 'vite.config.ts')) ||
        await fileExists(path.join(this.projectRoot, 'vite.config.js'))) {
      return 'Vite';
    } else if (await fileExists(path.join(this.projectRoot, 'webpack.config.ts')) ||
               await fileExists(path.join(this.projectRoot, 'webpack.config.js'))) {
      return 'Webpack';
    } else if (await fileExists(path.join(this.projectRoot, 'rollup.config.ts')) ||
               await fileExists(path.join(this.projectRoot, 'rollup.config.js'))) {
      return 'Rollup';
    } else if (await fileExists(path.join(this.projectRoot, 'tsconfig.json'))) {
      return 'tsc';
    }
    return 'Unknown';
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/dependency-scanner.ts
git commit -m "feat(scanners): add dependency scanner with tech stack detection"
```

---

### Task 4: 组件扫描器

**Files:**
- Create: `src/scanners/component-scanner.ts`

- [ ] **Step 1: 创建组件扫描器**

```typescript
// src/scanners/component-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { ComponentInfo, PropDefinition, EventDefinition } from '../memory/types.js';

const COMPONENT_PATTERNS = [
  'src/components/**/*.{tsx,jsx,vue}',
  'src/pages/**/*.{tsx,jsx,vue}',
  'src/views/**/*.{tsx,jsx,vue}',
  'src/layouts/**/*.{tsx,jsx,vue}',
];

const IGNORE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  '**/*.test.{tsx,jsx,vue}',
  '**/*.spec.{tsx,jsx,vue}',
];

export class ComponentScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];

    for (const pattern of COMPONENT_PATTERNS) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: IGNORE_PATTERNS,
      });

      for (const file of files) {
        const info = await this.extractComponentInfo(file);
        if (info) {
          components.push(info);
        }
      }
    }

    return components;
  }

  private async extractComponentInfo(filePath: string): Promise<ComponentInfo | null> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    const name = this.extractComponentName(filePath, content);
    const type = this.detectComponentType(filePath);
    const props = this.extractProps(content);
    const events = this.extractEvents(content);
    const description = this.extractDescription(content);
    const dependencies = this.extractDependencies(content);

    return {
      id: this.generateId(filePath),
      name,
      type,
      path: filePath,
      props,
      events,
      description,
      dependencies,
    };
  }

  private extractComponentName(filePath: string, content: string): string {
    // 从文件名提取
    const fileName = path.basename(filePath, path.extname(filePath));

    // 尝试从代码中提取组件名
    const nameMatch = content.match(/(?:const|function)\s+(\w+)\s*[=:]\s*(?:\(|memo|forwardRef)/);
    if (nameMatch) {
      return nameMatch[1];
    }

    // Vue组件名
    const vueNameMatch = content.match(/name:\s*['"](\w+)['"]/);
    if (vueNameMatch) {
      return vueNameMatch[1];
    }

    return fileName;
  }

  private detectComponentType(filePath: string): ComponentInfo['type'] {
    if (filePath.includes('/pages/') || filePath.includes('/views/')) {
      return 'page';
    } else if (filePath.includes('/layouts/')) {
      return 'layout';
    }
    return 'component';
  }

  private extractProps(content: string): PropDefinition[] {
    const props: PropDefinition[] = [];

    // TypeScript interface props
    const interfaceMatch = content.match(/interface\s+\w*Props\s*\{([^}]+)\}/);
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propMatches = propsContent.matchAll(/(\w+)(\?)?:\s*([^;]+);/g);

      for (const match of propMatches) {
        props.push({
          name: match[1],
          type: match[3].trim(),
          required: !match[2],
          description: '',
        });
      }
    }

    // Vue props
    const vuePropsMatch = content.match(/props:\s*\{([^}]+)\}/);
    if (vuePropsMatch) {
      const propsContent = vuePropsMatch[1];
      const propMatches = propsContent.matchAll(/(\w+):\s*\{[^}]*type:\s*(\w+)/g);

      for (const match of propMatches) {
        props.push({
          name: match[1],
          type: match[2],
          required: true,
          description: '',
        });
      }
    }

    return props;
  }

  private extractEvents(content: string): EventDefinition[] {
    const events: EventDefinition[] = [];

    // React onClick, onChange等
    const eventMatches = content.matchAll(/on(\w+)\s*[=:]\s*\(?([^)]*)\)?\s*=>/g);
    for (const match of eventMatches) {
      events.push({
        name: `on${match[1]}`,
        payload: match[2].trim() || 'void',
        description: '',
      });
    }

    // Vue emits
    const emitsMatch = content.match(/emits:\s*\[([^\]]+)\]/);
    if (emitsMatch) {
      const emitNames = emitsMatch[1].match(/['"](\w+)['"]/g);
      if (emitNames) {
        for (const name of emitNames) {
          events.push({
            name: name.replace(/['"]/g, ''),
            payload: 'unknown',
            description: '',
          });
        }
      }
    }

    return events;
  }

  private extractDescription(content: string): string {
    // JSDoc注释
    const jsdocMatch = content.match(/\/\*\*\s*\n?\s*\*\s*([^\n]+)/);
    if (jsdocMatch) {
      return jsdocMatch[1].trim();
    }

    // 单行注释
    const commentMatch = content.match(/\/\/\s*(.+)/);
    if (commentMatch) {
      return commentMatch[1].trim();
    }

    return '';
  }

  private extractDependencies(content: string): string[] {
    const deps: string[] = [];

    // import语句
    const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      if (!match[1].startsWith('.')) {
        deps.push(match[1]);
      }
    }

    return [...new Set(deps)];
  }

  private generateId(filePath: string): string {
    return `comp-${filePath.replace(/[/\\.]/g, '-')}`;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/component-scanner.ts
git commit -m "feat(scanners): add component scanner with prop/event extraction"
```

---

### Task 5: API扫描器

**Files:**
- Create: `src/scanners/api-scanner.ts`

- [ ] **Step 1: 创建API扫描器**

```typescript
// src/scanners/api-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { ApiEndpoint, DataModel } from '../memory/types.js';

const API_PATTERNS = [
  'src/api/**/*.{ts,js}',
  'src/services/**/*.{ts,js}',
  'src/controllers/**/*.{ts,js}',
  'src/routes/**/*.{ts,js}',
  'pages/api/**/*.{ts,js}',
];

export class ApiScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scanEndpoints(): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];

    for (const pattern of API_PATTERNS) {
      const files = await glob(pattern, { cwd: this.projectRoot });

      for (const file of files) {
        const fileEndpoints = await this.extractEndpoints(file);
        endpoints.push(...fileEndpoints);
      }
    }

    return endpoints;
  }

  async scanModels(): Promise<DataModel[]> {
    const models: DataModel[] = [];

    const modelPatterns = [
      'src/models/**/*.{ts,js}',
      'src/types/**/*.{ts,js}',
      'src/interfaces/**/*.{ts,js}',
    ];

    for (const pattern of modelPatterns) {
      const files = await glob(pattern, { cwd: this.projectRoot });

      for (const file of files) {
        const fileModels = await this.extractModels(file);
        models.push(...fileModels);
      }
    }

    return models;
  }

  private async extractEndpoints(filePath: string): Promise<ApiEndpoint[]> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const endpoints: ApiEndpoint[] = [];

    // Express风格路由
    const expressMatches = content.matchAll(/\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi);
    for (const match of expressMatches) {
      endpoints.push({
        id: `api-${match[1]}-${match[2].replace(/[/]/g, '-')}`,
        method: match[1].toUpperCase() as ApiEndpoint['method'],
        path: match[2],
        description: '',
        auth: content.includes('auth') || content.includes('token'),
        response: { body: 'unknown' },
      });
    }

    // Next.js API路由
    if (filePath.includes('pages/api/')) {
      const method = path.basename(filePath, path.extname(filePath));
      const apiPath = filePath
        .replace('pages/api', '')
        .replace(/\.(ts|js)$/, '')
        .replace(/\[([^\]]+)\]/g, ':$1');

      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        endpoints.push({
          id: `api-${method}-${apiPath.replace(/[/]/g, '-')}`,
          method: method.toUpperCase() as ApiEndpoint['method'],
          path: apiPath,
          description: '',
          auth: content.includes('auth') || content.includes('token'),
          response: { body: 'unknown' },
        });
      }
    }

    // fetch/axios调用
    const fetchMatches = content.matchAll(/(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*['"]([^'"]+)['"]/gi);
    for (const match of fetchMatches) {
      const method = match[0].includes('post') ? 'POST' :
                     match[0].includes('put') ? 'PUT' :
                     match[0].includes('delete') ? 'DELETE' :
                     match[0].includes('patch') ? 'PATCH' : 'GET';

      endpoints.push({
        id: `api-client-${method}-${match[1].replace(/[/]/g, '-')}`,
        method,
        path: match[1],
        description: '',
        auth: true,
        response: { body: 'unknown' },
      });
    }

    return endpoints;
  }

  private async extractModels(filePath: string): Promise<DataModel[]> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const models: DataModel[] = [];

    // TypeScript interface
    const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*\{([^}]+)\}/g);
    for (const match of interfaceMatches) {
      const fields = this.parseFields(match[2]);
      models.push({
        id: `model-${match[1]}`,
        name: match[1],
        fields,
        description: '',
      });
    }

    // TypeScript type
    const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*\{([^}]+)\}/g);
    for (const match of typeMatches) {
      const fields = this.parseFields(match[2]);
      models.push({
        id: `model-${match[1]}`,
        name: match[1],
        fields,
        description: '',
      });
    }

    return models;
  }

  private parseFields(content: string): DataModel['fields'] {
    const fields: DataModel['fields'] = [];
    const fieldMatches = content.matchAll(/(\w+)(\?)?:\s*([^;]+);?/g);

    for (const match of fieldMatches) {
      fields.push({
        name: match[1],
        type: match[3].trim(),
        required: !match[2],
        description: '',
      });
    }

    return fields;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/api-scanner.ts
git commit -m "feat(scanners): add API scanner for endpoints and models"
```

---

### Task 6: 工具函数扫描器

**Files:**
- Create: `src/scanners/util-scanner.ts`

- [ ] **Step 1: 创建工具函数扫描器**

```typescript
// src/scanners/util-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { UtilityFunction, ParameterDefinition } from '../memory/types.js';

const UTIL_PATTERNS = [
  'src/utils/**/*.{ts,js}',
  'src/lib/**/*.{ts,js}',
  'src/helpers/**/*.{ts,js}',
  'src/common/**/*.{ts,js}',
  'src/hooks/**/*.{ts,js}',
];

export class UtilScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scanFunctions(): Promise<UtilityFunction[]> {
    const functions: UtilityFunction[] = [];

    const patterns = UTIL_PATTERNS.filter(p => !p.includes('hooks'));

    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: this.projectRoot });

      for (const file of files) {
        const fileFunctions = await this.extractFunctions(file);
        functions.push(...fileFunctions);
      }
    }

    return functions;
  }

  async scanHooks(): Promise<UtilityFunction[]> {
    const hooks: UtilityFunction[] = [];

    const patterns = UTIL_PATTERNS.filter(p => p.includes('hooks'));

    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: this.projectRoot });

      for (const file of files) {
        const fileHooks = await this.extractHooks(file);
        hooks.push(...fileHooks);
      }
    }

    return hooks;
  }

  private async extractFunctions(filePath: string): Promise<UtilityFunction[]> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const functions: UtilityFunction[] = [];

    // 导出函数
    const exportMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g);
    for (const match of exportMatches) {
      functions.push({
        id: `func-${match[1]}`,
        name: match[1],
        path: filePath,
        signature: `function ${match[1]}(${match[2]})${match[3] ? ': ' + match[3].trim() : ''}`,
        description: this.extractDescription(content, match[1]),
        parameters: this.parseParameters(match[2]),
        returnType: match[3]?.trim() || 'void',
      });
    }

    // 箭头函数导出
    const arrowMatches = content.matchAll(/export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/g);
    for (const match of arrowMatches) {
      functions.push({
        id: `func-${match[1]}`,
        name: match[1],
        path: filePath,
        signature: `const ${match[1]} = (${match[2]})${match[3] ? ': ' + match[3].trim() : ''} => ...`,
        description: this.extractDescription(content, match[1]),
        parameters: this.parseParameters(match[2]),
        returnType: match[3]?.trim() || 'unknown',
      });
    }

    return functions;
  }

  private async extractHooks(filePath: string): Promise<UtilityFunction[]> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const hooks: UtilityFunction[] = [];

    // React Hooks
    const hookMatches = content.matchAll(/export\s+(?:const|function)\s+(use\w+)\s*[=\(]/g);
    for (const match of hookMatches) {
      hooks.push({
        id: `hook-${match[1]}`,
        name: match[1],
        path: filePath,
        signature: match[1],
        description: this.extractDescription(content, match[1]),
        parameters: [],
        returnType: 'unknown',
      });
    }

    return hooks;
  }

  private parseParameters(paramsStr: string): ParameterDefinition[] {
    if (!paramsStr.trim()) return [];

    const params: ParameterDefinition[] = [];
    const paramList = paramsStr.split(',');

    for (const param of paramList) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/(\w+)(\?)?(?::\s*(.+))?/);
      if (match) {
        params.push({
          name: match[1],
          type: match[3]?.trim() || 'unknown',
          required: !match[2],
          description: '',
        });
      }
    }

    return params;
  }

  private extractDescription(content: string, name: string): string {
    // 查找函数前的JSDoc注释
    const regex = new RegExp(`\\/\\*\\*([^*]*(?:\\*(?!\\/)[^*]*)*)\\*\\/\\s*(?:export\\s+)?(?:async\\s+)?(?:function|const)\\s+${name}`);
    const match = content.match(regex);

    if (match) {
      const doc = match[1]
        .replace(/\*\s*/g, '')
        .replace(/\n/g, ' ')
        .trim();

      // 提取第一行描述
      const desc = doc.split('@')[0].trim();
      return desc;
    }

    return '';
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/util-scanner.ts
git commit -m "feat(scanners): add utility function and hooks scanner"
```

---

### Task 7: 规范扫描器

**Files:**
- Create: `src/scanners/convention-scanner.ts`

- [ ] **Step 1: 创建规范扫描器**

```typescript
// src/scanners/convention-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import type { CodingConvention } from '../memory/types.js';
import { fileExists, readText } from '../utils/fs-utils.js';

export class ConventionScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    // ESLint规则
    const eslintConventions = await this.scanEslint();
    conventions.push(...eslintConventions);

    // TypeScript规则
    const tsConventions = await this.scanTsconfig();
    conventions.push(...tsConventions);

    // 从代码推断命名规范
    const namingConventions = await this.inferNamingConventions();
    conventions.push(...namingConventions);

    return conventions;
  }

  private async scanEslint(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    const configFiles = [
      '.eslintrc.json',
      '.eslintrc.js',
      '.eslintrc.yaml',
      '.eslintrc.yml',
    ];

    for (const file of configFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (await fileExists(filePath)) {
        const content = await readText(filePath);

        // 解析规则
        const rulesMatch = content.match(/"rules"\s*:\s*\{([^}]+)\}/);
        if (rulesMatch) {
          const rules = rulesMatch[1].matchAll(/"([^"]+)":\s*\[?"([^"\]]+)"\]?/g);

          for (const match of rules) {
            conventions.push({
              id: `eslint-${match[1].replace(/\//g, '-')}`,
              category: 'formatting',
              name: match[1],
              description: `ESLint rule: ${match[1]} = ${match[2]}`,
              examples: [],
              severity: match[2] === 'error' ? 'error' : match[2] === 'warn' ? 'warn' : 'info',
            });
          }
        }
        break;
      }
    }

    return conventions;
  }

  private async scanTsconfig(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (await fileExists(tsconfigPath)) {
      const content = await readText(tsconfigPath);

      // strict模式
      if (content.includes('"strict": true')) {
        conventions.push({
          id: 'ts-strict',
          category: 'structure',
          name: 'strict mode',
          description: 'TypeScript strict mode is enabled',
          examples: [],
          severity: 'error',
        });
      }

      // noImplicitAny
      if (content.includes('"noImplicitAny": true')) {
        conventions.push({
          id: 'ts-noImplicitAny',
          category: 'structure',
          name: 'noImplicitAny',
          description: 'Implicit any is not allowed',
          examples: [],
          severity: 'error',
        });
      }
    }

    return conventions;
  }

  private async inferNamingConventions(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    // 这里可以扫描代码文件，分析命名模式
    // 简化版：返回通用规范

    conventions.push({
      id: 'naming-component',
      category: 'naming',
      name: 'Component naming',
      description: 'React components should be named in PascalCase',
      examples: ['Button', 'UserProfile', 'NavigationBar'],
      severity: 'error',
    });

    conventions.push({
      id: 'naming-hook',
      category: 'naming',
      name: 'Hook naming',
      description: 'React hooks should be named with "use" prefix',
      examples: ['useAuth', 'useLocalStorage', 'useDebounce'],
      severity: 'error',
    });

    conventions.push({
      id: 'naming-util',
      category: 'naming',
      name: 'Utility function naming',
      description: 'Utility functions should be named in camelCase',
      examples: ['formatDate', 'parseJSON', 'validateEmail'],
      severity: 'warn',
    });

    return conventions;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/convention-scanner.ts
git commit -m "feat(scanners): add convention scanner for ESLint and TypeScript rules"
```

---

### Task 8: 样式扫描器

**Files:**
- Create: `src/scanners/style-scanner.ts`

- [ ] **Step 1: 创建样式扫描器**

```typescript
// src/scanners/style-scanner.ts
import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { StyleSystem, ThemeConfig, DesignToken } from '../memory/types.js';
import { fileExists, readText } from '../utils/fs-utils.js';

const STYLE_PATTERNS = [
  'src/styles/**/*.{css,scss,less}',
  'src/**/*.{module.css,module.scss,module.less}',
  'tailwind.config.{js,ts}',
  'theme.{js,ts,json}',
];

export class StyleScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<StyleSystem> {
    const solution = await this.detectSolution();
    const theme = await this.extractTheme();
    const tokens = await this.extractTokens();

    return {
      solution,
      theme,
      tokens,
    };
  }

  private async detectSolution(): Promise<StyleSystem['solution']> {
    // 检测 Tailwind
    if (await fileExists(path.join(this.projectRoot, 'tailwind.config.js')) ||
        await fileExists(path.join(this.projectRoot, 'tailwind.config.ts'))) {
      return 'tailwind';
    }

    // 检测 styled-components
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (await fileExists(pkgPath)) {
      const content = await readText(pkgPath);
      if (content.includes('styled-components')) {
        return 'styled-components';
      }
    }

    // 检测 CSS Modules
    const moduleFiles = await glob('src/**/*.module.css', { cwd: this.projectRoot });
    if (moduleFiles.length > 0) {
      return 'css-modules';
    }

    // 检测 Sass
    const sassFiles = await glob('src/**/*.scss', { cwd: this.projectRoot });
    if (sassFiles.length > 0) {
      return 'sass';
    }

    // 检测 Less
    const lessFiles = await glob('src/**/*.less', { cwd: this.projectRoot });
    if (lessFiles.length > 0) {
      return 'less';
    }

    return 'css-modules';
  }

  private async extractTheme(): Promise<ThemeConfig | undefined> {
    const theme: ThemeConfig = {};

    // 尝试读取主题配置文件
    const themeFiles = [
      'src/styles/theme.{js,ts,json}',
      'src/theme.{js,ts,json}',
      'theme.{js,ts,json}',
    ];

    for (const pattern of themeFiles) {
      const files = await glob(pattern, { cwd: this.projectRoot });
      if (files.length > 0) {
        try {
          const content = await readText(path.join(this.projectRoot, files[0]));
          
          // 简单解析颜色
          const colorMatches = content.matchAll(/['"](\w+)['"]:\s*['"](#?[a-fA-F0-9]{3,8}|rgb\([^)]+\)|\w+)['"]/g);
          for (const match of colorMatches) {
            theme.colors = theme.colors || {};
            theme.colors[match[1]] = match[2];
          }

          // 简单解析断点
          const bpMatches = content.matchAll(/['"](\w+)['"]:\s*['"](\d+(?:px|em|rem))['"]/g);
          for (const match of bpMatches) {
            if (['sm', 'md', 'lg', 'xl', '2xl'].includes(match[1])) {
              theme.breakpoints = theme.breakpoints || {};
              theme.breakpoints[match[1]] = match[2];
            }
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    // Tailwind 配置
    const tailwindPath = path.join(this.projectRoot, 'tailwind.config.js');
    if (await fileExists(tailwindPath)) {
      const content = await readText(tailwindPath);
      
      // 提取颜色
      const colorSection = content.match(/colors:\s*\{([^}]+)\}/);
      if (colorSection) {
        theme.colors = theme.colors || {};
        const colorMatches = colorSection[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
        for (const match of colorMatches) {
          theme.colors[match[1]] = match[2];
        }
      }
    }

    return Object.keys(theme).length > 0 ? theme : undefined;
  }

  private async extractTokens(): Promise<DesignToken[]> {
    const tokens: DesignToken[] = [];

    // 从 CSS 变量提取
    const cssFiles = await glob('src/**/*.css', { cwd: this.projectRoot });
    for (const file of cssFiles) {
      const content = await readText(path.join(this.projectRoot, file));
      
      // CSS 变量
      const varMatches = content.matchAll(/--([\w-]+):\s*([^;]+);/g);
      for (const match of varMatches) {
        const name = match[1];
        const value = match[2].trim();
        
        tokens.push({
          name: `--${name}`,
          value,
          category: this.categorizeToken(name, value),
        });
      }
    }

    // 从 Tailwind 配置提取
    const tailwindPath = path.join(this.projectRoot, 'tailwind.config.js');
    if (await fileExists(tailwindPath)) {
      const content = await readText(tailwindPath);
      
      // spacing
      const spacingMatch = content.match(/spacing:\s*\{([^}]+)\}/);
      if (spacingMatch) {
        const spMatches = spacingMatch[1].matchAll(/['"](\w+)['"]:\s*['"]([^'"]+)['"]/g);
        for (const match of spMatches) {
          tokens.push({
            name: `spacing-${match[1]}`,
            value: match[2],
            category: 'spacing',
          });
        }
      }
    }

    return tokens;
  }

  private categorizeToken(name: string, value: string): DesignToken['category'] {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('color') || lowerName.includes('bg') || 
        lowerName.includes('border') && /^#|rgb|hsl/.test(value)) {
      return 'color';
    }
    
    if (lowerName.includes('spacing') || lowerName.includes('padding') || 
        lowerName.includes('margin') || lowerName.includes('gap')) {
      return 'spacing';
    }
    
    if (lowerName.includes('font') || lowerName.includes('text') || 
        lowerName.includes('line-height') || lowerName.includes('letter')) {
      return 'typography';
    }
    
    if (lowerName.includes('shadow') || lowerName.includes('elevation')) {
      return 'shadow';
    }
    
    if (lowerName.includes('radius') || lowerName.includes('border')) {
      return 'border';
    }
    
    return 'color'; // 默认
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/scanners/style-scanner.ts
git commit -m "feat(scanners): add style scanner for theme and token extraction"
```

---

### Task 9: ResearchAgent整合

**Files:**
- Create: `src/agents/research-agent.ts`
- Create: `src/scanners/index.ts`
- Test: `tests/agents/research-agent.test.ts`

- [ ] **Step 1: 创建扫描器导出**

```typescript
// src/scanners/index.ts
export { StructureScanner } from './structure-scanner.js';
export { DependencyScanner } from './dependency-scanner.js';
export { ComponentScanner } from './component-scanner.js';
export { ApiScanner } from './api-scanner.js';
export { UtilScanner } from './util-scanner.js';
export { ConventionScanner } from './convention-scanner.js';
export { StyleScanner } from './style-scanner.js';
```

- [ ] **Step 2: 创建ResearchAgent**

```typescript
// src/agents/research-agent.ts
import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import {
  StructureScanner,
  DependencyScanner,
  ComponentScanner,
  ApiScanner,
  UtilScanner,
  ConventionScanner,
} from '../scanners/index.js';
import { logger } from '../utils/logger.js';

export interface ResearchResult {
  projectMeta: any;
  structure: any;
  components: any[];
  apis: any[];
  models: any[];
  utils: any[];
  hooks: any[];
  conventions: any[];
}

export class ResearchAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('ResearchAgent', context);
  }

  async execute(): Promise<AgentResult<ResearchResult>> {
    try {
      logger.title('项目深度调研');

      const projectRoot = this.getProjectRoot();
      const memory = this.getMemory();

      // Step 1: 扫描依赖和项目元信息
      logger.step(1, 8, '扫描项目依赖...');
      const depScanner = new DependencyScanner(projectRoot);
      const projectMeta = await depScanner.scan();
      await memory.setProjectMeta(projectMeta);
      logger.success(`技术栈: ${projectMeta.techStack.framework} + ${projectMeta.techStack.language}`);

      // Step 2: 扫描项目结构
      logger.step(2, 8, '扫描项目结构...');
      const structScanner = new StructureScanner(projectRoot);
      const structure = await structScanner.scan();
      await memory.setStructure(structure);
      logger.success(`发现 ${structure.entryFiles.length} 个入口文件`);

      // Step 3: 扫描组件
      logger.step(3, 8, '扫描组件库...');
      const compScanner = new ComponentScanner(projectRoot);
      const components = await compScanner.scan();
      await memory.setComponents(components);
      logger.success(`发现 ${components.length} 个组件`);

      // Step 4: 扫描API
      logger.step(4, 8, '扫描API接口...');
      const apiScanner = new ApiScanner(projectRoot);
      const apis = await apiScanner.scanEndpoints();
      const models = await apiScanner.scanModels();
      await memory.setApis(apis);
      await memory.setModels(models);
      logger.success(`发现 ${apis.length} 个API端点, ${models.length} 个数据模型`);

      // Step 5: 扫描工具函数
      logger.step(5, 8, '扫描工具函数...');
      const utilScanner = new UtilScanner(projectRoot);
      const utils = await utilScanner.scanFunctions();
      const hooks = await utilScanner.scanHooks();
      await memory.setUtils(utils);
      logger.success(`发现 ${utils.length} 个工具函数, ${hooks.length} 个Hooks`);

      // Step 6: 扫描编码规范
      logger.step(6, 8, '扫描编码规范...');
      const convScanner = new ConventionScanner(projectRoot);
      const conventions = await convScanner.scan();
      await memory.setConventions(conventions);
      logger.success(`发现 ${conventions.length} 条编码规范`);

      // Step 7: 生成架构文档
      logger.step(7, 8, '生成架构文档...');
      const architecture = this.generateArchitectureDoc(projectMeta, structure);
      await memory.write('architecture', architecture);
      logger.success('架构文档已生成');

      // Step 8: 完成
      logger.step(8, 8, '调研完成');

      return {
        success: true,
        data: {
          projectMeta,
          structure,
          components,
          apis,
          models,
          utils,
          hooks,
          conventions,
        },
        artifacts: ['.dev-flow/memory/'],
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

  private generateArchitectureDoc(projectMeta: any, structure: any): string {
    return `# 项目架构文档

## 项目概览
- **名称**: ${projectMeta.name}
- **技术栈**: ${projectMeta.techStack.framework} + ${projectMeta.techStack.language}
- **构建工具**: ${projectMeta.buildTool}
- **包管理器**: ${projectMeta.packageManager}

## 技术栈详情
- **语言**: ${projectMeta.techStack.language}
- **框架**: ${projectMeta.techStack.framework}
- **UI库**: ${projectMeta.techStack.uiLibrary || '无'}
- **状态管理**: ${projectMeta.techStack.stateManagement || '无'}
- **CSS方案**: ${projectMeta.techStack.cssSolution || 'CSS'}
- **测试框架**: ${projectMeta.techStack.testFramework || '无'}

## 项目结构
\`\`\`
${this.formatStructure(structure.directories)}
\`\`\`

## 入口文件
${structure.entryFiles.map((f: string) => `- ${f}`).join('\n')}
`;
  }

  private formatStructure(nodes: any[], indent = 0): string {
    let result = '';
    for (const node of nodes.slice(0, 20)) { // 限制输出
      result += '  '.repeat(indent) + `${node.type === 'directory' ? '📁' : '📄'} ${node.name}\n`;
      if (node.children && indent < 3) {
        result += this.formatStructure(node.children, indent + 1);
      }
    }
    return result;
  }
}
```

- [ ] **Step 3: 编写测试**

```typescript
// tests/agents/research-agent.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { MemoryManager } from '../../src/memory/index.js';
import { ResearchAgent } from '../../src/agents/research-agent.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-research-test-' + Date.now());
let memory: MemoryManager;

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true });

  // 创建模拟项目
  await fs.writeFile(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({
      name: 'test-project',
      dependencies: { react: '^18.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    })
  );

  await fs.writeFile(
    path.join(tmpDir, 'src', 'App.tsx'),
    `import React from 'react';
export function App() {
  return <div>Hello</div>;
}`
  );

  memory = new MemoryManager(tmpDir);
});

afterEach(async () => {
  memory.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('ResearchAgent', () => {
  it('scans project and saves to memory', async () => {
    const agent = new ResearchAgent({
      projectRoot: tmpDir,
      memory,
      sessionId: 'test-session',
    });

    const result = await agent.execute();

    expect(result.success).toBe(true);
    expect(result.data?.projectMeta.name).toBe('test-project');
    expect(result.data?.projectMeta.techStack.framework).toBe('React');
  });

  it('saves components to memory', async () => {
    const agent = new ResearchAgent({
      projectRoot: tmpDir,
      memory,
      sessionId: 'test-session',
    });

    await agent.execute();

    const components = await memory.getComponents();
    expect(components).not.toBeNull();
    expect(components!.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: 运行测试**

Run: `npx vitest run tests/agents/research-agent.test.ts`
Expected: 所有测试通过

- [ ] **Step 5: 最终提交**

```bash
git add src/agents/research-agent.ts src/scanners/index.ts tests/agents/research-agent.test.ts
git commit -m "feat(agents): P3 complete - research agent with all scanners"
```
