import path from 'node:path';
import fs from 'node:fs/promises';
import type { CodingConvention } from '../memory/types.js';
import { fileExists, readText } from '../utils/fs-utils.js';

export class ConventionScanner {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    // ESLint规则
    const eslintConventions = await this.scanEslint();
    conventions.push(...eslintConventions);

    // TypeScript规则
    const tsConventions = await this.scanTsconfig();
    conventions.push(...tsConventions);

    // 从代码推断命名规范
    const namingConventions = await this.inferNamingConventions();
    conventions.push(...namingConventions);

    return conventions;
  }

  private async scanEslint(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    const configFiles = [
      '.eslintrc.json',
      '.eslintrc.js',
      '.eslintrc.yaml',
      '.eslintrc.yml',
    ];

    for (const file of configFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (await fileExists(filePath)) {
        const content = await readText(filePath);

        // 解析规则
        const rulesMatch = content.match(/"rules"\s*:\s*\{([^}]+)\}/);
        if (rulesMatch) {
          const rules = rulesMatch[1].matchAll(/"([^"]+)":\s*\[?"([^"\]]+)"\]?/g);

          for (const match of rules) {
            conventions.push({
              id: `eslint-${match[1].replace(/\//g, '-')}`,
              category: 'formatting',
              name: match[1],
              description: `ESLint rule: ${match[1]} = ${match[2]}`,
              examples: [],
              severity: match[2] === 'error' ? 'error' : match[2] === 'warn' ? 'warn' : 'info',
            });
          }
        }
        break;
      }
    }

    return conventions;
  }

  private async scanTsconfig(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (await fileExists(tsconfigPath)) {
      const content = await readText(tsconfigPath);

      // strict模式
      if (content.includes('"strict": true')) {
        conventions.push({
          id: 'ts-strict',
          category: 'structure',
          name: 'strict mode',
          description: 'TypeScript strict mode is enabled',
          examples: [],
          severity: 'error',
        });
      }

      // noImplicitAny
      if (content.includes('"noImplicitAny": true')) {
        conventions.push({
          id: 'ts-noImplicitAny',
          category: 'structure',
          name: 'noImplicitAny',
          description: 'Implicit any is not allowed',
          examples: [],
          severity: 'error',
        });
      }
    }

    return conventions;
  }

  private async inferNamingConventions(): Promise<CodingConvention[]> {
    const conventions: CodingConvention[] = [];

    // 这里可以扫描代码文件，分析命名模式
    // 简化版：返回通用规范

    conventions.push({
      id: 'naming-component',
      category: 'naming',
      name: 'Component naming',
      description: 'React components should be named in PascalCase',
      examples: ['Button', 'UserProfile', 'NavigationBar'],
      severity: 'error',
    });

    conventions.push({
      id: 'naming-hook',
      category: 'naming',
      name: 'Hook naming',
      description: 'React hooks should be named with "use" prefix',
      examples: ['useAuth', 'useLocalStorage', 'useDebounce'],
      severity: 'error',
    });

    conventions.push({
      id: 'naming-util',
      category: 'naming',
      name: 'Utility function naming',
      description: 'Utility functions should be named in camelCase',
      examples: ['formatDate', 'parseJSON', 'validateEmail'],
      severity: 'warn',
    });

    return conventions;
  }
}
