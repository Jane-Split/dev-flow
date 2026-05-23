// src/memory/file-store.ts
import * as path from 'node:path';
import * as yaml from 'yaml';
import * as fs from 'node:fs/promises';
import { ensureDir, fileExists, readText, writeText } from '../utils/fs-utils.js';
import type { MemoryKey, MemoryEntry } from './types.js';

const MEMORY_DIR = '.dev-flow/memory';

const FILE_EXTENSIONS: Record<MemoryKey, 'yaml' | 'json' | 'md'> = {
  project: 'yaml',
  structure: 'json',
  architecture: 'md',
  conventions: 'md',
  components: 'json',
  apis: 'json',
  models: 'json',
  utils: 'json',
  hooks: 'json',
  styles: 'json',
  patterns: 'json',
  feedback: 'json',
};

const FILE_NAMES: Record<MemoryKey, string> = {
  project: 'project.yaml',
  structure: 'structure.json',
  architecture: 'architecture.md',
  conventions: 'conventions/coding.md',
  components: 'components/frontend.json',
  apis: 'apis/endpoints.json',
  models: 'apis/models.json',
  utils: 'utils/functions.json',
  hooks: 'utils/hooks.json',
  styles: 'styles/theme.json',
  patterns: 'patterns/learned.json',
  feedback: 'patterns/feedback.json',
};

export class FileStore {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  private getMemoryPath(): string {
    return path.join(this.projectRoot, MEMORY_DIR);
  }

  private getFilePath(key: MemoryKey): string {
    return path.join(this.getMemoryPath(), FILE_NAMES[key]);
  }

  async read<T>(key: MemoryKey): Promise<T | null> {
    const filePath = this.getFilePath(key);

    if (!(await fileExists(filePath))) {
      return null;
    }

    const content = await readText(filePath);
    const ext = FILE_EXTENSIONS[key];

    if (ext === 'yaml') {
      return yaml.parse(content) as T;
    } else if (ext === 'json') {
      return JSON.parse(content) as T;
    } else {
      return content as unknown as T;
    }
  }

  async write<T>(key: MemoryKey, data: T): Promise<void> {
    const filePath = this.getFilePath(key);
    const ext = FILE_EXTENSIONS[key];

    await ensureDir(path.dirname(filePath));

    let content: string;
    if (ext === 'yaml') {
      content = yaml.stringify(data);
    } else if (ext === 'json') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = String(data);
    }

    await writeText(filePath, content);
  }

  async readEntry(key: MemoryKey): Promise<MemoryEntry | null> {
    const data = await this.read<unknown>(key);
    if (data === null) {
      return null;
    }
    return {
      key,
      data,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  }

  async writeEntry(entry: MemoryEntry): Promise<void> {
    await this.write(entry.key, entry.data);
  }

  async exists(key: MemoryKey): Promise<boolean> {
    return fileExists(this.getFilePath(key));
  }

  async delete(key: MemoryKey): Promise<void> {
    const filePath = this.getFilePath(key);
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }
  }

  async listKeys(): Promise<MemoryKey[]> {
    const keys: MemoryKey[] = [];
    for (const key of Object.keys(FILE_NAMES) as MemoryKey[]) {
      if (await this.exists(key)) {
        keys.push(key);
      }
    }
    return keys;
  }
}
