import { PROPERTIES_PATH, PROPERTIES_RAW_PATH, TMP_PATH } from "@/consts/filePaths";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";

if (!existsSync(TMP_PATH)) {
    mkdirSync(TMP_PATH);
}

if (existsSync(PROPERTIES_RAW_PATH)) {
    unlinkSync(PROPERTIES_RAW_PATH);
}

if (existsSync(PROPERTIES_PATH)) {
    writeFileSync(PROPERTIES_PATH, "", { encoding: "latin1" });
}
