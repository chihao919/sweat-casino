"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle,
  Mail,
  Bug,
  ChevronDown,
  Activity,
  Coins,
  Target,
  Users,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAQItemProps {
  icon: React.ReactNode;
  question: string;
  answer: React.ReactNode;
}

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------

function FAQItem({ icon, question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left hover:text-red-400 transition-colors"
      >
        <span className="flex items-center gap-3 font-medium text-white">
          <span className="shrink-0 text-zinc-500">{icon}</span>
          {question}
        </span>
        <ChevronDown
          className={`ml-4 h-5 w-5 shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 pl-9 text-zinc-400 leading-relaxed text-sm">
          {answer}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ data — each entry maps to one accordion item
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItemProps[] = [
  {
    icon: <Activity className="h-5 w-5" />,
    question: "How do I connect Strava?",
    answer: (
      <p>
        Go to <strong className="text-white">Profile → Settings → Connect Strava</strong> and
        tap the &quot;Connect&quot; button. You&apos;ll be redirected to Strava to
        authorise the connection. Once approved, your runs will sync automatically
        within a few minutes of completing a workout. Note: RunRun can also read
        directly from <strong className="text-white">Apple Health</strong> — Strava is
        optional.
      </p>
    ),
  },
  {
    icon: <Coins className="h-5 w-5" />,
    question: "How is SC (Sweat Currency) earned?",
    answer: (
      <div className="space-y-2">
        <p>
          You earn <strong className="text-yellow-400">10 SC per kilometre</strong> run.
          A few extra ways to earn:
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong className="text-white">Welcome bonus</strong> — 100 SC when you
            first sign up.
          </li>
          <li>
            <strong className="text-white">Weather bonus (1.5×)</strong> — running in
            rain, thunderstorm, extreme heat (&gt;35 °C), extreme cold (&lt;0 °C), or
            strong wind (&gt;10 m/s) multiplies your SC for that run.
          </li>
          <li>
            <strong className="text-white">Season bonus</strong> — if your team wins the
            season, all members share an SC prize pool.
          </li>
        </ul>
        <p>
          ⚠️ If you run less than{" "}
          <strong className="text-white">5 km per week</strong>, a{" "}
          <strong className="text-red-400">5% Survival Tax</strong> is deducted every
          Monday.
        </p>
      </div>
    ),
  },
  {
    icon: <Target className="h-5 w-5" />,
    question: "How does personal betting work?",
    answer: (
      <div className="space-y-2">
        <p>
          Head to <strong className="text-white">Betting → Personal Bet</strong> and set
          a weekly distance goal (e.g. &quot;I&apos;ll run 30 km this week&quot;). Stake
          however much SC you like.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong className="text-green-400">Win</strong>: achieve your goal before the
            week ends → receive <strong className="text-white">1.5× – 5.0×</strong>{" "}
            your stake back (harder goals pay more).
          </li>
          <li>
            <strong className="text-red-400">Lose</strong>: miss the goal → your staked
            SC is gone.
          </li>
        </ul>
        <p>Bets lock in at midnight on Monday and settle the following Sunday.</p>
      </div>
    ),
  },
  {
    icon: <Users className="h-5 w-5" />,
    question: "How do I join a team?",
    answer: (
      <p>
        Teams are assigned automatically when you complete the onboarding flow. You
        will be placed on either{" "}
        <strong className="text-red-400">Red Bulls 🐂</strong> or{" "}
        <strong className="text-white">White Bears 🐻‍❄️</strong>. The assignment is
        permanent — there is no team-switching. If you were invited via a referral
        link, you may be placed on the same team as your inviter.
      </p>
    ),
  },
  {
    icon: <Trash2 className="h-5 w-5" />,
    question: "How do I delete my account?",
    answer: (
      <div className="space-y-2">
        <p>
          Go to <strong className="text-white">Profile → Settings → Delete Account</strong>.
          Deleting your account will permanently remove all your data including SC
          balance, run history, and bets. This action cannot be undone.
        </p>
        <p>
          If you cannot find the option or encounter any issues, email us at{" "}
          <a
            href="mailto:chihaohuang@gmail.com"
            className="text-red-400 hover:underline"
          >
            chihaohuang@gmail.com
          </a>{" "}
          with the subject <strong className="text-white">&quot;Delete Account Request&quot;</strong> and
          we will remove your data manually within 7 business days.
        </p>
      </div>
    ),
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    question: "Why isn't my run syncing?",
    answer: (
      <div className="space-y-2">
        <p>Try these steps in order:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>
            Open the RunRun app and pull down to refresh on the Dashboard — syncs
            are sometimes delayed by a few minutes.
          </li>
          <li>
            Check that RunRun has permission to read health data:{" "}
            <strong className="text-white">
              iPhone Settings → Privacy → Health → RunRun
            </strong>.
          </li>
          <li>
            If you use Strava, make sure the run has finished syncing inside the
            Strava app first, then open RunRun and refresh.
          </li>
          <li>
            Ensure the run duration is at least{" "}
            <strong className="text-white">5 minutes</strong> — very short activities
            are filtered out.
          </li>
        </ol>
        <p>
          Still not working? Email us the details (date, distance, device) and we
          will investigate.
        </p>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Main Support Page
// ---------------------------------------------------------------------------

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.10)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl px-4 py-12">

        {/* ----------------------------------------------------------------- */}
        {/* Header                                                             */}
        {/* ----------------------------------------------------------------- */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight">Support</h1>
          <p className="mt-3 text-lg text-zinc-400">
            We&apos;re here to help you keep running.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/guide">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Read the Guide
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Contact                                                            */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold">Contact Us</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="pt-6 pb-6">
              <p className="text-zinc-400 leading-relaxed">
                For account issues, data questions, or anything else, email us
                directly. We typically reply within{" "}
                <span className="text-white font-medium">1–2 business days</span>.
              </p>
              <a
                href="mailto:chihaohuang@gmail.com"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                chihaohuang@gmail.com
              </a>
            </CardContent>
          </Card>
        </section>

        <Separator className="mb-12 bg-zinc-800" />

        {/* ----------------------------------------------------------------- */}
        {/* FAQ                                                                */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="px-6 py-2">
              {FAQ_ITEMS.map((item) => (
                <FAQItem
                  key={item.question}
                  icon={item.icon}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </CardContent>
          </Card>
        </section>

        <Separator className="mb-12 bg-zinc-800" />

        {/* ----------------------------------------------------------------- */}
        {/* Bug Reporting                                                       */}
        {/* ----------------------------------------------------------------- */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold">Report a Bug</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-zinc-300">
                Help us fix it fast — include these details in your email:
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400 text-sm space-y-4">
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-white">What happened</strong> — a short
                  description of the bug (e.g. &quot;SC balance didn&apos;t update after my
                  run&quot;).
                </li>
                <li>
                  <strong className="text-white">Steps to reproduce</strong> — what did
                  you do right before the bug appeared?
                </li>
                <li>
                  <strong className="text-white">Expected vs. actual</strong> — what
                  should have happened, and what happened instead?
                </li>
                <li>
                  <strong className="text-white">Device &amp; OS</strong> — e.g. iPhone 15 /
                  iOS 17.4.
                </li>
                <li>
                  <strong className="text-white">Screenshot or screen recording</strong>{" "}
                  — attach if possible. This speeds things up significantly.
                </li>
              </ol>

              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                <p className="text-zinc-300 font-medium mb-1">Send your bug report to:</p>
                <a
                  href="mailto:chihaohuang@gmail.com?subject=Bug%20Report%3A%20RunRun"
                  className="text-red-400 hover:underline font-mono text-sm"
                >
                  chihaohuang@gmail.com
                </a>
                <p className="mt-1 text-zinc-500 text-xs">
                  Subject: <span className="text-zinc-400">Bug Report: [short description]</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-zinc-600">
          <p>RunRun © 2026 — Your Sweat, Your Stakes</p>
        </div>
      </div>
    </div>
  );
}
