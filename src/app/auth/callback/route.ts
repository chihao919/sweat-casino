import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the OAuth/magic-link callback from Supabase.
 *
 * Supabase redirects here after email confirmation or OAuth sign-in.
 * We exchange the one-time `code` query param for a persistent session,
 * then send the user to their intended destination.
 *
 * Common failure: PKCE code_verifier cookie is lost during the redirect
 * (Safari ITP, in-app browsers, privacy mode). We catch this and show
 * a helpful error instead of an infinite loop.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  // If Supabase/Google returned an error directly
  if (errorParam) {
    console.error("[auth/callback] OAuth provider error:", errorParam, errorDescription);
    const reason = errorDescription || errorParam;
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed&reason=${encodeURIComponent(reason)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error("[auth/callback] exchangeCodeForSession failed:", error.message, error.status);

      // PKCE verifier missing — most common cause of "卡住"
      const isPKCEError =
        error.message.includes("code verifier") ||
        error.message.includes("code_verifier") ||
        error.message.includes("invalid request") ||
        error.message.includes("both auth code and code verifier");

      if (isPKCEError) {
        return NextResponse.redirect(
          `${origin}/login?error=auth_callback_failed&reason=${encodeURIComponent(
            "Cookie 遺失導致驗證失敗。請用 Safari 或 Chrome 重新開啟頁面，避免使用 LINE/Facebook 內建瀏覽器。"
          )}`
        );
      }

      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`
      );
    } catch (err) {
      console.error("[auth/callback] unexpected error:", err);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  }

  console.error("[auth/callback] no code param in URL. Params:", Object.fromEntries(searchParams));
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
