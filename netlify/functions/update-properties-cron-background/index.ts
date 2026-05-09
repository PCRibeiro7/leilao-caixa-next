import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import geocodeProperties from "@/scripts/steps/geocode-properties";
import {
    acquirePipelineLock,
    setPipelineState,
    PipelineStep,
} from "@/services/pipelineState";
import { HandlerEvent, schedule } from "@netlify/functions";

const GEOCODE_BATCH_SIZE = 5000; // Number of properties to geocode per batch. Adjust based on performance testing and API rate limits.
const COOLDOWN_HOURS = 24;
// Background functions have a 15-minute (900s) timeout. Leave a margin so we
// can release the lock cleanly before Netlify kills the invocation.
const DEADLINE_MS = 14 * 60 * 1000; // 14 minutes

// Runs every 15 minutes as a Netlify scheduled background function.
// Background functions (filename suffix `-background`) have a 15-minute
// timeout, allowing each invocation to process many pipeline steps before
// gracefully releasing the lock.
export const handler = schedule("*/15 * * * *", async (event: HandlerEvent) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    // Atomically acquire the lock — if another invocation is already running, bail out.
    const state = await acquirePipelineLock();
    if (!state) {
        console.log("Pipeline is locked by another invocation. Skipping.");
        return { statusCode: 200 };
    }
    console.log(`Current pipeline step: ${state.currentStep}`);

    let deadlineTimer: NodeJS.Timeout | undefined;
    let timedOut = false;
    const deadline = new Promise<"timeout">((resolve) => {
        deadlineTimer = setTimeout(() => {
            timedOut = true;
            resolve("timeout");
        }, DEADLINE_MS);
    });

    // Returns the next step to execute, or null if the pipeline should stop
    // (e.g. cooldown not elapsed). Also performs the work for the current step.
    const runStep = async (current: PipelineStep): Promise<PipelineStep | null> => {
        switch (current) {
            case PipelineStep.IDLE: {
                const hoursSinceUpdate = (Date.now() - new Date(state.updatedAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceUpdate < COOLDOWN_HOURS) {
                    console.log(
                        `Pipeline completed ${hoursSinceUpdate.toFixed(1)}h ago. ` +
                            `Waiting for ${COOLDOWN_HOURS}h cooldown.`,
                    );
                    return null;
                }
                console.log("Idle done. Next: fetch");
                return PipelineStep.FETCH;
            }

            case PipelineStep.FETCH: {
                await fetchRawCsv();
                console.log("Fetch done. Next: parse");
                return PipelineStep.PARSE;
            }

            case PipelineStep.PARSE: {
                await parseCsvToProperties();
                console.log("Parse done. Next: geocode");
                return PipelineStep.GEOCODE;
            }

            case PipelineStep.GEOCODE: {
                const { remaining } = await geocodeProperties(GEOCODE_BATCH_SIZE);
                if (remaining > 0) {
                    console.log(`Geocoded batch. ${remaining} properties remaining.`);
                    return PipelineStep.GEOCODE;
                }
                console.log("Pipeline completed!");
                return PipelineStep.IDLE;
            }
        }
    };

    // Loop through pipeline steps until we either hit the deadline, the
    // pipeline returns to IDLE, or cooldown blocks further work.
    const work = async (): Promise<PipelineStep> => {
        let current = state.currentStep;
        while (!timedOut) {
            const next = await runStep(current);
            if (next === null) {
                // Cooldown — stay on IDLE without bumping updated_at.
                return current;
            }
            current = next;
            // Stop after completing a full cycle back to IDLE so we don't
            // immediately re-enter the cooldown branch.
            if (current === PipelineStep.IDLE) return current;
        }
        return current;
    };

    let finalStep: PipelineStep = state.currentStep;
    try {
        const result = await Promise.race([work(), deadline]);
        if (result === "timeout") {
            console.warn("Approaching timeout — releasing lock at current step.");
            finalStep = state.currentStep;
        } else {
            finalStep = result;
        }
    } catch (error) {
        console.error(`Step "${state.currentStep}" failed:`, error);
        // Release the lock without advancing — the same step will be retried.
        finalStep = state.currentStep;
    } finally {
        clearTimeout(deadlineTimer);
        await setPipelineState(finalStep);
    }

    return { statusCode: 200 };
});
