import { downloadTmpFile } from "@/services/tmpStorage";

async function readJsonlFileAsJsonArray<T>(fileName: string) {
    const content = await downloadTmpFile(fileName);

    if (!content) {
        return;
    }

    const json = content
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));

    return json as T[];
}

export default readJsonlFileAsJsonArray;
