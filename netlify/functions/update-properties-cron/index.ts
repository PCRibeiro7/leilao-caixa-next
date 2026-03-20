import cleanupProperties from "@/scripts/functions/steps/cleanup-properties";
import fetchRawPropertiesLocal from "@/scripts/functions/steps/fetch-raw-properties-local";
import fetchRawPropertiesScrapeDo from "@/scripts/functions/steps/fetch-raw-properties-scrape-do";
import parseProperties from "@/scripts/functions/steps/parse-properties";
import fetchGeocodeData from "@/scripts/functions/steps/fetch-geocode-data";
import { getPipelineState, setPipelineState, PipelineStep } from "@/services/pipelineState";
import { HandlerEvent, schedule } from "@netlify/functions";

const GEOCODE_BATCH_SIZE = 2;
const COOLDOWN_HOURS = 23;

// Runs every 5 minutes; each invocation executes one pipeline step
// to stay within the 10-second Netlify function timeout.
export const handler = schedule("*/5 * * * *", async (event: HandlerEvent) => {
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
                console.log("Starting pipeline: cleanup");
                await setPipelineState(PipelineStep.CLEANUP);
                await cleanupProperties();
                await setPipelineState(PipelineStep.FETCH);
                console.log("Cleanup done. Next: fetch");
                break;
            }

            case PipelineStep.CLEANUP: {
                await cleanupProperties();
                await setPipelineState(PipelineStep.FETCH);
                console.log("Cleanup done. Next: fetch");
                break;
            }

            case PipelineStep.FETCH: {
                if (process.env.ENV === "prod") {
                    await fetchRawPropertiesScrapeDo();
                } else {
                    await fetchRawPropertiesLocal();
                }
                await setPipelineState(PipelineStep.PARSE);
                console.log("Fetch done. Next: parse");
                break;
            }

            case PipelineStep.PARSE: {
                await parseProperties();
                await setPipelineState(PipelineStep.GEOCODE);
                console.log("Parse done. Next: geocode");
                break;
            }

            case PipelineStep.GEOCODE: {
                const { remaining } = await fetchGeocodeData(GEOCODE_BATCH_SIZE);
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
