"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Detect if the page is opened inside an in-app browser (LINE, Facebook, Instagram, etc.).
 * Google blocks OAuth sign-in from embedded webviews for security.
 */
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  // Common in-app browser identifiers
  return /Line|FBAV|FBAN|Instagram|Twitter|MicroMessenger|WeChat|Snapchat|Pinterest|TikTok/i.test(
    ua
  );
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());

    // Check if redirected back with an error
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_callback_failed") {
      const reason = params.get("reason");
      const debugStep = params.get("debug_step");
      const errorDetail = [
        reason || "Google 登入失敗，請再試一次。如果持續失敗，請確認使用 Safari 或 Chrome 瀏覽器開啟。",
        debugStep ? `\n[Debug: step=${debugStep}]` : "",
      ].join("");
      setAuthError(errorDetail);
      // Clean up URL so the error doesn't persist on refresh
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  async function handleOAuthLogin(provider: "apple" | "google") {
    setIsLoading(true);
    setAuthError(null);
    const supabase = createClient();

    const isNative =
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>).Capacitor !== undefined;

    if (isNative && provider === "apple") {
      // Native Apple Sign-In — no WebView navigation needed
      try {
        const { AppleSignIn, SignInScope } = await import("@capawesome/capacitor-apple-sign-in");
        const result = await AppleSignIn.signIn({
          scopes: [SignInScope.Email, SignInScope.FullName],
        });

        // Exchange Apple's identity token with Supabase
        const { error: sessionError } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: result.idToken,
        });

        if (sessionError) {
          setIsLoading(false);
          setAuthError(`Apple 登入失敗: ${sessionError.message}`);
          return;
        }

        window.location.href = "/dashboard";
      } catch (err) {
        setIsLoading(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("cancel")) {
          setAuthError(`Apple 登入失敗: ${msg}`);
        }
      }
      return;
    } else if (isNative) {
      // Native Google — use OAuth in WebView with capacitor://localhost redirect
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "capacitor://localhost/dashboard",
          queryParams: { response_type: "token" },
        },
      });

      if (error) {
        setIsLoading(false);
        setAuthError(`登入啟動失敗: ${error.message}`);
        return;
      }
    } else {
      // Web: standard OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setIsLoading(false);
        setAuthError(`登入啟動失敗: ${error.message}`);
      }
    }
  }

  async function handleAppleLogin() {
    await handleOAuthLogin("apple");
  }

  async function handleGoogleLogin() {
    await handleOAuthLogin("google");
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      {/* Subtle casino ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.15)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* App title */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white">
            汗水賭場 🎰
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-zinc-400">
            用汗水下注，讓跑步變成一場賭局
          </p>
        </div>

        {/* Auth error message */}
        {authError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 p-5">
            <p className="text-sm text-red-200 text-center whitespace-pre-line">{authError}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(authError);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-3 w-full rounded-lg bg-red-900/50 py-2 text-xs text-red-300 hover:bg-red-900/70 transition-colors"
            >
              {copied ? "已複製錯誤訊息" : "複製錯誤訊息 (回報用)"}
            </button>
          </div>
        )}

        {/* Warning for in-app browsers */}
        {inAppBrowser && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/40 p-5 text-center">
            <p className="text-lg font-bold text-amber-400">
              ⚠️ 請使用外部瀏覽器開啟
            </p>
            <p className="mt-2 text-sm text-amber-200/80">
              Google 登入不支援 App 內建瀏覽器（LINE、Facebook 等）。
              <br />
              請複製連結，用 Safari 或 Chrome 開啟。
            </p>
            <Button
              onClick={handleCopyUrl}
              className="mt-4 w-full bg-amber-600 text-white font-semibold hover:bg-amber-500 h-12 text-base"
            >
              {copied ? "✅ 已複製！" : "📋 複製連結"}
            </Button>
          </div>
        )}

        <Card className="border-zinc-800 bg-zinc-900 shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-2xl text-white">開始遊戲</CardTitle>
            <CardDescription className="text-base text-zinc-400">
              登入帳號，加入汗水賭局
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 space-y-3">
            <Button
              onClick={handleAppleLogin}
              disabled={isLoading || inAppBrowser}
              className="w-full bg-white text-zinc-900 font-semibold hover:bg-zinc-100 focus-visible:ring-red-600 disabled:opacity-50 h-14 text-lg"
            >
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {isLoading ? "跳轉中..." : "使用 Apple 登入"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-900 px-2 text-zinc-500">或</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading || inAppBrowser}
              className="w-full bg-zinc-800 text-white font-semibold hover:bg-zinc-700 focus-visible:ring-red-600 disabled:opacity-50 h-14 text-lg border border-zinc-700"
            >
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? "跳轉中..." : "使用 Google 登入"}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-3">
          <Link
            href="/guide"
            className="block text-base font-medium text-red-400 hover:text-red-300 hover:underline"
          >
            📖 遊戲規則與新手指南
          </Link>
          <p className="text-sm text-zinc-600">
            登入即代表你同意用汗水下注 💦
          </p>
        </div>
      </div>
    </div>
  );
}
