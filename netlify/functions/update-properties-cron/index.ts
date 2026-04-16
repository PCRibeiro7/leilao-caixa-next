import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import geocodeProperties from "@/scripts/steps/geocode-properties";
import {
    acquirePipelineLock,
    setPipelineState,
    PipelineStep,
} from "@/services/pipelineState";
import { HandlerEvent, schedule } from "@netlify/functions";

const GEOCODE_BATCH_SIZE = 5000;
const COOLDOWN_HOURS = 24;

// Runs every 5 minutes; each invocation executes one pipeline step
// to stay within the 30-second Netlify function timeout.
export const handler = schedule("*/5 * * * *", async (event: HandlerEvent) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    // Atomically acquire the lock — if another invocation is already running, bail out.
    const state = await acquirePipelineLock();
    if (!state) {
        console.log("Pipeline is locked by another invocation. Skipping.");
        return { statusCode: 200 };
    }
    console.log(`Current pipeline step: ${state.currentStep}`);

    try {
        switch (state.currentStep) {
            case PipelineStep.IDLE: {
                const hoursSinceUpdate = (Date.now() - new Date(state.updatedAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceUpdate < COOLDOWN_HOURS) {
                    console.log(
                        `Pipeline completed ${hoursSinceUpdate.toFixed(1)}h ago. ` +
                            `Waiting for ${COOLDOWN_HOURS}h cooldown.`,
                    );
                    await setPipelineState(PipelineStep.IDLE);
                    break;
                }
                await setPipelineState(PipelineStep.FETCH);
                console.log("Idle done. Next: fetch");
                break;
            }

            case PipelineStep.FETCH: {
                await fetchRawCsv();
                await setPipelineState(PipelineStep.PARSE);
                console.log("Fetch done. Next: parse");
                break;
            }

            case PipelineStep.PARSE: {
                await parseCsvToProperties();
                await setPipelineState(PipelineStep.GEOCODE);
                console.log("Parse done. Next: geocode");
                break;
            }

            case PipelineStep.GEOCODE: {
                const { remaining } = await geocodeProperties(GEOCODE_BATCH_SIZE);
                if (remaining > 0) {
                    await setPipelineState(PipelineStep.GEOCODE);
                    console.log(`Geocoded batch. ${remaining} properties remaining.`);
                } else {
                    await setPipelineState(PipelineStep.IDLE);
                    console.log("Pipeline completed!");
                }
                break;
            }
        }
    } catch (error) {
        console.error(`Step "${state.currentStep}" failed:`, error);
        // Release the lock without advancing — the same step will be retried.
        await setPipelineState(state.currentStep);
    }

    return { statusCode: 200 };
});
