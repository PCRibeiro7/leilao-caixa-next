import "dotenv/config";
import resetPropertiesPipeline from "@/scripts/pipelines/reset-properties.pipeline";

resetPropertiesPipeline().catch(console.error);
