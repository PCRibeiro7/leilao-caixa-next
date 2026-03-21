import "dotenv/config";
import updateBasePropertiesPipeline from "@/scripts/pipelines/update-base-properties.pipeline";

updateBasePropertiesPipeline().catch(console.error);
