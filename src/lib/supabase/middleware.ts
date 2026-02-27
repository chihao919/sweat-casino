import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase auth session in middleware.
 *
 * This must be called in middleware to keep the user's session alive.
 * It reads the session cookie, validates it with Supabase, and writes
 * the refreshed token back to both the request and response cookies.
 */
export async function updateSession(request: NextRequest) {
  // Start with a passthrough response — we may modify it below
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto the outgoing request (for downstream server reads)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Recreate the response so it carries the updated request cookies
          supabaseResponse = NextResponse.next({ request });

          // Also write cookies onto the response (so the browser receives them)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // A mistake here could cause the user to be randomly signed out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
