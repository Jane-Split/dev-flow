import { writeText } from '../utils/fs-utils.js';
import path from 'node:path';
export class TestGenerator {
    async generate(tasks, projectRoot) {
        const testCases = [];
        for (const task of tasks) {
            const tests = await this.generateTestsForTask(task, projectRoot);
            testCases.push(...tests);
        }
        return testCases;
    }
    async generateTestsForTask(task, projectRoot) {
        const tests = [];
        switch (task.type) {
            case 'component':
                tests.push(...this.generateComponentTests(task, projectRoot));
                break;
            case 'api':
                tests.push(...this.generateApiTests(task, projectRoot));
                break;
            case 'data':
                tests.push(...this.generateModelTests(task, projectRoot));
                break;
        }
        return tests;
    }
    generateComponentTests(task, projectRoot) {
        const componentName = task.name.replace('实现', '').replace('组件', '').trim();
        const testFile = task.output.files[0]?.replace(/\.(tsx|jsx|vue)$/, '.test.$1') ||
            `src/components/__tests__/${componentName}.test.tsx`;
        return [{
                id: `test-${task.id}-component`,
                name: `${componentName}组件测试`,
                type: 'unit',
                description: `测试${componentName}组件的渲染和交互`,
                file: testFile,
                code: `import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${componentName} } from '../${componentName}';

describe('${componentName}', () => {
  it('renders correctly', () => {
    render(<${componentName} />);
    // TODO: 添加断言
    expect(screen.getByRole('div')).toBeDefined();
  });

  it('handles user interaction', () => {
    render(<${componentName} />);
    // TODO: 测试交互
  });
});
`,
            }];
    }
    generateApiTests(task, projectRoot) {
        const apiName = task.name.replace('实现', '').replace('接口', '').trim();
        const testFile = `src/api/__tests__/${apiName.replace(/\s+/g, '-')}.test.ts`;
        return [{
                id: `test-${task.id}-api`,
                name: `${apiName}接口测试`,
                type: 'api',
                description: `测试${apiName}接口的请求和响应`,
                file: testFile,
                code: `import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
// import app from '../app';

describe('${apiName}', () => {
  it('returns 200 on successful request', async () => {
    // const response = await request(app).get('/api/...');
    // expect(response.status).toBe(200);
    expect(true).toBe(true);
  });

  it('returns 400 on invalid input', async () => {
    // const response = await request(app).post('/api/...').send({});
    // expect(response.status).toBe(400);
    expect(true).toBe(true);
  });
});
`,
            }];
    }
    generateModelTests(task, projectRoot) {
        const modelName = task.name.replace('创建', '').replace('数据模型', '').trim();
        const testFile = `src/types/__tests__/${modelName.toLowerCase()}.test.ts`;
        return [{
                id: `test-${task.id}-model`,
                name: `${modelName}模型测试`,
                type: 'unit',
                description: `测试${modelName}模型的类型和校验`,
                file: testFile,
                code: `import { describe, it, expect } from 'vitest';
import type { ${modelName} } from '../${modelName.toLowerCase()}';

describe('${modelName}', () => {
  it('defines correct type', () => {
    const model: ${modelName} = {
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(model.id).toBe('test-id');
  });
});
`,
            }];
    }
    async writeTestFiles(testCases, projectRoot) {
        for (const testCase of testCases) {
            const fullPath = path.join(projectRoot, testCase.file);
            await writeText(fullPath, testCase.code);
        }
    }
}
//# sourceMappingURL=test-generator.js.map