import { PROPERTIES_GEOCODED_PATH, PROPERTIES_PATH, PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import { unlinkSync, writeFileSync } from "fs";

unlinkSync(PROPERTIES_RAW_PATH);
writeFileSync(PROPERTIES_PATH, "[]");
writeFileSync(PROPERTIES_GEOCODED_PATH, "[]");
