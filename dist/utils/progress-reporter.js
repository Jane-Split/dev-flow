import * as path from 'node:path';
import { ensureDir, writeText } from './fs-utils.js';
/**
 * 进度报告器 - 跟踪和可视化 dev-flow 执行进度
 *
 * 功能:
 * - 跟踪各阶段执行状态
 * - 跟踪任务执行状态
 * - 渲染为 Markdown 格式的进度报告
 * - 保存进度报告到文件
 * - 计算总体进度百分比
 */
export class ProgressReporter {
    report;
    constructor(sessionId, requirement) {
        this.report = {
            sessionId,
            requirement,
            startTime: new Date().toISOString(),
            currentStage: '',
            stages: [],
            tasks: [],
            overallStatus: 'running',
        };
    }
    /**
     * 更新阶段状态
     *
     * @param name - 阶段名称
     * @param status - 阶段状态
     * @param summary - 阶段摘要
     * @param artifacts - 产出文件列表
     */
    updateStage(name, status, summary, artifacts) {
        const now = new Date().toISOString();
        let stage = this.report.stages.find(s => s.name === name);
        if (!stage) {
            stage = {
                name,
                status: 'pending',
            };
            this.report.stages.push(stage);
        }
        // 更新状态
        stage.status = status;
        // 设置开始时间
        if (status === 'running' && !stage.startTime) {
            stage.startTime = now;
        }
        // 设置结束时间和计算耗时
        if ((status === 'completed' || status === 'failed' || status === 'skipped') &&
            stage.startTime) {
            stage.endTime = now;
            stage.duration = Math.round((new Date(now).getTime() - new Date(stage.startTime).getTime()) / 1000);
        }
        // 更新摘要和产出
        if (summary !== undefined) {
            stage.summary = summary;
        }
        if (artifacts !== undefined) {
            stage.artifacts = artifacts;
        }
        // 更新当前阶段
        if (status === 'running') {
            this.report.currentStage = name;
        }
        // 如果当前阶段失败，更新整体状态
        if (status === 'failed') {
            this.report.overallStatus = 'failed';
        }
        // 检查是否所有阶段都已完成
        this.checkOverallStatus();
    }
    /**
     * 更新任务状态
     *
     * @param id - 任务 ID
     * @param name - 任务名称
     * @param status - 任务状态
     * @param expert - 负责的专家
     * @param level - 任务层级
     * @param files - 产出文件列表
     */
    updateTask(id, name, status, expert, level, files) {
        let task = this.report.tasks.find(t => t.id === id);
        if (!task) {
            task = {
                id,
                name,
                status: 'pending',
            };
            this.report.tasks.push(task);
        }
        task.status = status;
        if (expert !== undefined)
            task.expert = expert;
        if (level !== undefined)
            task.level = level;
        if (files !== undefined)
            task.files = files;
    }
    /**
     * 完成报告
     */
    complete() {
        this.report.endTime = new Date().toISOString();
        this.report.overallStatus = 'failed' === this.report.overallStatus ? 'failed' : 'completed';
    }
    /**
     * 渲染为 Markdown 格式
     */
    render() {
        const lines = [];
        // 标题
        lines.push('# dev-flow 执行进度');
        lines.push('');
        // 需求
        lines.push('## 需求');
        lines.push('');
        lines.push(this.report.requirement);
        lines.push('');
        // 总进度
        const progress = this.getProgress();
        const totalItems = this.report.stages.length;
        const completedItems = this.report.stages.filter(s => s.status === 'completed' || s.status === 'skipped').length;
        const progressBar = this.renderProgressBar(progress);
        lines.push(`## 总进度: ${progressBar} ${progress}% (${completedItems}/${totalItems})`);
        lines.push('');
        // 阶段详情
        lines.push('## 阶段详情');
        lines.push('');
        lines.push('| # | 阶段 | 状态 | 耗时 |');
        lines.push('|---|------|------|------|');
        this.report.stages.forEach((stage, index) => {
            const statusIcon = this.getStageStatusIcon(stage.status);
            const statusText = this.getStageStatusText(stage.status);
            const duration = stage.duration !== undefined ? this.formatDuration(stage.duration) : '-';
            lines.push(`| ${index + 1} | ${stage.name} | ${statusIcon} ${statusText} | ${duration} |`);
        });
        lines.push('');
        // 任务详情
        if (this.report.tasks.length > 0) {
            lines.push('## 任务详情');
            lines.push('');
            lines.push('| ID | 任务 | 状态 | 专家 | 文件 |');
            lines.push('|----|------|------|------|------|');
            for (const task of this.report.tasks) {
                const statusIcon = this.getTaskStatusIcon(task.status);
                const statusText = this.getTaskStatusText(task.status);
                const expert = task.expert || '-';
                const fileCount = task.files ? `${task.files.length} 个文件` : '-';
                lines.push(`| ${task.id} | ${task.name} | ${statusIcon} ${statusText} | ${expert} | ${fileCount} |`);
            }
            lines.push('');
        }
        // 产出文件
        const allArtifacts = this.collectArtifacts();
        if (allArtifacts.length > 0) {
            lines.push('## 产出文件');
            lines.push('');
            for (const artifact of allArtifacts) {
                lines.push(`- ${artifact}`);
            }
            lines.push('');
        }
        // 会话信息
        lines.push('---');
        lines.push('');
        lines.push(`- 会话 ID: ${this.report.sessionId}`);
        lines.push(`- 开始时间: ${this.report.startTime}`);
        if (this.report.endTime) {
            lines.push(`- 结束时间: ${this.report.endTime}`);
        }
        lines.push(`- 整体状态: ${this.report.overallStatus}`);
        return lines.join('\n');
    }
    /**
     * 保存进度报告到文件
     *
     * @param projectRoot - 项目根目录
     * @returns 保存的文件路径
     */
    async save(projectRoot) {
        const content = this.render();
        const filePath = path.join(projectRoot, '.dev-flow', 'sessions', `progress-${this.report.sessionId}.md`);
        await ensureDir(path.dirname(filePath));
        await writeText(filePath, content);
        return filePath;
    }
    /**
     * 获取进度百分比 (0-100)
     */
    getProgress() {
        if (this.report.stages.length === 0)
            return 0;
        const total = this.report.stages.length;
        let completed = 0;
        for (const stage of this.report.stages) {
            switch (stage.status) {
                case 'completed':
                case 'skipped':
                    completed += 1;
                    break;
                case 'running':
                    completed += 0.5;
                    break;
                case 'failed':
                    completed += 0.25;
                    break;
            }
        }
        return Math.round((completed / total) * 100);
    }
    /**
     * 获取当前状态摘要
     */
    getSummary() {
        const progress = this.getProgress();
        const currentStage = this.report.currentStage
            ? `当前阶段: ${this.report.currentStage}`
            : '尚未开始';
        const completedStages = this.report.stages.filter(s => s.status === 'completed' || s.status === 'skipped').length;
        const failedStages = this.report.stages.filter(s => s.status === 'failed').length;
        const parts = [
            `[${this.report.overallStatus.toUpperCase()}]`,
            `进度: ${progress}%`,
            currentStage,
            `阶段: ${completedStages}/${this.report.stages.length} 完成`,
        ];
        if (failedStages > 0) {
            parts.push(`失败: ${failedStages} 个阶段`);
        }
        if (this.report.tasks.length > 0) {
            const completedTasks = this.report.tasks.filter(t => t.status === 'completed').length;
            parts.push(`任务: ${completedTasks}/${this.report.tasks.length} 完成`);
        }
        return parts.join(' | ');
    }
    /**
     * 获取完整的进度报告数据
     */
    getReport() {
        return { ...this.report };
    }
    // ==================== 私有方法 ====================
    /**
     * 渲染进度条
     */
    renderProgressBar(percent) {
        const totalBars = 20;
        const filledBars = Math.round((percent / 100) * totalBars);
        const emptyBars = totalBars - filledBars;
        return '\u2588'.repeat(filledBars) + '\u2591'.repeat(emptyBars);
    }
    /**
     * 获取阶段状态图标
     */
    getStageStatusIcon(status) {
        switch (status) {
            case 'completed': return '\u2705';
            case 'running': return '\U0001f504';
            case 'failed': return '\u274c';
            case 'skipped': return '\u26d4';
            case 'pending': return '\u23f3';
        }
    }
    /**
     * 获取阶段状态文本
     */
    getStageStatusText(status) {
        switch (status) {
            case 'completed': return '完成';
            case 'running': return '执行中';
            case 'failed': return '失败';
            case 'skipped': return '跳过';
            case 'pending': return '等待';
        }
    }
    /**
     * 获取任务状态图标
     */
    getTaskStatusIcon(status) {
        switch (status) {
            case 'completed': return '\u2705';
            case 'running': return '\U0001f504';
            case 'failed': return '\u274c';
            case 'pending': return '\u23f3';
        }
    }
    /**
     * 获取任务状态文本
     */
    getTaskStatusText(status) {
        switch (status) {
            case 'completed': return '完成';
            case 'running': return '执行中';
            case 'failed': return '失败';
            case 'pending': return '等待';
        }
    }
    /**
     * 格式化持续时间（秒转为可读格式）
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    /**
     * 收集所有产出文件
     */
    collectArtifacts() {
        const artifacts = [];
        for (const stage of this.report.stages) {
            if (stage.artifacts) {
                artifacts.push(...stage.artifacts);
            }
        }
        for (const task of this.report.tasks) {
            if (task.files) {
                artifacts.push(...task.files);
            }
        }
        return Array.from(new Set(artifacts));
    }
    /**
     * 检查整体状态
     */
    checkOverallStatus() {
        if (this.report.stages.length === 0)
            return;
        // 如果有失败阶段，整体状态为失败
        if (this.report.stages.some(s => s.status === 'failed')) {
            this.report.overallStatus = 'failed';
            return;
        }
        // 如果所有阶段都已完成或跳过
        const allDone = this.report.stages.every(s => s.status === 'completed' || s.status === 'skipped');
        if (allDone) {
            this.report.overallStatus = 'completed';
            if (!this.report.endTime) {
                this.report.endTime = new Date().toISOString();
            }
        }
    }
}
//# sourceMappingURL=progress-reporter.js.map