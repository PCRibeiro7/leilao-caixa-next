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

const safetyCheck = async (question: string, errorType: "abort" | "return") => {
    const ans = await askQuestion(`${question} (Y/N): `);
    if (!["y", "yes"].includes(ans.toLowerCase())) {
        console.log("Script aborted");
        switch (errorType) {
            case "abort":
                process.abort();
            case "return":
                return false;
        }
    }
    return true;
};

export default safetyCheck;
