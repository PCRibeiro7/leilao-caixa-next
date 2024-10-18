import { PROPERTIES_GEOCODED_PATH, PROPERTIES_PATH, PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import { existsSync, unlinkSync, writeFileSync } from "fs";

if (existsSync(PROPERTIES_RAW_PATH)) {
    unlinkSync(PROPERTIES_RAW_PATH);
}

writeFileSync(PROPERTIES_PATH, "", { encoding: "latin1" });
writeFileSync(PROPERTIES_GEOCODED_PATH, "", { encoding: "latin1" });
