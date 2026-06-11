import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete Account — RunRun",
  description: "Request deletion of your RunRun account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.08)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl px-6 py-14">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to RunRun
        </Link>

        <h1 className="text-4xl font-black tracking-tight">Delete Account</h1>
        <p className="mt-2 text-muted-foreground">RunRun — Sweat Casino</p>

        <div className="mt-10 space-y-8">
          {/* Steps */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              How to Delete Your Account
            </h2>
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                You can delete your RunRun account directly from the app or by
                contacting us via email. Follow one of the methods below:
              </p>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-zinc-200">
                  Method 1: In-App Deletion
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground leading-relaxed">
                  <li>Open the RunRun app on your device.</li>
                  <li>
                    Tap <strong className="text-white">Profile</strong> (bottom
                    navigation bar).
                  </li>
                  <li>
                    Scroll to the bottom and find the{" "}
                    <strong className="text-red-400">Danger Zone</strong>{" "}
                    section.
                  </li>
                  <li>
                    Tap{" "}
                    <strong className="text-red-400">Delete Account</strong>.
                  </li>
                  <li>
                    Confirm by tapping{" "}
                    <strong className="text-red-400">Confirm Delete</strong>.
                    Your account and all data will be permanently removed.
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-zinc-200">
                  Method 2: Email Request
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Send an email to{" "}
                  <a
                    href="mailto:chihaohuang@gmail.com?subject=Delete%20Account%20Request%20%E2%80%94%20RunRun"
                    className="text-red-400 hover:underline"
                  >
                    chihaohuang@gmail.com
                  </a>{" "}
                  with the subject line{" "}
                  <strong className="text-white">
                    &quot;Delete Account Request — RunRun&quot;
                  </strong>
                  . Include the email address associated with your account. We
                  will process your request within{" "}
                  <strong className="text-white">7 business days</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Data deletion details */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              What Data Is Deleted
            </h2>
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                When you delete your account, the following data is{" "}
                <strong className="text-white">permanently deleted</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Your profile information (display name, avatar, email)</li>
                <li>All running activity records</li>
                <li>Sweat Currency ($SC) balance and transaction history</li>
                <li>Betting history (personal bets and pool bets)</li>
                <li>Team assignment and leaderboard data</li>
                <li>Referral records</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mt-4">
                The following data may be{" "}
                <strong className="text-white">retained</strong> for a limited
                period:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  Server access logs (Vercel) — retained for up to{" "}
                  <strong className="text-white">30 days</strong> for
                  operational purposes
                </li>
                <li>
                  Records required by law or to resolve outstanding disputes
                </li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mt-4">
                Account deletion is{" "}
                <strong className="text-red-400">irreversible</strong>. Once
                deleted, your data cannot be recovered.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
            <div className="rounded-lg border border-border bg-card px-5 py-4 text-foreground">
              <p className="font-semibold text-white">RunRun Support</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href="mailto:chihaohuang@gmail.com"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  chihaohuang@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-14 text-center text-sm text-zinc-600">
          <p>RunRun &copy; 2026 &mdash; Your Sweat, Your Stakes</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-muted-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/support"
              className="hover:text-muted-foreground transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
