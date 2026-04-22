import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const isNative =
  typeof window !== "undefined" &&
  (window as unknown as Record<string, unknown>).Capacitor !== undefined;

/**
 * Creates a Supabase client for use in browser/client components.
 * In native Capacitor app: uses localStorage for session persistence.
 * On web: uses cookie-based SSR client.
 */
export function createClient() {
  if (isNative) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
        },
      }
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
