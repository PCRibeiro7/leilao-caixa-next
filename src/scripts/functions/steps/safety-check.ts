import readline from "readline";
import "dotenv/config";

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

const safetyCheck = async () => {
    const ans = await askQuestion("Are you sure you want to DELETE all properties? (Y/N): ");
    if (!["y", "yes"].includes(ans.toLowerCase())) {
        console.log("Script aborted");
        process.abort();
    }
};

export default safetyCheck;
