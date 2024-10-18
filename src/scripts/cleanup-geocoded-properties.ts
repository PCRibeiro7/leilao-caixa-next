import { PROPERTIES_GEOCODED_PATH } from "@/consts/filePaths";
import { writeFileSync } from "fs";

writeFileSync(PROPERTIES_GEOCODED_PATH, "", { encoding: "latin1" });
