// src/memory/db-store.ts
import * as path from 'node:path';
import Database from 'better-sqlite3';
import type { VectorEntry, SearchResult } from './types.js';

const DB_PATH = '.dev-flow/db/memory.db';

export class DbStore {
  private db: Database.Database;
  private dbPath: string;

  constructor(projectRoot: string) {
    this.dbPath = path.join(projectRoot, DB_PATH);
    this.db = new Database(this.dbPath);
    this.initialize();
  }

  private initialize(): void {
    // 创建向量表（简化版，实际可使用sqlite-vss扩展）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding BLOB,
        type TEXT,
        path TEXT,
        name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建反馈记录表
    this.db.exec(`
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

    // 创建会话记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        metadata TEXT
      );
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_vectors_type ON vectors(type);
      CREATE INDEX IF NOT EXISTS idx_vectors_name ON vectors(name);
    `);
  }

  // 向量操作
  insertVector(entry: VectorEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vectors (id, content, embedding, type, path, name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const embeddingBuffer = Buffer.from(new Float32Array(entry.embedding).buffer);

    stmt.run(
      entry.id,
      entry.content,
      embeddingBuffer,
      entry.metadata.type,
      entry.metadata.path || null,
      entry.metadata.name || null
    );
  }

  getVector(id: string): VectorEntry | null {
    const stmt = this.db.prepare('SELECT * FROM vectors WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    const embedding = Array.from(new Float32Array(row.embedding.buffer));

    return {
      id: row.id,
      content: row.content,
      embedding,
      metadata: {
        type: row.type,
        path: row.path || undefined,
        name: row.name || undefined,
      },
    };
  }

  searchVectors(queryEmbedding: number[], limit = 10): SearchResult[] {
    // 简化版：使用余弦相似度
    const stmt = this.db.prepare('SELECT * FROM vectors');
    const rows = stmt.all() as any[];

    const results: SearchResult[] = rows.map((row) => {
      const embedding = Array.from(new Float32Array(row.embedding.buffer));
      const score = this.cosineSimilarity(queryEmbedding, embedding);

      return {
        entry: {
          id: row.id,
          content: row.content,
          embedding,
          metadata: {
            type: row.type,
            path: row.path || undefined,
            name: row.name || undefined,
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
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  deleteVector(id: string): void {
    const stmt = this.db.prepare('DELETE FROM vectors WHERE id = ?');
    stmt.run(id);
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
    const stmt = this.db.prepare(`
      INSERT INTO feedback (id, timestamp, stage, task, user_action, original_output, user_correction, learned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      feedback.id,
      feedback.timestamp,
      feedback.stage,
      feedback.task,
      feedback.userAction,
      feedback.originalOutput || null,
      feedback.userCorrection || null,
      feedback.learned || null
    );
  }

  getFeedback(limit = 100): any[] {
    const stmt = this.db.prepare('SELECT * FROM feedback ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  }

  // 会话操作
  createSession(id: string, metadata?: Record<string, unknown>): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, created_at, status, metadata)
      VALUES (?, ?, 'active', ?)
    `);

    stmt.run(id, new Date().toISOString(), metadata ? JSON.stringify(metadata) : null);
  }

  updateSessionStatus(id: string, status: string): void {
    const stmt = this.db.prepare('UPDATE sessions SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  close(): void {
    this.db.close();
  }
}
