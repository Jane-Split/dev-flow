import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
const API_PATTERNS = [
    'src/api/**/*.{ts,js}',
    'src/services/**/*.{ts,js}',
    'src/controllers/**/*.{ts,js}',
    'src/routes/**/*.{ts,js}',
    'pages/api/**/*.{ts,js}',
];
export class ApiScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scanEndpoints() {
        const endpoints = [];
        for (const pattern of API_PATTERNS) {
            const files = await glob(pattern, { cwd: this.projectRoot });
            for (const file of files) {
                const fileEndpoints = await this.extractEndpoints(file);
                endpoints.push(...fileEndpoints);
            }
        }
        return endpoints;
    }
    async scanModels() {
        const models = [];
        const modelPatterns = [
            'src/models/**/*.{ts,js}',
            'src/types/**/*.{ts,js}',
            'src/interfaces/**/*.{ts,js}',
        ];
        for (const pattern of modelPatterns) {
            const files = await glob(pattern, { cwd: this.projectRoot });
            for (const file of files) {
                const fileModels = await this.extractModels(file);
                models.push(...fileModels);
            }
        }
        return models;
    }
    async extractEndpoints(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const endpoints = [];
        // Express风格路由
        const expressMatches = content.matchAll(/\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi);
        for (const match of expressMatches) {
            endpoints.push({
                id: `api-${match[1]}-${match[2].replace(/[/]/g, '-')}`,
                method: match[1].toUpperCase(),
                path: match[2],
                description: '',
                auth: content.includes('auth') || content.includes('token'),
                response: { body: 'unknown' },
            });
        }
        // Next.js API路由
        if (filePath.includes('pages/api/')) {
            const method = path.basename(filePath, path.extname(filePath));
            const apiPath = filePath
                .replace('pages/api', '')
                .replace(/\.(ts|js)$/, '')
                .replace(/\[([^\]]+)\]/g, ':$1');
            if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                endpoints.push({
                    id: `api-${method}-${apiPath.replace(/[/]/g, '-')}`,
                    method: method.toUpperCase(),
                    path: apiPath,
                    description: '',
                    auth: content.includes('auth') || content.includes('token'),
                    response: { body: 'unknown' },
                });
            }
        }
        // fetch/axios调用
        const fetchMatches = content.matchAll(/(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*['"]([^'"]+)['"]/gi);
        for (const match of fetchMatches) {
            const method = match[0].includes('post') ? 'POST' :
                match[0].includes('put') ? 'PUT' :
                    match[0].includes('delete') ? 'DELETE' :
                        match[0].includes('patch') ? 'PATCH' : 'GET';
            endpoints.push({
                id: `api-client-${method}-${match[1].replace(/[/]/g, '-')}`,
                method,
                path: match[1],
                description: '',
                auth: true,
                response: { body: 'unknown' },
            });
        }
        return endpoints;
    }
    async extractModels(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const models = [];
        // TypeScript interface
        const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*\{([^}]+)\}/g);
        for (const match of interfaceMatches) {
            const fields = this.parseFields(match[2]);
            models.push({
                id: `model-${match[1]}`,
                name: match[1],
                fields,
                description: '',
            });
        }
        // TypeScript type
        const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*\{([^}]+)\}/g);
        for (const match of typeMatches) {
            const fields = this.parseFields(match[2]);
            models.push({
                id: `model-${match[1]}`,
                name: match[1],
                fields,
                description: '',
            });
        }
        return models;
    }
    parseFields(content) {
        const fields = [];
        const fieldMatches = content.matchAll(/(\w+)(\?)?:\s*([^;]+);?/g);
        for (const match of fieldMatches) {
            fields.push({
                name: match[1],
                type: match[3].trim(),
                required: !match[2],
                description: '',
            });
        }
        return fields;
    }
}
//# sourceMappingURL=api-scanner.js.map