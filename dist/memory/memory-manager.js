// src/memory/memory-manager.ts
import { FileStore } from './file-store.js';
import { DbStore } from './db-store.js';
import { VectorIndex } from './vector-index.js';
export class MemoryManager {
    fileStore;
    dbStore;
    vectorIndex;
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.fileStore = new FileStore(projectRoot);
        this.dbStore = new DbStore(projectRoot);
        this.vectorIndex = new VectorIndex(this.dbStore);
    }
    // 项目元信息
    async getProjectMeta() {
        return this.fileStore.read('project');
    }
    async setProjectMeta(meta) {
        await this.fileStore.write('project', meta);
    }
    // 项目结构
    async getStructure() {
        return this.fileStore.read('structure');
    }
    async setStructure(structure) {
        await this.fileStore.write('structure', structure);
    }
    // 编码规范
    async getConventions() {
        return this.fileStore.read('conventions');
    }
    async setConventions(conventions) {
        await this.fileStore.write('conventions', conventions);
    }
    // 组件
    async getComponents() {
        return this.fileStore.read('components');
    }
    async setComponents(components) {
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
    async getApis() {
        return this.fileStore.read('apis');
    }
    async setApis(apis) {
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
    async getModels() {
        return this.fileStore.read('models');
    }
    async setModels(models) {
        await this.fileStore.write('models', models);
    }
    // 工具函数
    async getUtils() {
        return this.fileStore.read('utils');
    }
    async setUtils(utils) {
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
    async getStyles() {
        return this.fileStore.read('styles');
    }
    async setStyles(styles) {
        await this.fileStore.write('styles', styles);
    }
    // 学习模式
    async getPatterns() {
        return this.fileStore.read('patterns');
    }
    async setPatterns(patterns) {
        await this.fileStore.write('patterns', patterns);
    }
    async addPattern(pattern) {
        const existing = (await this.getPatterns()) || [];
        const index = existing.findIndex(p => p.id === pattern.id);
        if (index >= 0) {
            existing[index] = pattern;
        }
        else {
            existing.push(pattern);
        }
        await this.setPatterns(existing);
    }
    // 反馈记录
    addFeedback(feedback) {
        const id = `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this.dbStore.insertFeedback({
            id,
            ...feedback,
            userAction: feedback.userAction,
        });
    }
    getFeedback(limit = 100) {
        return this.dbStore.getFeedback(limit);
    }
    // 语义搜索
    async search(query, options) {
        return this.vectorIndex.search(query, options?.limit || 10, {
            type: options?.type,
        });
    }
    // 通用读取
    async read(key) {
        return this.fileStore.read(key);
    }
    // 通用写入
    async write(key, data) {
        return this.fileStore.write(key, data);
    }
    // 检查记忆是否存在
    async hasMemory() {
        return this.fileStore.exists('project');
    }
    // 关闭连接
    close() {
        this.dbStore.close();
    }
}
//# sourceMappingURL=memory-manager.js.map