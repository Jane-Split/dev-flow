/**
 * 多语言支持集成测试
 *
 * 测试新增的 Java/Python/Go 技术栈支持功能:
 * - DependencyScanner: 多语言项目识别
 * - StructureScanner: 多语言入口文件检测
 * - JavaExpert: Java 代码生成
 * - PythonExpert: Python 代码生成
 * - TestExpert: 多语言测试生成
 * - ExpertRegistry: JavaExpert/PythonExpert 注册与执行
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DependencyScanner } from '../src/scanners/dependency-scanner.js';
import { StructureScanner } from '../src/scanners/structure-scanner.js';
import { JavaExpert } from '../src/experts/java-expert.js';
import { PythonExpert } from '../src/experts/python-expert.js';
import { TestExpert } from '../src/experts/test-expert.js';
import { ExpertRegistry } from '../src/experts/expert-registry.js';
import type { Task } from '../src/planner/task-splitter.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ─── 测试辅助 ─────────────────────────────────────────

const TEST_DIR = '/data/user/work/test-multilingual';

/** 创建模拟上下文 */
function createMockContext(projectRoot: string) {
  return {
    projectRoot,
    memory: {
      get: async () => null,
      set: async () => {},
      has: async () => false,
    },
    sessionId: 'test',
  };
}

/** 创建测试任务 */
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    name: '测试任务',
    description: '测试',
    type: 'api',
    complexity: 'medium',
    dependencies: [],
    context: {
      memoryKeys: [],
      referenceFiles: [],
      designSection: '',
    },
    expert: '',
    output: {
      files: [],
      verification: '',
    },
    status: 'pending',
    ...overrides,
  };
}

/** 清理测试目录 */
async function cleanupTestDir(): Promise<void> {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // 忽略
  }
}

// ─── 测试用例 ─────────────────────────────────────────

describe('多语言支持集成测试', () => {

  beforeEach(async () => {
    await cleanupTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir();
  });

  // ─── 1. DependencyScanner 多语言识别 ────────────────

  describe('DependencyScanner 多语言识别', () => {

    it('应识别 Java Maven 项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'pom.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0.0</version>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.hibernate</groupId>
      <artifactId>hibernate-core</artifactId>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`);

      const scanner = new DependencyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.techStack.language).toBe('Java');
      expect(result.techStack.framework).toBe('Spring Boot');
      expect(result.techStack.orm).toBe('Hibernate/JPA');
      expect(result.techStack.testFramework).toBe('JUnit');
    });

    it('应识别 Java Gradle 项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'build.gradle'), `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.hibernate:hibernate-core'
}`);

      const scanner = new DependencyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.techStack.language).toBe('Java');
      expect(result.techStack.framework).toBe('Spring Boot');
      expect(result.buildTool).toBe('Gradle');
    });

    it('应识别 Python Django 项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'requirements.txt'), `django>=4.2
djangorestframework>=3.14
pytest>=7.0
`);

      const scanner = new DependencyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.techStack.language).toBe('Python');
      expect(result.techStack.framework).toBe('Django REST Framework');
      expect(result.techStack.testFramework).toBe('pytest');
    });

    it('应识别 Python FastAPI 项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'requirements.txt'), `fastapi>=0.100
sqlalchemy>=2.0
pytest>=7.0
`);

      const scanner = new DependencyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.techStack.language).toBe('Python');
      expect(result.techStack.framework).toBe('FastAPI');
      expect(result.techStack.orm).toBe('SQLAlchemy');
    });

    it('应识别 Go 项目', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'go.mod'), `module github.com/example/server

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    gorm.io/gorm v1.25.5
)`);

      const scanner = new DependencyScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.techStack.language).toBe('Go');
      expect(result.techStack.framework).toBe('Gin');
    });

    it('应正确检测包管理器', async () => {
      // pnpm-lock.yaml -> pnpm
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'pnpm-lock.yaml'), '');
      await fs.writeFile(path.join(TEST_DIR, 'package.json'), '{}');
      let scanner = new DependencyScanner(TEST_DIR);
      let result = await scanner.scan();
      expect(result.packageManager).toBe('pnpm');
      await cleanupTestDir();

      // poetry.lock -> Poetry
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'poetry.lock'), '');
      await fs.writeFile(path.join(TEST_DIR, 'pyproject.toml'), '');
      scanner = new DependencyScanner(TEST_DIR);
      result = await scanner.scan();
      expect(result.packageManager).toBe('Poetry');
      await cleanupTestDir();

      // pom.xml -> Maven
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'pom.xml'), '<?xml version="1.0"?><project></project>');
      scanner = new DependencyScanner(TEST_DIR);
      result = await scanner.scan();
      expect(result.packageManager).toBe('Maven');
    });
  });

  // ─── 2. StructureScanner 多语言入口 ────────────────

  describe('StructureScanner 多语言入口', () => {

    it('应检测 Java 入口文件', async () => {
      const javaDir = path.join(TEST_DIR, 'src', 'main', 'java', 'com', 'example');
      await fs.mkdir(javaDir, { recursive: true });
      await fs.writeFile(path.join(javaDir, 'Application.java'), 'public class Application {}');

      const scanner = new StructureScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.entryFiles.length).toBeGreaterThan(0);
      const hasJavaEntry = result.entryFiles.some(
        f => f.includes('Application.java')
      );
      expect(hasJavaEntry).toBe(true);
    });

    it('应检测 Python 入口文件', async () => {
      await fs.mkdir(TEST_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_DIR, 'app.py'), 'print("hello")');
      await fs.writeFile(path.join(TEST_DIR, 'main.py'), 'print("world")');

      const scanner = new StructureScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.entryFiles).toContain('app.py');
      expect(result.entryFiles).toContain('main.py');
    });

    it('应检测 Go 入口文件', async () => {
      const goDir = path.join(TEST_DIR, 'cmd', 'server');
      await fs.mkdir(goDir, { recursive: true });
      await fs.writeFile(path.join(goDir, 'main.go'), 'package main');

      const scanner = new StructureScanner(TEST_DIR);
      const result = await scanner.scan();

      expect(result.entryFiles.length).toBeGreaterThan(0);
      const hasGoEntry = result.entryFiles.some(
        f => f.includes('main.go')
      );
      expect(hasGoEntry).toBe(true);
    });
  });

  // ─── 3. JavaExpert ──────────────────────────────────

  describe('JavaExpert', () => {

    it('应通过显式指定匹配', () => {
      const expert = new JavaExpert(createMockContext('/tmp'));
      const task = createTestTask({ expert: 'JavaExpert' });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过 .java 文件扩展名匹配', () => {
      const expert = new JavaExpert(createMockContext('/tmp'));
      const task = createTestTask({
        output: { files: ['src/UserService.java'], verification: '' },
      });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过 Java 关键词匹配', () => {
      const expert = new JavaExpert(createMockContext('/tmp'));
      const task = createTestTask({
        description: '创建 Spring Boot 用户服务',
      });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应生成 Spring Boot REST Controller', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src'), { recursive: true });
      const expert = new JavaExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'api',
        output: { files: ['src/UserController.java'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = result.files[0];
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('@RestController');
      expect(content).toContain('@GetMapping');
      expect(content).toContain('@PostMapping');
    });

    it('应生成 Java Service 类', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src'), { recursive: true });
      const expert = new JavaExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'logic',
        output: { files: ['src/UserService.java'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = result.files[0];
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('@Service');
    });

    it('应生成 JPA Entity', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src'), { recursive: true });
      const expert = new JavaExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'data',
        output: { files: ['src/User.java'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = result.files[0];
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('@Entity');
      expect(content).toContain('@Id');
    });
  });

  // ─── 4. PythonExpert ────────────────────────────────

  describe('PythonExpert', () => {

    it('应通过显式指定匹配', () => {
      const expert = new PythonExpert(createMockContext('/tmp'));
      const task = createTestTask({ expert: 'PythonExpert' });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过 .py 文件扩展名匹配', () => {
      const expert = new PythonExpert(createMockContext('/tmp'));
      const task = createTestTask({
        output: { files: ['app/services/user_service.py'], verification: '' },
      });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应通过 Python 关键词匹配', () => {
      const expert = new PythonExpert(createMockContext('/tmp'));
      const task = createTestTask({
        description: '创建 FastAPI 用户路由',
      });
      expect(expert.canHandle(task)).toBe(true);
    });

    it('应生成 FastAPI 路由', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'app', 'routers'), { recursive: true });
      const expert = new PythonExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'api',
        output: { files: ['app/routers/users.py'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = result.files[0];
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('APIRouter');
      expect(content).toContain('async def');
      expect(content).toContain('@router');
    });

    it('应生成 Python 服务类', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'app', 'services'), { recursive: true });
      const expert = new PythonExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'logic',
        output: { files: ['app/services/user_service.py'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = result.files[0];
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('class');
      expect(content).toContain('async def');
    });

    it('应生成 Pydantic 模型', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'app', 'models'), { recursive: true });
      const expert = new PythonExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'data',
        output: { files: ['app/models/user.py'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = result.files[0];
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('BaseModel');
      expect(content).toContain('class');
    });
  });

  // ─── 5. TestExpert 多语言测试生成 ──────────────────

  describe('TestExpert 多语言测试生成', () => {

    it('应为 Java 文件生成 JUnit 测试', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src'), { recursive: true });
      const expert = new TestExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'test',
        name: 'UserService 测试',
        description: 'UserService 单元测试',
        output: { files: ['src/UserServiceTest.java'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = path.join(TEST_DIR, 'src', 'UserServiceTest.java');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('@Test');
      expect(content).toContain('Assertions');
    });

    it('应为 Python 文件生成 pytest 测试', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'app', 'services'), { recursive: true });
      const expert = new TestExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'test',
        name: 'user 测试',
        description: 'user 模块测试',
        output: { files: ['app/services/test_user.py'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = path.join(TEST_DIR, 'app', 'services', 'test_user.py');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('def test_');
      expect(content).toContain('assert');
    });

    it('应为 TypeScript 文件生成 vitest 测试', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src', 'utils'), { recursive: true });
      const expert = new TestExpert(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'test',
        name: 'helper 测试',
        description: 'helper 工具函数测试',
        output: { files: ['src/utils/helper.test.ts'], verification: '' },
      });

      const result = await expert.execute(task);
      expect(result.success).toBe(true);

      const filePath = path.join(TEST_DIR, 'src', 'utils', 'helper.test.ts');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('describe');
      expect(content).toContain('it(');
      expect(content).toContain('expect');
      expect(content).toContain('vitest');
    });
  });

  // ─── 6. ExpertRegistry 集成 ────────────────────────

  describe('ExpertRegistry 集成', () => {

    it('应自动注册 JavaExpert', () => {
      const registry = new ExpertRegistry(createMockContext('/tmp'));
      const task = createTestTask({
        type: 'api',
        name: '用户管理接口',
        description: '创建用户管理 REST API',
        output: { files: ['src/UserController.java'], verification: '' },
      });
      const expert = registry.getExpert(task);
      expect(expert).not.toBeNull();
      expect(expert!.constructor.name).toBe('JavaExpert');
    });

    it('应自动注册 PythonExpert', () => {
      const registry = new ExpertRegistry(createMockContext('/tmp'));
      const task = createTestTask({
        type: 'api',
        name: '用户路由',
        description: '创建用户管理路由',
        output: { files: ['app/routers/users.py'], verification: '' },
      });
      const expert = registry.getExpert(task);
      expect(expert).not.toBeNull();
      expect(expert!.constructor.name).toBe('PythonExpert');
    });

    it('JavaExpert 应通过 Registry 执行任务', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'src'), { recursive: true });
      const registry = new ExpertRegistry(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'api',
        name: '创建用户控制器',
        description: '创建 Spring Boot 用户控制器',
        output: { files: ['src/UserController.java'], verification: '' },
      });

      const result = await registry.executeTask(task);
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('PythonExpert 应通过 Registry 执行任务', async () => {
      await fs.mkdir(path.join(TEST_DIR, 'app', 'routers'), { recursive: true });
      const registry = new ExpertRegistry(createMockContext(TEST_DIR));
      const task = createTestTask({
        type: 'api',
        name: '创建用户路由',
        description: '创建 FastAPI 用户路由',
        output: { files: ['app/routers/users.py'], verification: '' },
      });

      const result = await registry.executeTask(task);
      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });
  });
});
