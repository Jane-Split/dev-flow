// src/agents/architecture-agent.ts
// 架构决策代理 - 基于规则和模板生成架构方案
import { BaseAgent } from './base-agent.js';
import { getScaleFromRequirement, getTechRecommendations, getArchitecturePattern, getLayerStrategy, getDeploymentPlan, getTradeoffs, } from './architecture-templates.js';
import { logger } from '../utils/logger.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';
// ─── ArchitectureAgent ──────────────────────────────────────
export class ArchitectureAgent extends BaseAgent {
    constructor(context) {
        super('ArchitectureAgent', context);
    }
    async execute(requirement) {
        try {
            logger.title('架构决策');
            // Step 1: 需求规模评估
            logger.step(1, 7, '评估项目规模...');
            const projectScale = getScaleFromRequirement(requirement);
            const scaleLabel = projectScale === 'small' ? '小型' : projectScale === 'medium' ? '中型' : '大型';
            logger.success(`项目规模: ${scaleLabel} (${projectScale})`);
            // Step 2: 技术选型
            logger.step(2, 7, '生成技术选型推荐...');
            const techDecisions = getTechRecommendations(projectScale);
            for (const decision of techDecisions) {
                logger.success(`${decision.category}: 推荐 ${decision.selected}`);
            }
            // Step 3: 架构模式选择
            logger.step(3, 7, '选择架构模式...');
            const pattern = getArchitecturePattern(projectScale);
            logger.success(`架构模式: ${pattern.name}`);
            // Step 4: 分层设计
            logger.step(4, 7, '生成分层设计...');
            const selectedFramework = techDecisions.find(d => d.category === 'framework')?.selected ?? 'Next.js';
            const layers = getLayerStrategy(projectScale, selectedFramework);
            logger.success(`目录结构: ${layers.directoryStructure.length} 个条目`);
            // Step 5: 部署方案
            logger.step(5, 7, '生成部署方案...');
            const deployment = getDeploymentPlan(projectScale);
            logger.success(`部署策略: ${deployment.strategy}`);
            // Step 6: 权衡分析
            logger.step(6, 7, '生成权衡分析...');
            const tradeoffs = getTradeoffs(projectScale);
            logger.success(`关键权衡: ${tradeoffs.length} 项`);
            // Step 7: 生成文档
            logger.step(7, 7, '生成架构文档...');
            const documentPath = await this.generateDocument({
                requirement,
                projectScale,
                techDecisions,
                pattern,
                layers,
                deployment,
                tradeoffs,
            });
            logger.success(`文档已保存: ${documentPath}`);
            // 存入记忆
            const memory = this.getMemory();
            await memory.write('architecture', JSON.stringify({
                projectScale,
                pattern: pattern.name,
                selectedTech: techDecisions.map(d => ({ category: d.category, selected: d.selected })),
                documentPath,
            }, null, 2));
            return {
                success: true,
                data: {
                    projectScale,
                    techDecisions,
                    pattern,
                    layers,
                    deployment,
                    tradeoffs,
                    documentPath,
                },
                artifacts: [documentPath],
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(`Error: ${message}`);
            return {
                success: false,
                error: message,
            };
        }
    }
    // ─── 文档生成 ─────────────────────────────────────────────
    async generateDocument(data) {
        const { requirement, projectScale, techDecisions, pattern, layers, deployment, tradeoffs, } = data;
        const scaleLabel = projectScale === 'small' ? '小型' : projectScale === 'medium' ? '中型' : '大型';
        const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const doc = `# 架构决策文档

> 生成时间: ${timestamp}
> 项目规模: **${scaleLabel}** (${projectScale})

## 1. 需求描述

${requirement}

## 2. 项目规模评估

**评估结果**: ${scaleLabel}项目 (${projectScale})

| 规模 | 适用场景 |
|------|----------|
| small | 个人项目、工具、静态站点、MVP |
| medium | 团队项目、CRUD应用、管理后台、电商 |
| large | 高并发、多团队、微服务、分布式系统 |

## 3. 架构模式

### ${pattern.name}

${pattern.description}

#### 适用场景
${pattern.suitableFor.map(s => `- ${s}`).join('\n')}

#### 权衡取舍
${pattern.tradeoffs.map(t => `- ${t}`).join('\n')}

## 4. 技术选型

${techDecisions.map(decision => {
            const categoryLabel = getCategoryLabel(decision.category);
            return `### ${categoryLabel}

> 推荐: **${decision.selected}**
> ${decision.rationale}

| 方案 | 评分 | 推荐度 | 优点 | 缺点 |
|------|------|--------|------|------|
${decision.options.map(opt => `| ${opt.name} | ${opt.score}/100 | ${opt.recommended ? '推荐' : '备选'} | ${opt.pros.join(', ')} | ${opt.cons.join(', ')} |`).join('\n')}
`;
        }).join('\n')}

## 5. 分层设计

### 5.1 目录结构

\`\`\`
${layers.directoryStructure.join('\n')}
\`\`\`

### 5.2 模块边界

${layers.moduleBoundaries.map(b => `- ${b}`).join('\n')}

### 5.3 数据流

${layers.dataFlow}

### 5.4 API 契约

${layers.apiContract}

## 6. 部署方案

### 策略: ${deployment.strategy}

${deployment.description}

#### 前置要求
${deployment.requirements.map(r => `- ${r}`).join('\n')}

## 7. 权衡分析

| 关注点 | 决策 | 影响 |
|--------|------|------|
${tradeoffs.map(t => `| ${t.concern} | ${t.decision} | ${t.impact} |`).join('\n')}

## 8. 后续步骤

1. [ ] 确认技术选型方案
2. [ ] 初始化项目结构
3. [ ] 搭建开发环境
4. [ ] 实现核心功能骨架
5. [ ] 配置 CI/CD 流水线
6. [ ] 编写技术文档
`;
        const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
        const docPath = path.join(sessionsDir, `architecture-${Date.now()}.md`);
        await writeText(docPath, doc);
        return docPath;
    }
}
// ─── 辅助函数 ───────────────────────────────────────────────
function getCategoryLabel(category) {
    const labels = {
        framework: '框架选型',
        database: '数据库选型',
        cache: '缓存选型',
        queue: '消息队列选型',
        auth: '认证方案选型',
        monitoring: '监控方案选型',
        deployment: '部署方案选型',
    };
    return labels[category] ?? category;
}
//# sourceMappingURL=architecture-agent.js.map