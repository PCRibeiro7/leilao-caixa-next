import { existsSync, readFileSync } from "fs";

function readJsonlFileAsJsonArray<T>(jsonlFilePath: string) {
    if (!existsSync(jsonlFilePath)) {
        return;
    }

    const content = readFileSync(jsonlFilePath, { encoding: "latin1" });

    if (!content) {
        return [];
    }

    const json = content
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));

    return json as T[];
}

export default readJsonlFileAsJsonArray;
