import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
const UTIL_PATTERNS = [
    'src/utils/**/*.{ts,js}',
    'src/lib/**/*.{ts,js}',
    'src/helpers/**/*.{ts,js}',
    'src/common/**/*.{ts,js}',
    'src/hooks/**/*.{ts,js}',
];
export class UtilScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scanFunctions() {
        const functions = [];
        const patterns = UTIL_PATTERNS.filter(p => !p.includes('hooks'));
        for (const pattern of patterns) {
            const files = await glob(pattern, { cwd: this.projectRoot });
            for (const file of files) {
                const fileFunctions = await this.extractFunctions(file);
                functions.push(...fileFunctions);
            }
        }
        return functions;
    }
    async scanHooks() {
        const hooks = [];
        const patterns = UTIL_PATTERNS.filter(p => p.includes('hooks'));
        for (const pattern of patterns) {
            const files = await glob(pattern, { cwd: this.projectRoot });
            for (const file of files) {
                const fileHooks = await this.extractHooks(file);
                hooks.push(...fileHooks);
            }
        }
        return hooks;
    }
    async extractFunctions(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const functions = [];
        // 导出函数
        const exportMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g);
        for (const match of exportMatches) {
            functions.push({
                id: `func-${match[1]}`,
                name: match[1],
                path: filePath,
                signature: `function ${match[1]}(${match[2]})${match[3] ? ': ' + match[3].trim() : ''}`,
                description: this.extractDescription(content, match[1]),
                parameters: this.parseParameters(match[2]),
                returnType: match[3]?.trim() || 'void',
            });
        }
        // 箭头函数导出
        const arrowMatches = content.matchAll(/export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::\s*([^=]+))?\s*=>/g);
        for (const match of arrowMatches) {
            functions.push({
                id: `func-${match[1]}`,
                name: match[1],
                path: filePath,
                signature: `const ${match[1]} = (${match[2]})${match[3] ? ': ' + match[3].trim() : ''} =>`,
                description: this.extractDescription(content, match[1]),
                parameters: this.parseParameters(match[2]),
                returnType: match[3]?.trim() || 'void',
            });
        }
        return functions;
    }
    async extractHooks(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const hooks = [];
        // useXxx hooks
        const hookMatches = content.matchAll(/export\s+function\s+(use\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g);
        for (const match of hookMatches) {
            hooks.push({
                id: `hook-${match[1]}`,
                name: match[1],
                path: filePath,
                signature: `function ${match[1]}(${match[2]})${match[3] ? ': ' + match[3].trim() : ''}`,
                description: this.extractDescription(content, match[1]),
                parameters: this.parseParameters(match[2]),
                returnType: match[3]?.trim() || 'void',
            });
        }
        return hooks;
    }
    extractDescription(content, name) {
        // 查找函数前的 JSDoc 注释
        const regex = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:async\\s+)?(?:function|const)\\s+${name}`);
        const match = content.match(regex);
        if (match) {
            const comment = match[0];
            const lines = comment.split('\\n');
            const description = lines
                .slice(1, -1)
                .map(line => line.replace(/^\\s*\\*\\s?/, ''))
                .join(' ')
                .trim();
            return description;
        }
        return '';
    }
    parseParameters(paramStr) {
        if (!paramStr.trim())
            return [];
        return paramStr.split(',').map(param => {
            const trimmed = param.trim();
            const optional = trimmed.includes('?');
            const [name, type] = trimmed.replace('?', '').split(':').map(s => s.trim());
            return {
                name,
                type: type || 'any',
                required: !optional,
            };
        });
    }
}
//# sourceMappingURL=util-scanner.js.map