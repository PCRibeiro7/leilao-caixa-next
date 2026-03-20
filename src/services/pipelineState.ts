import { downloadTmpFile, uploadTmpFile } from "./tmpStorage";

const PIPELINE_STATE_FILENAME = "pipeline-state.json";

export enum PipelineStep {
    IDLE = "idle",
    CLEANUP = "cleanup",
    FETCH = "fetch",
    PARSE = "parse",
    GEOCODE = "geocode",
}

export interface PipelineState {
    currentStep: PipelineStep;
    updatedAt: string;
}

export async function getPipelineState(): Promise<PipelineState> {
    const content = await downloadTmpFile(PIPELINE_STATE_FILENAME);
    if (!content) {
        return { currentStep: PipelineStep.IDLE, updatedAt: new Date(0).toISOString() };
    }
    try {
        return JSON.parse(content);
    } catch {
        return { currentStep: PipelineStep.IDLE, updatedAt: new Date(0).toISOString() };
    }
}

export async function setPipelineState(step: PipelineStep): Promise<void> {
    const state: PipelineState = {
        currentStep: step,
        updatedAt: new Date().toISOString(),
    };
    await uploadTmpFile(PIPELINE_STATE_FILENAME, JSON.stringify(state));
}
