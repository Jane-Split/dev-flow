import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function readJson(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
}
export async function writeJson(filePath, data, indent = 2) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, indent), 'utf-8');
}
export async function readText(filePath) {
    return fs.readFile(filePath, 'utf-8');
}
export async function writeText(filePath, content) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
}
export async function copyFile(src, dest) {
    await ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
}
export function resolveProjectRoot() {
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        if (fileExistsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return process.cwd();
}
function fileExistsSync(filePath) {
    try {
        fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=fs-utils.js.map