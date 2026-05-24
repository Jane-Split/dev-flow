import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
export declare class PythonExpert extends BaseExpert {
    constructor(context: any);
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<ExpertResult>;
    private generateCode;
    /**
     * 生成 FastAPI 路由模块
     */
    private generateFastApiRoute;
    /**
     * 生成 Python 服务类
     */
    private generateServiceClass;
    /**
     * 生成 Pydantic 数据模型
     */
    private generateDataModel;
    /**
     * 生成 Python 模块骨架
     */
    private generateModuleSkeleton;
    /**
     * 自检：验证文件是否成功创建
     */
    private selfCheck;
    /**
     * 将文件名转换为 Python 模块名 (snake_case)
     */
    private toModuleName;
    /**
     * 从任务描述中提取实体名称
     */
    private extractEntityName;
}
//# sourceMappingURL=python-expert.d.ts.map