import { PROPERTIES_FILENAME, PROPERTIES_RAW_FILENAME } from "@/consts/filePaths";
import { deleteTmpFiles } from "@/services/tmpStorage";

const cleanupProperties = async () => {
    await deleteTmpFiles([PROPERTIES_RAW_FILENAME, PROPERTIES_FILENAME]);
};

export default cleanupProperties;
