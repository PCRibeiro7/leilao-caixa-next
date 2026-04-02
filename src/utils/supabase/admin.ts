import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client using the service role key — bypasses RLS.
// ONLY use this server-side (Netlify functions, CLI scripts). Never expose to the browser.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    }

    return createSupabaseClient(url, serviceRoleKey);
}
