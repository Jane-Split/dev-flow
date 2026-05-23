// src/agents/analyze-agent.ts
import { BaseAgent } from './base-agent.js';
import { RequirementParser, ContextLinker, ImpactAnalyzer, AmbiguityDetector, } from '../analyzers/index.js';
import { logger } from '../utils/logger.js';
import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';
export class AnalyzeAgent extends BaseAgent {
    constructor(context) {
        super('AnalyzeAgent', context);
    }
    async execute(requirement) {
        try {
            logger.title('需求分析');
            const projectRoot = this.getProjectRoot();
            const memory = this.getMemory();
            // Step 1: 解析需求
            logger.step(1, 6, '解析需求...');
            const parser = new RequirementParser();
            const parsed = await parser.parse(requirement, projectRoot);
            logger.success(`需求类型: ${parsed.type}, 优先级: ${parsed.priority}`);
            // Step 2: 关联项目上下文
            logger.step(2, 6, '关联项目上下文...');
            const linker = new ContextLinker(memory);
            const contextResult = await linker.link(parsed.raw);
            logger.success(`发现 ${contextResult.links.length} 个关联项`);
            // Step 3: 影响分析
            logger.step(3, 6, '分析影响范围...');
            const impactAnalyzer = new ImpactAnalyzer();
            const impactResult = impactAnalyzer.analyze(parsed.raw, contextResult.links);
            logger.success(`影响 ${impactResult.items.length} 个文件/API`);
            // Step 4: 歧义检测
            logger.step(4, 6, '检测歧义...');
            const ambiguityDetector = new AmbiguityDetector();
            const ambiguities = ambiguityDetector.detect(parsed.raw);
            logger.success(`发现 ${ambiguities.length} 个待确认问题`);
            // Step 5: 生成功能点
            logger.step(5, 6, '拆分功能点...');
            const features = this.generateFeatures(parsed, contextResult);
            logger.success(`拆分出 ${features.length} 个功能点`);
            // Step 6: 生成文档
            logger.step(6, 6, '生成需求理解文档...');
            const documentPath = await this.generateDocument({
                parsed,
                features,
                impacts: impactResult.items,
                constraints: parsed.constraints,
                risks: impactResult.risks,
                ambiguities,
            });
            logger.success(`文档已保存: ${documentPath}`);
            return {
                success: true,
                data: {
                    title: parsed.title,
                    type: parsed.type,
                    priority: parsed.priority,
                    features,
                    impacts: impactResult.items,
                    constraints: parsed.constraints,
                    risks: impactResult.risks,
                    ambiguities: ambiguities.map(a => ({
                        description: a.description,
                        suggestion: a.suggestion,
                    })),
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
    generateFeatures(parsed, contextResult) {
        const features = [];
        const lower = parsed.raw.toLowerCase();
        // 根据需求关键词生成功能点
        if (lower.includes('登录') || lower.includes('login')) {
            features.push({
                name: '账号密码登录',
                priority: 'P0',
                complexity: 'medium',
                role: '用户',
                action: '使用账号密码登录',
                value: '访问个人空间',
                acceptances: [
                    { given: '用户在登录页面', when: '输入正确的账号密码并点击登录', then: '成功跳转到首页' },
                    { given: '用户在登录页面', when: '输入错误的密码', then: '显示错误提示' },
                ],
                relatedComponents: 'LoginForm, Input, Button',
                relatedApis: 'POST /api/auth/login',
                relatedModels: 'User',
            });
            if (lower.includes('验证码') || lower.includes('短信')) {
                features.push({
                    name: '手机验证码登录',
                    priority: 'P1',
                    complexity: 'medium',
                    role: '用户',
                    action: '使用手机验证码登录',
                    value: '更便捷地登录',
                    acceptances: [
                        { given: '用户在登录页面', when: '输入手机号并获取验证码', then: '收到验证码短信' },
                        { given: '用户在登录页面', when: '输入正确验证码并登录', then: '成功跳转到首页' },
                    ],
                    relatedComponents: 'LoginForm, CaptchaButton',
                    relatedApis: 'POST /api/auth/sms-login, POST /api/auth/send-code',
                    relatedModels: 'User',
                });
            }
        }
        // 如果没有识别到特定功能，创建通用功能点
        if (features.length === 0) {
            features.push({
                name: parsed.title,
                priority: parsed.priority,
                complexity: 'medium',
                role: '用户',
                action: parsed.description.slice(0, 50),
                value: '满足业务需求',
                acceptances: [
                    { given: '系统正常运行', when: '执行该功能', then: '达到预期效果' },
                ],
                relatedComponents: contextResult.relatedComponents.map((c) => c.name).join(', ') || '待确定',
                relatedApis: contextResult.relatedApis.map((a) => a.path).join(', ') || '待确定',
                relatedModels: contextResult.relatedModels.map((m) => m.name).join(', ') || '待确定',
            });
        }
        return features;
    }
    async generateDocument(data) {
        const { parsed, features, impacts, constraints, risks, ambiguities } = data;
        const doc = `# 需求理解文档

## 1. 需求概述
- **原始需求**: ${parsed.title}
- **需求类型**: ${parsed.type}
- **优先级**: ${parsed.priority}

## 2. 功能点拆解
${features.map((f, i) => `
### 2.${i + 1} ${f.name} (${f.priority}, 复杂度: ${f.complexity})
- **用户故事**: 作为${f.role}，我希望${f.action}，以便${f.value}
- **验收标准**:
${f.acceptances.map(a => `  - Given ${a.given}\n  - When ${a.when}\n  - Then ${a.then}`).join('\n')}
- **关联组件**: ${f.relatedComponents}
- **关联API**: ${f.relatedApis}
- **关联Model**: ${f.relatedModels}
`).join('\n')}

## 3. 影响范围分析
| 类型 | 文件 | 操作 | 说明 |
|------|------|------|------|
${impacts.map(i => `| ${i.type} | ${i.path} | ${i.operation} | ${i.description} |`).join('\n')}

## 4. 技术约束
${constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : '- 无特殊约束'}

## 5. 风险点
${risks.length > 0 ? risks.map(r => `- ⚠️ ${r}`).join('\n') : '- 暂无明显风险'}

## 6. 待确认问题
${ambiguities.length > 0 ? ambiguities.map(a => `- [ ] **${a.description}**\n  - 建议: ${a.suggestion}`).join('\n') : '- 无待确认问题'}
`;
        const sessionsDir = path.join(this.getProjectRoot(), '.dev-flow', 'sessions');
        const docPath = path.join(sessionsDir, `requirement-${Date.now()}.md`);
        await writeText(docPath, doc);
        return docPath;
    }
}
//# sourceMappingURL=analyze-agent.js.map