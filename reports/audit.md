# RunRun Project Audit Report

**Date:** 2026-04-03  
**Auditor:** Claude (read-only, no source code modified)

---

## 1. Build (`npm run build`)

**Status: PASS** (with warnings)

The production build completed successfully. All 37 routes compiled and static pages generated.

### Warnings

| Warning | Location | Severity |
|---|---|---|
| Workspace root lockfile ambiguity | Next.js config | Low |
| **`middleware` file convention is deprecated — use `proxy` instead** | `src/middleware.ts` | **Medium** |
| Edge runtime disables static generation | Unspecified page(s) | Low |

**Key warning detail:**
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```
Next.js 16 has renamed `middleware` → `proxy`. The file `src/middleware.ts` will still function but is flagged every build.

---

## 2. TypeScript (`npx tsc --noEmit`)

**Status: FAIL — 4 type errors, all in test files**

All errors are in `src/__tests__/personal-betting.test.ts` (lines 91, 96, 101, 106).

### Root Cause

`PersonalBet` type in `src/types/index.ts` requires `resolved_at: string | null` as a **non-optional** field:

```ts
export interface PersonalBet {
  // ...
  resolved_at: string | null  // required
  created_at: string
}
```

The test fixtures omit `resolved_at`, causing 4 identical errors:
```
Property 'resolved_at' is missing in type '{ ... }' but required in type 'PersonalBet'.
```

**Fix (not applied):** Add `resolved_at: null` to each test fixture object, or make the field optional (`resolved_at?: string | null`) in the interface.

> **Note:** These errors are in `__tests__` only — they do not affect the production build (Next.js build does not type-check test files).

---

## 3. `src/middleware.ts` — Deprecated Patterns

**Status: DEPRECATED (Next.js 16)**

File path: `src/middleware.ts`

The file itself is well-structured — clean route guards, redirect logic, and session refresh via Supabase. However:

- **The `middleware.ts` filename convention is deprecated** in Next.js 16. The framework now expects `proxy.ts` (or `proxy.js`) instead.
- The `config.matcher` pattern is standard and correct.
- No deprecated API calls detected inside the file (no `req.cookies`, `NextResponse.rewrite` for auth, etc.).
- Uses the modern `NextRequest` / `NextResponse` API correctly.

**Action required:** Rename `src/middleware.ts` → `src/proxy.ts` (and update any imports if needed) per [Next.js migration docs](https://nextjs.org/docs/messages/middleware-to-proxy).

---

## 4. `src/types/index.ts` — side_a/side_b vs long/short Inconsistency

**Status: NO INCONSISTENCY FOUND**

The `BettingPool` interface uses `side_a_*` / `side_b_*` naming consistently:

```ts
export interface BettingPool {
  side_a_total: number
  side_b_total: number
  side_a_label: string
  side_b_label: string
  winning_side: PoolSide | null
}

export enum PoolSide {
  A = "a",
  B = "b",
}

export interface PoolEntry {
  side: PoolSide
  // ...
}
```

There is no usage of `long` / `short` terminology anywhere in `src/types/index.ts`. The naming is consistent throughout the type definitions.

---

## 5. `console.log` Audit (excluding `__tests__`)

**Status: 14 instances found across 4 files**

| File | Lines | Count | Context |
|---|---|---|---|
| `src/app/api/strava/sync/route.ts` | 69, 72, 75, 104, 110, 124, 136, 137, 138, 210 | **10** | Debug logging for token refresh, activity sync |
| `src/app/auth/callback/route.ts` | 55, 68 | 2 | Auth success + referral processed |
| `src/app/(protected)/profile/page.tsx` | 414 | 1 | Client-side debug for strava/sync response |
| `src/app/api/line/webhook/route.ts` | 340 | 1 | LINE Bot group join event |

### Assessment

- The heaviest offender is `strava/sync/route.ts` with 10 `console.log` calls — these are detailed debug traces that will appear in Vercel function logs on every sync.
- `auth/callback/route.ts` logs the full debug context object including user data (`debugCtx`) — potential **PII exposure in logs** (line 55).
- The `profile/page.tsx` client-side log (line 414) will appear in users' browser consoles.
- None of these are security-critical but they should be replaced with a structured logger or removed before production hardening.

---

## Summary Table

| Check | Result | Priority |
|---|---|---|
| `npm run build` | PASS with warnings | Medium |
| `npx tsc --noEmit` | 4 errors (test files only) | Low |
| `middleware.ts` deprecated pattern | Yes — filename deprecated in Next.js 16 | Medium |
| `side_a/side_b` vs `long/short` | No inconsistency found | — |
| `console.log` in src/ | 14 instances in 4 files | Low–Medium |

## Recommended Actions (priority order)

1. **Rename `src/middleware.ts` → `src/proxy.ts`** to silence the build warning and comply with Next.js 16.
2. **Fix test fixtures** in `src/__tests__/personal-betting.test.ts` — add `resolved_at: null` to 4 mock objects.
3. **Review `auth/callback/route.ts` line 55** — `debugCtx` may contain PII; remove or redact before production.
4. **Replace debug `console.log` calls in `strava/sync`** with a proper logger or remove them to reduce log noise in Vercel.
5. **Remove client-side `console.log` in `profile/page.tsx` line 414** — visible to end users in browser DevTools.
