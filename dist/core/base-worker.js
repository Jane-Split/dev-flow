// src/core/base-worker.ts - 共享基类
// BaseAgent 和 BaseExpert 的公共逻辑抽取
export class BaseWorker {
    context;
    name;
    constructor(name, context) {
        this.name = name;
        this.context = context;
    }
    log(message) {
        console.log(`[${this.name}] ${message}`);
    }
    getMemory() {
        return this.context.memory;
    }
    getProjectRoot() {
        return this.context.projectRoot;
    }
}
//# sourceMappingURL=base-worker.js.map