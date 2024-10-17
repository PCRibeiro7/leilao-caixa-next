import readline from "readline";
import "dotenv/config";

const ENV = process.env.NODE_ENV;

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
    if (ENV === "development") {
        console.log("Running in development mode");
    } else if (ENV === "production") {
        console.log("Running in production mode");

        const ans = await askQuestion("Are you sure you want to run in PRODUCTION mode? (Y/N): ");
        if (!["y", "yes"].includes(ans.toLowerCase())) {
            console.log("Script aborted");
            process.abort();
        }
    } else {
        console.error("Invalid NODE_ENV value. Use 'development' or 'production'");
        process.abort();
    }
};

checkEnv();
