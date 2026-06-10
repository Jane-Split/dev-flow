# 前后端分离架构设计

<!-- last-updated: 2026-06-10 -->
<!-- status: approved -->

## 概述

将 dev-flow 的 Research 扫描和 Develop 开发专家按前后端分离，支持纯前端项目、纯后端项目、全栈项目三种场景。

## 核心变更

### 1. Research 阶段

- pre-scanner 增加 Step P1.5 前后端存在性检测
- 输出 `backend-file-index.yaml` 和/或 `frontend-file-index.yaml` + `project-domains.yaml`
- 后端扫描子代理组：11 个，4 批次（与现有完全一致，零削弱）
- 前端扫描子代理组：9 个，3 批次（新增）
  - Batch 1: frontend-overview, frontend-structure, frontend-architecture
  - Batch 2: components, routes-and-state, frontend-config
  - Batch 3: frontend-apis, frontend-utils, frontend-conventions
- Memory 分目录：`frontend/` + `backend/` + 共享根目录

### 2. Develop 阶段

- `develop-expert` → `backend-develop-expert`（重命名，内容不变）
- 新增 `frontend-develop-expert`（前端专用开发专家）
- 工具集完全一致：Read, Write, Edit, Bash, Grep, Glob

### 3. Task Split 阶段

- 每个任务增加 `domain: frontend | backend` 标签
- domain 判定规则：按文件扩展名和目录自动判断

### 4. 调度策略

- 纯后端项目：仅启动后端扫描组 + backend-develop-expert
- 纯前端项目：仅启动前端扫描组 + frontend-develop-expert
- 全栈项目：两组并行扫描 + 两个 develop-expert 按域路由

## 向后兼容

- 纯后端项目流程与现有完全一致，零削弱
- 现有 develop-expert.md 重命名为 backend-develop-expert.md
- 现有 file-index.yaml 重命名为 backend-file-index.yaml
- 所有现有规则、铁律、验证步骤全部保留
