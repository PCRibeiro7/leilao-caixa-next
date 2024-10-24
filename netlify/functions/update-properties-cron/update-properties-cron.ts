import updateProperties from "@/scripts/functions/update-properties";
import { schedule } from "@netlify/functions";

// To learn about scheduled functions and supported cron extensions,
// see: https://ntl.fyi/sched-func
// export const handler = schedule("*/5 * * * *", async (event) => {
export const handler = schedule("*/5 * * * *", async (event) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    await updateProperties().catch(console.error);

    return {
        statusCode: 200,
    };
});
