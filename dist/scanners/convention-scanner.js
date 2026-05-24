import path from 'node:path';
import fs from 'node:fs/promises';
import { fileExists, readText } from '../utils/fs-utils.js';
export class ConventionScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scan() {
        const conventions = [];
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
    async scanEslint() {
        const conventions = [];
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
    async scanTsconfig() {
        const conventions = [];
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
    async inferNamingConventions() {
        const conventions = [];
        try {
            // 扫描 src 目录下的代码文件
            const srcDir = path.join(this.projectRoot, 'src');
            const srcExists = await fileExists(srcDir);
            if (!srcExists) {
                // 没有src目录，返回默认规范
                conventions.push({ id: 'naming-component', category: 'naming', name: 'Component naming', description: 'Components should be named in PascalCase', examples: ['Button', 'UserProfile'], severity: 'warn' }, { id: 'naming-function', category: 'naming', name: 'Function naming', description: 'Functions should be named in camelCase', examples: ['handleSubmit', 'fetchData'], severity: 'warn' });
                return conventions;
            }
            const codeFiles = await this.findCodeFiles(srcDir);
            if (codeFiles.length === 0)
                return conventions;
            let pascalCaseCount = 0;
            let camelCaseCount = 0;
            let snakeCaseCount = 0;
            let hasUsePrefix = false;
            let totalFunctions = 0;
            for (const file of codeFiles.slice(0, 50)) { // 最多扫描50个文件
                const content = await readText(file);
                // 统计组件命名（PascalCase 导出）
                const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9]*)/g);
                for (const m of exportMatches)
                    pascalCaseCount++;
                // 统计函数命名
                const funcMatches = content.matchAll(/(?:const|function|def)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
                for (const m of funcMatches) {
                    totalFunctions++;
                    const name = m[1];
                    if (/^[A-Z]/.test(name) && !/^[A-Z]+$/.test(name))
                        pascalCaseCount++;
                    else if (/^[a-z]/.test(name) && name.includes('_'))
                        snakeCaseCount++;
                    else if (/^[a-z]/.test(name))
                        camelCaseCount++;
                }
                // 检测 use 前缀（React Hooks）
                if (content.match(/(?:const|function)\s+use[A-Z]/))
                    hasUsePrefix = true;
            }
            // 根据统计结果生成命名规范
            if (totalFunctions > 0) {
                if (camelCaseCount > snakeCaseCount && camelCaseCount > pascalCaseCount) {
                    conventions.push({
                        id: 'naming-function',
                        category: 'naming',
                        name: 'Function naming',
                        description: `Functions use camelCase (${camelCaseCount}/${totalFunctions} functions follow this pattern)`,
                        examples: ['handleSubmit', 'fetchData', 'parseInput'],
                        severity: 'warn',
                    });
                }
                else if (snakeCaseCount > camelCaseCount) {
                    conventions.push({
                        id: 'naming-function',
                        category: 'naming',
                        name: 'Function naming',
                        description: `Functions use snake_case (${snakeCaseCount}/${totalFunctions} functions follow this pattern)`,
                        examples: ['handle_submit', 'fetch_data', 'parse_input'],
                        severity: 'warn',
                    });
                }
            }
            if (hasUsePrefix) {
                conventions.push({
                    id: 'naming-hook',
                    category: 'naming',
                    name: 'Hook naming',
                    description: 'React hooks use "use" prefix (detected in project)',
                    examples: ['useAuth', 'useLocalStorage', 'useDebounce'],
                    severity: 'error',
                });
            }
            if (pascalCaseCount > 0) {
                conventions.push({
                    id: 'naming-component',
                    category: 'naming',
                    name: 'Component naming',
                    description: `Components use PascalCase (${pascalCaseCount} PascalCase exports detected)`,
                    examples: ['Button', 'UserProfile', 'NavigationBar'],
                    severity: 'error',
                });
            }
        }
        catch {
            // 扫描失败时返回空数组
        }
        return conventions;
    }
    async findCodeFiles(dir) {
        const files = [];
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist')
                    continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    files.push(...await this.findCodeFiles(fullPath));
                }
                else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
        catch {
            // ignore
        }
        return files;
    }
}
//# sourceMappingURL=convention-scanner.js.map