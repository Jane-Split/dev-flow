import path from 'node:path';
import { fileExists, readJson } from '../utils/fs-utils.js';
export class DependencyScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scan() {
        const pkgJson = await this.readPackageJson();
        const techStack = this.detectTechStack(pkgJson);
        const packageManager = await this.detectPackageManager();
        return {
            name: pkgJson.name || 'unknown',
            version: pkgJson.version || '0.0.0',
            techStack,
            packageManager,
            framework: techStack.framework,
            buildTool: await this.detectBuildTool(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    async readPackageJson() {
        const pkgPath = path.join(this.projectRoot, 'package.json');
        if (await fileExists(pkgPath)) {
            return readJson(pkgPath);
        }
        return {};
    }
    detectTechStack(pkgJson) {
        const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
        const techStack = {
            language: 'JavaScript',
            framework: 'Unknown',
        };
        // 检测语言
        if (deps.typescript) {
            techStack.language = 'TypeScript';
        }
        // 检测框架
        if (deps.react || deps['react-dom']) {
            techStack.framework = 'React';
        }
        else if (deps.vue) {
            techStack.framework = 'Vue';
        }
        else if (deps.angular || deps['@angular/core']) {
            techStack.framework = 'Angular';
        }
        else if (deps.svelte) {
            techStack.framework = 'Svelte';
        }
        else if (deps.next) {
            techStack.framework = 'Next.js';
        }
        else if (deps.nuxt) {
            techStack.framework = 'Nuxt';
        }
        else if (deps.express) {
            techStack.framework = 'Express';
        }
        else if (deps.nestjs || deps['@nestjs/core']) {
            techStack.framework = 'NestJS';
        }
        // 检测UI库
        if (deps['antd'] || deps['ant-design-vue']) {
            techStack.uiLibrary = 'Ant Design';
        }
        else if (deps['element-plus'] || deps['element-ui']) {
            techStack.uiLibrary = 'Element';
        }
        else if (deps['@mui/material'] || deps['@material-ui/core']) {
            techStack.uiLibrary = 'Material UI';
        }
        else if (deps['@chakra-ui/react']) {
            techStack.uiLibrary = 'Chakra UI';
        }
        // 检测状态管理
        if (deps.redux || deps['@reduxjs/toolkit']) {
            techStack.stateManagement = 'Redux';
        }
        else if (deps.zustand) {
            techStack.stateManagement = 'Zustand';
        }
        else if (deps.pinia) {
            techStack.stateManagement = 'Pinia';
        }
        else if (deps.vuex) {
            techStack.stateManagement = 'Vuex';
        }
        else if (deps.mobx) {
            techStack.stateManagement = 'MobX';
        }
        // 检测CSS方案
        if (deps.tailwindcss) {
            techStack.cssSolution = 'Tailwind CSS';
        }
        else if (deps['styled-components']) {
            techStack.cssSolution = 'Styled Components';
        }
        else if (deps['@emotion/react']) {
            techStack.cssSolution = 'Emotion';
        }
        else if (deps.sass || deps['node-sass']) {
            techStack.cssSolution = 'Sass';
        }
        // 检测测试框架
        if (deps.jest || deps.vitest) {
            techStack.testFramework = deps.vitest ? 'Vitest' : 'Jest';
        }
        else if (deps['@playwright/test']) {
            techStack.testFramework = 'Playwright';
        }
        else if (deps.cypress) {
            techStack.testFramework = 'Cypress';
        }
        return techStack;
    }
    async detectPackageManager() {
        if (await fileExists(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        else if (await fileExists(path.join(this.projectRoot, 'yarn.lock'))) {
            return 'yarn';
        }
        return 'npm';
    }
    async detectBuildTool() {
        if (await fileExists(path.join(this.projectRoot, 'vite.config.ts')) ||
            await fileExists(path.join(this.projectRoot, 'vite.config.js'))) {
            return 'Vite';
        }
        else if (await fileExists(path.join(this.projectRoot, 'webpack.config.ts')) ||
            await fileExists(path.join(this.projectRoot, 'webpack.config.js'))) {
            return 'Webpack';
        }
        else if (await fileExists(path.join(this.projectRoot, 'rollup.config.ts')) ||
            await fileExists(path.join(this.projectRoot, 'rollup.config.js'))) {
            return 'Rollup';
        }
        else if (await fileExists(path.join(this.projectRoot, 'tsconfig.json'))) {
            return 'tsc';
        }
        return 'Unknown';
    }
}
//# sourceMappingURL=dependency-scanner.js.map