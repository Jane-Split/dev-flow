// src/memory/db-store.ts
import * as path from 'node:path';
import * as fs from 'node:fs';
import initSqlJs, { type Database } from 'sql.js';
import type { VectorEntry, SearchResult } from './types.js';

const DB_PATH = '.dev-flow/db/memory.db';

export class DbStore {
  private db!: Database;
  private dbPath: string;

  constructor(projectRoot: string) {
    this.dbPath = path.join(projectRoot, DB_PATH);
    this.openOrCreate().then((db) => {
      this.db = db;
      this.initialize();
    });
  }

  private async openOrCreate(): Promise<Database> {
    const SQL = await initSqlJs();
    const dir = path.dirname(this.dbPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      return new SQL.Database(fileBuffer);
    }

    return new SQL.Database();
  }

  private save(): void {
    if (!this.db) return;
    const data = this.db.export();
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  private initialize(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding TEXT,
        type TEXT,
        path TEXT,
        name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        stage TEXT NOT NULL,
        task TEXT NOT NULL,
        user_action TEXT NOT NULL,
        original_output TEXT,
        user_correction TEXT,
        learned TEXT
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        metadata TEXT
      );
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_vectors_type ON vectors(type);
      CREATE INDEX IF NOT EXISTS idx_vectors_name ON vectors(name);
    `);

    this.save();
  }

  // 向量操作
  insertVector(entry: VectorEntry): void {
    if (!this.db) return;
    this.db.run(
      `INSERT OR REPLACE INTO vectors (id, content, embedding, type, path, name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.content,
        JSON.stringify(entry.embedding),
        entry.metadata.type,
        entry.metadata.path || null,
        entry.metadata.name || null,
      ]
    );
    this.save();
  }

  getVector(id: string): VectorEntry | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM vectors WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();

      return {
        id: row.id as string,
        content: row.content as string,
        embedding: JSON.parse((row.embedding as string) || '[]'),
        metadata: {
          type: row.type as string,
          path: (row.path as string) || undefined,
          name: (row.name as string) || undefined,
        },
      };
    }

    stmt.free();
    return null;
  }

  searchVectors(queryEmbedding: number[], limit = 10): SearchResult[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM vectors');
    const rows: Record<string, unknown>[] = [];

    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    const results: SearchResult[] = rows.map((row) => {
      const embedding = JSON.parse((row.embedding as string) || '[]');
      const score = this.cosineSimilarity(queryEmbedding, embedding);

      return {
        entry: {
          id: row.id as string,
          content: row.content as string,
          embedding,
          metadata: {
            type: row.type as string,
            path: (row.path as string) || undefined,
            name: (row.name as string) || undefined,
          },
        },
        score,
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }

  deleteVector(id: string): void {
    if (!this.db) return;
    this.db.run('DELETE FROM vectors WHERE id = ?', [id]);
    this.save();
  }

  // 反馈操作
  insertFeedback(feedback: {
    id: string;
    timestamp: string;
    stage: string;
    task: string;
    userAction: string;
    originalOutput?: string;
    userCorrection?: string;
    learned?: string;
  }): void {
    if (!this.db) return;
    this.db.run(
      `INSERT INTO feedback (id, timestamp, stage, task, user_action, original_output, user_correction, learned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedback.id,
        feedback.timestamp,
        feedback.stage,
        feedback.task,
        feedback.userAction,
        feedback.originalOutput || null,
        feedback.userCorrection || null,
        feedback.learned || null,
      ]
    );
    this.save();
  }

  getFeedback(limit = 100): any[] {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM feedback ORDER BY timestamp DESC LIMIT ?');
    stmt.bind([limit]);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // 会话操作
  createSession(id: string, metadata?: Record<string, unknown>): void {
    if (!this.db) return;
    this.db.run(
      `INSERT INTO sessions (id, created_at, status, metadata)
       VALUES (?, ?, 'active', ?)`,
      [id, new Date().toISOString(), metadata ? JSON.stringify(metadata) : null]
    );
    this.save();
  }

  updateSessionStatus(id: string, status: string): void {
    if (!this.db) return;
    this.db.run('UPDATE sessions SET status = ? WHERE id = ?', [status, id]);
    this.save();
  }

  close(): void {
    this.save();
    if (this.db) {
      this.db.close();
    }
  }
}
