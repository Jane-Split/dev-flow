export class StyleDesigner {
    design(features, existingStyles) {
        const themeVariables = [];
        const responsive = [];
        const animations = [];
        const componentStyles = [];
        // 基础响应式断点
        responsive.push({ name: 'sm', minWidth: '640px', description: '手机横屏' }, { name: 'md', minWidth: '768px', description: '平板竖屏' }, { name: 'lg', minWidth: '1024px', description: '平板横屏/小屏电脑' }, { name: 'xl', minWidth: '1280px', description: '桌面电脑' }, { name: '2xl', minWidth: '1536px', description: '大屏显示器' });
        // 基础动画
        animations.push({
            name: 'fade-in',
            type: 'keyframe',
            duration: '300ms',
            timing: 'ease-out',
            description: '淡入动画',
        }, {
            name: 'fade-out',
            type: 'keyframe',
            duration: '300ms',
            timing: 'ease-in',
            description: '淡出动画',
        }, {
            name: 'slide-up',
            type: 'keyframe',
            duration: '300ms',
            timing: 'ease-out',
            description: '从下往上滑入',
        }, {
            name: 'default-transition',
            type: 'transition',
            duration: '200ms',
            timing: 'ease',
            description: '默认过渡效果',
        });
        for (const feature of features) {
            const inferredStyles = this.inferStyles(feature, existingStyles);
            themeVariables.push(...inferredStyles.themeVariables);
            componentStyles.push(...inferredStyles.componentStyles);
        }
        return { themeVariables, responsive, animations, componentStyles };
    }
    inferStyles(feature, existingStyles) {
        const themeVariables = [];
        const componentStyles = [];
        const lower = feature.name.toLowerCase();
        if (lower.includes('登录') || lower.includes('login')) {
            // 登录页面主题变量
            themeVariables.push({
                name: '--login-bg',
                value: existingStyles?.theme?.colors?.background || '#f5f5f5',
                usage: '登录页面背景色',
            }, {
                name: '--login-card-bg',
                value: '#ffffff',
                usage: '登录卡片背景色',
            }, {
                name: '--login-card-shadow',
                value: '0 4px 12px rgba(0, 0, 0, 0.1)',
                usage: '登录卡片阴影',
            });
            // 登录表单组件样式
            componentStyles.push({
                component: 'LoginForm',
                styles: [
                    'max-width: 400px',
                    'padding: 24px',
                    'background: var(--login-card-bg)',
                    'border-radius: 8px',
                    'box-shadow: var(--login-card-shadow)',
                ],
                description: '登录表单容器样式',
            }, {
                component: 'LoginInput',
                styles: [
                    'width: 100%',
                    'height: 40px',
                    'padding: 0 12px',
                    'border: 1px solid #d9d9d9',
                    'border-radius: 4px',
                    'transition: all 0.2s',
                ],
                description: '登录输入框样式',
            }, {
                component: 'LoginButton',
                styles: [
                    'width: 100%',
                    'height: 40px',
                    'background: var(--primary-color, #1890ff)',
                    'color: #fff',
                    'border: none',
                    'border-radius: 4px',
                    'cursor: pointer',
                    'transition: background 0.2s',
                ],
                description: '登录按钮样式',
            });
            // 验证码按钮样式
            if (lower.includes('验证码')) {
                componentStyles.push({
                    component: 'CaptchaButton',
                    styles: [
                        'min-width: 120px',
                        'height: 40px',
                        'padding: 0 16px',
                        'background: transparent',
                        'border: 1px solid #d9d9d9',
                        'border-radius: 4px',
                        'cursor: pointer',
                        'transition: all 0.2s',
                        '&:disabled { opacity: 0.5; cursor: not-allowed }',
                    ],
                    description: '验证码发送按钮样式',
                });
            }
        }
        return { themeVariables, componentStyles };
    }
}
//# sourceMappingURL=style-designer.js.map