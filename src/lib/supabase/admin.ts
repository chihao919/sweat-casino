import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 *
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use it in server-side contexts such as API routes and cron jobs.
 * NEVER expose the service role key to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable auto-refresh since this is a server-side client
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
