import { BoundingBox } from "@/types/BoundingBox";
import { createAdminClient } from "@/utils/supabase/admin";

const supabase = createAdminClient();
const BOUNDING_BOX_TABLE_NAME = "boundingBoxes";

export type FetchBoundingBoxFilter = { state: string; city: string }[];

export async function fetchBoundingBoxes(filter: FetchBoundingBoxFilter): Promise<BoundingBox[]> {
    const filterString = filter.map(({ state, city }) => `and(state.eq.${state},city.eq.${city})`).join(",");

    const { count: boundingBoxesCount } = await supabase
        .from(BOUNDING_BOX_TABLE_NAME)
        .select("*", { count: "exact", head: true })
        .or(filterString);

    if (!boundingBoxesCount) return [];

    const allBoundingBoxes: BoundingBox[] = [];

    for (let i = 0; i < boundingBoxesCount; i += 1000) {
        const { data: boundingBoxesPage } = await supabase
            .from(BOUNDING_BOX_TABLE_NAME)
            .select()
            .or(filterString)
            .range(i, i + 999);

        if (!boundingBoxesPage) return allBoundingBoxes;

        allBoundingBoxes.push(...boundingBoxesPage);
    }
    return allBoundingBoxes;
}

export async function addBoundingBox(boundingBox: BoundingBox) {
    const { error } = await supabase.from(BOUNDING_BOX_TABLE_NAME).insert([boundingBox]);

    if (error) throw error;
}
