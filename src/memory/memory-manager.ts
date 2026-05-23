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
