export class BaseExpert {
    name;
    context;
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
//# sourceMappingURL=base-expert.js.map