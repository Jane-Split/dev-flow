import { BaseAgent, type AgentContext, type AgentResult } from './base-agent.js';
import {
  StructureScanner,
  DependencyScanner,
  ComponentScanner,
  ApiScanner,
  UtilScanner,
  ConventionScanner,
} from '../scanners/index.js';
import { logger } from '../utils/logger.js';

export interface ResearchResult {
  projectMeta: any;
  structure: any;
  components: any[];
  apis: any[];
  models: any[];
  utils: any[];
  hooks: any[];
  conventions: any[];
}

export class ResearchAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('ResearchAgent', context);
  }

  async execute(): Promise<AgentResult<ResearchResult>> {
    try {
      logger.title('项目深度调研');

      const projectRoot = this.getProjectRoot();
      const memory = this.getMemory();

      // Step 1: 扫描依赖和项目元信息
      logger.step(1, 8, '扫描项目依赖...');
      const depScanner = new DependencyScanner(projectRoot);
      const projectMeta = await depScanner.scan();
      await memory.setProjectMeta(projectMeta);
      logger.success(`技术栈: ${projectMeta.techStack.framework} + ${projectMeta.techStack.language}`);

      // Step 2: 扫描项目结构
      logger.step(2, 8, '扫描项目结构...');
      const structScanner = new StructureScanner(projectRoot);
      const structure = await structScanner.scan();
      await memory.setStructure(structure);
      logger.success(`发现 ${structure.entryFiles.length} 个入口文件`);

      // Step 3: 扫描组件
      logger.step(3, 8, '扫描组件库...');
      const compScanner = new ComponentScanner(projectRoot);
      const components = await compScanner.scan();
      await memory.setComponents(components);
      logger.success(`发现 ${components.length} 个组件`);

      // Step 4: 扫描API
      logger.step(4, 8, '扫描API接口...');
      const apiScanner = new ApiScanner(projectRoot);
      const apis = await apiScanner.scanEndpoints();
      const models = await apiScanner.scanModels();
      await memory.setApis(apis);
      await memory.setModels(models);
      logger.success(`发现 ${apis.length} 个API端点, ${models.length} 个数据模型`);

      // Step 5: 扫描工具函数
      logger.step(5, 8, '扫描工具函数...');
      const utilScanner = new UtilScanner(projectRoot);
      const utils = await utilScanner.scanFunctions();
      const hooks = await utilScanner.scanHooks();
      await memory.setUtils(utils);
      logger.success(`发现 ${utils.length} 个工具函数, ${hooks.length} 个Hooks`);

      // Step 6: 扫描编码规范
      logger.step(6, 8, '扫描编码规范...');
      const convScanner = new ConventionScanner(projectRoot);
      const conventions = await convScanner.scan();
      await memory.setConventions(conventions);
      logger.success(`发现 ${conventions.length} 条编码规范`);

      // Step 7: 生成架构文档
      logger.step(7, 8, '生成架构文档...');
      const architecture = this.generateArchitectureDoc(projectMeta, structure);
      await memory.write('architecture', architecture);
      logger.success('架构文档已生成');

      // Step 8: 完成
      logger.step(8, 8, '调研完成');

      return {
        success: true,
        data: {
          projectMeta,
          structure,
          components,
          apis,
          models,
          utils,
          hooks,
          conventions,
        },
        artifacts: ['.dev-flow/memory/'],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Error: ${message}`);
      return {
        success: false,
        error: message,
      };
    }
  }

  private generateArchitectureDoc(projectMeta: any, structure: any): string {
    return `# 项目架构文档

## 项目概览
- **名称**: ${projectMeta.name}
- **技术栈**: ${projectMeta.techStack.framework} + ${projectMeta.techStack.language}
- **构建工具**: ${projectMeta.buildTool}
- **包管理器**: ${projectMeta.packageManager}

## 技术栈详情
- **语言**: ${projectMeta.techStack.language}
- **框架**: ${projectMeta.techStack.framework}
- **UI库**: ${projectMeta.techStack.uiLibrary || '无'}
- **状态管理**: ${projectMeta.techStack.stateManagement || '无'}
- **CSS方案**: ${projectMeta.techStack.cssSolution || 'CSS'}
- **测试框架**: ${projectMeta.techStack.testFramework || '无'}

## 项目结构
\`\`\`
${this.formatStructure(structure.directories)}
\`\`\`

## 入口文件
${structure.entryFiles.map((f: string) => `- ${f}`).join('\n')}
`;
  }

  private formatStructure(nodes: any[], indent = 0): string {
    let result = '';
    for (const node of nodes.slice(0, 20)) { // 限制输出
      result += '  '.repeat(indent) + `${node.type === 'directory' ? '📁' : '📄'} ${node.name}\n`;
      if (node.children && indent < 3) {
        result += this.formatStructure(node.children, indent + 1);
      }
    }
    return result;
  }
}
