# dev-flow 用户级 Codex 配置指南

> 本文件不是自动加载的配置文件，**仅作为操作说明**。
> 实际配置需要用户手动写入 `~/.codex/config.toml`（即用户主目录下的 `.codex/config.toml`）。

## 为什么需要用户级配置？

根据 [Codex 官方文档](https://developers.openai.ac.cn/codex/config-reference)：

> 项目级配置不能覆盖机器本地的提供商、身份验证、**通知、配置文件**或遥测路由键。
> 当以下键出现在项目级 `.codex/config.toml` 中时，Codex 会**忽略**它们：
> - `profile` / `profiles`
> - `openai_base_url` / `chatgpt_base_url`
> - `model_provider` / `model_providers`
> - `notify`
> - `experimental_realtime_ws_base_url`
> - `otel`

dev-flow 的 `profiles`（fast / deep / review / fix）必须放在用户级。

## 操作步骤

### 1. 创建用户级配置目录（如不存在）

**Windows PowerShell**：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex"
```

**Linux / macOS**：

```bash
mkdir -p ~/.codex
```

### 2. 写入配置

**Windows**（用 PowerShell）：

```powershell
@'
# ============================================================
# dev-flow 用户级 Codex 配置
# ============================================================

# --- 默认 profile ---
profile = "deep"

# --- Profiles（dev-flow 场景化模式）---

[profiles.fast]
model = "gpt-5.4-mini"
model_reasoning_effort = "medium"
description = "快速扫描、轻量 subagent 任务"

[profiles.deep]
model = "gpt-5.5"
model_reasoning_effort = "high"
description = "深度开发、设计、分析（dev-flow 默认）"

[profiles.review]
model = "gpt-5.5"
model_reasoning_effort = "high"
approval_policy = "never"
description = "代码审查模式（无人值守）"

[profiles.fix]
model = "gpt-5.4"
model_reasoning_effort = "high"
description = "Bug 修复模式"
'@ | Out-File -Encoding utf8 "$env:USERPROFILE\.codex\config.toml"
```

**Linux / macOS**：

```bash
cat > ~/.codex/config.toml << 'EOF'
# ============================================================
# dev-flow 用户级 Codex 配置
# ============================================================

# --- 默认 profile ---
profile = "deep"

# --- Profiles（dev-flow 场景化模式）---

[profiles.fast]
model = "gpt-5.4-mini"
model_reasoning_effort = "medium"
description = "快速扫描、轻量 subagent 任务"

[profiles.deep]
model = "gpt-5.5"
model_reasoning_effort = "high"
description = "深度开发、设计、分析（dev-flow 默认）"

[profiles.review]
model = "gpt-5.5"
model_reasoning_effort = "high"
approval_policy = "never"
description = "代码审查模式（无人值守）"

[profiles.fix]
model = "gpt-5.4"
model_reasoning_effort = "high"
description = "Bug 修复模式"
EOF
```

### 3. 切换 profile

```bash
# 使用默认 profile（deep）
codex

# 切换到 fast
codex --profile fast

# 切换到 review
codex --profile review
```

### 4. 验证

```bash
codex --ask-for-approval never "List the active profiles."
```

## 当前默认行为

未配置用户级 `~/.codex/config.toml` 时：

- Codex 使用内置默认（无 profile 切换）
- 所有命令使用顶层 `model_reasoning_effort = "high"`
- 不影响项目级 `.codex/config.toml` 加载

## 故障排查

| 问题 | 解决 |
|------|------|
| `codex --profile deep` 报 "profile not found" | 用户级 config.toml 路径错误或未加载；运行 `echo $CODEX_HOME` 或 `echo $env:CODEX_HOME` 检查 |
| 切换 profile 后行为未变 | Codex 启动时缓存配置，需重启 Codex |
| 配置被项目级覆盖 | 确认 `profile` / `profiles` 键未出现在项目级 `.codex/config.toml` 中（已在本项目移除）|
