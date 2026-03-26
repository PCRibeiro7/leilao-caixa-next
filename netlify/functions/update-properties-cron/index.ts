import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import geocodeProperties from "@/scripts/steps/geocode-properties";
import { getPipelineState, setPipelineState, PipelineStep } from "@/services/pipelineState";
import { HandlerEvent, schedule } from "@netlify/functions";

const GEOCODE_BATCH_SIZE = 5000;
const COOLDOWN_HOURS = 6;

// Runs every 5 minutes; each invocation executes one pipeline step
// to stay within the 30-second Netlify function timeout.
export const handler = schedule("*/5 * * * *", async (event: HandlerEvent) => {
    // Pause job until April 2026 — remove this block to resume
    if (new Date() < new Date("2026-04-01")) {
        console.log("Job paused until April 2026");
        return { statusCode: 200 };
    }

    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    const state = await getPipelineState();
    console.log(`Current pipeline step: ${state.currentStep}`);

    try {
        switch (state.currentStep) {
            case PipelineStep.IDLE: {
                const hoursSinceUpdate =
                    (Date.now() - new Date(state.updatedAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceUpdate < COOLDOWN_HOURS) {
                    console.log(
                        `Pipeline completed ${hoursSinceUpdate.toFixed(1)}h ago. ` +
                            `Waiting for ${COOLDOWN_HOURS}h cooldown.`,
                    );
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
        // State is NOT advanced — the same step will be retried on the next invocation.
    }

    return { statusCode: 200 };
});
