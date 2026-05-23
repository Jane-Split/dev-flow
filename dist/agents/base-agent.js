export class BaseAgent {
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
//# sourceMappingURL=base-agent.js.map