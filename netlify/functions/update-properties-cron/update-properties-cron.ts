import { schedule } from "@netlify/functions";
import resetProperties from "@/scripts/functions/reset-properties";

// To learn about scheduled functions and supported cron extensions,
// see: https://ntl.fyi/sched-func
// export const handler = schedule("*/5 * * * *", async (event) => {
export const handler = schedule("*/5 * * * *", async (event) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    await resetProperties().catch(console.error);

    return {
        statusCode: 200,
    };
});
