import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { ComponentInfo, PropDefinition, EventDefinition } from '../memory/types.js';

const COMPONENT_PATTERNS = [
  'src/components/**/*.{tsx,jsx,vue}',
  'src/pages/**/*.{tsx,jsx,vue}',
  'src/views/**/*.{tsx,jsx,vue}',
  'src/layouts/**/*.{tsx,jsx,vue}',
];

const IGNORE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  '**/*.test.{tsx,jsx,vue}',
  '**/*.spec.{tsx,jsx,vue}',
];

export class ComponentScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];

    for (const pattern of COMPONENT_PATTERNS) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: IGNORE_PATTERNS,
      });

      for (const file of files) {
        const info = await this.extractComponentInfo(file);
        if (info) {
          components.push(info);
        }
      }
    }

    return components;
  }

  private async extractComponentInfo(filePath: string): Promise<ComponentInfo | null> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    const name = this.extractComponentName(filePath, content);
    const type = this.detectComponentType(filePath);
    const props = this.extractProps(content);
    const events = this.extractEvents(content);
    const description = this.extractDescription(content);
    const dependencies = this.extractDependencies(content);

    return {
      id: this.generateId(filePath),
      name,
      type,
      path: filePath,
      props,
      events,
      description,
      dependencies,
    };
  }

  private extractComponentName(filePath: string, content: string): string {
    // 从文件名提取
    const fileName = path.basename(filePath, path.extname(filePath));

    // 尝试从代码中提取组件名
    const nameMatch = content.match(/(?:const|function)\s+(\w+)\s*[=:]\s*(?:\(|memo|forwardRef)/);
    if (nameMatch) {
      return nameMatch[1];
    }

    // Vue组件名
    const vueNameMatch = content.match(/name:\s*['"](\w+)['"]/);
    if (vueNameMatch) {
      return vueNameMatch[1];
    }

    return fileName;
  }

  private detectComponentType(filePath: string): ComponentInfo['type'] {
    if (filePath.includes('/pages/') || filePath.includes('/views/')) {
      return 'page';
    } else if (filePath.includes('/layouts/')) {
      return 'layout';
    }
    return 'component';
  }

  private extractProps(content: string): PropDefinition[] {
    const props: PropDefinition[] = [];

    // TypeScript interface props
    const interfaceMatch = content.match(/interface\s+\w*Props\s*\{([^}]+)\}/);
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propMatches = propsContent.matchAll(/(\w+)(\?)?:\s*([^;]+);/g);

      for (const match of propMatches) {
        props.push({
          name: match[1],
          type: match[3].trim(),
          required: !match[2],
          description: '',
        });
      }
    }

    // Vue props
    const vuePropsMatch = content.match(/props:\s*\{([^}]+)\}/);
    if (vuePropsMatch) {
      const propsContent = vuePropsMatch[1];
      const propMatches = propsContent.matchAll(/(\w+):\s*\{[^}]*type:\s*(\w+)/g);

      for (const match of propMatches) {
        props.push({
          name: match[1],
          type: match[2],
          required: true,
          description: '',
        });
      }
    }

    return props;
  }

  private extractEvents(content: string): EventDefinition[] {
    const events: EventDefinition[] = [];

    // React onClick, onChange等
    const eventMatches = content.matchAll(/on(\w+)\s*[=:]\s*\(?([^)]*)\)?\s*=>/g);
    for (const match of eventMatches) {
      events.push({
        name: `on${match[1]}`,
        payload: match[2].trim() || 'void',
        description: '',
      });
    }

    // Vue emits
    const emitsMatch = content.match(/emits:\s*\[([^\]]+)\]/);
    if (emitsMatch) {
      const emitNames = emitsMatch[1].match(/['"](\w+)['"]/g);
      if (emitNames) {
        for (const name of emitNames) {
          events.push({
            name: name.replace(/['"]/g, ''),
            payload: 'unknown',
            description: '',
          });
        }
      }
    }

    return events;
  }

  private extractDescription(content: string): string {
    // JSDoc注释
    const jsdocMatch = content.match(/\/\*\*\s*\n?\s*\*\s*([^\n]+)/);
    if (jsdocMatch) {
      return jsdocMatch[1].trim();
    }

    // 单行注释
    const commentMatch = content.match(/\/\/\s*(.+)/);
    if (commentMatch) {
      return commentMatch[1].trim();
    }

    return '';
  }

  private extractDependencies(content: string): string[] {
    const deps: string[] = [];

    // import语句
    const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      if (!match[1].startsWith('.')) {
        deps.push(match[1]);
      }
    }

    return [...new Set(deps)];
  }

  private generateId(filePath: string): string {
    return `comp-${filePath.replace(/[/\\.]/g, '-')}`;
  }
}
