"use client";

import { useState } from "react";
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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleLogin() {
    setIsLoading(true);
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

        <Card className="border-zinc-800 bg-zinc-900 shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-2xl text-white">開始遊戲</CardTitle>
            <CardDescription className="text-base text-zinc-400">
              使用 Google 帳號登入，加入汗水賭局
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-zinc-900 font-semibold hover:bg-zinc-100 focus-visible:ring-red-600 disabled:opacity-50 h-14 text-lg"
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
