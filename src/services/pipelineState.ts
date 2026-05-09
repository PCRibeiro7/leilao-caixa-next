import { createAdminClient } from "@/utils/supabase/admin";

export enum PipelineStep {
    IDLE = "idle",
    FETCH = "fetch",
    PARSE = "parse",
    GEOCODE = "geocode",
}

export interface PipelineState {
    currentStep: PipelineStep;
    updatedAt: string;
}

// Slightly longer than the function's internal 14-minute deadline so a
// still-running invocation never loses its lock, but short enough that a
// crashed invocation's lock expires before the next 15-minute cron tick.
const LOCK_TTL_MS = 15 * 60 * 1000;

export async function getPipelineState(): Promise<PipelineState> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("pipeline_state").select("*").eq("id", 1).single();

    if (error || !data) {
        return { currentStep: PipelineStep.IDLE, updatedAt: new Date(0).toISOString() };
    }

    return {
        currentStep: data.current_step as PipelineStep,
        updatedAt: data.updated_at,
    };
}

/**
 * Atomically acquire the pipeline lock using a Postgres function.
 * Returns the current state if the lock was acquired, or null if already locked.
 */
export async function acquirePipelineLock(): Promise<PipelineState | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("acquire_pipeline_lock", {
        lock_duration_ms: LOCK_TTL_MS,
    });

    if (error) {
        console.error("Failed to acquire pipeline lock:", error);
        return null;
    }

    if (!data || data.length === 0) {
        return null; // Lock held by another invocation
    }

    const row = data[0];
    return {
        currentStep: row.current_step as PipelineStep,
        updatedAt: row.updated_at,
    };
}

/**
 * Release the lock and set the next step atomically.
 *
 * `bumpUpdatedAt` controls whether `updated_at` is refreshed. Pass `true`
 * (default) when the invocation did real work — most importantly, when a
 * pipeline cycle completes back to IDLE, so the cooldown timer restarts.
 * Pass `false` when releasing without progress (cooldown, mid-step retry)
 * so the cooldown keeps reflecting the time of the last real completion.
 */
export async function setPipelineState(
    step: PipelineStep,
    { bumpUpdatedAt = true }: { bumpUpdatedAt?: boolean } = {},
): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("release_pipeline_lock", {
        new_step: step,
        update_time: new Date().toISOString(),
        bump_updated_at: bumpUpdatedAt,
    });

    if (error) {
        throw new Error(`Failed to set pipeline state: ${error.message}`);
    }
}
