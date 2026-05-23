export class DataDesigner {
    design(features, existingModels) {
        const models = [];
        const validationRules = [];
        const transformations = [];
        for (const feature of features) {
            // 根据功能点推断需要的模型
            const inferredModels = this.inferModels(feature, existingModels);
            models.push(...inferredModels);
            // 生成校验规则
            for (const model of inferredModels) {
                for (const field of model.fields) {
                    const rules = this.generateValidationRules(field);
                    if (rules.length > 0) {
                        validationRules.push({
                            model: model.name,
                            field: field.name,
                            rules,
                        });
                    }
                }
            }
        }
        return { models, validationRules, transformations };
    }
    inferModels(feature, existing) {
        const models = [];
        const lower = feature.name.toLowerCase();
        // 检查是否已存在相关模型
        const existingNames = existing.map(m => m.name.toLowerCase());
        if (lower.includes('用户') || lower.includes('user')) {
            if (!existingNames.includes('user')) {
                models.push({
                    id: 'model-user',
                    name: 'User',
                    fields: [
                        { name: 'id', type: 'string', required: true, description: '用户ID' },
                        { name: 'username', type: 'string', required: true, description: '用户名' },
                        { name: 'password', type: 'string', required: true, description: '密码（加密）' },
                        { name: 'phone', type: 'string', required: false, description: '手机号' },
                        { name: 'avatar', type: 'string', required: false, description: '头像URL' },
                        { name: 'roles', type: 'string[]', required: false, description: '角色列表' },
                        { name: 'createdAt', type: 'Date', required: true, description: '创建时间' },
                    ],
                    description: '用户模型',
                });
            }
        }
        if (lower.includes('登录') || lower.includes('login')) {
            models.push({
                id: 'model-loginparams',
                name: 'LoginParams',
                fields: [
                    { name: 'username', type: 'string', required: true, description: '用户名' },
                    { name: 'password', type: 'string', required: true, description: '密码' },
                ],
                description: '登录参数',
            });
            models.push({
                id: 'model-loginresult',
                name: 'LoginResult',
                fields: [
                    { name: 'token', type: 'string', required: true, description: '访问令牌' },
                    { name: 'refreshToken', type: 'string', required: false, description: '刷新令牌' },
                    { name: 'user', type: 'User', required: true, description: '用户信息' },
                ],
                description: '登录结果',
            });
        }
        return models;
    }
    generateValidationRules(field) {
        const rules = [];
        if (field.required) {
            rules.push('required');
        }
        if (field.type === 'string') {
            if (field.name.toLowerCase().includes('email')) {
                rules.push('email format');
            }
            if (field.name.toLowerCase().includes('phone')) {
                rules.push('phone format: 11 digits');
            }
            if (field.name.toLowerCase().includes('password')) {
                rules.push('min length: 6');
                rules.push('max length: 20');
            }
        }
        return rules;
    }
}
//# sourceMappingURL=data-designer.js.map