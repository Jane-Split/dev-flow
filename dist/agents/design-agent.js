// src/agents/design-agent.ts
import { BaseAgent } from './base-agent.js';
import { DataDesigner, ApiDesigner, ComponentDesigner, LogicDesigner, StyleDesigner } from '../designers/index.js';
import { logger } from '../utils/logger.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';
export class DesignAgent extends BaseAgent {
    constructor(context) {
        super('DesignAgent', context);
    }
    async execute(analyzeResult) {
        try {
            logger.title('详细设计');
            const memory = this.getMemory();
            // Step 1: 数据层设计
            logger.step(1, 5, '设计数据层...');
            const existingModels = (await memory.getModels()) || [];
            const dataDesigner = new DataDesigner();
            const dataDesign = dataDesigner.design(analyzeResult.features, existingModels);
            logger.success(`定义 ${dataDesign.models.length} 个数据模型`);
            // Step 2: 接口层设计
            logger.step(2, 5, '设计接口层...');
            const existingApis = (await memory.getApis()) || [];
            const apiDesigner = new ApiDesigner();
            const apiDesign = apiDesigner.design(analyzeResult.features, existingApis);
            logger.success(`定义 ${apiDesign.endpoints.length} 个API端点`);
            // Step 3: 组件层设计
            logger.step(3, 5, '设计组件层...');
            const existingComponents = (await memory.getComponents()) || [];
            const componentDesigner = new ComponentDesigner();
            const componentDesign = componentDesigner.design(analyzeResult.features, existingComponents);
            logger.success(`定义 ${componentDesign.components.length} 个组件`);
            // Step 4: 业务逻辑设计
            logger.step(4, 5, '设计业务逻辑层...');
            const logicDesigner = new LogicDesigner();
            const logicDesign = logicDesigner.design(analyzeResult.features);
            logger.success(`定义 ${logicDesign.flows.length} 个业务流程`);
            // Step 5: 样式设计
            logger.step(5, 5, '设计样式层...');
            const existingStyles = await memory.getStyles();
            const styleDesigner = new StyleDesigner();
            const styleDesign = styleDesigner.design(analyzeResult.features, existingStyles);
            logger.success(`定义 ${styleDesign.componentStyles.length} 个组件样式`);
            // Step 6: 设计自检
            logger.step(5, 5, '执行设计自检...');
            const issues = this.selfCheck(dataDesign, apiDesign, componentDesign, analyzeResult);
            if (issues.length > 0) {
                logger.warn(`发现 ${issues.length} 个设计问题`);
                issues.forEach(i => logger.warn(`  - ${i}`));
            }
            else {
                logger.success('设计自检通过');
            }
            // Step 7: 生成设计文档
            logger.step(5, 5, '生成设计文档...');
            const documentPath = await this.generateDocument({
                title: analyzeResult.title,
                dataDesign,
                apiDesign,
                componentDesign,
                logicDesign,
                styleDesign,
                issues,
            });
            logger.success(`文档已保存: ${documentPath}`);
            return {
                success: true,
                data: {
                    dataDesign,
                    apiDesign,
                    componentDesign,
                    logicDesign,
                    styleDesign,
                    documentPath,
                    // 便捷字段，用于下游快速访问
                    dataModels: dataDesign?.models || [],
                    apiEndpoints: apiDesign?.endpoints || [],
                    components: componentDesign?.components || [],
                },
                artifacts: [documentPath],
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    }
    selfCheck(dataDesign, apiDesign, componentDesign, analyzeResult) {
        const issues = [];
        // 检查功能点覆盖
        for (const feature of analyzeResult.features) {
            const hasApi = apiDesign.endpoints.some((a) => feature.name.toLowerCase().includes('登录') && a.path.includes('auth'));
            const hasComponent = componentDesign.components.some((c) => feature.name.toLowerCase().includes('登录') && c.name.includes('Login'));
            if (!hasApi && feature.name.toLowerCase().includes('登录')) {
                issues.push(`功能"${feature.name}"缺少对应的API设计`);
            }
            if (!hasComponent && feature.name.toLowerCase().includes('登录')) {
                issues.push(`功能"${feature.name}"缺少对应的组件设计`);
            }
        }
        return issues;
    }
    async generateDocument(data) {
        const { title, dataDesign, apiDesign, componentDesign, logicDesign, styleDesign, issues } = data;
        const doc = `# 详细设计文档 - ${title}

## 1. 设计概述
- **需求来源**: ${title}
- **设计原则**: 复用现有组件、遵循项目规范、最小化改动

## 2. 数据层设计

### 2.1 数据模型
${dataDesign.models.map((m) => `
#### ${m.name}
\`\`\`typescript
interface ${m.name} {
${m.fields.map((f) => `  ${f.name}${f.required ? '' : '?'}: ${f.type}; // ${f.description}`).join('\n')}
}
\`\`\`
`).join('\n')}

### 2.2 数据校验规则
| 模型 | 字段 | 规则 |
|------|------|------|
${dataDesign.validationRules.map((r) => `| ${r.model} | ${r.field} | ${r.rules.join(', ')} |`).join('\n')}

## 3. 接口层设计

### 3.1 API端点
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
${apiDesign.endpoints.map((a) => `| ${a.method} | ${a.path} | ${a.description} | ${a.auth ? '是' : '否'} |`).join('\n')}

### 3.2 错误码定义
| 错误码 | 说明 | 描述 |
|--------|------|------|
${apiDesign.errorCodes.map((e) => `| ${e.code} | ${e.message} | ${e.description} |`).join('\n')}

### 3.3 认证策略
${apiDesign.authStrategy}

## 4. 组件层设计

### 4.1 组件树
\`\`\`
${componentDesign.componentTree}
\`\`\`

### 4.2 组件定义
${componentDesign.components.map((c) => `
#### ${c.name}
- **类型**: ${c.type}
- **路径**: ${c.path}
- **描述**: ${c.description}
- **Props**:
${c.props.map((p) => `  - ${p.name}: ${p.type}${p.required ? ' (必填)' : ''} - ${p.description}`).join('\n')}
`).join('\n')}

## 5. 业务逻辑设计

### 5.1 业务流程
${logicDesign.flows.map((f) => `
#### ${f.name}
${f.description}

| 步骤ID | 步骤名称 | 类型 | 描述 | 下一步 | 错误处理 |
|--------|----------|------|------|--------|----------|
${f.steps.map((s) => `| ${s.id} | ${s.name} | ${s.type} | ${s.description} | ${s.next?.join(', ') || '-'} | ${s.onError || '-'} |`).join('\n')}
`).join('\n')}

### 5.2 状态定义
| 状态名 | 类型 | 初始值 | 描述 |
|--------|------|--------|------|
${logicDesign.states.map((s) => `| ${s.name} | ${s.type} | ${s.initialValue} | ${s.description} |`).join('\n')}

### 5.3 副作用
| 触发条件 | 执行动作 | 描述 |
|----------|----------|------|
${logicDesign.sideEffects.map((e) => `| ${e.trigger} | ${e.action} | ${e.description} |`).join('\n')}

## 6. 样式设计

### 6.1 主题变量
| 变量名 | 值 | 用途 |
|--------|-----|------|
${styleDesign.themeVariables.map((v) => `| ${v.name} | ${v.value} | ${v.usage} |`).join('\n')}

### 6.2 响应式断点
| 名称 | 最小宽度 | 描述 |
|------|----------|------|
${styleDesign.responsive.map((r) => `| ${r.name} | ${r.minWidth} | ${r.description} |`).join('\n')}

### 6.3 动画定义
| 名称 | 类型 | 时长 | 缓动函数 | 描述 |
|------|------|------|----------|------|
${styleDesign.animations.map((a) => `| ${a.name} | ${a.type} | ${a.duration} | ${a.timing} | ${a.description} |`).join('\n')}

### 6.4 组件样式
${styleDesign.componentStyles.map((c) => `
#### ${c.component}
${c.description}

\`\`\`css
${c.styles.join('\n')}
\`\`\`
`).join('\n')}

## 7. 设计问题
${issues.length > 0 ? issues.map(i => `- ⚠️ ${i}`).join('\n') : '- 无设计问题'}

## 8. 文件变更清单
| 操作 | 文件路径 | 说明 |
|------|----------|------|
${componentDesign.components.map((c) => `| 新增 | ${c.path} | ${c.name}组件 |`).join('\n')}
`;
        const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
        const docPath = path.join(sessionsDir, `design-${Date.now()}.md`);
        await writeText(docPath, doc);
        return docPath;
    }
}
//# sourceMappingURL=design-agent.js.map