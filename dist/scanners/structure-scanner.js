import { glob } from 'glob';
const IGNORE_PATTERNS = [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '.dev-flow/**',
    'coverage/**',
    '**/*.min.js',
    '**/*.map',
];
export class StructureScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scan() {
        const directories = await this.scanDirectories();
        const entryFiles = await this.findEntryFiles();
        const routes = await this.extractRoutes();
        return {
            root: this.projectRoot,
            directories,
            entryFiles,
            routes,
        };
    }
    async scanDirectories() {
        const pattern = '**/*';
        const files = await glob(pattern, {
            cwd: this.projectRoot,
            ignore: IGNORE_PATTERNS,
            nodir: false,
        });
        const rootNodes = [];
        const nodeMap = new Map();
        // 构建目录树
        for (const file of files.sort()) {
            const parts = file.split('/');
            let currentPath = '';
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!nodeMap.has(currentPath)) {
                    const isFile = i === parts.length - 1 && part.includes('.');
                    const node = {
                        name: part,
                        path: currentPath,
                        type: isFile ? 'file' : 'directory',
                    };
                    nodeMap.set(currentPath, node);
                    if (parentPath === '') {
                        rootNodes.push(node);
                    }
                    else {
                        const parent = nodeMap.get(parentPath);
                        if (parent) {
                            parent.children = parent.children || [];
                            parent.children.push(node);
                        }
                    }
                }
            }
        }
        return rootNodes;
    }
    async findEntryFiles() {
        const entryPatterns = [
            'src/index.{ts,tsx,js,jsx}',
            'src/main.{ts,tsx,js,jsx}',
            'src/App.{ts,tsx,js,jsx}',
            'pages/_app.{ts,tsx,js,jsx}',
            'app/layout.{ts,tsx,js,jsx}',
        ];
        const entries = [];
        for (const pattern of entryPatterns) {
            const files = await glob(pattern, { cwd: this.projectRoot });
            entries.push(...files);
        }
        return entries;
    }
    async extractRoutes() {
        // 尝试查找路由配置文件
        const routePatterns = [
            'src/router/**/*.{ts,tsx,js,jsx}',
            'src/routes/**/*.{ts,tsx,js,jsx}',
            'pages/**/*.{ts,tsx,js,jsx}',
        ];
        for (const pattern of routePatterns) {
            const files = await glob(pattern, {
                cwd: this.projectRoot,
                ignore: IGNORE_PATTERNS,
            });
            if (files.length > 0) {
                // 简化版：返回文件路径作为路由
                return files.map(file => ({
                    path: this.fileToRoute(file),
                    component: file,
                }));
            }
        }
        return undefined;
    }
    fileToRoute(file) {
        // 将文件路径转换为路由路径
        const route = file
            .replace(/^pages|^src\/routes?|^src\/router/, '')
            .replace(/\.(ts|tsx|js|jsx)$/, '')
            .replace(/\/index$/, '/')
            .replace(/\[([^\]]+)\]/g, ':$1');
        return route.startsWith('/') ? route : `/${route}`;
    }
}
//# sourceMappingURL=structure-scanner.js.map