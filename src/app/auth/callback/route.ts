import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the OAuth/magic-link callback from Supabase.
 *
 * Supabase redirects here after email confirmation or OAuth sign-in.
 * We exchange the one-time `code` query param for a persistent session,
 * then send the user to their intended destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Respect any post-login redirect the middleware saved
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth callback: failed to exchange code for session", error);
  }

  // Something went wrong — send back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
