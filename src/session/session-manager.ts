// src/session/session-manager.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ensureDir, fileExists, readJson, writeJson } from '../utils/fs-utils.js';

const SESSIONS_DIR = '.dev-flow/sessions';

export interface SessionState {
  id: string;
  requirement: string;
  currentStage: string;
  completedStages: string[];
  stageResults: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'interrupted';
}

export class SessionManager {
  private projectRoot: string;
  private sessionsDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.sessionsDir = path.join(projectRoot, SESSIONS_DIR);
  }

  private getSessionPath(sessionId: string): string {
    return path.join(this.sessionsDir, `${sessionId}.json`);
  }

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `session-${timestamp}-${random}`;
  }

  async create(requirement: string): Promise<SessionState> {
    await ensureDir(this.sessionsDir);

    const now = new Date().toISOString();
    const state: SessionState = {
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

  async save(state: SessionState): Promise<void> {
    state.updatedAt = new Date().toISOString();
    const filePath = this.getSessionPath(state.id);
    await writeJson(filePath, state);
  }

  async load(sessionId: string): Promise<SessionState | null> {
    const filePath = this.getSessionPath(sessionId);

    if (!(await fileExists(filePath))) {
      return null;
    }

    try {
      return await readJson<SessionState>(filePath);
    } catch {
      return null;
    }
  }

  async listResumable(): Promise<SessionState[]> {
    await this.ensureSessionsDir();

    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessions: SessionState[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.sessionsDir, file);
          const state = await readJson<SessionState>(filePath);

          if (state.status !== 'completed') {
            sessions.push(state);
          }
        } catch {
          // 跳过无法解析的文件
        }
      }

      // 按更新时间降序排列
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return sessions;
    } catch {
      return [];
    }
  }

  async getLatest(): Promise<SessionState | null> {
    const resumable = await this.listResumable();
    return resumable.length > 0 ? resumable[0] : null;
  }

  async saveStageResult(sessionId: string, stage: string, result: any): Promise<void> {
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

  async complete(sessionId: string): Promise<void> {
    const state = await this.load(sessionId);

    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    state.status = 'completed';
    await this.save(state);
  }

  async delete(sessionId: string): Promise<void> {
    const filePath = this.getSessionPath(sessionId);

    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }
  }

  private async ensureSessionsDir(): Promise<void> {
    if (!(await fileExists(this.sessionsDir))) {
      await ensureDir(this.sessionsDir);
    }
  }
}
