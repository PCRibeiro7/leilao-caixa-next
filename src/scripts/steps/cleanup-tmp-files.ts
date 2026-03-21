import { PROPERTIES_FILENAME, PROPERTIES_RAW_FILENAME } from "@/consts/filePaths";
import { deleteTmpFiles } from "@/services/tmpStorage";

export default async function cleanupTmpFiles() {
    await deleteTmpFiles([PROPERTIES_RAW_FILENAME, PROPERTIES_FILENAME]);
}
