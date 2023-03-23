import { string } from "joi";

export interface SP_Params {
    queueNumber: number;
    queueSize: number;
    log: boolean;
    cycleSize: number;
    startDate: string;
}

export enum QueueStatus {
    QUEUED, PROCESSED, FROZEN
}
