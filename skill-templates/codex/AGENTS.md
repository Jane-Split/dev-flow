# dev-flow for Codex

<!-- dev-flow:start -->

当用户要求执行 `dev-flow`、`dev-flow research`、`dev-flow analyze`、`dev-flow design`、`dev-flow develop`、`dev-flow test`、`dev-flow fix` 或类似开发流程时，优先使用仓库级 Codex skill：`$dev-flow`。

## 工作约定

- 先读取 `.dev-flow/memory/` 中已有项目记忆；若缺失或过期，先执行 Research。
- 除 hotfix 或用户明确要求直接修改外，全流程按 Research → Analyze → Design → Develop → Test/Fix 推进，每个阶段完成后暂停并等待用户确认。
- 生成代码前必须读取相关已有实现，保持项目原有架构、命名、风格和测试习惯。
- 复杂任务、多服务任务、大规模扫描或并行开发时，可以显式使用 Codex subagents：`orchestrator`、`research-expert`、`analyze-expert`、`design-expert`、`develop-expert`、`verify-expert`、`smoke-test`、`integration-test`、`delivery`、`dependency-scanner`、`service-scanner`、`structure-analyzer`、`config-analyzer`。
- 阶段性产物写入 `.dev-flow/sessions/`；长期项目知识写入 `.dev-flow/memory/`。
- 不要生成 TODO 占位代码、空壳实现或无效测试。

更多细节见 `.agents/skills/dev-flow/SKILL.md`。

<!-- dev-flow:end -->
