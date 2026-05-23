// src/session/session-manager.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ensureDir, fileExists, readJson, writeJson } from '../utils/fs-utils.js';
const SESSIONS_DIR = '.dev-flow/sessions';
export class SessionManager {
    projectRoot;
    sessionsDir;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.sessionsDir = path.join(projectRoot, SESSIONS_DIR);
    }
    getSessionPath(sessionId) {
        return path.join(this.sessionsDir, `${sessionId}.json`);
    }
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).slice(2, 8);
        return `session-${timestamp}-${random}`;
    }
    async create(requirement) {
        await ensureDir(this.sessionsDir);
        const now = new Date().toISOString();
        const state = {
            id: this.generateId(),
            requirement,
            currentStage: 'init',
            completedStages: [],
            stageResults: {},
            createdAt: now,
            updatedAt: now,
            status: 'active',
        };
        await this.save(state);
        return state;
    }
    async save(state) {
        state.updatedAt = new Date().toISOString();
        const filePath = this.getSessionPath(state.id);
        await writeJson(filePath, state);
    }
    async load(sessionId) {
        const filePath = this.getSessionPath(sessionId);
        if (!(await fileExists(filePath))) {
            return null;
        }
        try {
            return await readJson(filePath);
        }
        catch {
            return null;
        }
    }
    async listResumable() {
        await this.ensureSessionsDir();
        try {
            const files = await fs.readdir(this.sessionsDir);
            const sessions = [];
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                try {
                    const filePath = path.join(this.sessionsDir, file);
                    const state = await readJson(filePath);
                    if (state.status !== 'completed') {
                        sessions.push(state);
                    }
                }
                catch {
                    // 跳过无法解析的文件
                }
            }
            // 按更新时间降序排列
            sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return sessions;
        }
        catch {
            return [];
        }
    }
    async getLatest() {
        const resumable = await this.listResumable();
        return resumable.length > 0 ? resumable[0] : null;
    }
    async saveStageResult(sessionId, stage, result) {
        const state = await this.load(sessionId);
        if (!state) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        state.stageResults[stage] = result;
        if (!state.completedStages.includes(stage)) {
            state.completedStages.push(stage);
        }
        state.currentStage = stage;
        await this.save(state);
    }
    async complete(sessionId) {
        const state = await this.load(sessionId);
        if (!state) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        state.status = 'completed';
        await this.save(state);
    }
    async delete(sessionId) {
        const filePath = this.getSessionPath(sessionId);
        if (await fileExists(filePath)) {
            await fs.unlink(filePath);
        }
    }
    async ensureSessionsDir() {
        if (!(await fileExists(this.sessionsDir))) {
            await ensureDir(this.sessionsDir);
        }
    }
}
//# sourceMappingURL=session-manager.js.map