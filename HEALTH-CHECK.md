# RunRun Project Health Check Report

**Date:** 2026-04-03
**Analyst:** Claude (A君 Sub-Agent)
**Project:** RunRun — Gamified Fitness Betting App
**Stack:** Next.js 16 + Supabase + Capacitor (iOS/Android)
**Live URL:** https://runrun-plum.vercel.app

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Build | PASS | Clean build, no TypeScript errors |
| Tests | PASS | 185/185 tests passing |
| API Security | PARTIAL | 2 unprotected endpoints identified |
| Database Schema | WARN | Schema drift between migrations |
| Capacitor / Mobile | PASS | HealthKit entitlement configured |
| Environment Variables | WARN | .env.local lacks actual secrets (Vercel-managed) |
| Code Quality | WARN | `console.log` left in strava/sync, TODO in line/webhook |

---

## 1. Build Health

**Status: PASS**

`npm run build` completed successfully with no errors. TypeScript compilation passed. All 37 routes rendered successfully.

### Notable Build Warning
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
The `middleware.ts` file should be renamed to `proxy.ts` per Next.js 16 conventions. This is a deprecation warning, not a breaking error.

### Route Inventory (20 API routes)
- `/api/betting/personal` — personal bet CRUD
- `/api/betting/pools` — pool betting CRUD
- `/api/cron/*` (5 routes) — scheduled jobs
- `/api/health/sync` — HealthKit/Health Connect sync
- `/api/line/*` (3 routes) — LINE bot integration
- `/api/mock/activity` — dev test endpoint
- `/api/og/*` (3 routes) — OG image generation
- `/api/profile/avatar` — avatar upload
- `/api/public/players` — public player list
- `/api/referral/process` — referral rewards
- `/api/strava/*` (4 routes) — Strava OAuth + sync + webhook
- `/api/test/seed-users` — test data seeder

---

## 2. Code Quality

### console.log Left in Production Code

**Critical: `/src/app/api/strava/sync/route.ts`** — Multiple `console.log` statements left from debugging, and they expose sensitive debug info (token expiry times, activity IDs, Strava tokens state) in production logs:

- Line 69: logs token expiry details
- Line 72: logs "Refreshing expired token..."
- Line 75: logs new token expiry
- Line 104: logs date range query
- Line 110-117: logs all raw Strava activity data (names, distances, dates)
- Line 124: logs filter results
- Line 136-138: logs DB IDs and Strava IDs

Additionally, the response body of `strava/sync` includes a `debug` field that leaks internal implementation details (token expiry, Strava athlete ID, all activity IDs) directly to the frontend client. This should be removed for production.

**`console.warn`/`console.error`** usage throughout other routes is acceptable for server-side error logging.

### TODO Comments Found

- `/src/app/api/line/webhook/route.ts` line 341: `// TODO: persist group ID to database for push notifications` — the `saveGroupId()` function only logs the group ID, never stores it. LINE push notifications to groups will not work until this is implemented.

### Hardcoded Values

- `/src/app/api/strava/connect/route.ts` line 14: Hardcoded fallback `"https://runrun-plum.vercel.app/api/strava/callback"` — acceptable as a fallback when env var is missing.
- `/src/app/api/strava/callback/route.ts` line 7: Same hardcoded production URL as fallback — acceptable pattern.
- `/src/app/api/line/webhook/route.ts` line 244: Hardcoded `"3/11（週三）正式開賽！"` — this season start date is hardcoded in the LINE bot reply. Should be read from the active season DB record.
- `/src/app/api/cron/season-check/route.ts` line 7: `const SEASON_WIN_BONUS = 500` — season bonus is a hardcoded constant. Consider moving to the season `config` JSONB field for flexibility.

---

## 3. API Routes Security

### Authentication Summary

| Endpoint | Method | Auth Required | Mechanism |
|----------|--------|--------------|-----------|
| `betting/personal` | GET | YES | `supabase.auth.getUser()` |
| `betting/personal` | POST | YES | `supabase.auth.getUser()` |
| `betting/pools` | GET | **NO** | None — uses admin client directly |
| `betting/pools` | POST | YES | `supabase.auth.getUser()` |
| `betting/pools` | PUT | YES | `supabase.auth.getUser()` |
| `cron/*` (5 routes) | GET | YES | `verifyCronSecret()` / Bearer token |
| `health/sync` | POST | YES | `supabase.auth.getUser()` |
| `line/push` | POST | YES | `CRON_SECRET` Bearer token |
| `line/setup-richmenu` | POST | YES | `CRON_SECRET` Bearer token |
| `line/webhook` | POST | **NO** | Signature verified but NOT enforced |
| `mock/activity` | POST | Partial | Dev: open; Prod: `CRON_SECRET` |
| `og/*` (3 routes) | GET | **NO** | Intentionally public |
| `profile/avatar` | POST | YES | `supabase.auth.getUser()` |
| `public/players` | GET | **NO** | Intentionally public |
| `referral/process` | POST | YES | `supabase.auth.getUser()` |
| `strava/callback` | GET | Partial | Session cookie OR state param |
| `strava/connect` | GET | **NO** | Redirects to Strava OAuth |
| `strava/sync` | POST | YES | `supabase.auth.getUser()` |
| `strava/webhook` | POST | Partial | Verify token on GET; POST unguarded |
| `test/seed-users` | POST | YES | `CRON_SECRET` Bearer token |

### Security Issues Found

**Issue 1: `betting/pools` GET — Unauthenticated Data Access**
The GET handler for `/api/betting/pools` uses the admin client (`createAdminClient()`) directly without any authentication check. Any unauthenticated request can list all betting pools. This may be intentional (public pool browsing before login) but is inconsistent with the RLS policies that require `authenticated` role. Recommend adding auth check or noting as an explicit design decision.

**Issue 2: LINE Webhook Signature Not Enforced**
`/src/app/api/line/webhook/route.ts` (lines 36-44): The HMAC-SHA256 signature is computed and compared, but on mismatch it only logs a warning (`console.warn`) and continues processing. This means anyone can forge LINE webhook events and trigger bot responses. The signature check should return 401 on mismatch.

**Issue 3: `strava/webhook` POST — No Verification**
The Strava webhook POST handler has no signature verification. While Strava does not use HMAC on POST events (unlike some providers), the handler accepts any JSON payload matching `{object_type: "activity", aspect_type: "create", owner_id: ...}` and will query the DB for a matching profile. Low severity since it requires knowing a valid Strava athlete ID.

**No SQL Injection Risks Found**
All database queries use the Supabase client's parameterized query builder — no raw SQL strings with user input concatenation. The RPC calls use named parameters (`p_user_id`, `p_amount`, etc.) which are inherently safe.

---

## 4. Database Schema

### Migration File Order
```
001_base_tables.sql          — seasons, teams, weather_records
002_profiles_activities.sql  — profiles, activities
003_betting_system.sql       — sc_transactions, personal_bets, betting_pools, pool_entries, weekly_snapshots
004_functions_rls.sql        — functions, triggers, all RLS policies
005_fix_trigger.sql          — hotfix: recreate handle_new_user
006_avatar_from_oauth.sql    — hotfix: add avatar_url to signup
007_fix_new_user_trigger.sql — final fix: ON CONFLICT + schema-qualified names
008_gamification_system.sql  — skins, items, user_skins, user_inventory, loot_drops
009_referral_system.sql      — referral_count, referred_by columns, process_referral_reward()
```

### Schema Drift Warning: betting_pools (CRITICAL)

Migration `003` and the API code (`betting/pools/route.ts`) define **completely different schemas** for `betting_pools`:

| Field | Migration 003 | API Code |
|-------|--------------|----------|
| Sides | `long_total`, `short_total` | `side_a_total`, `side_b_total` |
| Side values | `'long'`, `'short'` | `'a'`, `'b'` |
| Pool types | `'team_distance'`, `'team_activity'`, `'individual'`, `'custom'` | `'team_win'`, `'personal_km'`, `'weekly_streak'` |
| Resolution | `resolve_date`, `actual_value`, `winning_side IN ('long','short')` | `lock_at`, `resolve_at`, `winning_side IN ('a','b')` |
| Status values | `'open'`, `'closed'`, `'resolved'`, `'cancelled'` | `'open'`, `'settled'` |

Similarly, `pool_entries` in migration 003 uses `side IN ('long', 'short')` while the code uses `side IN ('a', 'b')`.

**This means the betting pools feature will fail at runtime if the DB was created from migration 003 and the code was updated without a new migration.** A migration (likely applied directly to Supabase without being committed) must have updated these tables. The committed migrations are out of sync with the live schema.

### Personal Bets Schema Drift

Migration 003 defines `personal_bets` with columns `start_date`/`end_date` and status `'active'/'won'/'lost'/'cancelled'`, but the API code uses `period_start`/`period_end` and `BetStatus.PENDING`. Same issue as above — the live schema differs from committed migrations.

### Missing RLS Policies

Tables without write-protection RLS policies (only SELECT policies exist):
- `betting_pools` — UPDATE and DELETE are unprotected at DB level (admin client bypasses RLS in API, but direct DB access has no write protection)
- `weekly_snapshots` — no INSERT/UPDATE policies (cron uses admin client, acceptable)
- `weather_records` — no INSERT policy (only admin inserts, acceptable)
- `skins`, `items` — no INSERT/UPDATE/DELETE policies (admin-managed, acceptable)
- `user_skins`, `user_inventory`, `loot_drops` — no INSERT policies (server-side only, acceptable)

### Tables With Proper Indexes
- `activities`: indexed on `user_id`, `start_date`, `season_id` — good
- `sc_transactions`: indexed on `user_id` — good
- `personal_bets`: indexed on `user_id`, `status` — good

### Tables Missing Indexes
- `betting_pools`: no index on `status` or `resolve_at` — pool resolution cron will do full table scans as pools grow
- `pool_entries`: no index on `pool_id` — pool payout queries will be slow at scale
- `profiles`: no index on `team_id` — team aggregation queries used by LINE bot and leaderboard will be slow

---

## 5. Capacitor / Mobile

**Status: PASS (with notes)**

### `capacitor.config.ts`
- `appId`: `com.runrun.app` — properly set
- `webDir`: `out` — requires Next.js static export mode (`output: 'export'` in next.config.ts). **The current `next.config.ts` likely uses server rendering** (all routes show as `ƒ Dynamic` in the build output), which means Capacitor local bundle mode will not work. The config uses `server.url` pointing to the live Vercel deployment as a workaround, which means the app requires internet connectivity.
- `server.cleartext`: `false` — correctly set (no HTTP cleartext)
- `ios.scheme`: `RunRun` — set

### iOS
- Directory exists with Xcode project under `ios/App/App.xcodeproj`
- HealthKit entitlement is configured: `com.apple.developer.healthkit: true`
- **HealthKit read permission strings** (NSHealthShareUsageDescription / NSHealthUpdateUsageDescription) should be verified in `ios/App/App/Info.plist` — not checked in this analysis

### Android
- Directory exists with Gradle build files
- `signingType: "apksigner"` configured in capacitor.config.ts

### Missing / Not Confirmed
- No `@capacitor/health` permissions in capacitor.config.ts plugins section — the `@capgo/capacitor-health` package is installed but not configured in the plugin section
- No push notification plugin installed (LINE push is server-side only)

---

## 6. Environment Variables

### Required Keys (from `.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
STRAVA_WEBHOOK_VERIFY_TOKEN
OPENWEATHERMAP_API_KEY
CRON_SECRET
```

### Additional Keys Found in Source Code (not in .env.example)
```
LINE_CHANNEL_SECRET         — required for webhook signature verification
LINE_CHANNEL_ACCESS_TOKEN   — required for LINE bot to send messages
LINE_BOT_USER_ID            — optional, for @mention detection
NEXT_PUBLIC_STRAVA_CLIENT_ID — alternative to STRAVA_CLIENT_ID (used in strava/connect)
NEXT_PUBLIC_STRAVA_REDIRECT_URI — optional override for OAuth redirect
```

**`.env.example` is incomplete** — it is missing `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, and `LINE_BOT_USER_ID`.

### Local Environment
`.env.local` only contains a Vercel OIDC token — all actual secrets are managed via Vercel Environment Variables dashboard. This is the correct pattern.

### No Secrets Exposed in Code
No API keys, passwords, or tokens were found hardcoded in source files. The `SUPABASE_SERVICE_ROLE_KEY` is accessed only via `process.env.SUPABASE_SERVICE_ROLE_KEY` in the admin client — never `NEXT_PUBLIC_` prefixed. Correct.

---

## 7. Test Coverage

**Status: PASS — 185/185 tests passing**

### Test Files (15 files in `src/__tests__/`)
| File | Tests |
|------|-------|
| `survival-tax.test.ts` | Survival tax calculation logic |
| `sc-engine.test.ts` | $SC earning calculation |
| `odds.test.ts` | Betting odds formatting and conversion |
| `personal-betting.test.ts` | Personal bet progress tracking |
| `lootbox.test.ts` | Loot drop system and item/skin catalogs |
| `weather-bonus.test.ts` | Weather multiplier evaluation |
| `body-version.test.ts` | Body version versioning system |
| `comeback.test.ts` | Comeback multiplier logic |
| `milestones.test.ts` | Achievement milestone checking |
| `rank-system.test.ts` | Rank tier calculation |
| `quotes.test.ts` | Motivational quote system |
| `strava-sync.test.ts` | Strava sync flow |
| `new-user-signup.test.ts` | New user registration flow |
| `google-auth-flow.test.ts` | Google OAuth flow |

### Coverage Gaps
- No API route tests (no integration or e2e tests for the HTTP endpoints)
- No tests for LINE bot command handling
- No tests for pool resolution logic (`cron/pool-resolution`)
- No tests for referral reward processing

---

## Priority Action Items

### Critical (Fix Before Next Release)
1. **Remove `console.log` statements from `strava/sync`** — especially the ones logging raw Strava activity data and token state. These expose internal details in production logs and in the response body `debug` field.
2. **Enforce LINE webhook signature** — Change the signature mismatch from `console.warn` to `return NextResponse.json({error:'Unauthorized'}, {status:401})`. Currently anyone can forge LINE events.
3. **Audit live betting_pools schema** — The committed migration 003 is completely out of sync with what the API code expects. Either write a corrective migration (010_fix_betting_schema.sql) to document the actual live schema, or verify via Supabase dashboard.

### High Priority
4. **Implement `saveGroupId()`** in `line/webhook` — The TODO stub means LINE push notifications to groups will never work.
5. **Add missing keys to `.env.example`** — `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_BOT_USER_ID`.
6. **Add index on `betting_pools(status, resolve_at)`** — needed for cron job performance as pool count grows.
7. **Add index on `pool_entries(pool_id)`** — needed for pool payout queries.
8. **Add middleware deprecation fix** — rename `middleware.ts` to `proxy.ts` per Next.js 16.

### Low Priority
9. **Hardcoded season start date in LINE bot** — "3/11（週三）正式開賽！" in `line/webhook` should be read dynamically from the active season record.
10. **`betting/pools` GET auth** — Decide explicitly: is this endpoint intentionally public? If so, document it. If not, add `getUser()` check.
11. **`SEASON_WIN_BONUS` constant** — Consider moving to `season.config` JSONB for per-season configurability.
12. **Add index on `profiles(team_id)`** — for LINE bot team queries and leaderboard aggregation.

---

*Report generated by read-only static analysis. No source files were modified.*
