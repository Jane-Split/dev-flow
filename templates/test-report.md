# 测试报告: {{feature_name}}

## 测试概览

| 指标 | 数值 |
|------|------|
| 测试用例总数 | {{total}} |
| 通过 | {{passed}} |
| 失败 | {{failed}} |
| 跳过 | {{skipped}} |
| 覆盖率 | {{coverage}}% |

## 单元测试

### 通过
- [x] Test case 1
- [x] Test case 2

### 失败
- [ ] Test case 3
  - 错误: <错误信息>
  - 位置: `file.ts:42`

## API测试

### 通过
- [x] GET /api/users

### 失败
- [ ] POST /api/login
  - 状态码: 500
  - 响应: <响应内容>

## E2E测试

### 通过
- [x] 用户登录流程

### 失败
- [ ] 支付流程
  - 截图: ![screenshot](path)

## Bug列表

| ID | 描述 | 严重程度 | 文件 | 状态 |
|----|------|----------|------|------|
| BUG-1 | 描述 | High | file.ts | 待修复 |

## 修复建议

### BUG-1
**问题**: <描述>
**建议修复**:
```typescript
// 修复代码
```
