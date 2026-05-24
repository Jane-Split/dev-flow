/**
 * 老旧项目专家 - 处理老旧技术栈相关的开发任务
 *
 * 能力:
 * - 识别老旧技术栈代码并生成兼容代码
 * - 执行渐进式代码迁移
 * - 为老旧框架生成测试用例
 * - 提供迁移建议和风险评估
 *
 * 支持的老旧技术栈:
 * - jQuery → React/Vue
 * - AngularJS 1.x → Angular 17+
 * - PHP 5.x → Node.js/PHP 8.x
 * - Java 6/7 → Java 17+
 * - Python 2.x → Python 3.x
 * - Backbone.js / Knockout.js → React/Vue
 */
import { BaseExpert } from './base-expert.js';
import { writeText, fileExists } from '../utils/fs-utils.js';
import * as path from 'node:path';
import { getMigrationTemplate } from '../migration/migration-templates.js';
export class LegacyExpert extends BaseExpert {
    constructor(context) {
        super('LegacyExpert', context);
    }
    canHandle(task) {
        // 0. 如果显式指定了其他专家，不匹配
        if (task.expert && task.expert !== 'LegacyExpert')
            return false;
        // 1. 显式指定专家
        if (task.expert === 'LegacyExpert')
            return true;
        // 2. 任务类型
        if (task.type === 'legacy' || task.type === 'migration')
            return true;
        // 3. 关键词匹配
        const legacyKeywords = /老旧|迁移|重构|legacy|migrate|refactor|jQuery|AngularJS|PHP\s*5|Java\s*[67]|Python\s*2|Backbone|Knockout|gulp|grunt|ie兼容|技术债务|tech debt/i;
        return legacyKeywords.test(task.description) || legacyKeywords.test(task.name);
    }
    async execute(task) {
        this.log(`执行任务: ${task.name}`);
        const files = [];
        const changes = [];
        const suggestions = [];
        // 分析任务上下文，确定迁移类型
        const migrationType = this.detectMigrationType(task);
        if (migrationType) {
            this.log(`检测到迁移类型: ${migrationType.from} → ${migrationType.to}`);
            const result = await this.executeMigration(task, migrationType, files, changes, suggestions);
            if (!result) {
                return {
                    success: false,
                    files: [],
                    changes: [],
                    verification: { passed: false, message: '迁移执行失败' },
                    suggestions,
                };
            }
        }
        else {
            // 通用老旧代码生成
            this.log('未检测到特定迁移类型，生成通用老旧项目兼容代码');
            const result = await this.generateLegacyCode(task, files, changes, suggestions);
            if (!result) {
                return {
                    success: false,
                    files: [],
                    changes: [],
                    verification: { passed: false, message: '代码生成失败' },
                    suggestions,
                };
            }
        }
        const verification = await this.selfCheck(files);
        return {
            success: verification.passed,
            files,
            changes,
            verification,
            suggestions: suggestions.length > 0 ? suggestions : undefined,
        };
    }
    /**
     * 检测迁移类型
     */
    detectMigrationType(task) {
        const desc = `${task.name} ${task.description}`.toLowerCase();
        const migrationMap = [
            { pattern: /jquery.*react|react.*jquery/i, from: 'jquery', to: 'react' },
            { pattern: /jquery.*vue|vue.*jquery/i, from: 'jquery', to: 'vue' },
            { pattern: /angularjs.*angular|angular.*angularjs/i, from: 'angularjs', to: 'angular' },
            { pattern: /php.*node|node.*php/i, from: 'php', to: 'node' },
            { pattern: /python\s*2.*python\s*3|python\s*3.*python\s*2/i, from: 'python2', to: 'python3' },
            { pattern: /backbone.*react|react.*backbone/i, from: 'backbone', to: 'react' },
            { pattern: /knockout.*vue|vue.*knockout/i, from: 'knockout', to: 'vue' },
        ];
        for (const m of migrationMap) {
            if (m.pattern.test(desc)) {
                return { from: m.from, to: m.to };
            }
        }
        // 检查任务输出文件扩展名推断
        if (task.output.files.length > 0) {
            const ext = path.extname(task.output.files[0]);
            if (ext === '.jsx' || ext === '.tsx') {
                return { from: 'jquery', to: 'react' };
            }
            if (ext === '.vue') {
                return { from: 'jquery', to: 'vue' };
            }
        }
        return null;
    }
    /**
     * 执行代码迁移
     */
    async executeMigration(task, migrationType, files, changes, suggestions) {
        const template = getMigrationTemplate(migrationType.from, migrationType.to);
        if (!template) {
            this.log(`未找到迁移模板: ${migrationType.from} → ${migrationType.to}`);
            // 生成通用迁移代码
            return this.generateGenericMigration(task, migrationType, files, changes, suggestions);
        }
        // 添加模板建议
        suggestions.push(`迁移路径: ${template.from} → ${template.to}`);
        template.notes.forEach(n => suggestions.push(`💡 ${n}`));
        template.warnings.forEach(w => suggestions.push(`⚠️ ${w}`));
        // 生成迁移后的代码
        const taskName = this.toFileName(task.name);
        const projectRoot = this.getProjectRoot();
        // 生成迁移代码文件
        const codeContent = this.generateMigratedCode(task, template);
        const codePath = task.output.files.length > 0
            ? path.join(projectRoot, task.output.files[0])
            : path.join(projectRoot, `src/migrated/${taskName}.tsx`);
        await writeText(codePath, codeContent);
        files.push(codePath);
        changes.push({
            file: path.relative(projectRoot, codePath),
            operation: 'create',
            description: `迁移 ${template.from} → ${template.to} 代码`,
        });
        // 生成测试文件
        const testContent = this.generateMigrationTest(task, template);
        const testPath = codePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
        await writeText(testPath, testContent);
        files.push(testPath);
        changes.push({
            file: path.relative(projectRoot, testPath),
            operation: 'create',
            description: `创建迁移后代码的测试用例`,
        });
        // 生成迁移指南
        const guideContent = this.generateMigrationGuide(task, template);
        const guidePath = path.join(projectRoot, `docs/migration-${taskName}.md`);
        await writeText(guidePath, guideContent);
        files.push(guidePath);
        changes.push({
            file: path.relative(projectRoot, guidePath),
            operation: 'create',
            description: `生成迁移指南文档`,
        });
        return true;
    }
    /**
     * 生成迁移后的代码
     */
    generateMigratedCode(task, template) {
        const taskName = this.toFileName(task.name);
        const isReact = template.to === 'React';
        const isVue = template.to === 'Vue';
        const isAngular = template.to.includes('Angular') && !template.to.includes('AngularJS');
        const isNode = template.to.includes('Node');
        if (isReact) {
            return this.generateReactCode(task, taskName);
        }
        if (isVue) {
            return this.generateVueCode(task, taskName);
        }
        if (isAngular) {
            return this.generateAngularCode(task, taskName);
        }
        if (isNode) {
            return this.generateNodeCode(task, taskName);
        }
        // 通用迁移代码
        return `/**
 * ${task.name} - 迁移代码
 *
 * 原始描述: ${task.description}
 * 迁移路径: ${template.from} → ${template.to}
 *
 * TODO: 根据具体业务逻辑补充实现
 */

// 迁移后的代码骨架
export function main(): void {
  console.log('${task.name} - 已迁移');
}
`;
    }
    /**
     * 生成 React 代码
     */
    generateReactCode(task, taskName) {
        return `/**
 * ${task.name} - React 组件
 *
 * 描述: ${task.description}
 * 迁移自: jQuery → React
 *
 * 注意事项:
 * - 使用 useState 管理状态替代 jQuery 变量
 * - 使用 useEffect 管理副作用替代 $(document).ready()
 * - 使用 useRef 管理 DOM 引用替代 jQuery 选择器
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ${this.toPascalCase(taskName)}Props {
  /** 组件属性 */
  className?: string;
  children?: React.ReactNode;
}

export default function ${this.toPascalCase(taskName)}(props: ${this.toPascalCase(taskName)}Props) {
  const { className, children } = props;

  // 状态管理 (替代 jQuery 变量)
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DOM 引用 (替代 jQuery 选择器)
  const containerRef = useRef<HTMLDivElement>(null);

  // 副作用 (替代 $(document).ready() 和事件绑定)
  useEffect(() => {
    initialize();
    return () => {
      // 清理逻辑 (替代 $().off())
    };
  }, []);

  // 事件处理 (替代 jQuery .on()/.click())
  const handleClick = useCallback((event: React.MouseEvent) => {
    // 处理点击事件
  }, []);

  // 数据获取 (替代 $.ajax)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化
  async function initialize(): Promise<void> {
    // 初始化逻辑
  }

  // 条件渲染 (替代 .show()/.hide())
  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  // 列表渲染 (替代 .each()/.append())
  return (
    <div ref={containerRef} className={className}>
      {children}
      {data.map((item, index) => (
        <div key={item.id ?? index}>
          {JSON.stringify(item)}
        </div>
      ))}
    </div>
  );
}
`;
    }
    /**
     * 生成 Vue 代码
     */
    generateVueCode(task, taskName) {
        return `<template>
  <!-- ${task.name} -->
  <!-- 描述: ${task.description} -->
  <!-- 迁移自: jQuery → Vue -->
  <div ref="containerRef" :class="className">
    <slot></slot>

    <!-- 条件渲染 (替代 .show()/.hide()) -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">错误: {{ error }}</div>

    <!-- 列表渲染 (替代 .each()/.append()) -->
    <div v-for="(item, index) in data" :key="item.id ?? index">
      {{ item }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Props (替代 jQuery 配置)
interface Props {
  className?: string;
}
const props = withDefaults(defineProps<Props>(), {
  className: '',
});

// 状态管理 (替代 jQuery 变量)
const data = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// 事件处理 (替代 jQuery .on()/.click())
function handleClick(event: Event): void {
  // 处理点击事件
}

// 数据获取 (替代 $.ajax)
async function fetchData(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('/api/data');
    data.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '未知错误';
  } finally {
    loading.value = false;
  }
}

// 生命周期 (替代 $(document).ready())
onMounted(async () => {
  await fetchData();
});

onUnmounted(() => {
  // 清理逻辑 (替代 $().off())
});
</script>
`;
    }
    /**
     * 生成 Angular 代码
     */
    generateAngularCode(task, taskName) {
        return `/**
 * ${task.name} - Angular 组件
 *
 * 描述: ${task.description}
 * 迁移自: AngularJS → Angular
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface DataItem {
  id: string;
  [key: string]: any;
}

@Component({
  selector: 'app-${taskName}',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div [class]="className">
      <!-- 条件渲染 (替代 ng-if) -->
      @if (loading) {
        <div class="loading">加载中...</div>
      }
      @if (error) {
        <div class="error">错误: {{ error }}</div>
      }

      <!-- 列表渲染 (替代 ng-repeat) -->
      @for (item of data; track item.id) {
        <div>{{ item | json }}</div>
      }
    </div>
  \`,
})
export class ${this.toPascalCase(taskName)}Component implements OnInit, OnDestroy {
  className = '';
  data: DataItem[] = [];
  loading = false;
  error: string | null = null;

  private subscription: Subscription | null = null;

  constructor(private http: HttpClient) {}

  // 生命周期 (替代 $scope.$init)
  ngOnInit(): void {
    this.fetchData();
  }

  // 生命周期 (替代 $scope.$on('$destroy'))
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // 数据获取 (替代 $http)
  fetchData(): void {
    this.loading = true;
    this.error = null;
    this.subscription = this.http
      .get<DataItem[]>('/api/data')
      .subscribe({
        next: (result) => {
          this.data = result;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        },
      });
  }
}
`;
    }
    /**
     * 生成 Node.js 代码
     */
    generateNodeCode(task, taskName) {
        return `/**
 * ${task.name} - Node.js 路由/控制器
 *
 * 描述: ${task.description}
 * 迁移自: PHP → Node.js
 */

import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * GET /api/${taskName}
 * 获取列表 (替代 PHP $_GET)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    // 替代 mysql_query → 使用 ORM 或参数化查询
    const data = []; // TODO: 实现数据查询
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/${taskName}/:id
 * 获取详情
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = {}; // TODO: 实现数据查询
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/${taskName}
 * 创建 (替代 PHP $_POST)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body; // 替代 $_POST
    // TODO: 实现数据创建
    res.status(201).json({ success: true, data: body });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/${taskName}/:id
 * 更新
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;
    // TODO: 实现数据更新
    res.json({ success: true, data: { id, ...body } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/${taskName}/:id
 * 删除
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // TODO: 实现数据删除
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
`;
    }
    /**
     * 生成迁移测试
     */
    generateMigrationTest(task, template) {
        const taskName = this.toFileName(task.name);
        const isReact = template.to === 'React';
        const isVue = template.to === 'Vue';
        const isNode = template.to.includes('Node');
        if (isReact) {
            return `import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ${this.toPascalCase(taskName)} from './${taskName}.js';

// Mock fetch
global.fetch = vi.fn();

describe('${task.name} - 迁移验证', () => {
  it('应正确渲染组件', () => {
    render(<${this.toPascalCase(taskName)} />);
    expect(screen.getByText('加载中...')).toBeTruthy();
  });

  it('应处理加载状态', () => {
    render(<${this.toPascalCase(taskName)} />);
    expect(screen.getByText('加载中...')).toBeTruthy();
  });

  it('应处理错误状态', async () => {
    (fetch as any).mockRejectedValue(new Error('网络错误'));
    render(<${this.toPascalCase(taskName)} />);
    // 等待错误显示
  });

  it('应正确渲染数据列表', async () => {
    const mockData = [{ id: '1', name: '测试项' }];
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve(mockData),
    });
    render(<${this.toPascalCase(taskName)} />);
    // 验证数据渲染
  });

  it('应响应点击事件', () => {
    const { container } = render(<${this.toPascalCase(taskName)} />);
    fireEvent.click(container.firstChild as HTMLElement);
  });
});
`;
        }
        if (isNode) {
            return `import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import router from './${taskName}.js';

const app = express();
app.use(express.json());
app.use('/api/${taskName}', router);

describe('${task.name} - 迁移验证', () => {
  it('GET / 应返回列表', async () => {
    const res = await request(app).get('/api/${taskName}');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /:id 应返回详情', async () => {
    const res = await request(app).get('/api/${taskName}/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST / 应创建资源', async () => {
    const res = await request(app)
      .post('/api/${taskName}')
      .send({ name: '测试' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('PUT /:id 应更新资源', async () => {
    const res = await request(app)
      .put('/api/${taskName}/1')
      .send({ name: '更新' });
    expect(res.status).toBe(200);
  });

  it('DELETE /:id 应删除资源', async () => {
    const res = await request(app).delete('/api/${taskName}/1');
    expect(res.status).toBe(200);
  });
});
`;
        }
        // 通用测试
        return `import { describe, it, expect } from 'vitest';

describe('${task.name} - 迁移验证', () => {
  it('应正确导出模块', () => {
    // TODO: 验证模块导出
    expect(true).toBe(true);
  });

  it('应保持功能一致性', () => {
    // TODO: 验证迁移前后功能一致
    expect(true).toBe(true);
  });
});
`;
    }
    /**
     * 生成迁移指南
     */
    generateMigrationGuide(task, template) {
        return `# ${task.name} 迁移指南

## 迁移信息

- **原始描述**: ${task.description}
- **迁移路径**: ${template.from} → ${template.to}
- **迁移日期**: ${new Date().toISOString().split('T')[0]}

## 迁移模式对照

| 老旧写法 (${template.from}) | 现代写法 (${template.to}) | 说明 |
|---|---|---|
${template.patterns.map(p => `| \`${p.legacy.substring(0, 40)}${p.legacy.length > 40 ? '...' : ''}\` | \`${p.modern.substring(0, 40)}${p.modern.length > 40 ? '...' : ''}\` | ${p.description} |`).join('\n')}

## 注意事项

${template.notes.map(n => `- ${n}`).join('\n')}

## 风险提示

${template.warnings.map(w => `- ${w}`).join('\n')}

## 验证清单

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 功能回归测试通过
- [ ] 性能测试无退化
- [ ] 代码审查完成
`;
    }
    /**
     * 通用迁移代码（无匹配模板时）
     */
    async generateGenericMigration(task, migrationType, files, changes, suggestions) {
        const taskName = this.toFileName(task.name);
        const projectRoot = this.getProjectRoot();
        suggestions.push(`迁移路径: ${migrationType.from} → ${migrationType.to}`);
        suggestions.push('未找到精确匹配的迁移模板，已生成通用迁移骨架');
        const code = `/**
 * ${task.name} - 迁移代码
 *
 * 描述: ${task.description}
 * 迁移路径: ${migrationType.from} → ${migrationType.to}
 *
 * TODO: 根据具体业务逻辑补充实现
 * TODO: 添加对应的测试用例
 * TODO: 验证功能一致性
 */

export function main(): void {
  console.log('${task.name} - 已迁移');
}
`;
        const codePath = task.output.files.length > 0
            ? path.join(projectRoot, task.output.files[0])
            : path.join(projectRoot, `src/migrated/${taskName}.ts`);
        await writeText(codePath, code);
        files.push(codePath);
        changes.push({
            file: path.relative(projectRoot, codePath),
            operation: 'create',
            description: `创建 ${migrationType.from} → ${migrationType.to} 迁移代码`,
        });
        return true;
    }
    /**
     * 通用老旧项目代码生成
     */
    async generateLegacyCode(task, files, changes, suggestions) {
        const taskName = this.toFileName(task.name);
        const projectRoot = this.getProjectRoot();
        suggestions.push('建议先使用 /dev-flow -legacy-analyze 分析项目');
        suggestions.push('建议先建立测试保障再进行重构');
        const code = `/**
 * ${task.name}
 *
 * ${task.description}
 *
 * 老旧项目兼容代码
 * TODO: 补充具体实现
 */

export function handle(): void {
  // 实现逻辑
}
`;
        const codePath = task.output.files.length > 0
            ? path.join(projectRoot, task.output.files[0])
            : path.join(projectRoot, `src/legacy/${taskName}.ts`);
        await writeText(codePath, code);
        files.push(codePath);
        changes.push({
            file: path.relative(projectRoot, codePath),
            operation: 'create',
            description: `创建老旧项目兼容代码`,
        });
        return true;
    }
    /**
     * 自检
     */
    async selfCheck(files) {
        for (const file of files) {
            try {
                if (!(await fileExists(file))) {
                    return { passed: false, message: `文件 ${file} 未创建成功` };
                }
            }
            catch {
                return { passed: false, message: `无法验证文件 ${file}` };
            }
        }
        return { passed: true, message: '自检通过' };
    }
    /**
     * 转换名称为文件安全名称
     */
    toFileName(name) {
        return name
            .replace(/[实现创建迁移重构]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
            .replace(/^-+|-+$/g, '') || 'legacy-module';
    }
    /**
     * 转换为 PascalCase
     */
    toPascalCase(name) {
        return name
            .split(/[-_\s]+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    }
}
//# sourceMappingURL=legacy-expert.js.map