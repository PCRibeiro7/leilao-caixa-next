import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const supabase = createClient();

    const { data, error } = await supabase
        .from("properties")
        .select()
        .eq("caixaId", id)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(data);
}
