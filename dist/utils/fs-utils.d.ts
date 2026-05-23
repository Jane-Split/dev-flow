export declare function ensureDir(dirPath: string): Promise<void>;
export declare function fileExists(filePath: string): Promise<boolean>;
export declare function readJson<T>(filePath: string): Promise<T>;
export declare function writeJson(filePath: string, data: unknown, indent?: number): Promise<void>;
export declare function readText(filePath: string): Promise<string>;
export declare function writeText(filePath: string, content: string): Promise<void>;
export declare function copyFile(src: string, dest: string): Promise<void>;
export declare function resolveProjectRoot(): string;
//# sourceMappingURL=fs-utils.d.ts.map