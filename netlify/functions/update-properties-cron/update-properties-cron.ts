import { execSync } from "child_process";
import { schedule } from "@netlify/functions";

import "package.json";

// To learn about scheduled functions and supported cron extensions,
// see: https://ntl.fyi/sched-func
export const handler = schedule("*/5 * * * *", async (event) => {
    const eventBody = JSON.parse(event.body || "{}");
    console.log(`Next function run at ${eventBody?.next_run}.`);

    execSync("npm run update-properties --skip-checks", { stdio: "inherit" });

    return {
        statusCode: 200,
    };
});
