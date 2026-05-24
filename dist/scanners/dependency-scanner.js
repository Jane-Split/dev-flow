import path from 'node:path';
import { fileExists, readJson, readText } from '../utils/fs-utils.js';
export class DependencyScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scan() {
        const pkgJson = await this.readPackageJson();
        const techStack = await this.detectTechStack(pkgJson);
        const packageManager = await this.detectPackageManager();
        // 从各语言配置文件中提取项目名称和版本
        const { name, version } = await this.detectProjectInfo(pkgJson);
        return {
            name,
            version,
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
    async detectProjectInfo(pkgJson) {
        // Node.js/前端项目
        if (pkgJson.name) {
            return { name: pkgJson.name, version: pkgJson.version || '0.0.0' };
        }
        // Java Maven 项目
        const pomPath = path.join(this.projectRoot, 'pom.xml');
        if (await fileExists(pomPath)) {
            try {
                const pomContent = await readText(pomPath);
                const nameMatch = pomContent.match(/<name>([^<]+)<\/name>/);
                const versionMatch = pomContent.match(/<version>([^<]+)<\/version>/);
                const artifactMatch = pomContent.match(/<artifactId>([^<]+)<\/artifactId>/);
                return {
                    name: nameMatch?.[1] || artifactMatch?.[1] || 'unknown',
                    version: versionMatch?.[1] || '0.0.0',
                };
            }
            catch {
                // XML 解析失败
            }
        }
        // Java Gradle 项目
        const buildGradlePath = path.join(this.projectRoot, 'build.gradle');
        const settingsGradlePath = path.join(this.projectRoot, 'settings.gradle');
        if (await fileExists(buildGradlePath) || await fileExists(settingsGradlePath)) {
            try {
                const gradleContent = await readText(await fileExists(settingsGradlePath) ? settingsGradlePath : buildGradlePath);
                const nameMatch = gradleContent.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
                const versionMatch = gradleContent.match(/version\s*=\s*['"]([^'"]+)['"]/);
                return {
                    name: nameMatch?.[1] || 'unknown',
                    version: versionMatch?.[1] || '0.0.0',
                };
            }
            catch {
                // Gradle 解析失败
            }
        }
        // Python 项目
        const setupPath = path.join(this.projectRoot, 'setup.py');
        const pyprojectPath = path.join(this.projectRoot, 'pyproject.toml');
        if (await fileExists(pyprojectPath)) {
            try {
                const pyprojectContent = await readText(pyprojectPath);
                const nameMatch = pyprojectContent.match(/name\s*=\s*['"]([^'"]+)['"]/);
                const versionMatch = pyprojectContent.match(/version\s*=\s*['"]([^'"]+)['"]/);
                return {
                    name: nameMatch?.[1] || 'unknown',
                    version: versionMatch?.[1] || '0.0.0',
                };
            }
            catch {
                // TOML 解析失败
            }
        }
        if (await fileExists(setupPath)) {
            try {
                const setupContent = await readText(setupPath);
                const nameMatch = setupContent.match(/name\s*=\s*['"]([^'"]+)['"]/);
                const versionMatch = setupContent.match(/version\s*=\s*['"]([^'"]+)['"]/);
                return {
                    name: nameMatch?.[1] || 'unknown',
                    version: versionMatch?.[1] || '0.0.0',
                };
            }
            catch {
                // 解析失败
            }
        }
        // Go 项目
        const goModPath = path.join(this.projectRoot, 'go.mod');
        if (await fileExists(goModPath)) {
            try {
                const goModContent = await readText(goModPath);
                const moduleMatch = goModContent.match(/^module\s+(\S+)/m);
                const parts = (moduleMatch?.[1] || '').split('/');
                return {
                    name: parts[parts.length - 1] || 'unknown',
                    version: '0.0.0',
                };
            }
            catch {
                // 解析失败
            }
        }
        return { name: 'unknown', version: '0.0.0' };
    }
    async detectTechStack(pkgJson) {
        const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
        // 先检测非 JS/TS 项目
        const nonJsStack = await this.detectNonJsTechStack();
        if (nonJsStack)
            return nonJsStack;
        // JS/TS 项目检测
        const techStack = {
            language: 'JavaScript',
            framework: 'Unknown',
        };
        // 检测语言
        if (deps.typescript) {
            techStack.language = 'TypeScript';
        }
        // 检测框架
        if (deps.next) {
            techStack.framework = 'Next.js';
        }
        else if (deps.nuxt) {
            techStack.framework = 'Nuxt';
        }
        else if (deps.react || deps['react-dom']) {
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
        else if (deps.nestjs || deps['@nestjs/core']) {
            techStack.framework = 'NestJS';
        }
        else if (deps.express) {
            techStack.framework = 'Express';
        }
        else if (deps.koa) {
            techStack.framework = 'Koa';
        }
        else if (deps.fastify) {
            techStack.framework = 'Fastify';
        }
        else if (deps.hapi || deps['@hapi/hapi']) {
            techStack.framework = 'Hapi';
        }
        else if (deps.electron) {
            techStack.framework = 'Electron';
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
        if (deps.vitest) {
            techStack.testFramework = 'Vitest';
        }
        else if (deps.jest) {
            techStack.testFramework = 'Jest';
        }
        else if (deps['@playwright/test']) {
            techStack.testFramework = 'Playwright';
        }
        else if (deps.cypress) {
            techStack.testFramework = 'Cypress';
        }
        else if (deps.mocha) {
            techStack.testFramework = 'Mocha';
        }
        // 检测 ORM / 数据库
        if (deps.prisma || deps['@prisma/client']) {
            techStack.orm = 'Prisma';
        }
        else if (deps.typeorm) {
            techStack.orm = 'TypeORM';
        }
        else if (deps.sequelize) {
            techStack.orm = 'Sequelize';
        }
        else if (deps.mongoose) {
            techStack.orm = 'Mongoose';
        }
        else if (deps['@objection/knex'] || deps.knex) {
            techStack.orm = 'Knex';
        }
        return techStack;
    }
    /**
     * 检测非 JS/TS 项目的技术栈（Java, Python, Go 等）
     */
    async detectNonJsTechStack() {
        const root = this.projectRoot;
        // ─── Java 项目检测 ───────────────────────────────
        if (await fileExists(path.join(root, 'pom.xml'))) {
            return this.detectJavaMavenStack();
        }
        if (await fileExists(path.join(root, 'build.gradle')) || await fileExists(path.join(root, 'build.gradle.kts'))) {
            return this.detectJavaGradleStack();
        }
        // ─── Python 项目检测 ──────────────────────────────
        if (await fileExists(path.join(root, 'pyproject.toml')) ||
            await fileExists(path.join(root, 'setup.py')) ||
            await fileExists(path.join(root, 'requirements.txt')) ||
            await fileExists(path.join(root, 'Pipfile'))) {
            return this.detectPythonStack();
        }
        // ─── Go 项目检测 ──────────────────────────────────
        if (await fileExists(path.join(root, 'go.mod'))) {
            return this.detectGoStack();
        }
        // ─── Rust 项目检测 ────────────────────────────────
        if (await fileExists(path.join(root, 'Cargo.toml'))) {
            return { language: 'Rust', framework: 'Unknown' };
        }
        // ─── C# / .NET 项目检测 ───────────────────────────
        if (await fileExists(path.join(root, '*.csproj')) || await fileExists(path.join(root, '*.sln'))) {
            return { language: 'C#', framework: '.NET' };
        }
        return null;
    }
    /**
     * 检测 Java Maven 项目
     */
    async detectJavaMavenStack() {
        const stack = { language: 'Java', framework: 'Unknown' };
        try {
            const pomContent = await readText(path.join(this.projectRoot, 'pom.xml'));
            // 检测 Java 版本
            const javaVersionMatch = pomContent.match(/<java\.version>([^<]+)<\/java\.version>/)
                || pomContent.match(/<maven\.compiler\.(?:source|release)>([^<]+)<\/maven\.compiler\.(?:source|release)>/);
            if (javaVersionMatch) {
                stack.javaVersion = javaVersionMatch[1];
            }
            // 检测 Spring Boot
            if (pomContent.includes('spring-boot-starter')) {
                stack.framework = 'Spring Boot';
                // 检测 Spring Boot 版本
                const bootVersionMatch = pomContent.match(/<spring-boot\.version>([^<]+)<\/spring-boot\.version>/)
                    || pomContent.match(/<parent>[\s\S]*?<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/);
                if (bootVersionMatch) {
                    stack.frameworkVersion = bootVersionMatch[1];
                }
            }
            // 检测 Spring Framework (非 Boot)
            else if (pomContent.includes('spring-core') || pomContent.includes('spring-context')) {
                stack.framework = 'Spring Framework';
            }
            // 检测 Quarkus
            else if (pomContent.includes('quarkus')) {
                stack.framework = 'Quarkus';
            }
            // 检测 Micronaut
            else if (pomContent.includes('micronaut')) {
                stack.framework = 'Micronaut';
            }
            // 检测 Jakarta EE
            else if (pomContent.includes('jakarta.') || pomContent.includes('javax.servlet')) {
                stack.framework = 'Jakarta EE';
            }
            // 检测 ORM
            if (pomContent.includes('spring-data-jpa') || pomContent.includes('hibernate-core')) {
                stack.orm = 'Hibernate/JPA';
            }
            else if (pomContent.includes('mybatis') || pomContent.includes('mybatis-plus')) {
                stack.orm = 'MyBatis';
            }
            // 检测测试框架
            if (pomContent.includes('junit') || pomContent.includes('junit-jupiter')) {
                stack.testFramework = 'JUnit';
            }
            else if (pomContent.includes('testng')) {
                stack.testFramework = 'TestNG';
            }
            // 检测构建工具
            if (pomContent.includes('maven-surefire') || pomContent.includes('maven-failsafe')) {
                stack.buildTool = 'Maven';
            }
        }
        catch {
            // XML 解析失败时使用默认值
        }
        return stack;
    }
    /**
     * 检测 Java Gradle 项目
     */
    async detectJavaGradleStack() {
        const stack = { language: 'Java', framework: 'Unknown' };
        try {
            const gradlePath = await fileExists(path.join(this.projectRoot, 'build.gradle.kts'))
                ? path.join(this.projectRoot, 'build.gradle.kts')
                : path.join(this.projectRoot, 'build.gradle');
            const content = await readText(gradlePath);
            // 检测 Kotlin DSL
            if (gradlePath.endsWith('.kts')) {
                stack.language = 'Kotlin';
            }
            // 检测 Java 版本
            const javaVersionMatch = content.match(/(?:sourceCompatibility|targetCompatibility|java\.sourceCompatibility|jvmTarget)\s*=\s*['"]?(\d+)/);
            if (javaVersionMatch) {
                stack.javaVersion = javaVersionMatch[1];
            }
            // 检测框架
            if (content.includes('spring-boot') || content.includes('org.springframework.boot')) {
                stack.framework = 'Spring Boot';
            }
            else if (content.includes('org.springframework') || content.includes('spring-framework')) {
                stack.framework = 'Spring Framework';
            }
            else if (content.includes('quarkus')) {
                stack.framework = 'Quarkus';
            }
            else if (content.includes('micronaut')) {
                stack.framework = 'Micronaut';
            }
            else if (content.includes('ktor')) {
                stack.framework = 'Ktor';
            }
            // 检测 ORM
            if (content.includes('hibernate') || content.includes('spring-data-jpa')) {
                stack.orm = 'Hibernate/JPA';
            }
            else if (content.includes('mybatis') || content.includes('mybatis-plus')) {
                stack.orm = 'MyBatis';
            }
            else if (content.includes('exposed')) {
                stack.orm = 'JetBrains Exposed';
            }
            // 检测测试框架
            if (content.includes('junit') || content.includes('JUnit')) {
                stack.testFramework = 'JUnit';
            }
            else if (content.includes('kotest')) {
                stack.testFramework = 'Kotest';
            }
            stack.buildTool = 'Gradle';
        }
        catch {
            // 解析失败
        }
        return stack;
    }
    /**
     * 检测 Python 项目
     */
    async detectPythonStack() {
        const stack = { language: 'Python', framework: 'Unknown' };
        const root = this.projectRoot;
        try {
            // 读取依赖文件
            let deps = [];
            const requirementsPath = path.join(root, 'requirements.txt');
            const pyprojectPath = path.join(root, 'pyproject.toml');
            const pipfilePath = path.join(root, 'Pipfile');
            if (await fileExists(requirementsPath)) {
                const content = await readText(requirementsPath);
                deps = content.split('\n')
                    .map(line => line.split(/[=<>~!][=<>~!]/)[0].trim().toLowerCase())
                    .filter(Boolean);
            }
            else if (await fileExists(pipfilePath)) {
                const content = await readText(pipfilePath);
                const installMatch = content.match(/\[packages\]([\s\S]*?)(?:\[|$)/);
                if (installMatch) {
                    deps = installMatch[1].split('\n')
                        .map(line => line.split('=')[0].trim().toLowerCase())
                        .filter(Boolean);
                }
            }
            else if (await fileExists(pyprojectPath)) {
                const content = await readText(pyprojectPath);
                const depsMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
                if (depsMatch) {
                    deps = depsMatch[1]
                        .split('\n')
                        .map(line => line.replace(/['",]/g, '').trim().toLowerCase())
                        .filter(Boolean);
                }
            }
            const depsSet = new Set(deps);
            // 检测 Web 框架
            if (depsSet.has('django') || depsSet.has('django-rest-framework') || depsSet.has('djangorestframework')) {
                stack.framework = 'Django';
                if (depsSet.has('djangorestframework') || depsSet.has('django-rest-framework')) {
                    stack.framework = 'Django REST Framework';
                }
            }
            else if (depsSet.has('flask')) {
                stack.framework = 'Flask';
            }
            else if (depsSet.has('fastapi')) {
                stack.framework = 'FastAPI';
            }
            else if (depsSet.has('starlette')) {
                stack.framework = 'Starlette';
            }
            else if (depsSet.has('tornado')) {
                stack.framework = 'Tornado';
            }
            else if (depsSet.has('sanic')) {
                stack.framework = 'Sanic';
            }
            else if (depsSet.has('aiohttp')) {
                stack.framework = 'aiohttp';
            }
            // 检测 ORM
            if (depsSet.has('sqlalchemy')) {
                stack.orm = 'SQLAlchemy';
            }
            else if (depsSet.has('peewee')) {
                stack.orm = 'Peewee';
            }
            else if (depsSet.has('tortoise-orm') || depsSet.has('tortoise')) {
                stack.orm = 'Tortoise ORM';
            }
            else if (depsSet.has('django') && (depsSet.has('django.db') || true)) {
                // Django 自带 ORM
                if (stack.framework === 'Django' || stack.framework === 'Django REST Framework') {
                    stack.orm = 'Django ORM';
                }
            }
            // 检测测试框架
            if (depsSet.has('pytest')) {
                stack.testFramework = 'pytest';
            }
            else if (depsSet.has('unittest') || depsSet.has('unittest2')) {
                stack.testFramework = 'unittest';
            }
            else if (depsSet.has('nose2') || depsSet.has('nose')) {
                stack.testFramework = 'nose';
            }
            // 检测异步框架
            if (depsSet.has('celery')) {
                stack.taskQueue = 'Celery';
            }
            if (depsSet.has('asyncio') || depsSet.has('uvloop')) {
                stack.asyncFramework = 'asyncio';
            }
            // 检测 Python 版本
            if (await fileExists(pyprojectPath)) {
                const content = await readText(pyprojectPath);
                const versionMatch = content.match(/requires-python\s*=\s*['"]([^'"]+)['"]/);
                if (versionMatch) {
                    stack.pythonVersion = versionMatch[1];
                }
            }
            // 检测包管理器
            if (await fileExists(path.join(root, 'poetry.lock'))) {
                stack.packageManager = 'Poetry';
            }
            else if (await fileExists(path.join(root, 'Pipfile.lock'))) {
                stack.packageManager = 'Pipenv';
            }
            else if (await fileExists(path.join(root, 'uv.lock'))) {
                stack.packageManager = 'uv';
            }
            else if (await fileExists(requirementsPath)) {
                stack.packageManager = 'pip';
            }
        }
        catch {
            // 解析失败
        }
        return stack;
    }
    /**
     * 检测 Go 项目
     */
    async detectGoStack() {
        const stack = { language: 'Go', framework: 'Unknown' };
        try {
            const content = await readText(path.join(this.projectRoot, 'go.mod'));
            const versionMatch = content.match(/^go\s+(\S+)/m);
            if (versionMatch) {
                stack.goVersion = versionMatch[1];
            }
            // 检测框架
            if (content.includes('gin-gonic/gin') || content.includes('gin')) {
                stack.framework = 'Gin';
            }
            else if (content.includes('labstack/echo') || content.includes('echo')) {
                stack.framework = 'Echo';
            }
            else if (content.includes('gorilla/mux')) {
                stack.framework = 'Gorilla Mux';
            }
            else if (content.includes('go-chi/chi')) {
                stack.framework = 'Chi';
            }
            else if (content.includes('gofiber/fiber')) {
                stack.framework = 'Fiber';
            }
            // 检测 ORM
            if (content.includes('gorm.io/gorm') || content.includes('gorm')) {
                stack.orm = 'GORM';
            }
            else if (content.includes('ent') || content.includes('entgo.io/ent')) {
                stack.orm = 'Ent';
            }
            // 检测测试框架
            if (content.includes('testify')) {
                stack.testFramework = 'Testify';
            }
            stack.buildTool = 'Go Modules';
        }
        catch {
            // 解析失败
        }
        return stack;
    }
    async detectPackageManager() {
        const root = this.projectRoot;
        // JS/TS 包管理器
        if (await fileExists(path.join(root, 'pnpm-lock.yaml')))
            return 'pnpm';
        if (await fileExists(path.join(root, 'yarn.lock')))
            return 'yarn';
        if (await fileExists(path.join(root, 'bun.lockb')))
            return 'bun';
        if (await fileExists(path.join(root, 'package-lock.json')))
            return 'npm';
        // Python 包管理器
        if (await fileExists(path.join(root, 'poetry.lock')))
            return 'Poetry';
        if (await fileExists(path.join(root, 'Pipfile.lock')))
            return 'Pipenv';
        if (await fileExists(path.join(root, 'uv.lock')))
            return 'uv';
        if (await fileExists(path.join(root, 'requirements.txt')))
            return 'pip';
        // Java 构建工具
        if (await fileExists(path.join(root, 'pom.xml')))
            return 'Maven';
        if (await fileExists(path.join(root, 'build.gradle')) || await fileExists(path.join(root, 'build.gradle.kts')))
            return 'Gradle';
        // Go
        if (await fileExists(path.join(root, 'go.mod')))
            return 'Go Modules';
        // Rust
        if (await fileExists(path.join(root, 'Cargo.toml')))
            return 'Cargo';
        return 'Unknown';
    }
    async detectBuildTool() {
        const root = this.projectRoot;
        // JS/TS 构建工具
        if (await fileExists(path.join(root, 'vite.config.ts')) ||
            await fileExists(path.join(root, 'vite.config.js'))) {
            return 'Vite';
        }
        if (await fileExists(path.join(root, 'webpack.config.ts')) ||
            await fileExists(path.join(root, 'webpack.config.js'))) {
            return 'Webpack';
        }
        if (await fileExists(path.join(root, 'rollup.config.ts')) ||
            await fileExists(path.join(root, 'rollup.config.js'))) {
            return 'Rollup';
        }
        if (await fileExists(path.join(root, 'tsconfig.json'))) {
            return 'tsc';
        }
        if (await fileExists(path.join(root, 'esbuild.config.js')) ||
            await fileExists(path.join(root, 'esbuild.js'))) {
            return 'esbuild';
        }
        if (await fileExists(path.join(root, 'turbo.json'))) {
            return 'Turbopack';
        }
        // Java 构建工具
        if (await fileExists(path.join(root, 'pom.xml')))
            return 'Maven';
        if (await fileExists(path.join(root, 'build.gradle')) || await fileExists(path.join(root, 'build.gradle.kts')))
            return 'Gradle';
        // Python
        if (await fileExists(path.join(root, 'Makefile')))
            return 'Make';
        return 'Unknown';
    }
}
//# sourceMappingURL=dependency-scanner.js.map