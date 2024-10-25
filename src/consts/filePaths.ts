import "dotenv/config";

export const TMP_PATH = process.env.ENV === "prod" ? "/tmp" : "tmp";
export const PROPERTIES_PATH = `${TMP_PATH}/properties.jsonl`;
export const PROPERTIES_RAW_PATH = `${TMP_PATH}/properties-raw.csv`;
