import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
export declare class JavaExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    private generateCode;
    /**
     * 生成 Spring Boot REST Controller
     */
    private generateRestController;
    /**
     * 生成 Java Service 类
     */
    private generateService;
    /**
     * 生成 JPA Entity 类
     */
    private generateJpaEntity;
    /**
     * 生成 Java 类骨架
     */
    private generateClassSkeleton;
    /**
     * 自检：验证文件是否成功创建
     */
    private selfCheck;
    /**
     * 将文件名转换为 Java 类名 (PascalCase)
     */
    private toClassName;
    /**
     * 从任务描述中提取实体名称
     */
    private extractEntityName;
    /**
     * 根据文件路径推断包名
     */
    private inferPackage;
}
//# sourceMappingURL=java-expert.d.ts.map