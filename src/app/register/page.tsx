"use client";

import { useState } from "react";
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

type FormState = "idle" | "loading" | "success";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setFormState("loading");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After email confirmation, redirect back into the app
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setFormState("idle");
      return;
    }

    setFormState("success");
  }

  if (formState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.15)_0%,_transparent_60%)]" />

        <Card className="relative w-full max-w-sm border-zinc-800 bg-zinc-900 shadow-2xl shadow-red-950/20">
          <CardHeader className="pb-4 text-center">
            <div className="mb-2 text-4xl">📬</div>
            <CardTitle className="text-xl text-white">Check your email</CardTitle>
            <CardDescription className="text-zinc-400">
              We sent a confirmation link to{" "}
              <span className="font-medium text-red-400">{email}</span>.
              Click it to activate your account and start sweating.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
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
            <CardTitle className="text-xl text-white">Create account</CardTitle>
            <CardDescription className="text-zinc-400">
              Join the casino — your sweat is the currency
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
                  autoComplete="new-password"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-red-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-zinc-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-red-600"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={formState === "loading"}
                className="w-full bg-red-600 font-semibold text-white hover:bg-red-700 focus-visible:ring-red-600 disabled:opacity-50"
              >
                {formState === "loading" ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-red-400 hover:text-red-300 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
