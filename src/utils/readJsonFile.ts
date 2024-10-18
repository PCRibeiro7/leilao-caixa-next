import { readFileSync } from "fs";

function readJsonlFileAsJsonArray<T>(jsonlFilePath: string) {
    const content = readFileSync(jsonlFilePath, "utf8");

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
