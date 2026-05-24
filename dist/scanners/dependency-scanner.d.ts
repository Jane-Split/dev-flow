import type { ProjectMeta } from '../memory/types.js';
export declare class DependencyScanner {
    private projectRoot;
    constructor(projectRoot: string);
    scan(): Promise<ProjectMeta>;
    private readPackageJson;
    private detectProjectInfo;
    private detectTechStack;
    /**
     * 检测非 JS/TS 项目的技术栈（Java, Python, Go 等）
     */
    private detectNonJsTechStack;
    /**
     * 检测 Java Maven 项目
     */
    private detectJavaMavenStack;
    /**
     * 检测 Java Gradle 项目
     */
    private detectJavaGradleStack;
    /**
     * 检测 Python 项目
     */
    private detectPythonStack;
    /**
     * 检测 Go 项目
     */
    private detectGoStack;
    private detectPackageManager;
    private detectBuildTool;
}
//# sourceMappingURL=dependency-scanner.d.ts.map