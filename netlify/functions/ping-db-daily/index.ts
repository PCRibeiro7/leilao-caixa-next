import { fetchAllProperties } from "@/services/properties";
import { HandlerEvent, schedule } from "@netlify/functions";

// To learn about scheduled functions and supported cron extensions,
// see: https://ntl.fyi/sched-func
export const handler = schedule("@daily", async (event: HandlerEvent) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    fetchAllProperties();

    return {
        statusCode: 200,
    };
});
