import path from 'node:path';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import type { ProjectStructure, DirectoryNode, RouteInfo } from '../memory/types.js';

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
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<ProjectStructure> {
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

  private async scanDirectories(): Promise<DirectoryNode[]> {
    const pattern = '**/*';
    const files = await glob(pattern, {
      cwd: this.projectRoot,
      ignore: IGNORE_PATTERNS,
      nodir: false,
    });

    const rootNodes: DirectoryNode[] = [];
    const nodeMap = new Map<string, DirectoryNode>();

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
          const node: DirectoryNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'directory',
          };

          nodeMap.set(currentPath, node);

          if (parentPath === '') {
            rootNodes.push(node);
          } else {
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

  private async findEntryFiles(): Promise<string[]> {
    const entryPatterns = [
      // 前端 / Node.js
      'src/index.{ts,tsx,js,jsx}',
      'src/main.{ts,tsx,js,jsx}',
      'src/App.{ts,tsx,js,jsx}',
      'pages/_app.{ts,tsx,js,jsx}',
      'app/layout.{ts,tsx,js,jsx}',
      // Java Maven
      'src/main/java/**/Application.java',
      'src/main/java/**/Main.java',
      // Java Gradle (Kotlin)
      'src/main/kotlin/**/Application.kt',
      'src/main/kotlin/**/Main.kt',
      // Python
      'app.py',
      'main.py',
      'manage.py',
      'wsgi.py',
      'app/__init__.py',
      // Go
      'cmd/**/main.go',
      'main.go',
      // Rust
      'src/main.rs',
      'src/lib.rs',
    ];

    const entries: string[] = [];
    for (const pattern of entryPatterns) {
      const files = await glob(pattern, { cwd: this.projectRoot });
      entries.push(...files);
    }

    return entries;
  }

  private async extractRoutes(): Promise<RouteInfo[] | undefined> {
    // 尝试查找路由配置文件
    const routePatterns = [
      // 前端路由
      'src/router/**/*.{ts,tsx,js,jsx}',
      'src/routes/**/*.{ts,tsx,js,jsx}',
      'pages/**/*.{ts,tsx,js,jsx}',
      // Java Spring 控制器
      'src/main/java/**/*Controller.java',
      'src/main/java/**/*Resource.java',
      'src/main/java/**/*Endpoint.java',
      // Python Flask / Django / FastAPI 路由
      '**/views.py',
      '**/urls.py',
      '**/routes.py',
      '**/app.py',
      '**/api.py',
    ];

    const allRouteFiles: string[] = [];
    for (const pattern of routePatterns) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: IGNORE_PATTERNS,
      });
      allRouteFiles.push(...files);
    }

    if (allRouteFiles.length === 0) {
      return undefined;
    }

    // 尝试从文件内容中提取路由信息
    const routeInfos: RouteInfo[] = [];

    for (const file of allRouteFiles) {
      const ext = file.split('.').pop();

      if (ext === 'java') {
        // Java Spring 路由: @GetMapping, @PostMapping, @RequestMapping
        const javaRoutes = await this.extractJavaRoutes(file);
        routeInfos.push(...javaRoutes);
      } else if (ext === 'py') {
        // Python Flask / Django / FastAPI 路由
        const pythonRoutes = await this.extractPythonRoutes(file);
        routeInfos.push(...pythonRoutes);
      } else {
        // 前端路由: 使用文件路径转换
        routeInfos.push({
          path: this.fileToRoute(file),
          component: file,
        });
      }
    }

    return routeInfos.length > 0 ? routeInfos : undefined;
  }

  private async extractJavaRoutes(file: string): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    try {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // 匹配 @GetMapping("/path"), @PostMapping("/path"), @RequestMapping("/path")
      const springPatterns = [
        /@(?:GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g,
      ];

      for (const pattern of springPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          routes.push({
            path: match[1],
            component: file,
          });
        }
      }
    } catch {
      // 忽略读取错误
    }

    // 如果没有从注解中提取到路由，回退到文件路径
    if (routes.length === 0) {
      routes.push({
        path: this.fileToRoute(file),
        component: file,
      });
    }

    return routes;
  }

  private async extractPythonRoutes(file: string): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    try {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // 匹配 @app.route("/path"), @router.get("/path"), @app.get("/path"), @router.post("/path")
      const pythonPatterns = [
        /@(?:app|router|blueprint)\.(?:route|get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g,
      ];

      for (const pattern of pythonPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          routes.push({
            path: match[1],
            component: file,
          });
        }
      }
    } catch {
      // 忽略读取错误
    }

    // 如果没有从装饰器中提取到路由，回退到文件路径
    if (routes.length === 0) {
      routes.push({
        path: this.fileToRoute(file),
        component: file,
      });
    }

    return routes;
  }

  private fileToRoute(file: string): string {
    // 将文件路径转换为路由路径
    const route = file
      .replace(/^pages|^src\/routes?|^src\/router/, '')
      .replace(/\.(ts|tsx|js|jsx)$/, '')
      .replace(/\/index$/, '/')
      .replace(/\[([^\]]+)\]/g, ':$1');

    return route.startsWith('/') ? route : `/${route}`;
  }
}
