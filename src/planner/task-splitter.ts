/**
 * 任务拆分器 - 将设计文档拆分为独立的开发任务
 *
 * 特点:
 * - 考虑上下文限制(8000 tokens)
 * - 支持多种任务类型: data, api, component, logic, style, test
 * - 自动识别任务依赖关系
 */

// 从 design-agent.ts 导入类型
import type { DesignResult } from '../agents/design-agent.js';

// 扩展类型定义（用于任务拆分器内部使用）
export interface DataModel {
  name: string;
  fields: Array<{ name: string; type: string; required?: boolean; description?: string }>;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Array<{ name: string; type: string; required?: boolean }>;
  response?: unknown;
  auth?: boolean;
}

export interface Component {
  name: string;
  type: 'page' | 'component' | 'layout';
  description: string;
  path: string;
  dependencies: string[];
  props?: Array<{ name: string; type: string; required?: boolean; description?: string }>;
}

// 上下文限制常量
export const CONTEXT_LIMIT = 8000;

// 任务类型
export type TaskType = 'data' | 'api' | 'component' | 'logic' | 'style' | 'test' | 'algorithm' | 'legacy' | 'migration';

// 复杂度等级
export type Complexity = 'high' | 'medium' | 'low';

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * 任务定义接口
 */
export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  complexity: Complexity;
  dependencies: string[];
  context: {
    memoryKeys: string[];
    referenceFiles: string[];
    designSection: string;
    estimatedTokens?: number;
  };
  expert: string;
  output: {
    files: string[];
    verification: string;
  };
  status: TaskStatus;
}

/**
 * 任务拆分结果
 */
export interface SplitResult {
  tasks: Task[];
  warnings: string[];
}

/**
 * 任务拆分器
 *
 * 将设计文档解析为可执行的任务列表
 */
export class TaskSplitter {
  private taskIdCounter = 1;
  private warnings: string[] = [];

  /**
   * 拆分设计文档为任务列表
   */
  split(designResult: DesignResult): SplitResult {
    this.taskIdCounter = 1;
    this.warnings = [];

    const tasks: Task[] = [];

    // 1. 数据层任务（最底层，无依赖）
    const dataTasks = this.createDataTasks(designResult);
    tasks.push(...dataTasks);

    // 2. API层任务（依赖数据层）
    const apiTasks = this.createApiTasks(designResult, dataTasks);
    tasks.push(...apiTasks);

    // 3. 组件层任务（依赖API层）
    const componentTasks = this.createComponentTasks(designResult, apiTasks);
    tasks.push(...componentTasks);

    // 4. 样式任务（依赖组件层）
    const styleTasks = this.createStyleTasks(designResult, componentTasks);
    tasks.push(...styleTasks);

    // 5. 测试任务（依赖所有实现任务）
    const testTasks = this.createTestTasks(designResult, tasks);
    tasks.push(...testTasks);

    // 检查上下文限制
    this.checkContextLimits(tasks);

    return {
      tasks,
      warnings: this.warnings,
    };
  }

  /**
   * 创建数据层任务
   */
  private createDataTasks(designResult: DesignResult): Task[] {
    const tasks: Task[] = [];

    for (const model of designResult.dataDesign.models) {
      const estimatedTokens = this.estimateTokens(JSON.stringify(model));

      tasks.push({
        id: `task-${this.taskIdCounter++}`,
        name: `创建${model.name}数据模型`,
        description: `定义${model.name}类型和校验规则`,
        type: 'data',
        complexity: 'low',
        dependencies: [],
        context: {
          memoryKeys: ['models'],
          referenceFiles: [],
          designSection: '数据层设计',
          estimatedTokens,
        },
        expert: 'BackendExpert',
        output: {
          files: [`src/types/${this.toFileName(model.name)}.ts`],
          verification: 'TypeScript编译通过',
        },
        status: 'pending',
      });
    }

    return tasks;
  }

  /**
   * 创建API层任务
   */
  private createApiTasks(designResult: DesignResult, dataTasks: Task[]): Task[] {
    const tasks: Task[] = [];
    const dataTaskIds = dataTasks.map(t => t.id);

    for (const api of designResult.apiDesign.endpoints) {
      const estimatedTokens = this.estimateTokens(JSON.stringify(api));

      // 识别API依赖的数据模型
      const relatedDataTasks = dataTasks.filter(t =>
        api.path.toLowerCase().includes(t.name.toLowerCase().replace('创建', '').replace('数据模型', ''))
      );

      tasks.push({
        id: `task-${this.taskIdCounter++}`,
        name: `实现${api.method} ${api.path}接口`,
        description: api.description,
        type: 'api',
        complexity: 'medium',
        dependencies: relatedDataTasks.length > 0
          ? relatedDataTasks.map(t => t.id)
          : dataTaskIds,
        context: {
          memoryKeys: ['apis', 'models'],
          referenceFiles: [],
          designSection: '接口层设计',
          estimatedTokens,
        },
        expert: 'BackendExpert',
        output: {
          files: [`src/api/${this.toFileName(api.path.split('/').pop() || 'endpoint')}.ts`],
          verification: '接口测试通过',
        },
        status: 'pending',
      });
    }

    return tasks;
  }

  /**
   * 创建组件层任务
   */
  private createComponentTasks(designResult: DesignResult, apiTasks: Task[]): Task[] {
    const tasks: Task[] = [];

    for (const component of designResult.componentDesign.components) {
      const estimatedTokens = this.estimateTokens(JSON.stringify(component));

      // 识别组件依赖的API任务
      const deps = apiTasks.filter(t =>
        component.dependencies.some((d: string) =>
          d.toLowerCase().includes('api') ||
          d.toLowerCase().includes('service') ||
          t.name.toLowerCase().includes(d.toLowerCase())
        )
      ).map(t => t.id);

      // 页面组件复杂度更高
      const complexity: Complexity = component.type === 'page' ? 'high' : 'medium';

      tasks.push({
        id: `task-${this.taskIdCounter++}`,
        name: `实现${component.name}组件`,
        description: component.description,
        type: 'component',
        complexity,
        dependencies: deps,
        context: {
          memoryKeys: ['components', 'styles'],
          referenceFiles: [],
          designSection: '组件层设计',
          estimatedTokens,
        },
        expert: 'FrontendExpert',
        output: {
          files: [component.path],
          verification: '组件渲染正常',
        },
        status: 'pending',
      });
    }

    return tasks;
  }

  /**
   * 创建样式任务
   */
  private createStyleTasks(designResult: DesignResult, componentTasks: Task[]): Task[] {
    const tasks: Task[] = [];

    // 为页面组件创建样式任务
    const pageComponents = componentTasks.filter(t =>
      t.name.includes('页面') || t.name.includes('Page')
    );

    for (const pageTask of pageComponents) {
      tasks.push({
        id: `task-${this.taskIdCounter++}`,
        name: `创建${pageTask.name.replace('实现', '').replace('组件', '')}样式`,
        description: `为${pageTask.name}添加CSS样式`,
        type: 'style',
        complexity: 'low',
        dependencies: [pageTask.id],
        context: {
          memoryKeys: ['styles', 'components'],
          referenceFiles: pageTask.output.files,
          designSection: '样式设计',
        },
        expert: 'FrontendExpert',
        output: {
          files: [`src/styles/${this.toFileName(pageTask.name)}.css`],
          verification: '样式渲染正确',
        },
        status: 'pending',
      });
    }

    return tasks;
  }

  /**
   * 创建测试任务
   */
  private createTestTasks(designResult: DesignResult, allTasks: Task[]): Task[] {
    const tasks: Task[] = [];

    // 获取所有实现任务的ID
    const implementationTaskIds = allTasks
      .filter(t => t.type !== 'test')
      .map(t => t.id);

    // 集成测试任务
    tasks.push({
      id: `task-${this.taskIdCounter++}`,
      name: '集成测试',
      description: '执行全链路集成测试',
      type: 'test',
      complexity: 'high',
      dependencies: implementationTaskIds,
      context: {
        memoryKeys: ['test-cases', 'components', 'apis'],
        referenceFiles: [],
        designSection: '测试设计',
      },
      expert: 'TestExpert',
      output: {
        files: ['tests/integration.test.ts'],
        verification: '所有测试通过',
      },
      status: 'pending',
    });

    return tasks;
  }

  /**
   * 检查任务的上下文限制
   */
  private checkContextLimits(tasks: Task[]): void {
    for (const task of tasks) {
      const estimatedTokens = task.context.estimatedTokens || 0;
      if (estimatedTokens > CONTEXT_LIMIT) {
        this.warnings.push(
          `任务 ${task.id} (${task.name}) 估计需要 ${estimatedTokens} tokens，超过限制 ${CONTEXT_LIMIT}`
        );
      }
    }
  }

  /**
   * 估算文本的token数量（简化版）
   * 假设平均每个token约4个字符
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * 转换名称为文件安全名称
   */
  private toFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
