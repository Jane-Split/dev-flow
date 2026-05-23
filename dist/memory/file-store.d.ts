import type { MemoryKey, MemoryEntry } from './types.js';
export declare class FileStore {
    private projectRoot;
    constructor(projectRoot: string);
    private getMemoryPath;
    private getFilePath;
    read<T>(key: MemoryKey): Promise<T | null>;
    write<T>(key: MemoryKey, data: T): Promise<void>;
    readEntry(key: MemoryKey): Promise<MemoryEntry | null>;
    writeEntry(entry: MemoryEntry): Promise<void>;
    exists(key: MemoryKey): Promise<boolean>;
    delete(key: MemoryKey): Promise<void>;
    listKeys(): Promise<MemoryKey[]>;
}
//# sourceMappingURL=file-store.d.ts.map