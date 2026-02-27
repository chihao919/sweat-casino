"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    // Redirect triggers a full navigation so Next.js server components re-render
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      {/* Subtle casino ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.15)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-sm">
        {/* App title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white">
            Sweat Casino 🎰
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Gamified running with behavioral economics
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900 shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-zinc-400">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-red-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-red-600"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 font-semibold text-white hover:bg-red-700 focus-visible:ring-red-600 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-zinc-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-red-400 hover:text-red-300 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
