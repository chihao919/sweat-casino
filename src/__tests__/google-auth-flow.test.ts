/**
 * BDD Tests for Google OAuth Authentication Flow
 *
 * Complete flow:
 *   1. User clicks "Google Login" button on /login page
 *   2. signInWithOAuth() generates PKCE code_verifier, stores in cookie, redirects to Google
 *   3. Google shows consent screen, user picks account
 *   4. Google redirects back to Supabase with auth code
 *   5. Supabase redirects to /auth/callback?code=xxx
 *   6. /auth/callback exchanges code for session via exchangeCodeForSession()
 *   7. On success: redirect to /dashboard
 *   8. Middleware validates session on /dashboard
 *
 * Known failure points:
 *   A. In-app browser (LINE/FB) blocks Google OAuth or loses PKCE cookie
 *   B. PKCE code_verifier cookie lost (Safari ITP, privacy mode, cross-domain)
 *   C. OAuth code already exchanged (user refreshes /auth/callback)
 *   D. Redirect URL mismatch between Supabase config and actual origin
 *   E. Middleware session check fails after successful exchange
 *   F. Google returns error (user cancels, account restrictions)
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Helpers — replicate auth logic without actual Supabase/Google calls
// ---------------------------------------------------------------------------

/** Detect in-app browsers that block Google OAuth */
function isInAppBrowser(userAgent: string): boolean {
  return /Line|FBAV|FBAN|Instagram|Twitter|MicroMessenger|WeChat|Snapchat|Pinterest|TikTok/i.test(
    userAgent
  );
}

/** Check if an error from exchangeCodeForSession is a PKCE error */
function isPKCEError(errorMessage: string): boolean {
  return (
    errorMessage.includes("code verifier") ||
    errorMessage.includes("code_verifier") ||
    errorMessage.includes("invalid request") ||
    errorMessage.includes("both auth code and code verifier")
  );
}

/** Parse callback URL params (simulates what /auth/callback receives) */
function parseCallbackParams(url: string): {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  next: string;
} {
  const u = new URL(url);
  return {
    code: u.searchParams.get("code"),
    error: u.searchParams.get("error"),
    errorDescription: u.searchParams.get("error_description"),
    next: u.searchParams.get("next") ?? "/dashboard",
  };
}

/** Determine the redirect result from the callback handler */
function determineCallbackRedirect(params: {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  exchangeResult?: { success: boolean; errorMessage?: string };
}): { path: string; reason?: string } {
  // Case 1: OAuth provider returned an error
  if (params.error) {
    return {
      path: "/login",
      reason: params.errorDescription || params.error,
    };
  }

  // Case 2: No code in URL
  if (!params.code) {
    return { path: "/login", reason: "No auth code provided" };
  }

  // Case 3: Code exchange
  if (!params.exchangeResult) {
    return { path: "/login", reason: "Exchange not attempted" };
  }

  if (params.exchangeResult.success) {
    return { path: "/dashboard" };
  }

  // Case 4: Exchange failed
  const msg = params.exchangeResult.errorMessage ?? "Unknown error";
  if (isPKCEError(msg)) {
    return {
      path: "/login",
      reason: "Cookie lost - use Safari or Chrome",
    };
  }

  return { path: "/login", reason: msg };
}

/** Check if a route is public (no auth required) */
const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback", "/guide", "/players", "/invite"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/** Determine middleware redirect */
function middlewareRedirect(pathname: string, hasUser: boolean): string | null {
  const AUTH_ONLY_ROUTES = ["/login", "/register"];
  const isAuthRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!hasUser && !isPublicRoute(pathname)) {
    return "/login";
  }

  if (hasUser && isAuthRoute) {
    return "/dashboard";
  }

  return null; // no redirect, pass through
}

// ---------------------------------------------------------------------------
// Feature: Google OAuth Login Flow
// ---------------------------------------------------------------------------

describe("Feature: Google OAuth Login Flow", () => {
  // =========================================================================
  // Scenario: In-App Browser Detection
  // =========================================================================
  describe("Scenario: Detect in-app browsers that block Google OAuth", () => {
    it("Given user opens in LINE browser, Then in-app browser is detected", () => {
      expect(isInAppBrowser("Mozilla/5.0 Line/12.0.0")).toBe(true);
    });

    it("Given user opens in Facebook browser, Then in-app browser is detected", () => {
      expect(isInAppBrowser("Mozilla/5.0 FBAV/400.0")).toBe(true);
      expect(isInAppBrowser("Mozilla/5.0 FBAN/Orca")).toBe(true);
    });

    it("Given user opens in Instagram browser, Then in-app browser is detected", () => {
      expect(isInAppBrowser("Mozilla/5.0 Instagram 200.0")).toBe(true);
    });

    it("Given user opens in Safari, Then in-app browser is NOT detected", () => {
      expect(isInAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1")).toBe(false);
    });

    it("Given user opens in Chrome, Then in-app browser is NOT detected", () => {
      expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 13) Chrome/110.0.5481.153 Mobile Safari/537.36")).toBe(false);
    });

    it("Given user opens in TikTok browser, Then in-app browser is detected", () => {
      expect(isInAppBrowser("Mozilla/5.0 TikTok/28.0")).toBe(true);
    });
  });

  // =========================================================================
  // Scenario: Parse callback URL parameters
  // =========================================================================
  describe("Scenario: Auth callback receives correct parameters", () => {
    it("Given Google OAuth succeeds, Then callback URL has code param", () => {
      const params = parseCallbackParams("https://app.com/auth/callback?code=abc123");
      expect(params.code).toBe("abc123");
      expect(params.error).toBeNull();
    });

    it("Given Google OAuth fails, Then callback URL has error params", () => {
      const params = parseCallbackParams(
        "https://app.com/auth/callback?error=access_denied&error_description=User+cancelled"
      );
      expect(params.code).toBeNull();
      expect(params.error).toBe("access_denied");
      expect(params.errorDescription).toBe("User cancelled");
    });

    it("Given no next param, Then default redirect is /dashboard", () => {
      const params = parseCallbackParams("https://app.com/auth/callback?code=abc");
      expect(params.next).toBe("/dashboard");
    });

    it("Given next param is /profile, Then redirect goes to /profile", () => {
      const params = parseCallbackParams("https://app.com/auth/callback?code=abc&next=/profile");
      expect(params.next).toBe("/profile");
    });
  });

  // =========================================================================
  // Scenario: Callback handler determines correct redirect
  // =========================================================================
  describe("Scenario: Callback handler redirect logic", () => {
    it("Given OAuth provider returns error, Then redirect to /login with reason", () => {
      const result = determineCallbackRedirect({
        code: null,
        error: "access_denied",
        errorDescription: "User denied access",
      });
      expect(result.path).toBe("/login");
      expect(result.reason).toBe("User denied access");
    });

    it("Given no code in URL, Then redirect to /login", () => {
      const result = determineCallbackRedirect({
        code: null,
        error: null,
        errorDescription: null,
      });
      expect(result.path).toBe("/login");
    });

    it("Given valid code and successful exchange, Then redirect to /dashboard", () => {
      const result = determineCallbackRedirect({
        code: "valid-code",
        error: null,
        errorDescription: null,
        exchangeResult: { success: true },
      });
      expect(result.path).toBe("/dashboard");
    });

    it("Given valid code but PKCE error, Then redirect to /login with cookie-lost message", () => {
      const result = determineCallbackRedirect({
        code: "valid-code",
        error: null,
        errorDescription: null,
        exchangeResult: {
          success: false,
          errorMessage: "both auth code and code verifier should be non-empty",
        },
      });
      expect(result.path).toBe("/login");
      expect(result.reason).toContain("Cookie");
    });

    it("Given valid code but code_verifier missing, Then detect as PKCE error", () => {
      const result = determineCallbackRedirect({
        code: "valid-code",
        error: null,
        errorDescription: null,
        exchangeResult: {
          success: false,
          errorMessage: "code verifier not found in storage",
        },
      });
      expect(result.path).toBe("/login");
      expect(result.reason).toContain("Cookie");
    });

    it("Given valid code but unknown error, Then redirect to /login with error message", () => {
      const result = determineCallbackRedirect({
        code: "valid-code",
        error: null,
        errorDescription: null,
        exchangeResult: {
          success: false,
          errorMessage: "Database connection timeout",
        },
      });
      expect(result.path).toBe("/login");
      expect(result.reason).toBe("Database connection timeout");
    });
  });

  // =========================================================================
  // Scenario: PKCE error detection
  // =========================================================================
  describe("Scenario: PKCE error detection covers all known variants", () => {
    it("detects 'code verifier' error", () => {
      expect(isPKCEError("code verifier not found")).toBe(true);
    });

    it("detects 'code_verifier' error (underscore variant)", () => {
      expect(isPKCEError("missing code_verifier in request")).toBe(true);
    });

    it("detects 'invalid request' error", () => {
      expect(isPKCEError("invalid request")).toBe(true);
    });

    it("detects 'both auth code and code verifier' error", () => {
      expect(isPKCEError("both auth code and code verifier should be non-empty")).toBe(true);
    });

    it("does NOT match unrelated errors", () => {
      expect(isPKCEError("Database connection failed")).toBe(false);
      expect(isPKCEError("User not found")).toBe(false);
      expect(isPKCEError("Rate limit exceeded")).toBe(false);
    });
  });

  // =========================================================================
  // Scenario: Middleware route protection
  // =========================================================================
  describe("Scenario: Middleware correctly protects routes", () => {
    it("Given unauthenticated user on /dashboard, Then redirect to /login", () => {
      expect(middlewareRedirect("/dashboard", false)).toBe("/login");
    });

    it("Given unauthenticated user on /profile, Then redirect to /login", () => {
      expect(middlewareRedirect("/profile", false)).toBe("/login");
    });

    it("Given unauthenticated user on /login, Then no redirect (public)", () => {
      expect(middlewareRedirect("/login", false)).toBeNull();
    });

    it("Given unauthenticated user on /guide, Then no redirect (public)", () => {
      expect(middlewareRedirect("/guide", false)).toBeNull();
    });

    it("Given unauthenticated user on /auth/callback, Then no redirect (public)", () => {
      expect(middlewareRedirect("/auth/callback", false)).toBeNull();
    });

    it("Given unauthenticated user on /invite, Then no redirect (public)", () => {
      expect(middlewareRedirect("/invite", false)).toBeNull();
    });

    it("Given authenticated user on /login, Then redirect to /dashboard", () => {
      expect(middlewareRedirect("/login", true)).toBe("/dashboard");
    });

    it("Given authenticated user on /register, Then redirect to /dashboard", () => {
      expect(middlewareRedirect("/register", true)).toBe("/dashboard");
    });

    it("Given authenticated user on /dashboard, Then no redirect (pass through)", () => {
      expect(middlewareRedirect("/dashboard", true)).toBeNull();
    });

    it("Given authenticated user on /profile, Then no redirect (pass through)", () => {
      expect(middlewareRedirect("/profile", true)).toBeNull();
    });
  });

  // =========================================================================
  // Scenario: End-to-end happy path
  // =========================================================================
  describe("Scenario: Complete successful login flow", () => {
    it("Step 1-8: User logs in with Google successfully", () => {
      // Step 1: User is on /login, not in-app browser
      const userAgent = "Mozilla/5.0 Chrome/110.0 Safari/537.36";
      expect(isInAppBrowser(userAgent)).toBe(false);

      // Step 2-4: Google OAuth completes, redirects to callback
      const callbackUrl = "https://app.com/auth/callback?code=google-auth-code-123";
      const params = parseCallbackParams(callbackUrl);
      expect(params.code).toBe("google-auth-code-123");
      expect(params.error).toBeNull();

      // Step 5-6: Exchange code for session succeeds
      const redirect = determineCallbackRedirect({
        ...params,
        exchangeResult: { success: true },
      });
      expect(redirect.path).toBe("/dashboard");

      // Step 7-8: Middleware allows authenticated user on /dashboard
      expect(middlewareRedirect("/dashboard", true)).toBeNull();
    });
  });

  // =========================================================================
  // Scenario: End-to-end LINE browser failure
  // =========================================================================
  describe("Scenario: User tries to login from LINE browser", () => {
    it("Step 1: Detect LINE in-app browser and block login", () => {
      const userAgent = "Mozilla/5.0 Line/12.21.0 iPhone";
      expect(isInAppBrowser(userAgent)).toBe(true);
      // UI should show warning and disable the Google login button
    });
  });

  // =========================================================================
  // Scenario: End-to-end PKCE failure
  // =========================================================================
  describe("Scenario: PKCE cookie lost during redirect", () => {
    it("User gets PKCE error and sees helpful message", () => {
      // Callback receives a valid code but code_verifier cookie is lost
      const params = parseCallbackParams("https://app.com/auth/callback?code=valid-code");
      expect(params.code).toBe("valid-code");

      // Exchange fails due to missing PKCE verifier
      const redirect = determineCallbackRedirect({
        ...params,
        exchangeResult: {
          success: false,
          errorMessage: "both auth code and code verifier should be non-empty",
        },
      });

      expect(redirect.path).toBe("/login");
      expect(redirect.reason).toContain("Cookie");

      // Middleware: user is NOT authenticated, on /login → no redirect
      expect(middlewareRedirect("/login", false)).toBeNull();
    });
  });

  // =========================================================================
  // Scenario: User cancels Google consent
  // =========================================================================
  describe("Scenario: User cancels on Google consent screen", () => {
    it("Google returns access_denied error to callback", () => {
      const params = parseCallbackParams(
        "https://app.com/auth/callback?error=access_denied&error_description=The+user+denied+access"
      );

      const redirect = determineCallbackRedirect({
        ...params,
      });

      expect(redirect.path).toBe("/login");
      expect(redirect.reason).toBe("The user denied access");
    });
  });

  // =========================================================================
  // Scenario: Redirect loop detection
  // =========================================================================
  describe("Scenario: Prevent redirect loops", () => {
    it("Unauthenticated user on /dashboard → /login, NOT back to /dashboard", () => {
      // First: middleware redirects to /login
      const firstRedirect = middlewareRedirect("/dashboard", false);
      expect(firstRedirect).toBe("/login");

      // On /login: no further redirect for unauthenticated user
      const secondRedirect = middlewareRedirect("/login", false);
      expect(secondRedirect).toBeNull();
    });

    it("Authenticated user on /login → /dashboard, NOT back to /login", () => {
      const firstRedirect = middlewareRedirect("/login", true);
      expect(firstRedirect).toBe("/dashboard");

      const secondRedirect = middlewareRedirect("/dashboard", true);
      expect(secondRedirect).toBeNull();
    });
  });
});
