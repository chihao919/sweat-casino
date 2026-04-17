"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  CloudRain,
  Skull,
  Swords,
  Target,
  TrendingUp,
  Footprints,
  ArrowRight,
  HelpCircle,
  Trophy,
  Coins,
  Timer,
  Snowflake,
  Thermometer,
  Wind,
  ChevronDown,
  Watch,
  Smartphone,
  Heart,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

// -----------------------------------------------------------------------
// FAQ Accordion Item
// -----------------------------------------------------------------------
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-white hover:text-red-400 transition-colors"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 text-zinc-400 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Flow Step (horizontal flowchart node)
// -----------------------------------------------------------------------
function FlowStep({
  icon,
  label,
  color,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center">
      <div
        className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 min-w-[90px] ${color}`}
      >
        {icon}
        <span className="text-xs font-semibold text-center leading-tight">
          {label}
        </span>
      </div>
      {!isLast && (
        <ArrowRight className="mx-2 h-5 w-5 shrink-0 text-zinc-600" />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Vertical Step Card (for setup guides)
// -----------------------------------------------------------------------
function SetupStep({
  step,
  title,
  children,
  color = "bg-red-600",
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-lg font-bold text-white`}
        >
          {step}
        </div>
        <div className="mt-2 h-full w-px bg-zinc-700" />
      </div>
      <div className="pb-8">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="mt-2 text-zinc-400 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Main Guide Page
// -----------------------------------------------------------------------
export default function GuidePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.12)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight">
            🎰 RunRun Guide
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Your sweat. Your stakes. Your game.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login">
              <Button className="bg-red-600 hover:bg-red-700 font-semibold">
                Join Now
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

        {/* ============================================================= */}
        {/* HOW IT WORKS — Flow Diagram                                   */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">How It Works</h2>
          </div>

          {/* Horizontal flow */}
          <Card className="border-zinc-800 bg-zinc-900 overflow-x-auto">
            <CardContent className="py-6">
              <div className="flex items-center justify-center min-w-[600px]">
                <FlowStep
                  icon={<Watch className="h-6 w-6 text-blue-400" />}
                  label="Run with Watch"
                  color="border-blue-800 bg-blue-950/50"
                />
                <FlowStep
                  icon={<Heart className="h-6 w-6 text-pink-400" />}
                  label="Auto Sync to Health"
                  color="border-pink-800 bg-pink-950/50"
                />
                <FlowStep
                  icon={<Smartphone className="h-6 w-6 text-green-400" />}
                  label="Open RunRun App"
                  color="border-green-800 bg-green-950/50"
                />
                <FlowStep
                  icon={<Coins className="h-6 w-6 text-yellow-400" />}
                  label="Earn $SC"
                  color="border-yellow-800 bg-yellow-950/50"
                />
                <FlowStep
                  icon={<Target className="h-6 w-6 text-purple-400" />}
                  label="Bet & Win"
                  color="border-purple-800 bg-purple-950/50"
                  isLast
                />
              </div>
              <p className="mt-4 text-center text-sm text-zinc-500">
                No manual upload. No Strava needed. Just run.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================= */}
        {/* GAME MECHANICS                                                */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Game Mechanics</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* SC Economy */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  $SC Sweat Coins
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  Earn <Badge className="bg-yellow-600/20 text-yellow-400">10 $SC</Badge> per{" "}
                  <Badge variant="secondary">1 km</Badge> run.
                </p>
                <p className="mt-2">
                  Sign up bonus:{" "}
                  <span className="font-semibold text-yellow-400">100 $SC</span>{" "}
                  to get started.
                </p>
              </CardContent>
            </Card>

            {/* Weather Bonus */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <CloudRain className="h-5 w-5 text-blue-400" />
                  Weather Bonus 1.5x
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p className="mb-2">Run in bad weather, earn 1.5x rewards!</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-blue-800 text-blue-400">
                    <CloudRain className="mr-1 h-3 w-3" /> Rain
                  </Badge>
                  <Badge variant="outline" className="border-purple-800 text-purple-400">
                    <Zap className="mr-1 h-3 w-3" /> Thunder
                  </Badge>
                  <Badge variant="outline" className="border-red-800 text-red-400">
                    <Thermometer className="mr-1 h-3 w-3" /> &gt;35°C
                  </Badge>
                  <Badge variant="outline" className="border-cyan-800 text-cyan-400">
                    <Snowflake className="mr-1 h-3 w-3" /> &lt;0°C
                  </Badge>
                  <Badge variant="outline" className="border-teal-800 text-teal-400">
                    <Wind className="mr-1 h-3 w-3" /> &gt;10 m/s
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Survival Tax */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Skull className="h-5 w-5 text-red-500" />
                  Survival Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  Run less than <Badge variant="secondary">5 km</Badge> per week?
                  Lose <span className="font-semibold text-red-400">5%</span> of your balance.
                </p>
                <p className="mt-2">Don&apos;t run = don&apos;t survive 💀</p>
              </CardContent>
            </Card>

            {/* Team Battle */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Swords className="h-5 w-5 text-orange-500" />
                  Team Battle
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  <span className="font-semibold text-red-400">🐂 Red Bulls</span>{" "}
                  vs{" "}
                  <span className="font-semibold text-zinc-200">🐻‍❄️ White Bears</span>
                </p>
                <p className="mt-2">
                  <span className="font-medium text-white">Score</span> = Total KM × Activity Rate
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Every teammate counts. It&apos;s not just about the top runners.
                </p>
              </CardContent>
            </Card>

            {/* Personal Bets */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Target className="h-5 w-5 text-green-500" />
                  Personal Bets
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>Bet on yourself: &quot;I&apos;ll run 20km this week.&quot;</p>
                <p className="mt-2">
                  Win:{" "}
                  <span className="font-semibold text-green-400">1.5x ~ 5.0x</span>{" "}
                  payout. Fail: lose your stake.
                </p>
              </CardContent>
            </Card>

            {/* Betting Pools */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Betting Pools
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>Predict: &quot;Will Red Bulls run 500km this week?&quot;</p>
                <p className="mt-2">
                  Pick <span className="text-green-400">Long</span> or{" "}
                  <span className="text-red-400">Short</span>.
                  Winners split the pool. Zero commission.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Season */}
          <Card className="mt-4 border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Seasons
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p>
                Each season lasts <span className="font-semibold text-white">3 months</span>.
                The winning team earns bonus $SC. Your balance carries over.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="mb-16 bg-zinc-800" />

        {/* ============================================================= */}
        {/* SETUP GUIDE — Flow Diagrams                                   */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <Watch className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">Watch Setup</h2>
          </div>

          {/* Apple Watch Flow */}
          <Card className="mb-6 border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                ⌚ Apple Watch
              </CardTitle>
              <p className="text-sm text-zinc-500">Zero setup needed</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center overflow-x-auto py-4 min-w-[400px]">
                <FlowStep
                  icon={<Watch className="h-5 w-5 text-white" />}
                  label="Run with Apple Watch"
                  color="border-zinc-700 bg-zinc-800"
                />
                <FlowStep
                  icon={<Heart className="h-5 w-5 text-pink-400" />}
                  label="Auto saved to Apple Health"
                  color="border-pink-800 bg-pink-950/50"
                />
                <FlowStep
                  icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
                  label="RunRun reads it"
                  color="border-green-800 bg-green-950/50"
                  isLast
                />
              </div>
              <p className="text-center text-sm text-zinc-500">
                Apple Watch automatically writes to Apple Health. Nothing to configure.
              </p>
            </CardContent>
          </Card>

          {/* Garmin Flow */}
          <Card className="mb-6 border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                🏃 Garmin
              </CardTitle>
              <p className="text-sm text-zinc-500">One-time setup required</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center overflow-x-auto py-4 min-w-[500px]">
                <FlowStep
                  icon={<Watch className="h-5 w-5 text-white" />}
                  label="Run with Garmin"
                  color="border-zinc-700 bg-zinc-800"
                />
                <FlowStep
                  icon={<Download className="h-5 w-5 text-blue-400" />}
                  label="Garmin Connect App"
                  color="border-blue-800 bg-blue-950/50"
                />
                <FlowStep
                  icon={<Heart className="h-5 w-5 text-pink-400" />}
                  label="Sync to Apple Health"
                  color="border-pink-800 bg-pink-950/50"
                />
                <FlowStep
                  icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
                  label="RunRun reads it"
                  color="border-green-800 bg-green-950/50"
                  isLast
                />
              </div>

              <Separator className="my-4 bg-zinc-800" />

              <div className="ml-1">
                <SetupStep step={1} title="Install Garmin Connect" color="bg-blue-600">
                  <p>
                    Download <span className="text-blue-400 font-semibold">Garmin Connect</span> from
                    App Store. Pair your Garmin watch.
                  </p>
                </SetupStep>
                <SetupStep step={2} title="Enable Apple Health Sync" color="bg-blue-600">
                  <p>Open Garmin Connect:</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300">More (⋯)</Badge>
                    <ArrowRight className="h-3 w-3 text-zinc-600" />
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300">Settings</Badge>
                    <ArrowRight className="h-3 w-3 text-zinc-600" />
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300">Health</Badge>
                    <ArrowRight className="h-3 w-3 text-zinc-600" />
                    <Badge variant="outline" className="border-green-700 text-green-400">Enable Apple Health</Badge>
                  </div>
                  <p className="mt-2">Allow all permissions when prompted.</p>
                </SetupStep>
                <SetupStep step={3} title="Verify" color="bg-blue-600">
                  <p>
                    Go for a run. After syncing to Garmin Connect, check iPhone{" "}
                    <span className="text-pink-400 font-semibold">Health</span> app
                    to confirm the workout appears. Done!
                  </p>
                </SetupStep>
              </div>
            </CardContent>
          </Card>

          {/* No Watch */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                📱 No Watch? No Problem.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center overflow-x-auto py-4 min-w-[400px]">
                <FlowStep
                  icon={<Smartphone className="h-5 w-5 text-white" />}
                  label="Run with any app"
                  color="border-zinc-700 bg-zinc-800"
                />
                <FlowStep
                  icon={<Heart className="h-5 w-5 text-pink-400" />}
                  label="Writes to Health"
                  color="border-pink-800 bg-pink-950/50"
                />
                <FlowStep
                  icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
                  label="RunRun reads it"
                  color="border-green-800 bg-green-950/50"
                  isLast
                />
              </div>
              <p className="text-center text-sm text-zinc-500">
                Use Nike Run Club, Adidas Running, or any app that writes to Apple Health / Health Connect.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="mb-16 bg-zinc-800" />

        {/* ============================================================= */}
        {/* GETTING STARTED                                               */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <Footprints className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">Getting Started</h2>
          </div>

          {/* Onboarding flow */}
          <Card className="mb-6 border-zinc-800 bg-zinc-900 overflow-x-auto">
            <CardContent className="py-6">
              <div className="flex items-center justify-center min-w-[500px]">
                <FlowStep
                  icon={<Download className="h-5 w-5 text-blue-400" />}
                  label="Download App"
                  color="border-blue-800 bg-blue-950/50"
                />
                <FlowStep
                  icon={<ArrowRight className="h-5 w-5 text-white" />}
                  label="Google Login"
                  color="border-zinc-700 bg-zinc-800"
                />
                <FlowStep
                  icon={<Heart className="h-5 w-5 text-pink-400" />}
                  label="Allow Health Access"
                  color="border-pink-800 bg-pink-950/50"
                />
                <FlowStep
                  icon={<Swords className="h-5 w-5 text-orange-400" />}
                  label="Join Team"
                  color="border-orange-800 bg-orange-950/50"
                />
                <FlowStep
                  icon={<Footprints className="h-5 w-5 text-green-400" />}
                  label="Run!"
                  color="border-green-800 bg-green-950/50"
                  isLast
                />
              </div>
            </CardContent>
          </Card>

          <div className="ml-1">
            <SetupStep step={1} title="Download RunRun App">
              <p>Get RunRun from the App Store. It&apos;s free.</p>
            </SetupStep>
            <SetupStep step={2} title="Sign in with Google">
              <p>One-tap Google login. You&apos;ll receive <span className="text-yellow-400 font-semibold">100 $SC</span> as a welcome bonus.</p>
            </SetupStep>
            <SetupStep step={3} title="Allow Health Data Access">
              <p>The app will ask to read your running data from Apple Health or Health Connect. Tap &quot;Allow&quot; — this is how we track your runs automatically.</p>
            </SetupStep>
            <SetupStep step={4} title="Get Assigned to a Team">
              <p>
                You&apos;ll be auto-assigned to{" "}
                <span className="text-red-400 font-semibold">🐂 Red Bulls</span> or{" "}
                <span className="text-white font-semibold">🐻‍❄️ White Bears</span>.
                No switching — your fate is sealed.
              </p>
            </SetupStep>
            <SetupStep step={5} title="Run & Earn">
              <p>Every kilometer earns $SC. Place bets, climb the leaderboard, and keep your team ahead. Don&apos;t forget — skip a week and the survival tax hits.</p>
            </SetupStep>
          </div>
        </section>

        <Separator className="mb-16 bg-zinc-800" />

        {/* ============================================================= */}
        {/* FAQ                                                           */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">FAQ</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="px-6 py-2">
              <FAQItem
                question="Can I convert $SC to real money?"
                answer="No. $SC is in-game virtual currency only. It has no real-world monetary value."
              />
              <FAQItem
                question="Can I switch teams?"
                answer="No. Team assignment is permanent. This is the 'shared fate' design — you win or lose together."
              />
              <FAQItem
                question="Do I need Strava?"
                answer="No! RunRun reads directly from Apple Health. Any watch or running app that writes to Health will work."
              />
              <FAQItem
                question="How does weather bonus work?"
                answer="The system checks real-time weather at your run location. Rain, thunderstorm, extreme heat (>35°C), extreme cold (<0°C), strong wind (>10 m/s), or snow triggers a 1.5x bonus. Multiple conditions don't stack."
              />
              <FAQItem
                question="When is survival tax charged?"
                answer="Every Monday at midnight. If you ran less than 5km the previous week, you lose 5% of your $SC balance."
              />
              <FAQItem
                question="What if I lose a bet?"
                answer="Personal bets: your stake is gone. Pool bets: your entry goes to the winners. But keep running — you'll earn it back!"
              />
              <FAQItem
                question="How are odds calculated?"
                answer="Personal bets: based on your history — harder goals = higher odds (1.5x–5.0x). Pool bets: dynamic odds based on total pool distribution (parimutuel)."
              />
              <FAQItem
                question="What are season rewards?"
                answer="Each season is 3 months. The team with the higher adjusted score (total KM × activity rate) wins. All members of the winning team earn bonus $SC."
              />
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h3 className="mb-4 text-xl font-bold">Ready to bet your sweat?</h3>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 font-bold text-lg px-8"
            >
              🎰 Join RunRun Now
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-zinc-600">
          <p>RunRun © 2026 — Your Sweat, Your Stakes</p>
        </div>
      </div>
    </div>
  );
}
