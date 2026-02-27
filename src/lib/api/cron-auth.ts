import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies the Authorization header sent by Vercel Cron Jobs.
 *
 * Vercel automatically attaches "Authorization: Bearer <CRON_SECRET>" to every
 * scheduled cron invocation. We validate it here to prevent unauthorized callers
 * from triggering expensive cron operations.
 *
 * Returns null when the request is authorized, or a 401 NextResponse when not.
 */
export function verifyCronSecret(
  request: NextRequest
): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron-auth] CRON_SECRET environment variable is not set");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${cronSecret}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Authorized — caller may proceed
  return null;
}
