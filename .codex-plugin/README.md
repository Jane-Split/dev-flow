# .codex-plugin 目录

## 说明

本目录是 dev-flow 的 **Codex Plugin 打包清单**。

## 目录结构

```
.codex-plugin/
├── plugin.json         # Plugin 清单
└── README.md           # 本文件

关联资源（不重复存储, 通过相对路径引用）:
├── .codex/
│   ├── config.toml     # 项目级配置
│   ├── hooks.json      # 生命周期钩子
│   ├── scripts/        # 钩子执行脚本
│   └── agents/         # 30 个 subagent
└── .agents/
    └── skills/
        └── dev-flow/   # Codex 原生 Skill
            ├── SKILL.md
            └── agents/openai.yaml
```

## 安装（用户级）

### 方式 1: 本地 Marketplace（推荐开发）

1. 确认 `.agents/plugins/marketplace.json` 存在
2. 在 Codex 中打开 Plugin 目录
3. 选择本仓库作为本地市场源
4. 启用 dev-flow 插件

### 方式 2: 全局 Marketplace（推荐分发）

将本目录发布到 git 仓库，用户在 `~/.agents/plugins/marketplace.json` 中添加：

```json
{
  "name": "my-marketplaces",
  "plugins": [
    {
      "name": "dev-flow",
      "source": {
        "source": "git",
        "url": "https://github.com/your-org/dev-flow",
        "ref": "v1.0.0"
      }
    }
  ]
}
```

## 验证

```bash
# 1. 完整配置审计
node .codex/scripts/audit-codex-config.cjs

# 2. 验证 Plugin 清单
cat .codex-plugin/plugin.json | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).name)"
```

## 卸载

- 在 Codex 插件目录禁用 dev-flow
- 保留文件无副作用（仅不再加载）
- 完全移除：删除 `.codex-plugin/`、`.codex/`、`.agents/skills/dev-flow/`、项目根 `AGENTS.md` 即可
