import path from 'node:path';
import { glob } from 'glob';
import { fileExists, readText } from '../utils/fs-utils.js';
const STYLE_PATTERNS = [
    'src/styles/**/*.{css,scss,less}',
    'src/**/*.{module.css,module.scss,module.less}',
    'tailwind.config.{js,ts}',
    'theme.{js,ts,json}',
];
export class StyleScanner {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async scan() {
        const solution = await this.detectSolution();
        const theme = await this.extractTheme();
        const tokens = await this.extractTokens();
        return {
            solution,
            theme,
            tokens,
        };
    }
    async detectSolution() {
        // 检测 Tailwind
        if (await fileExists(path.join(this.projectRoot, 'tailwind.config.js')) ||
            await fileExists(path.join(this.projectRoot, 'tailwind.config.ts'))) {
            return 'tailwind';
        }
        // 检测 styled-components
        const pkgPath = path.join(this.projectRoot, 'package.json');
        if (await fileExists(pkgPath)) {
            const content = await readText(pkgPath);
            if (content.includes('styled-components')) {
                return 'styled-components';
            }
        }
        // 检测 CSS Modules
        const moduleFiles = await glob('src/**/*.module.css', { cwd: this.projectRoot });
        if (moduleFiles.length > 0) {
            return 'css-modules';
        }
        // 检测 Sass
        const sassFiles = await glob('src/**/*.scss', { cwd: this.projectRoot });
        if (sassFiles.length > 0) {
            return 'sass';
        }
        // 检测 Less
        const lessFiles = await glob('src/**/*.less', { cwd: this.projectRoot });
        if (lessFiles.length > 0) {
            return 'less';
        }
        return 'css-modules';
    }
    async extractTheme() {
        const theme = {};
        // 尝试读取主题配置文件
        const themeFiles = [
            'src/styles/theme.{js,ts,json}',
            'src/theme.{js,ts,json}',
            'theme.{js,ts,json}',
        ];
        for (const pattern of themeFiles) {
            const files = await glob(pattern, { cwd: this.projectRoot });
            if (files.length > 0) {
                try {
                    const content = await readText(path.join(this.projectRoot, files[0]));
                    // 简单提取颜色配置
                    const colorMatch = content.match(/colors?:\s*\{([^}]+)\}/);
                    if (colorMatch) {
                        theme.colors = this.parseColors(colorMatch[1]);
                    }
                }
                catch {
                    // 忽略读取错误
                }
                break;
            }
        }
        return Object.keys(theme).length > 0 ? theme : undefined;
    }
    parseColors(colorBlock) {
        const colors = {};
        const lines = colorBlock.split('\n');
        for (const line of lines) {
            const match = line.match(/(\w+):\s*['"]?([^,'"\s]+)['"]?/);
            if (match) {
                colors[match[1]] = match[2];
            }
        }
        return colors;
    }
    async extractTokens() {
        const tokens = [];
        // 扫描 CSS 变量
        const cssFiles = await glob('src/**/*.{css,scss}', { cwd: this.projectRoot });
        for (const file of cssFiles.slice(0, 10)) { // 限制文件数量
            try {
                const content = await readText(path.join(this.projectRoot, file));
                const varMatches = content.matchAll(/--([\w-]+):\s*([^;]+);/g);
                for (const match of varMatches) {
                    tokens.push({
                        name: `--${match[1]}`,
                        value: match[2].trim(),
                        type: this.inferTokenType(match[1]),
                    });
                }
            }
            catch {
                // 忽略读取错误
            }
        }
        return tokens;
    }
    inferTokenType(name) {
        if (name.includes('color') || name.includes('bg') || name.includes('text')) {
            return 'color';
        }
        if (name.includes('font') || name.includes('size')) {
            return 'font';
        }
        if (name.includes('space') || name.includes('padding') || name.includes('margin')) {
            return 'spacing';
        }
        if (name.includes('shadow')) {
            return 'shadow';
        }
        if (name.includes('radius') || name.includes('round')) {
            return 'radius';
        }
        return 'other';
    }
}
//# sourceMappingURL=style-scanner.js.map