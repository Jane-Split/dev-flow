# P2: 记忆系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现dev-flow的记忆系统，包括文件存储（YAML/JSON/Markdown）、SQLite数据库存储、向量索引，以及统一的记忆管理器API，支持项目信息的持久化、检索和语义搜索。

**Architecture:** 采用混合存储策略：结构化数据（组件、API、配置）使用JSON/YAML文件存储便于版本控制；向量嵌入和敏感数据使用SQLite存储；通过MemoryManager统一对外提供API。

**Tech Stack:** TypeScript, better-sqlite3, yaml, glob

**依赖:** P1（项目脚手架与CLI）

---

## 文件结构

```
dev-flow/
├── src/
│   ├── memory/
│   │   ├── index.ts              # 导出入口
│   │   ├── memory-manager.ts     # 记忆管理器（统一API）
│   │   ├── file-store.ts         # 文件存储实现
│   │   ├── db-store.ts           # SQLite存储实现
│   │   ├── vector-index.ts       # 向量索引实现
│   │   └── types.ts              # 类型定义
│   └── ...
└── tests/
    └── memory/
        ├── memory-manager.test.ts
        ├── file-store.test.ts
        ├── db-store.test.ts
        └── vector-index.test.ts
```

---

### Task 1: 类型定义

**Files:**
- Create: `src/memory/types.ts`

- [ ] **Step 1: 创建记忆系统类型定义**

```typescript
// src/memory/types.ts

// 项目元信息
export interface ProjectMeta {
  name: string;
  version: string;
  techStack: TechStack;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  framework: string;
  buildTool: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechStack {
  language: string;
  framework: string;
  uiLibrary?: string;
  stateManagement?: string;
  cssSolution?: string;
  testFramework?: string;
}

// 目录结构
export interface ProjectStructure {
  root: string;
  directories: DirectoryNode[];
  entryFiles: string[];
  routes?: RouteInfo[];
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: DirectoryNode[];
  description?: string;
}

export interface RouteInfo {
  path: string;
  component: string;
  children?: RouteInfo[];
}

// 编码规范
export interface CodingConvention {
  id: string;
  category: 'naming' | 'formatting' | 'structure' | 'git' | 'comment';
  name: string;
  description: string;
  examples: string[];
  severity: 'error' | 'warn' | 'info';
}

// 组件定义
export interface ComponentInfo {
  id: string;
  name: string;
  type: 'page' | 'component' | 'layout' | 'widget';
  path: string;
  props: PropDefinition[];
  events: EventDefinition[];
  slots?: string[];
  description: string;
  usage?: string;
  dependencies: string[];
}

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface EventDefinition {
  name: string;
  payload: string;
  description: string;
}

// API定义
export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: boolean;
  request?: RequestResponse;
  response: RequestResponse;
  tags?: string[];
}

export interface RequestResponse {
  headers?: Record<string, string>;
  body?: string;
  schema?: string;
}

export interface DataModel {
  id: string;
  name: string;
  fields: ModelField[];
  description: string;
}

export interface ModelField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// 通用方法
export interface UtilityFunction {
  id: string;
  name: string;
  path: string;
  signature: string;
  description: string;
  parameters: ParameterDefinition[];
  returnType: string;
  usage?: string;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// 样式系统
export interface StyleSystem {
  solution: 'css-modules' | 'tailwind' | 'styled-components' | 'sass' | 'less';
  theme?: ThemeConfig;
  tokens: DesignToken[];
}

export interface ThemeConfig {
  colors?: Record<string, string>;
  breakpoints?: Record<string, string>;
  spacing?: Record<string, string>;
}

export interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'spacing' | 'typography' | 'shadow' | 'border';
}

// 学习模式
export interface LearnedPattern {
  id: string;
  type: 'code' | 'flow' | 'problem';
  name: string;
  description: string;
  code?: string;
  steps?: string[];
  confidence: number;
  usageCount: number;
  lastUpdated: string;
}

export interface FeedbackRecord {
  id: string;
  timestamp: string;
  stage: string;
  task: string;
  userAction: 'confirmed' | 'modified' | 'rejected';
  originalOutput?: string;
  userCorrection?: string;
  learned?: string;
}

// 记忆键类型
export type MemoryKey =
  | 'project'
  | 'structure'
  | 'architecture'
  | 'conventions'
  | 'components'
  | 'apis'
  | 'models'
  | 'utils'
  | 'hooks'
  | 'styles'
  | 'patterns'
  | 'feedback';

// 记忆条目
export interface MemoryEntry {
  key: MemoryKey;
  data: unknown;
  updatedAt: string;
  version: number;
}

// 向量索引条目
export interface VectorEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: string;
    path?: string;
    name?: string;
  };
}

// 搜索结果
export interface SearchResult {
  entry: VectorEntry;
  score: number;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/memory/types.ts
git commit -m "feat(memory): add type definitions for memory system"
```

---

### Task 2: 文件存储实现

**Files:**
- Create: `src/memory/file-store.ts`
- Test: `tests/memory/file-store.test.ts`

- [ ] **Step 1: 创建文件存储模块**

```typescript
// src/memory/file-store.ts
import path from 'node:path';
import yaml from 'yaml';
import { ensureDir, fileExists, readText, writeText } from '../utils/fs-utils.js';
import type { MemoryKey, MemoryEntry } from './types.js';

const MEMORY_DIR = '.dev-flow/memory';

const FILE_EXTENSIONS: Record<MemoryKey, 'yaml' | 'json' | 'md'> = {
  project: 'yaml',
  structure: 'json',
  architecture: 'md',
  conventions: 'md',
  components: 'json',
  apis: 'json',
  models: 'json',
  utils: 'json',
  hooks: 'json',
  styles: 'json',
  patterns: 'json',
  feedback: 'json',
};

const FILE_NAMES: Record<MemoryKey, string> = {
  project: 'project.yaml',
  structure: 'structure.json',
  architecture: 'architecture.md',
  conventions: 'conventions/coding.md',
  components: 'components/frontend.json',
  apis: 'apis/endpoints.json',
  models: 'apis/models.json',
  utils: 'utils/functions.json',
  hooks: 'utils/hooks.json',
  styles: 'styles/theme.json',
  patterns: 'patterns/learned.json',
  feedback: 'patterns/feedback.json',
};

export class FileStore {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  private getMemoryPath(): string {
    return path.join(this.projectRoot, MEMORY_DIR);
  }

  private getFilePath(key: MemoryKey): string {
    return path.join(this.getMemoryPath(), FILE_NAMES[key]);
  }

  async read<T>(key: MemoryKey): Promise<T | null> {
    const filePath = this.getFilePath(key);

    if (!(await fileExists(filePath))) {
      return null;
    }

    const content = await readText(filePath);
    const ext = FILE_EXTENSIONS[key];

    if (ext === 'yaml') {
      return yaml.parse(content) as T;
    } else if (ext === 'json') {
      return JSON.parse(content) as T;
    } else {
      return content as unknown as T;
    }
  }

  async write<T>(key: MemoryKey, data: T): Promise<void> {
    const filePath = this.getFilePath(key);
    const ext = FILE_EXTENSIONS[key];

    await ensureDir(path.dirname(filePath));

    let content: string;
    if (ext === 'yaml') {
      content = yaml.stringify(data);
    } else if (ext === 'json') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = String(data);
    }

    await writeText(filePath, content);
  }

  async readEntry(key: MemoryKey): Promise<MemoryEntry | null> {
    const data = await this.read<unknown>(key);
    if (data === null) {
      return null;
    }
    return {
      key,
      data,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  }

  async writeEntry(entry: MemoryEntry): Promise<void> {
    await this.write(entry.key, entry.data);
  }

  async exists(key: MemoryKey): Promise<boolean> {
    return fileExists(this.getFilePath(key));
  }

  async delete(key: MemoryKey): Promise<void> {
    const filePath = this.getFilePath(key);
    const { default: fs } = await import('node:fs/promises');
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }
  }

  async listKeys(): Promise<MemoryKey[]> {
    const keys: MemoryKey[] = [];
    for (const key of Object.keys(FILE_NAMES) as MemoryKey[]) {
      if (await this.exists(key)) {
        keys.push(key);
      }
    }
    return keys;
  }
}
```

- [ ] **Step 2: 编写文件存储测试**

```typescript
// tests/memory/file-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { FileStore } from '../../src/memory/file-store.js';
import type { ProjectMeta } from '../../src/memory/types.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-file-store-test-' + Date.now());

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('FileStore', () => {
  it('writes and reads YAML file', async () => {
    const store = new FileStore(tmpDir);
    const data: ProjectMeta = {
      name: 'test-project',
      version: '1.0.0',
      techStack: {
        language: 'TypeScript',
        framework: 'React',
      },
      packageManager: 'npm',
      framework: 'React',
      buildTool: 'Vite',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    await store.write('project', data);
    const result = await store.read<ProjectMeta>('project');

    expect(result).toEqual(data);
  });

  it('writes and reads JSON file', async () => {
    const store = new FileStore(tmpDir);
    const data = { components: [{ name: 'Button', path: 'src/Button.tsx' }] };

    await store.write('components', data);
    const result = await store.read<typeof data>('components');

    expect(result).toEqual(data);
  });

  it('returns null for non-existing key', async () => {
    const store = new FileStore(tmpDir);
    const result = await store.read('project');
    expect(result).toBeNull();
  });

  it('checks existence correctly', async () => {
    const store = new FileStore(tmpDir);
    expect(await store.exists('project')).toBe(false);
    await store.write('project', { name: 'test' });
    expect(await store.exists('project')).toBe(true);
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run tests/memory/file-store.test.ts`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add src/memory/file-store.ts tests/memory/file-store.test.ts
git commit -m "feat(memory): implement file storage with YAML/JSON/MD support"
```

---

### Task 3: SQLite存储实现

**Files:**
- Create: `src/memory/db-store.ts`
- Test: `tests/memory/db-store.test.ts`

- [ ] **Step 1: 安装依赖**

Run: `npm install better-sqlite3 && npm install -D @types/better-sqlite3`
Expected: 安装成功

- [ ] **Step 2: 创建SQLite存储模块**

```typescript
// src/memory/db-store.ts
import path from 'node:path';
import Database from 'better-sqlite3';
import type { VectorEntry, SearchResult } from './types.js';

const DB_PATH = '.dev-flow/db/memory.db';

export class DbStore {
  private db: Database.Database;
  private dbPath: string;

  constructor(projectRoot: string) {
    this.dbPath = path.join(projectRoot, DB_PATH);
    this.db = new Database(this.dbPath);
    this.initialize();
  }

  private initialize(): void {
    // 创建向量表（简化版，实际可使用sqlite-vss扩展）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding BLOB,
        type TEXT,
        path TEXT,
        name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建反馈记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        stage TEXT NOT NULL,
        task TEXT NOT NULL,
        user_action TEXT NOT NULL,
        original_output TEXT,
        user_correction TEXT,
        learned TEXT
      );
    `);

    // 创建会话记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        metadata TEXT
      );
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_vectors_type ON vectors(type);
      CREATE INDEX IF NOT EXISTS idx_vectors_name ON vectors(name);
    `);
  }

  // 向量操作
  insertVector(entry: VectorEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vectors (id, content, embedding, type, path, name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const embeddingBuffer = Buffer.from(new Float32Array(entry.embedding).buffer);

    stmt.run(
      entry.id,
      entry.content,
      embeddingBuffer,
      entry.metadata.type,
      entry.metadata.path || null,
      entry.metadata.name || null
    );
  }

  getVector(id: string): VectorEntry | null {
    const stmt = this.db.prepare('SELECT * FROM vectors WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    const embedding = Array.from(new Float32Array(row.embedding.buffer));

    return {
      id: row.id,
      content: row.content,
      embedding,
      metadata: {
        type: row.type,
        path: row.path || undefined,
        name: row.name || undefined,
      },
    };
  }

  searchVectors(queryEmbedding: number[], limit = 10): SearchResult[] {
    // 简化版：使用余弦相似度
    const stmt = this.db.prepare('SELECT * FROM vectors');
    const rows = stmt.all() as any[];

    const results: SearchResult[] = rows.map((row) => {
      const embedding = Array.from(new Float32Array(row.embedding.buffer));
      const score = this.cosineSimilarity(queryEmbedding, embedding);

      return {
        entry: {
          id: row.id,
          content: row.content,
          embedding,
          metadata: {
            type: row.type,
            path: row.path || undefined,
            name: row.name || undefined,
          },
        },
        score,
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  deleteVector(id: string): void {
    const stmt = this.db.prepare('DELETE FROM vectors WHERE id = ?');
    stmt.run(id);
  }

  // 反馈操作
  insertFeedback(feedback: {
    id: string;
    timestamp: string;
    stage: string;
    task: string;
    userAction: string;
    originalOutput?: string;
    userCorrection?: string;
    learned?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO feedback (id, timestamp, stage, task, user_action, original_output, user_correction, learned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      feedback.id,
      feedback.timestamp,
      feedback.stage,
      feedback.task,
      feedback.userAction,
      feedback.originalOutput || null,
      feedback.userCorrection || null,
      feedback.learned || null
    );
  }

  getFeedback(limit = 100): any[] {
    const stmt = this.db.prepare('SELECT * FROM feedback ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  }

  // 会话操作
  createSession(id: string, metadata?: Record<string, unknown>): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, created_at, status, metadata)
      VALUES (?, ?, 'active', ?)
    `);

    stmt.run(id, new Date().toISOString(), metadata ? JSON.stringify(metadata) : null);
  }

  updateSessionStatus(id: string, status: string): void {
    const stmt = this.db.prepare('UPDATE sessions SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  close(): void {
    this.db.close();
  }
}
```

- [ ] **Step 3: 编写SQLite存储测试**

```typescript
// tests/memory/db-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { DbStore } from '../../src/memory/db-store.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-db-store-test-' + Date.now());

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('DbStore', () => {
  it('inserts and retrieves vector', () => {
    const store = new DbStore(tmpDir);

    const entry = {
      id: 'test-1',
      content: 'Test content',
      embedding: [0.1, 0.2, 0.3],
      metadata: { type: 'component', name: 'Button' },
    };

    store.insertVector(entry);
    const result = store.getVector('test-1');

    expect(result).not.toBeNull();
    expect(result?.content).toBe('Test content');
    expect(result?.embedding).toEqual([0.1, 0.2, 0.3]);

    store.close();
  });

  it('searches vectors by similarity', () => {
    const store = new DbStore(tmpDir);

    store.insertVector({
      id: 'vec-1',
      content: 'React Button component',
      embedding: [1, 0, 0],
      metadata: { type: 'component' },
    });

    store.insertVector({
      id: 'vec-2',
      content: 'API endpoint for users',
      embedding: [0, 1, 0],
      metadata: { type: 'api' },
    });

    const results = store.searchVectors([0.9, 0.1, 0], 10);

    expect(results.length).toBe(2);
    expect(results[0].entry.id).toBe('vec-1'); // Most similar

    store.close();
  });

  it('inserts and retrieves feedback', () => {
    const store = new DbStore(tmpDir);

    store.insertFeedback({
      id: 'fb-1',
      timestamp: new Date().toISOString(),
      stage: 'develop',
      task: 'Create Button',
      userAction: 'confirmed',
    });

    const feedback = store.getFeedback(10);

    expect(feedback.length).toBe(1);
    expect(feedback[0].stage).toBe('develop');

    store.close();
  });
});
```

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run tests/memory/db-store.test.ts`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add src/memory/db-store.ts tests/memory/db-store.test.ts package.json
git commit -m "feat(memory): implement SQLite storage with vector search"
```

---

### Task 4: 向量索引实现

**Files:**
- Create: `src/memory/vector-index.ts`
- Test: `tests/memory/vector-index.test.ts`

- [ ] **Step 1: 创建向量索引模块**

```typescript
// src/memory/vector-index.ts
import type { VectorEntry, SearchResult } from './types.js';
import { DbStore } from './db-store.js';

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

/**
 * 简单的本地嵌入提供者
 * 实际使用时可以替换为 OpenAI、Cohere 等API
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  private dimension: number;

  constructor(dimension = 384) {
    this.dimension = dimension;
  }

  async embed(text: string): Promise<number[]> {
    // 简化版：基于文本特征生成伪嵌入
    // 实际项目中应使用真实的嵌入模型
    const embedding: number[] = [];

    // 使用简单的哈希特征
    const words = text.toLowerCase().split(/\s+/);
    const wordSet = new Set(words);

    for (let i = 0; i < this.dimension; i++) {
      let sum = 0;
      for (const word of wordSet) {
        sum += this.simpleHash(word + i) / 2147483647;
      }
      embedding.push(sum / wordSet.size);
    }

    // 归一化
    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    return embedding.map(v => v / norm);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export class VectorIndex {
  private dbStore: DbStore;
  private embeddingProvider: EmbeddingProvider;

  constructor(dbStore: DbStore, embeddingProvider?: EmbeddingProvider) {
    this.dbStore = dbStore;
    this.embeddingProvider = embeddingProvider || new LocalEmbeddingProvider();
  }

  async index(id: string, content: string, metadata: VectorEntry['metadata']): Promise<void> {
    const embedding = await this.embeddingProvider.embed(content);

    const entry: VectorEntry = {
      id,
      content,
      embedding,
      metadata,
    };

    this.dbStore.insertVector(entry);
  }

  async search(query: string, limit = 10, filter?: { type?: string }): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddingProvider.embed(query);
    const results = this.dbStore.searchVectors(queryEmbedding, limit * 2);

    // 应用过滤器
    let filtered = results;
    if (filter?.type) {
      filtered = results.filter(r => r.entry.metadata.type === filter.type);
    }

    return filtered.slice(0, limit);
  }

  delete(id: string): void {
    this.dbStore.deleteVector(id);
  }

  get(id: string): VectorEntry | null {
    return this.dbStore.getVector(id);
  }
}
```

- [ ] **Step 2: 编写向量索引测试**

```typescript
// tests/memory/vector-index.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { DbStore } from '../../src/memory/db-store.js';
import { VectorIndex, LocalEmbeddingProvider } from '../../src/memory/vector-index.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-vector-test-' + Date.now());
let dbStore: DbStore;

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
  dbStore = new DbStore(tmpDir);
});

afterEach(async () => {
  dbStore.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('VectorIndex', () => {
  it('indexes and searches content', async () => {
    const index = new VectorIndex(dbStore);

    await index.index('comp-1', 'React Button component with onClick handler', {
      type: 'component',
      name: 'Button',
    });

    await index.index('api-1', 'GET /api/users - fetch user list', {
      type: 'api',
      name: 'getUsers',
    });

    const results = await index.search('button component', 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.metadata.type).toBe('component');
  });

  it('filters by type', async () => {
    const index = new VectorIndex(dbStore);

    await index.index('comp-1', 'Button component', { type: 'component' });
    await index.index('api-1', 'User API', { type: 'api' });

    const results = await index.search('user', 5, { type: 'api' });

    expect(results.every(r => r.entry.metadata.type === 'api')).toBe(true);
  });
});

describe('LocalEmbeddingProvider', () => {
  it('generates normalized embeddings', async () => {
    const provider = new LocalEmbeddingProvider(128);

    const embedding = await provider.embed('test content');

    expect(embedding.length).toBe(128);

    // 检查归一化
    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it('generates similar embeddings for similar text', async () => {
    const provider = new LocalEmbeddingProvider(128);

    const emb1 = await provider.embed('React Button component');
    const emb2 = await provider.embed('Button component in React');

    // 计算余弦相似度
    let dot = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < emb1.length; i++) {
      dot += emb1[i] * emb2[i];
      norm1 += emb1[i] * emb1[i];
      norm2 += emb2[i] * emb2[i];
    }
    const similarity = dot / (Math.sqrt(norm1) * Math.sqrt(norm2));

    expect(similarity).toBeGreaterThan(0.9);
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run tests/memory/vector-index.test.ts`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add src/memory/vector-index.ts tests/memory/vector-index.test.ts
git commit -m "feat(memory): implement vector index with embedding provider"
```

---

### Task 5: 记忆管理器（统一API）

**Files:**
- Create: `src/memory/memory-manager.ts`
- Test: `tests/memory/memory-manager.test.ts`

- [ ] **Step 1: 创建记忆管理器**

```typescript
// src/memory/memory-manager.ts
import { FileStore } from './file-store.js';
import { DbStore } from './db-store.js';
import { VectorIndex } from './vector-index.js';
import type {
  MemoryKey,
  MemoryEntry,
  ProjectMeta,
  ProjectStructure,
  CodingConvention,
  ComponentInfo,
  ApiEndpoint,
  DataModel,
  UtilityFunction,
  StyleSystem,
  LearnedPattern,
  FeedbackRecord,
} from './types.js';

export class MemoryManager {
  private fileStore: FileStore;
  private dbStore: DbStore;
  private vectorIndex: VectorIndex;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.fileStore = new FileStore(projectRoot);
    this.dbStore = new DbStore(projectRoot);
    this.vectorIndex = new VectorIndex(this.dbStore);
  }

  // 项目元信息
  async getProjectMeta(): Promise<ProjectMeta | null> {
    return this.fileStore.read<ProjectMeta>('project');
  }

  async setProjectMeta(meta: ProjectMeta): Promise<void> {
    await this.fileStore.write('project', meta);
  }

  // 项目结构
  async getStructure(): Promise<ProjectStructure | null> {
    return this.fileStore.read<ProjectStructure>('structure');
  }

  async setStructure(structure: ProjectStructure): Promise<void> {
    await this.fileStore.write('structure', structure);
  }

  // 编码规范
  async getConventions(): Promise<CodingConvention[] | null> {
    return this.fileStore.read<CodingConvention[]>('conventions');
  }

  async setConventions(conventions: CodingConvention[]): Promise<void> {
    await this.fileStore.write('conventions', conventions);
  }

  // 组件
  async getComponents(): Promise<ComponentInfo[] | null> {
    return this.fileStore.read<ComponentInfo[]>('components');
  }

  async setComponents(components: ComponentInfo[]): Promise<void> {
    await this.fileStore.write('components', components);

    // 更新向量索引
    for (const comp of components) {
      const content = `${comp.name} ${comp.description} ${comp.props.map(p => p.name).join(' ')}`;
      await this.vectorIndex.index(`component:${comp.id}`, content, {
        type: 'component',
        name: comp.name,
        path: comp.path,
      });
    }
  }

  // API端点
  async getApis(): Promise<ApiEndpoint[] | null> {
    return this.fileStore.read<ApiEndpoint[]>('apis');
  }

  async setApis(apis: ApiEndpoint[]): Promise<void> {
    await this.fileStore.write('apis', apis);

    // 更新向量索引
    for (const api of apis) {
      const content = `${api.method} ${api.path} ${api.description}`;
      await this.vectorIndex.index(`api:${api.id}`, content, {
        type: 'api',
        name: api.path,
      });
    }
  }

  // 数据模型
  async getModels(): Promise<DataModel[] | null> {
    return this.fileStore.read<DataModel[]>('models');
  }

  async setModels(models: DataModel[]): Promise<void> {
    await this.fileStore.write('models', models);
  }

  // 工具函数
  async getUtils(): Promise<UtilityFunction[] | null> {
    return this.fileStore.read<UtilityFunction[]>('utils');
  }

  async setUtils(utils: UtilityFunction[]): Promise<void> {
    await this.fileStore.write('utils', utils);

    // 更新向量索引
    for (const util of utils) {
      const content = `${util.name} ${util.description} ${util.signature}`;
      await this.vectorIndex.index(`util:${util.id}`, content, {
        type: 'util',
        name: util.name,
        path: util.path,
      });
    }
  }

  // 样式系统
  async getStyles(): Promise<StyleSystem | null> {
    return this.fileStore.read<StyleSystem>('styles');
  }

  async setStyles(styles: StyleSystem): Promise<void> {
    await this.fileStore.write('styles', styles);
  }

  // 学习模式
  async getPatterns(): Promise<LearnedPattern[] | null> {
    return this.fileStore.read<LearnedPattern[]>('patterns');
  }

  async setPatterns(patterns: LearnedPattern[]): Promise<void> {
    await this.fileStore.write('patterns', patterns);
  }

  async addPattern(pattern: LearnedPattern): Promise<void> {
    const existing = (await this.getPatterns()) || [];
    const index = existing.findIndex(p => p.id === pattern.id);

    if (index >= 0) {
      existing[index] = pattern;
    } else {
      existing.push(pattern);
    }

    await this.setPatterns(existing);
  }

  // 反馈记录
  addFeedback(feedback: Omit<FeedbackRecord, 'id'>): void {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.dbStore.insertFeedback({
      id,
      ...feedback,
      userAction: feedback.userAction,
    });
  }

  getFeedback(limit = 100): any[] {
    return this.dbStore.getFeedback(limit);
  }

  // 语义搜索
  async search(query: string, options?: {
    limit?: number;
    type?: 'component' | 'api' | 'util';
  }): Promise<any[]> {
    return this.vectorIndex.search(query, options?.limit || 10, {
      type: options?.type,
    });
  }

  // 通用读取
  async read<T>(key: MemoryKey): Promise<T | null> {
    return this.fileStore.read<T>(key);
  }

  // 通用写入
  async write<T>(key: MemoryKey, data: T): Promise<void> {
    return this.fileStore.write(key, data);
  }

  // 检查记忆是否存在
  async hasMemory(): Promise<boolean> {
    return this.fileStore.exists('project');
  }

  // 关闭连接
  close(): void {
    this.dbStore.close();
  }
}
```

- [ ] **Step 2: 编写记忆管理器测试**

```typescript
// tests/memory/memory-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { MemoryManager } from '../../src/memory/memory-manager.js';
import type { ProjectMeta, ComponentInfo } from '../../src/memory/types.js';

const tmpDir = path.join(os.tmpdir(), 'dev-flow-memory-manager-test-' + Date.now());
let manager: MemoryManager;

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
  manager = new MemoryManager(tmpDir);
});

afterEach(async () => {
  manager.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('MemoryManager', () => {
  it('manages project meta', async () => {
    const meta: ProjectMeta = {
      name: 'test-project',
      version: '1.0.0',
      techStack: { language: 'TypeScript', framework: 'React' },
      packageManager: 'npm',
      framework: 'React',
      buildTool: 'Vite',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    await manager.setProjectMeta(meta);
    const result = await manager.getProjectMeta();

    expect(result).toEqual(meta);
  });

  it('manages components with vector indexing', async () => {
    const components: ComponentInfo[] = [
      {
        id: 'btn-1',
        name: 'Button',
        type: 'component',
        path: 'src/components/Button.tsx',
        props: [
          { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
        ],
        events: [],
        description: 'A clickable button component',
        dependencies: [],
      },
    ];

    await manager.setComponents(components);
    const result = await manager.getComponents();

    expect(result).toEqual(components);

    // 测试搜索
    const searchResults = await manager.search('button click');
    expect(searchResults.length).toBeGreaterThan(0);
  });

  it('checks if memory exists', async () => {
    expect(await manager.hasMemory()).toBe(false);
    await manager.setProjectMeta({ name: 'test' } as any);
    expect(await manager.hasMemory()).toBe(true);
  });

  it('adds and retrieves feedback', () => {
    manager.addFeedback({
      timestamp: new Date().toISOString(),
      stage: 'develop',
      task: 'Create Button',
      userAction: 'confirmed',
    });

    const feedback = manager.getFeedback(10);
    expect(feedback.length).toBe(1);
    expect(feedback[0].stage).toBe('develop');
  });
});
```

- [ ] **Step 3: 运行测试验证**

Run: `npx vitest run tests/memory/memory-manager.test.ts`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add src/memory/memory-manager.ts tests/memory/memory-manager.test.ts
git commit -m "feat(memory): implement memory manager with unified API"
```

---

### Task 6: 导出入口与全量测试

**Files:**
- Create: `src/memory/index.ts`

- [ ] **Step 1: 创建导出入口**

```typescript
// src/memory/index.ts
export { MemoryManager } from './memory-manager.js';
export { FileStore } from './file-store.js';
export { DbStore } from './db-store.js';
export { VectorIndex, LocalEmbeddingProvider } from './vector-index.js';
export * from './types.js';
```

- [ ] **Step 2: 运行全部测试**

Run: `npx vitest run tests/memory/`
Expected: 所有测试通过

- [ ] **Step 3: 最终提交**

```bash
git add src/memory/index.ts
git commit -m "feat(memory): P2 complete - memory system with file/db/vector storage"
```
