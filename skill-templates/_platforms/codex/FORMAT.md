# dev-flow Codex 平台格式适配指南

> 本文件描述 Codex 平台特有的格式规则，供构建系统参考。

## Codex 特有格式

### AGENTS.md 格式

Codex 使用仓库根目录的 `AGENTS.md` 作为入口，格式要求：
- 包裹在 `<!-- dev-flow:start -->` / `<!-- dev-flow:end -->` 标记中
- 不使用 frontmatter（与其他平台的 SKILL.md 不同）
- 代码块使用围栏格式（```）

### Agent 定义格式

Codex 使用 `.toml` + `.md` 双文件格式定义 subagent：
- `.toml` 文件：Agent 元数据（name、description、model、tools）
- `.md` 文件：Agent 的详细指令（Markdown 格式）

### 配置格式

- `config.toml`：Codex 项目级配置
- `approval_policy`：默认 `on-request`
- `sandbox_mode`：默认 `workspace-write`
- `model_reasoning_effort`：默认 `high`

### References 路径

- Codex 的 references 文件位于 `.codex/references/`
- 在构建输出中，`{{REFERENCES_PATH}}` 替换为 `.codex/references/`

### 会话与记忆

- 会话检查点：`.dev-flow/sessions/{session-id}/checkpoint.yaml`
- 长期记忆：`.dev-flow/memory/`（根目录）
- 会话记忆：`.dev-flow/memory/session/`
- 清理命令：`/dev-flow -cleanup`（清理会话记忆）/ `/dev-flow -cleanup --all`（重置全部）

### 不支持的功能

以下功能在 Codex 平台不可用（`TRAE-ONLY` 标记）：
- Trae 专属的实时上下文监控
- Trae 专属的智能提示增强
