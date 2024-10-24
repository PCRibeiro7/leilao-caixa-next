import "dotenv/config";
import resetProperties from "./functions/reset-properties";

resetProperties().catch(console.error);
