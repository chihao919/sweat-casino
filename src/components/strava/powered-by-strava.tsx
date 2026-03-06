"use client";

/**
 * "Powered by Strava" badge per Strava Brand Guidelines.
 * https://developers.strava.com/guidelines/
 *
 * Requirements:
 * - Must display "Powered by Strava" when using Strava data
 * - Use official Strava orange (#FC4C02) for the wordmark
 * - Link to strava.com
 * - Do not modify the logo proportions
 */
export function PoweredByStrava({ className }: { className?: string }) {
  return (
    <a
      href="https://www.strava.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity ${className ?? ""}`}
      aria-label="Powered by Strava"
    >
      <span className="text-[11px] text-neutral-500">powered by</span>
      {/* Strava logo mark + text wordmark */}
      <svg
        viewBox="0 0 16 24"
        className="h-3.5"
        fill="#FC4C02"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6.6 16.3L4.6 12h-4L6.6 24l6-12h-4l-2 4.3z" opacity="0.6" />
        <path d="M6.6 0L0 12h4l2.6-5.3L9.2 12h4L6.6 0z" />
      </svg>
      <span className="text-xs font-bold tracking-wide text-[#FC4C02]">STRAVA</span>
    </a>
  );
}

/**
 * "Connect with Strava" button per Strava Brand Guidelines.
 * Use this on the profile/settings page for the OAuth connect flow.
 */
export function ConnectWithStrava({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-[#FC4C02] px-5 font-semibold text-white hover:bg-[#e04402] transition-colors ${className ?? ""}`}
    >
      {/* Strava logo mark */}
      <svg
        viewBox="0 0 16 24"
        className="h-5"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Strava logo"
      >
        <path d="M6.6 16.3L4.6 12h-4L6.6 24l6-12h-4l-2 4.3z" opacity="0.6" />
        <path d="M6.6 0L0 12h4l2.6-5.3L9.2 12h4L6.6 0z" />
      </svg>
      Connect with Strava
    </a>
  );
}
