import readline from "readline";
import "dotenv/config";

const ENV = process.env.ENV;
const SKIP_CHECKS = process.env.npm_config_skip_checks === "true";

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

const checkEnv = async () => {
    if (ENV === "dev") {
        console.log("Running in development mode");
    } else if (ENV === "prod") {
        console.log("Running in production mode");

        if (SKIP_CHECKS) {
            console.log("Skipping checks");
            return;
        }

        const ans = await askQuestion("Are you sure you want to run in PRODUCTION mode? (Y/N): ");
        if (!["y", "yes"].includes(ans.toLowerCase())) {
            console.log("Script aborted");
            process.abort();
        }
    } else {
        console.error("Invalid ENV value. Use 'dev' or 'prod'");
        process.abort();
    }
};

checkEnv();
