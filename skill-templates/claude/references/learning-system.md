# dev-flow 学习能力

> 本文档从 Router 中外置，详细描述 dev-flow 的学习机制。
> 读取时机：Research / Develop / Fix 阶段结束后。

dev-flow 具备从用户反馈中学习的能力，通过持续积累项目知识，实现"越用越好用"。

## 学习来源

**1. 用户显式反馈**
- 用户说"这段代码很好，以后都按这个风格"→ 更新 preferences.md
- 用户说"这个错误又出现了"→ 更新 mistakes.md
- 用户修改了 AI 生成的代码 → 分析差异，更新 patterns.md

**2. 隐式学习**
- 观察用户如何修改 AI 生成的代码
- 统计哪些代码模式被复用最多
- 记录哪些错误反复出现

**3. 阶段间学习**
- Test 阶段发现的 Bug → 更新 mistakes.md
- Fix 阶段的修复方案 → 更新 patterns.md
- Develop 阶段的新模式 → 更新 patterns.md

## 学习动作

当发生以下情况时，AI 应主动学习和更新记忆：

| 场景 | 学习动作 | 更新文件 |
|------|----------|----------|
| 用户表扬某段代码 | 记录代码模式，标记为"推荐" | patterns.md |
| 用户修改 AI 生成的代码 | 分析修改原因，更新偏好或模式 | preferences.md / patterns.md |
| 测试发现 Bug | 记录错误模式和修复方案 | mistakes.md |
| 用户明确指定偏好 | 记录偏好设置 | preferences.md |
| 重大架构决策 | 记录决策和原因 | decisions.md |
| 某模式被复用 3 次以上 | 标记为"高频模式" | patterns.md |

## 学习示例

**示例 1：从用户修改中学习**

AI 生成的代码：
```typescript
const handleSubmit = async (data) => {
  await api.createUser(data);
  router.push('/users');
};
```

用户修改为：
```typescript
const handleSubmit = async (data) => {
  try {
    await api.createUser(data);
    toast.success('用户创建成功');
    router.push('/users');
  } catch (error) {
    toast.error(error.message);
  }
};
```

AI 学习：用户偏好添加 toast 提示 → 更新 preferences.md
AI 学习：API 调用需要 try-catch + toast → 更新 patterns.md

**示例 2：从错误中学习**

Test 阶段发现：组件未处理 loading 状态导致测试失败
Fix 阶段修复：添加 loading 状态处理

AI 学习：记录"忘记处理 loading 状态"为常见错误 → 更新 mistakes.md
AI 学习：记录"标准 loading 处理模式" → 更新 patterns.md

## 学习效果评估

通过以下指标评估学习效果：

| 指标 | 目标 | 评估方式 |
|------|------|----------|
| 代码接受率 | > 80% | 用户修改 AI 生成代码的比例降低 |
| Bug 重复率 | < 10% | 同一错误不出现超过 2 次 |
| 模式复用率 | > 60% | 新代码复用已有模式的比例 |
| 用户满意度 | > 4.5/5 | 用户主观评价 |

## 学习提示

在每个阶段结束时，AI 应主动询问用户：

- **Research 后**："调研结果是否符合项目实际情况？有需要补充的吗？"
- **Develop 后**："代码风格是否符合您的预期？有哪些需要调整的地方？"
- **Fix 后**："修复方案是否解决了问题？这个错误以前出现过吗？"

通过持续收集反馈，dev-flow 会越来越了解项目和用户的偏好，生成越来越符合预期的代码。
