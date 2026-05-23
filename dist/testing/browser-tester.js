// src/testing/browser-tester.ts
// Playwright 是可选依赖，这里使用类型断言避免类型错误
export class BrowserTester {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async runTest(config) {
        const startTime = Date.now();
        try {
            // 动态导入playwright（可选依赖）
            let playwrightModule;
            try {
                // 使用 require 风格的动态导入避免类型检查
                playwrightModule = await eval("import('playwright')");
            }
            catch {
                return {
                    passed: false,
                    error: 'Playwright未安装，请运行: npm install playwright',
                    duration: Date.now() - startTime,
                };
            }
            const chromium = playwrightModule.chromium;
            if (!chromium) {
                return {
                    passed: false,
                    error: 'Playwright未安装，请运行: npm install playwright',
                    duration: Date.now() - startTime,
                };
            }
            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();
            try {
                // 导航到页面
                await page.goto(config.url);
                // 执行操作
                for (const action of config.actions) {
                    await this.executeAction(page, action);
                }
                // 验证断言
                for (const assertion of config.assertions) {
                    const passed = await this.verifyAssertion(page, assertion);
                    if (!passed) {
                        throw new Error(`断言失败: ${assertion.type}`);
                    }
                }
                // 截图
                const screenshot = await page.screenshot({ encoding: 'base64' });
                await browser.close();
                return {
                    passed: true,
                    screenshot: `data:image/png;base64,${screenshot}`,
                    duration: Date.now() - startTime,
                };
            }
            catch (error) {
                const screenshot = await page.screenshot({ encoding: 'base64' });
                await browser.close();
                return {
                    passed: false,
                    screenshot: `data:image/png;base64,${screenshot}`,
                    error: String(error),
                    duration: Date.now() - startTime,
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                error: `Playwright未安装或启动失败: ${error}`,
                duration: Date.now() - startTime,
            };
        }
    }
    async executeAction(page, action) {
        switch (action.type) {
            case 'click':
                if (action.selector) {
                    await page.click(action.selector);
                }
                break;
            case 'type':
                if (action.selector && action.value) {
                    await page.fill(action.selector, action.value);
                }
                break;
            case 'select':
                if (action.selector && action.value) {
                    await page.selectOption(action.selector, action.value);
                }
                break;
            case 'wait':
                await page.waitForTimeout(action.timeout || 1000);
                break;
            case 'navigate':
                if (action.value) {
                    await page.goto(action.value);
                }
                break;
        }
    }
    async verifyAssertion(page, assertion) {
        switch (assertion.type) {
            case 'visible':
                if (assertion.selector) {
                    return page.isVisible(assertion.selector);
                }
                return false;
            case 'text':
                if (assertion.selector && assertion.expected) {
                    const text = await page.textContent(assertion.selector);
                    return text?.includes(assertion.expected) || false;
                }
                return false;
            case 'url':
                return page.url().includes(assertion.expected || '');
            case 'title':
                const title = await page.title();
                return title.includes(assertion.expected || '');
            default:
                return false;
        }
    }
}
//# sourceMappingURL=browser-tester.js.map