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
export declare class SessionManager {
    private projectRoot;
    private sessionsDir;
    constructor(projectRoot: string);
    private getSessionPath;
    private generateId;
    create(requirement: string): Promise<SessionState>;
    save(state: SessionState): Promise<void>;
    load(sessionId: string): Promise<SessionState | null>;
    listResumable(): Promise<SessionState[]>;
    getLatest(): Promise<SessionState | null>;
    saveStageResult(sessionId: string, stage: string, result: any): Promise<void>;
    complete(sessionId: string): Promise<void>;
    delete(sessionId: string): Promise<void>;
    private ensureSessionsDir;
}
//# sourceMappingURL=session-manager.d.ts.map