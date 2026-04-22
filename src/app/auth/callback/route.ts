import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const redirectScheme = searchParams.get("redirect_scheme");

  // Build debug context for troubleshooting
  const debugCtx: Record<string, string> = {
    step: "init",
    hasCode: String(!!code),
    hasError: String(!!errorParam),
    origin,
    params: JSON.stringify(Object.fromEntries(searchParams)),
  };

  function redirectToLoginWithError(reason: string, step: string) {
    debugCtx.step = step;
    debugCtx.reason = reason;
    console.error("[auth/callback]", JSON.stringify(debugCtx));
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed&reason=${encodeURIComponent(reason)}&debug_step=${encodeURIComponent(step)}`
    );
  }

  // If Supabase/Google returned an error directly
  if (errorParam) {
    const reason = errorDescription || errorParam;
    return redirectToLoginWithError(reason, "oauth_provider_error");
  }

  if (code) {
    try {
      debugCtx.step = "exchange_start";
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        debugCtx.step = "exchange_success";

        // Process referral if a referrer cookie exists
        const referrerId = request.cookies.get("referrer_id")?.value;
        if (referrerId) {
          try {
            const admin = createAdminClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id !== referrerId) {
              await admin.rpc("process_referral_reward", {
                p_new_user_id: user.id,
                p_referrer_id: referrerId,
              });
              console.log(`[auth/callback] Referral processed: ${referrerId} -> ${user.id}`);
            }
          } catch (refErr) {
            // Don't block login if referral processing fails
            console.error("[auth/callback] Referral error:", refErr);
          }
        }

        // For native Capacitor app: redirect back to local bundle with session tokens
        // Tokens go in the hash fragment so Supabase client auto-detects them
        if (redirectScheme) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=signup`;
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>
              <p>登入成功，正在返回 App...</p>
              <script>window.location.href="capacitor://localhost/dashboard#${hash}";</script>
            </body></html>`;
            return new NextResponse(html, {
              headers: { "Content-Type": "text/html" },
            });
          }
        }

        if (referrerId) {
          const response = NextResponse.redirect(`${origin}${next}`);
          response.cookies.set("referrer_id", "", { maxAge: 0, path: "/" });
          return response;
        }

        return NextResponse.redirect(`${origin}${next}`);
      }

      debugCtx.step = "exchange_failed";
      debugCtx.errorMessage = error.message;
      debugCtx.errorStatus = String(error.status);

      // PKCE verifier missing — most common cause of "卡住"
      const isPKCEError =
        error.message.includes("code verifier") ||
        error.message.includes("code_verifier") ||
        error.message.includes("invalid request") ||
        error.message.includes("both auth code and code verifier");

      if (isPKCEError) {
        return redirectToLoginWithError(
          "Cookie 遺失導致驗證失敗 (PKCE)。請用 Safari 或 Chrome 重新開啟頁面，避免使用 LINE/Facebook 內建瀏覽器。",
          "pkce_error"
        );
      }

      return redirectToLoginWithError(error.message, "exchange_error");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return redirectToLoginWithError(message, "exchange_exception");
    }
  }

  return redirectToLoginWithError(
    "未收到授權碼。可能是 Google 登入被取消或瀏覽器攔截了重定向。",
    "no_code"
  );
}
