// src/memory/file-store.ts
import * as path from 'node:path';
import * as yaml from 'yaml';
import * as fs from 'node:fs/promises';
import { ensureDir, fileExists, readText, writeText } from '../utils/fs-utils.js';
const MEMORY_DIR = '.dev-flow/memory';
const FILE_EXTENSIONS = {
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
const FILE_NAMES = {
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
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    getMemoryPath() {
        return path.join(this.projectRoot, MEMORY_DIR);
    }
    getFilePath(key) {
        return path.join(this.getMemoryPath(), FILE_NAMES[key]);
    }
    async read(key) {
        const filePath = this.getFilePath(key);
        if (!(await fileExists(filePath))) {
            return null;
        }
        const content = await readText(filePath);
        const ext = FILE_EXTENSIONS[key];
        if (ext === 'yaml') {
            return yaml.parse(content);
        }
        else if (ext === 'json') {
            return JSON.parse(content);
        }
        else {
            return content;
        }
    }
    async write(key, data) {
        const filePath = this.getFilePath(key);
        const ext = FILE_EXTENSIONS[key];
        await ensureDir(path.dirname(filePath));
        let content;
        if (ext === 'yaml') {
            content = yaml.stringify(data);
        }
        else if (ext === 'json') {
            content = JSON.stringify(data, null, 2);
        }
        else {
            content = String(data);
        }
        await writeText(filePath, content);
    }
    async readEntry(key) {
        const data = await this.read(key);
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
    async writeEntry(entry) {
        await this.write(entry.key, entry.data);
    }
    async exists(key) {
        return fileExists(this.getFilePath(key));
    }
    async delete(key) {
        const filePath = this.getFilePath(key);
        if (await fileExists(filePath)) {
            await fs.unlink(filePath);
        }
    }
    async listKeys() {
        const keys = [];
        for (const key of Object.keys(FILE_NAMES)) {
            if (await this.exists(key)) {
                keys.push(key);
            }
        }
        return keys;
    }
}
//# sourceMappingURL=file-store.js.map