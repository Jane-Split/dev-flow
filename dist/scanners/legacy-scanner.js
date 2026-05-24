/**
 * 老旧技术栈扫描器 - 识别项目中的老旧技术栈、代码复杂度和技术债务
 *
 * 能力:
 * - 识别老旧技术栈 (jQuery, AngularJS, PHP 5.x, Java 6/7, Python 2.x, Backbone.js, Knockout.js)
 * - 分析代码复杂度和热点文件
 * - 识别技术债务和安全风险
 * - 生成迁移路径建议
 */
import path from 'node:path';
import { glob } from 'glob';
import { readText, fileExists } from '../utils/fs-utils.js';
const TECH_PATTERNS = {
    jquery: {
        files: ['jquery*.js', 'jquery*.min.js'],
        imports: ['$', 'jQuery', 'jquery'],
        packageDeps: ['jquery'],
        codePatterns: [
            /\$\(/, /\$\.ajax/, /\$\.get/, /\$\.post/,
            /\$\.fn\./, /\$\.extend/, /\$\.each/,
        ],
        label: 'jQuery',
        migrationTargets: ['React', 'Vue'],
    },
    angularjs: {
        files: ['angular.js', 'angular.min.js'],
        imports: ['angular.module', 'angular.controller', 'angular.service', 'angular.directive'],
        packageDeps: ['angular'],
        codePatterns: [
            /angular\.module\(/, /ng-app/, /ng-controller/, /ng-repeat/,
            /\$scope\./, /\$http\./, /\$routeProvider/,
        ],
        label: 'AngularJS 1.x',
        migrationTargets: ['Angular 17+'],
    },
    'php-legacy': {
        files: ['*.php'],
        codePatterns: [
            /mysql_query\(/, /mysql_connect\(/, /mysql_fetch/,
            /ereg\(/, /eregi\(/, /split\(/,
            /\$\_GET/, /\$\_POST/, /\$\_REQUEST/,
            /<\?php/, /mysql_real_escape_string/,
        ],
        label: 'PHP 5.x (Legacy)',
        migrationTargets: ['PHP 8.x', 'Node.js'],
    },
    'java-legacy': {
        files: ['*.java'],
        codePatterns: [
            /javax\.servlet/, /java\.util\.Date/, /new Vector</,
            /new Hashtable</, /StringBuffer/, /Enumeration/,
            /com\.sun\./, /org\.apache\.commons\.lang\./,
        ],
        label: 'Java 6/7 (Legacy)',
        migrationTargets: ['Java 17+', 'Spring Boot'],
    },
    'python-legacy': {
        files: ['*.py'],
        codePatterns: [
            /print\s+[^(]/, /xrange\(/, /raw_input\(/,
            /urlopen\(/, /except\s+\w+\s*,\s*\w+:/,
            /from __future__/, /unicode\(/,
        ],
        label: 'Python 2.x',
        migrationTargets: ['Python 3.x'],
    },
    'ruby-legacy': {
        files: ['*.rb', 'Gemfile'],
        codePatterns: [
            /rails\s+[34]\./, /has_and_belongs_to_many/,
            /before_filter/, /render\s*:text\s*=>/,
        ],
        label: 'Ruby on Rails 3/4',
        migrationTargets: ['Ruby 3.x + Rails 7'],
    },
    backbone: {
        files: ['backbone*.js'],
        imports: ['Backbone.Model', 'Backbone.Collection', 'Backbone.View', 'Backbone.Router'],
        packageDeps: ['backbone'],
        codePatterns: [
            /Backbone\.Model\.extend/, /Backbone\.View\.extend/,
            /Backbone\.Collection\.extend/, /Backbone\.Router\.extend/,
        ],
        label: 'Backbone.js',
        migrationTargets: ['React', 'Vue'],
    },
    knockout: {
        files: ['knockout*.js'],
        imports: ['ko.observable', 'ko.computed', 'ko.applyBindings'],
        packageDeps: ['knockout'],
        codePatterns: [
            /ko\.observable/, /ko\.computed/, /ko\.observableArray/,
            /data-bind="/, /ko\.applyBindings/,
        ],
        label: 'Knockout.js',
        migrationTargets: ['React', 'Vue'],
    },
    'gulp-grunt': {
        files: ['gulpfile.js', 'Gruntfile.js'],
        packageDeps: ['gulp', 'grunt'],
        label: 'Gulp/Grunt',
        migrationTargets: ['Webpack', 'Vite', 'esbuild'],
    },
    'ie-compat': {
        codePatterns: [
            /document\.documentMode/, /msie|trident/i,
            /attachEvent\(/, /detachEvent\(/,
            /window\.ActiveXObject/, /XDomainRequest/,
        ],
        label: 'IE 兼容代码',
        migrationTargets: ['移除 IE 支持', 'Polyfill'],
    },
};
// ─── 安全风险模式 ─────────────────────────────────────────
const SECURITY_PATTERNS = [
    { pattern: /eval\s*\(/, description: '使用 eval() 存在代码注入风险', severity: 'critical' },
    { pattern: /innerHTML\s*=/, description: '直接设置 innerHTML 存在 XSS 风险', severity: 'high' },
    { pattern: /document\.write\s*\(/, description: 'document.write() 存在安全风险', severity: 'high' },
    { pattern: /mysql_query\(/, description: 'mysql_query() 存在 SQL 注入风险', severity: 'critical' },
    { pattern: /\$_GET\[|_\$_POST\[|_\$_REQUEST\[/, description: '直接使用超全局变量未过滤', severity: 'high' },
    { pattern: /password\s*=\s*['"][^'"]+['"]/, description: '密码硬编码在源码中', severity: 'critical' },
    { pattern: /http:\/\//, description: '使用不安全的 HTTP 协议', severity: 'medium' },
];
// ─── LegacyScanner ─────────────────────────────────────────
export class LegacyScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    /**
     * 执行完整的老旧项目扫描
     */
    async scan() {
        const techStacks = await this.identifyTechStacks();
        const complexity = await this.analyzeComplexity();
        const techDebts = await this.identifyTechDebts(techStacks);
        const migrationPaths = this.generateMigrationPaths(techStacks);
        const legacyScore = this.calculateLegacyScore(techStacks, techDebts);
        const isLegacy = legacyScore >= 20;
        const summary = this.generateSummary(techStacks, legacyScore);
        const recommendations = this.generateRecommendations(techStacks, techDebts);
        return {
            isLegacy,
            legacyScore,
            techStacks,
            complexity,
            techDebts,
            migrationPaths,
            summary,
            recommendations,
        };
    }
    /**
     * 识别老旧技术栈
     */
    async identifyTechStacks() {
        const results = [];
        // 1. 检查 package.json 依赖
        const pkgDeps = await this.readPackageDeps();
        // 2. 检查文件内容
        const sourceFiles = await this.findSourceFiles();
        for (const [type, pattern] of Object.entries(TECH_PATTERNS)) {
            const files = [];
            const dependencies = [];
            let confidence = 0;
            let version = '';
            // 检查 package.json 依赖
            if (pattern.packageDeps) {
                for (const dep of pattern.packageDeps) {
                    if (pkgDeps[dep]) {
                        dependencies.push(dep);
                        version = pkgDeps[dep];
                        confidence += 40;
                    }
                }
            }
            // 检查文件名匹配
            if (pattern.files) {
                for (const filePattern of pattern.files) {
                    const matches = await glob(filePattern, {
                        cwd: this.projectRoot,
                        ignore: ['node_modules/**', 'dist/**', 'vendor/**'],
                    });
                    files.push(...matches);
                    if (matches.length > 0)
                        confidence += 30;
                }
            }
            // 检查源文件内容
            if (pattern.codePatterns) {
                for (const file of sourceFiles) {
                    try {
                        const content = await readText(path.join(this.projectRoot, file));
                        for (const codePattern of pattern.codePatterns) {
                            if (codePattern.test(content)) {
                                confidence += 30;
                                if (!files.includes(file)) {
                                    files.push(file);
                                }
                                break; // 每个文件只计一次
                            }
                        }
                    }
                    catch {
                        // 跳过无法读取的文件
                    }
                }
            }
            // 尝试提取版本号
            if (pattern.versionPatterns && files.length > 0) {
                for (const file of files.slice(0, 3)) {
                    try {
                        const content = await readText(path.join(this.projectRoot, file));
                        for (const vp of pattern.versionPatterns) {
                            const match = content.match(vp);
                            if (match?.[1]) {
                                version = match[1];
                                break;
                            }
                        }
                    }
                    catch {
                        // 跳过
                    }
                }
            }
            // 置信度上限 100
            confidence = Math.min(confidence, 100);
            if (confidence >= 20) {
                results.push({
                    type,
                    label: pattern.label,
                    version: version || '未知',
                    confidence,
                    files: [...new Set(files)],
                    dependencies,
                    migrationTargets: pattern.migrationTargets,
                });
            }
        }
        return results.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * 分析代码复杂度
     */
    async analyzeComplexity() {
        const sourceFiles = await this.findSourceFiles();
        const hotspots = [];
        let totalComplexity = 0;
        let fileCount = 0;
        for (const file of sourceFiles) {
            try {
                const content = await readText(path.join(this.projectRoot, file));
                const lines = content.split('\n').length;
                const complexity = this.calculateCyclomaticComplexity(content);
                totalComplexity += complexity;
                fileCount++;
                if (complexity > 7) {
                    hotspots.push({
                        file,
                        complexity,
                        lines,
                        risk: complexity > 30 ? 'high' : 'medium',
                    });
                }
            }
            catch {
                // 跳过无法读取的文件
            }
        }
        hotspots.sort((a, b) => b.complexity - a.complexity);
        return {
            average: fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0,
            hotspots: hotspots.slice(0, 20), // 最多返回 20 个热点
        };
    }
    /**
     * 计算圈复杂度（简化版）
     */
    calculateCyclomaticComplexity(code) {
        let complexity = 1;
        const patterns = [
            /\bif\b/g, /\belse\s+if\b/g, /\bfor\b/g, /\bwhile\b/g,
            /\bcase\b/g, /\bcatch\b/g, /\&\&/g, /\|\|/g,
            /\?\?/g, /\?[^.?]/g,
        ];
        for (const pattern of patterns) {
            const matches = code.match(pattern);
            if (matches)
                complexity += matches.length;
        }
        return complexity;
    }
    /**
     * 识别技术债务
     */
    async identifyTechDebts(techStacks) {
        const debts = [];
        let debtId = 1;
        // 1. 基于已识别的技术栈生成债务
        for (const tech of techStacks) {
            debts.push({
                id: `debt-${debtId++}`,
                type: 'compatibility',
                severity: tech.confidence >= 70 ? 'high' : 'medium',
                files: tech.files.slice(0, 5),
                description: `使用老旧技术栈 ${tech.label} ${tech.version !== '未知' ? `(${tech.version})` : ''}`,
                suggestion: `建议迁移到: ${tech.migrationTargets.join(' 或 ')}`,
                effort: 'high',
            });
        }
        // 2. 扫描安全风险
        const sourceFiles = await this.findSourceFiles();
        for (const file of sourceFiles) {
            try {
                const content = await readText(path.join(this.projectRoot, file));
                for (const { pattern, description, severity } of SECURITY_PATTERNS) {
                    if (pattern.test(content)) {
                        debts.push({
                            id: `debt-${debtId++}`,
                            type: 'security',
                            severity,
                            files: [file],
                            description,
                            suggestion: this.getSecurityFixSuggestion(description),
                            effort: severity === 'critical' ? 'high' : 'medium',
                        });
                    }
                }
            }
            catch {
                // 跳过
            }
        }
        // 3. 检查测试覆盖
        const testFiles = await glob('**/*.test.{ts,tsx,js,jsx,py,java,php}', {
            cwd: this.projectRoot,
            ignore: ['node_modules/**', 'dist/**', 'vendor/**'],
        });
        const testDirs = await glob('**/{test,tests,__tests__,spec}/**', {
            cwd: this.projectRoot,
            ignore: ['node_modules/**', 'dist/**', 'vendor/**'],
        });
        if (testFiles.length === 0 && testDirs.length === 0) {
            debts.push({
                id: `debt-${debtId++}`,
                type: 'maintainability',
                severity: 'high',
                files: [],
                description: '项目缺少测试文件，测试覆盖率可能为 0%',
                suggestion: '建议为核心功能添加单元测试，目标覆盖率 > 60%',
                effort: 'high',
            });
        }
        // 4. 检查文档
        const readmeExists = await fileExists(path.join(this.projectRoot, 'README.md'));
        if (!readmeExists) {
            debts.push({
                id: `debt-${debtId++}`,
                type: 'maintainability',
                severity: 'medium',
                files: [],
                description: '项目缺少 README.md 文档',
                suggestion: '建议添加 README.md，包含项目介绍、安装步骤和使用说明',
                effort: 'low',
            });
        }
        return debts.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }
    /**
     * 生成迁移路径
     */
    generateMigrationPaths(techStacks) {
        const paths = [];
        for (const tech of techStacks) {
            for (const target of tech.migrationTargets) {
                paths.push({
                    from: tech.label,
                    to: target,
                    difficulty: tech.confidence >= 70 ? 'hard' : 'medium',
                    estimatedEffort: this.estimateEffort(tech, target),
                    steps: this.getMigrationSteps(tech.type, target),
                    risks: this.getMigrationRisks(tech.type),
                });
            }
        }
        return paths;
    }
    // ─── 辅助方法 ─────────────────────────────────────────
    async findSourceFiles() {
        const patterns = [
            '**/*.{ts,tsx,js,jsx,vue,php,java,py,rb,html,htm}',
        ];
        const files = [];
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: this.projectRoot,
                ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**', '.git/**', 'coverage/**'],
            });
            files.push(...matches);
        }
        return [...new Set(files)];
    }
    async readPackageDeps() {
        const pkgPath = path.join(this.projectRoot, 'package.json');
        try {
            const content = await readText(pkgPath);
            const pkg = JSON.parse(content);
            return {
                ...(pkg.dependencies || {}),
                ...(pkg.devDependencies || {}),
            };
        }
        catch {
            return {};
        }
    }
    calculateLegacyScore(techStacks, techDebts) {
        let score = 0;
        // 技术栈贡献 (最多 70 分) - 识别到老旧技术栈是强信号
        for (const tech of techStacks) {
            score += Math.round(tech.confidence * 0.7);
        }
        score = Math.min(score, 70);
        // 技术债务贡献 (最多 30 分)
        const criticalDebts = techDebts.filter(d => d.severity === 'critical').length;
        const highDebts = techDebts.filter(d => d.severity === 'high').length;
        const mediumDebts = techDebts.filter(d => d.severity === 'medium').length;
        score += Math.min(criticalDebts * 10, 15);
        score += Math.min(highDebts * 5, 10);
        score += Math.min(mediumDebts * 1, 5);
        return Math.min(score, 100);
    }
    generateSummary(techStacks, legacyScore) {
        if (techStacks.length === 0) {
            return '未检测到明显的老旧技术栈，项目技术栈相对现代。';
        }
        const topTechs = techStacks.slice(0, 3).map(t => `${t.label}(${t.version})`).join('、');
        const level = legacyScore >= 70 ? '严重老旧' : legacyScore >= 40 ? '部分老旧' : '轻微老旧';
        return `项目技术栈${level}，检测到: ${topTechs}。老旧评分: ${legacyScore}/100。`;
    }
    generateRecommendations(techStacks, techDebts) {
        const recs = [];
        // 安全问题优先
        const criticalDebts = techDebts.filter(d => d.severity === 'critical');
        if (criticalDebts.length > 0) {
            recs.push(`🔴 发现 ${criticalDebts.length} 个严重安全问题，建议立即修复`);
        }
        // 技术栈迁移建议
        if (techStacks.length > 0) {
            const topTech = techStacks[0];
            recs.push(`🟡 建议优先迁移 ${topTech.label} → ${topTech.migrationTargets[0]}`);
        }
        // 测试建议
        const noTestDebt = techDebts.find(d => d.description.includes('缺少测试'));
        if (noTestDebt) {
            recs.push('🟡 建议先建立测试保障，再进行重构和迁移');
        }
        // 渐进式迁移建议
        if (techStacks.length > 1) {
            recs.push('🟢 建议采用绞杀者模式，按模块逐步迁移');
        }
        return recs;
    }
    getSecurityFixSuggestion(description) {
        if (description.includes('eval'))
            return '使用 JSON.parse() 或其他安全替代方案';
        if (description.includes('innerHTML'))
            return '使用 textContent 或 DOMPurify 进行消毒';
        if (description.includes('document.write'))
            return '使用 DOM API 创建元素';
        if (description.includes('mysql_query'))
            return '使用 PDO 或 MySQLi 预处理语句';
        if (description.includes('超全局变量'))
            return '使用 filter_input() 或框架的请求对象';
        if (description.includes('密码硬编码'))
            return '使用环境变量或密钥管理服务';
        if (description.includes('HTTP'))
            return '升级到 HTTPS，使用相对协议或 CSP';
        return '请评估并修复此安全问题';
    }
    estimateEffort(tech, target) {
        const base = tech.confidence >= 70 ? '3-6 个月' : '1-3 个月';
        if (target === 'React' || target === 'Vue')
            return base;
        if (target === 'Angular 17+')
            return '3-6 个月';
        if (target === 'Node.js')
            return '2-4 个月';
        if (target === 'Java 17+')
            return '1-2 个月';
        return base;
    }
    getMigrationSteps(from, to) {
        const commonSteps = [
            '1. 建立测试保障（目标覆盖率 > 60%）',
            '2. 搭建新技术栈基础设施',
            '3. 选择低风险模块进行试点迁移',
            '4. 逐步迁移核心模块',
            '5. 全量测试和性能验证',
            '6. 清理旧代码和依赖',
        ];
        switch (from) {
            case 'jquery':
                return [
                    ...commonSteps,
                    '7. 将 jQuery 选择器替换为框架组件',
                    '8. 将 $.ajax 替换为 fetch/axios',
                    '9. 将 DOM 操作替换为声明式渲染',
                ];
            case 'angularjs':
                return [
                    ...commonSteps,
                    '7. 使用 ngUpgrade 建立混合应用',
                    '8. 逐步将 $scope 迁移为组件状态',
                    '9. 将 $http 替换为 HttpClientModule',
                ];
            default:
                return commonSteps;
        }
    }
    getMigrationRisks(from) {
        const common = ['功能回归', '性能下降', '团队学习成本'];
        switch (from) {
            case 'jquery':
                return [...common, 'DOM 操作逻辑复杂', '事件绑定迁移遗漏'];
            case 'angularjs':
                return [...common, '依赖注入迁移复杂', '双向绑定行为差异'];
            case 'php-legacy':
                return [...common, '数据库连接变更', '会话管理差异'];
            default:
                return common;
        }
    }
}
//# sourceMappingURL=legacy-scanner.js.map