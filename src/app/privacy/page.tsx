import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — RunRun",
  description: "Privacy Policy for the RunRun gamified running app.",
};

// ---------------------------------------------------------------------------
// Section heading component
// ---------------------------------------------------------------------------
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-3 text-xl font-bold text-white">{children}</h2>
  );
}

// ---------------------------------------------------------------------------
// Sub-heading component
// ---------------------------------------------------------------------------
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 mb-2 text-base font-semibold text-zinc-200">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Prose paragraph
// ---------------------------------------------------------------------------
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 leading-relaxed text-zinc-400">{children}</p>;
}

// ---------------------------------------------------------------------------
// Unordered list
// ---------------------------------------------------------------------------
function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mb-4 list-disc list-inside space-y-1 text-zinc-400">
      {children}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Highlighted callout box (used for HealthKit notice)
// ---------------------------------------------------------------------------
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-pink-800/50 bg-pink-950/30 px-5 py-4 text-zinc-300 leading-relaxed">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------
function Divider() {
  return <hr className="my-8 border-zinc-800" />;
}

// ---------------------------------------------------------------------------
// Main Privacy Policy Page
// ---------------------------------------------------------------------------
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glow — matches the rest of the app */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.08)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl px-6 py-14">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="mb-10">
          <Link
            href="/"
            className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Back to RunRun
          </Link>
          <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-zinc-500">
            Effective date: April 8, 2026 &nbsp;&middot;&nbsp; Last updated: April 8, 2026
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Introduction                                                     */}
        {/* ---------------------------------------------------------------- */}
        <P>
          Welcome to <strong className="text-white">RunRun</strong> (&quot;the App&quot;,
          &quot;we&quot;, &quot;our&quot;). RunRun is a gamified running app that turns
          your workouts into a competitive, team-based experience. This Privacy
          Policy explains what personal data we collect, how we use it, and the
          choices you have regarding your information.
        </P>
        <P>
          By downloading or using RunRun, you agree to the practices described in
          this policy. If you do not agree, please stop using the App and contact
          us to request deletion of your account.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 1. Data We Collect                                               */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>1. Data We Collect</SectionHeading>

        <SubHeading>1.1 Account & Profile Information</SubHeading>
        <UL>
          <li>Display name and profile picture (from your Google account via Supabase Auth)</li>
          <li>Email address</li>
          <li>Team assignment (Red Bulls or White Bears)</li>
          <li>Account creation date</li>
        </UL>

        <SubHeading>1.2 Health & Fitness Data (HealthKit / Health Connect)</SubHeading>
        <P>
          On iOS, RunRun requests read-only access to Apple HealthKit for the
          following data type only:
        </P>
        <UL>
          <li>Running workout distance (kilometers per activity)</li>
        </UL>
        <SubHeading>1.3 Strava Activity Data (Optional)</SubHeading>
        <P>
          If you choose to connect your Strava account, we request access to:
        </P>
        <UL>
          <li>Your public Strava profile name</li>
          <li>Activity list (run type, distance, date, elapsed time)</li>
        </UL>
        <P>
          Strava connection is optional. You can use RunRun solely through Apple
          Health or Health Connect without connecting Strava.
        </P>

        <SubHeading>1.4 App Usage Data</SubHeading>
        <UL>
          <li>Sweat Currency ($SC) balance and transaction history</li>
          <li>Betting history (personal bets and pool bets)</li>
          <li>Leaderboard rankings and weekly running totals</li>
          <li>In-app purchase or shop activity (if applicable)</li>
        </UL>

        <SubHeading>1.5 Device & Technical Data</SubHeading>
        <UL>
          <li>Device type and operating system version (for crash diagnostics)</li>
          <li>App version</li>
          <li>LINE user ID (if you connect LINE for push notifications)</li>
        </UL>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 2. How We Use Your Data                                          */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>2. How We Use Your Data</SectionHeading>

        <UL>
          <li>
            <strong className="text-zinc-200">Tracking your runs</strong> — converting
            kilometers into Sweat Currency ($SC) and updating your weekly stats
          </li>
          <li>
            <strong className="text-zinc-200">Game mechanics</strong> — calculating
            weather bonuses, applying the weekly survival tax, resolving personal bets
            and pool bets
          </li>
          <li>
            <strong className="text-zinc-200">Leaderboards & team scoring</strong> —
            displaying your stats on team and global leaderboards
          </li>
          <li>
            <strong className="text-zinc-200">Push notifications</strong> — sending
            LINE messages about bet results, survival tax warnings, and weekly recaps
          </li>
          <li>
            <strong className="text-zinc-200">Authentication & security</strong> —
            managing your login session via Supabase
          </li>
          <li>
            <strong className="text-zinc-200">App improvement</strong> — diagnosing
            crashes and improving performance (no third-party analytics SDK is used)
          </li>
        </UL>

        <P>
          We do <strong className="text-white">not</strong> use your data for advertising,
          profiling, or any purpose beyond operating and improving RunRun.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 3. Data Sharing                                                  */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>3. Data Sharing</SectionHeading>

        <P>
          We do not sell, rent, or trade your personal data. Data is shared only
          in the following limited circumstances:
        </P>

        <SubHeading>3.1 Service Providers</SubHeading>
        <UL>
          <li>
            <strong className="text-zinc-200">Supabase</strong> — our backend database
            and authentication provider. Your profile and game data are stored on
            Supabase servers (hosted on AWS).
          </li>
          <li>
            <strong className="text-zinc-200">Strava API</strong> — only if you
            explicitly connect your Strava account. We exchange OAuth tokens with
            Strava to fetch your running activities. We do not share your data back
            to Strava beyond what is required for the OAuth flow.
          </li>
          <li>
            <strong className="text-zinc-200">LINE Messaging API</strong> — your LINE
            user ID is used solely to send you push notifications from RunRun. We do
            not share any other personal data with LINE.
          </li>
          <li>
            <strong className="text-zinc-200">Vercel</strong> — our hosting platform.
            Request logs may be retained by Vercel for a short period for operational
            purposes.
          </li>
        </UL>

        <SubHeading>3.2 Legal Requirements</SubHeading>
        <P>
          We may disclose data if required by law, court order, or governmental
          authority, or when we believe disclosure is necessary to protect the
          safety of any person or to prevent fraud.
        </P>

        <SubHeading>3.3 No Sale of Data</SubHeading>
        <P>
          We do not sell personal data to any third party, including data brokers
          or advertising networks.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 4. Apple HealthKit — Special Notice                              */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>4. Apple HealthKit — Special Notice</SectionHeading>

        <Callout>
          <strong className="text-pink-300">Important notice required by Apple:</strong>
          <br /><br />
          RunRun uses Apple HealthKit solely to read running workout distance data.
          This data is used only to power core app features (tracking runs, earning
          $SC, leaderboards).
          <br /><br />
          <strong>We will never:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Share HealthKit data with third parties for any purpose</li>
            <li>Use HealthKit data for advertising or marketing</li>
            <li>Use HealthKit data to calculate insurance rates or for employment decisions</li>
            <li>Sell HealthKit data under any circumstances</li>
            <li>Use HealthKit data beyond the minimum required to operate the App</li>
          </ul>
          <br />
          HealthKit data is never uploaded to our servers. It is read locally on
          your device and the resulting numeric value (kilometers run) is sent to
          our backend. Raw HealthKit records remain on your device only.
        </Callout>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 5. Data Retention                                                */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>5. Data Retention</SectionHeading>

        <P>
          We retain your account and game data for as long as your account is
          active. If you delete your account, we will remove your personal data
          within <strong className="text-white">30 days</strong>, except where
          retention is required by law or to resolve outstanding disputes.
        </P>

        <UL>
          <li>
            Running activity records (distance per day) are retained indefinitely
            while your account is active, as they determine your all-time stats
          </li>
          <li>
            Betting history is retained for the duration of your account
          </li>
          <li>
            Server access logs (Vercel) are typically retained for up to 30 days
          </li>
        </UL>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 6. Your Rights                                                   */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>6. Your Rights</SectionHeading>

        <P>
          Regardless of where you are located, you have the following rights
          regarding your personal data:
        </P>

        <UL>
          <li>
            <strong className="text-zinc-200">Access</strong> — request a copy of the
            personal data we hold about you
          </li>
          <li>
            <strong className="text-zinc-200">Correction</strong> — ask us to correct
            inaccurate data
          </li>
          <li>
            <strong className="text-zinc-200">Deletion</strong> — request deletion of
            your account and all associated personal data
          </li>
          <li>
            <strong className="text-zinc-200">Data portability</strong> — request an
            export of your running history and game data in JSON format
          </li>
          <li>
            <strong className="text-zinc-200">Disconnect Strava</strong> — revoke
            Strava access at any time from the Profile page or directly from your
            Strava settings
          </li>
          <li>
            <strong className="text-zinc-200">Revoke Health access</strong> — remove
            RunRun&apos;s access to Apple Health or Health Connect at any time in your
            device Settings
          </li>
        </UL>

        <P>
          To exercise any of these rights, contact us at the email address below.
          We will respond within 30 days.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 7. Children's Privacy                                            */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>7. Children&apos;s Privacy</SectionHeading>

        <P>
          RunRun is not directed at children under the age of 13 (or 16 in the EU).
          We do not knowingly collect personal data from children. If you believe
          a child has provided us with personal data, please contact us immediately
          and we will delete it.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 8. Security                                                      */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>8. Security</SectionHeading>

        <P>
          We take reasonable technical and organizational measures to protect your
          data, including encrypted connections (HTTPS/TLS), Supabase row-level
          security policies, and limited employee access. However, no system is
          completely secure, and we cannot guarantee absolute security.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 9. Updates to This Policy                                       */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>9. Updates to This Policy</SectionHeading>

        <P>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will update the &quot;Last updated&quot; date at the top
          of this page and, where appropriate, send a notification via LINE or
          email. Continued use of the App after changes become effective
          constitutes your acceptance of the revised policy.
        </P>

        <Divider />

        {/* ---------------------------------------------------------------- */}
        {/* 10. Contact                                                      */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeading>10. Contact Us</SectionHeading>

        <P>
          If you have any questions, concerns, or requests regarding this Privacy
          Policy or your personal data, please contact:
        </P>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4 text-zinc-300">
          <p className="font-semibold text-white">chihaohuang</p>
          <p className="mt-1">
            Email:{" "}
            <a
              href="mailto:chihaohuang@gmail.com"
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              chihaohuang@gmail.com
            </a>
          </p>
          <p className="mt-1 text-zinc-500">Taipei, Taiwan</p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-14 text-center text-sm text-zinc-600">
          <p>RunRun &copy; 2026 &mdash; Your Sweat, Your Stakes</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/guide" className="hover:text-zinc-400 transition-colors">
              Guide
            </Link>
            <Link href="/login" className="hover:text-zinc-400 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
