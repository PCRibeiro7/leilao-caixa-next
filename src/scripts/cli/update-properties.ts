import "dotenv/config";
import updatePropertiesPipeline from "@/scripts/pipelines/update-properties.pipeline";

updatePropertiesPipeline().catch(console.error);
