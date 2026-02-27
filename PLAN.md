# Sweat Casino (汗水賭場) - Implementation Plan

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Deploy**: Vercel
- **APIs**: Strava (activity sync), OpenWeatherMap (weather bonuses)

## Env Vars
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN
OPENWEATHERMAP_API_KEY
CRON_SECRET
```

---

## Phase 1: Project Setup & Auth ✅ PARTIALLY DONE
- [x] Initialize Next.js project (TypeScript, Tailwind, App Router, src/)
- [x] Install deps: @supabase/supabase-js, @supabase/ssr, shadcn/ui, zustand, lucide-react, date-fns, recharts
- [x] Create .env.example and .env.local
- [x] Install shadcn/ui components (button, card, input, label, tabs, badge, dialog, select, sonner, progress, sheet, separator, avatar, dropdown-menu, form, textarea, skeleton, table)
- [ ] Create directory structure
- [ ] Supabase clients: client.ts, server.ts, middleware.ts, admin.ts
- [ ] middleware.ts to protect (protected) route group
- [ ] Auth pages: /login, /register, /auth/callback
- [ ] Base layout: Header + mobile BottomNav

## Phase 2: Database Schema
4 SQL migrations in order:
- [ ] **Migration 1**: seasons, teams, weather_records
- [ ] **Migration 2**: profiles (extends auth.users), activities
- [ ] **Migration 3**: sc_transactions, personal_bets, betting_pools, pool_entries, weekly_snapshots
- [ ] **Migration 4**: DB functions (handle_new_user, process_sc_transaction, calculate_team_activity_rate) + RLS policies

### Key Tables
| Table | Purpose |
|-------|---------|
| seasons | 3-month season periods with config JSON |
| teams | Red Bulls / White Bears (color/emoji) |
| weather_records | OpenWeatherMap snapshots per activity |
| profiles | extends auth.users, Strava tokens, team, $SC balance |
| activities | running data from Strava, $SC earned |
| sc_transactions | immutable ledger of all $SC movements |
| personal_bets | "bet on yourself" goals with stakes |
| betting_pools | public prediction markets |
| pool_entries | individual positions in pools |
| weekly_snapshots | aggregated weekly stats per team |

## Phase 3: Teams & $SC Engine
- [ ] Team Assignment (src/lib/teams/assignment.ts) - auto-assign to smaller team
- [ ] $SC Engine (src/lib/sc/engine.ts) - calculateSCEarned(distanceKm, weatherMultiplier, config)
- [ ] Survival Tax (src/lib/sc/survival-tax.ts) - weekly deduction if < 5km
- [ ] Activity Rate (src/lib/teams/activity-rate.ts) - Adjusted Score = Total KM * (Active / Total)
- [ ] Profile page (team, balance, stats)
- [ ] Wallet page (transaction history)

## Phase 4: Strava Integration
- [ ] OAuth Flow: authorize -> callback -> store tokens
- [ ] Webhook: GET (hub.challenge) + POST (activity events)
- [ ] Activity Pipeline: Webhook -> Fetch -> Weather -> Calculate $SC -> Insert -> Update bets
- [ ] Mock System (src/lib/strava/mock.ts) - fake activities for dev
- [ ] Manual Sync endpoint
- [ ] Strava Connect Button component

### Files
- src/lib/strava/auth.ts - OAuth helpers
- src/lib/strava/client.ts - API client with token refresh
- src/lib/strava/webhook.ts - webhook validation & processing
- src/app/api/strava/webhook/route.ts - webhook endpoint
- src/app/api/strava/callback/route.ts - OAuth callback
- src/app/api/mock/activity/route.ts - dev-only mock injection

## Phase 5: Weather Bonus System
- [ ] OpenWeatherMap Client (src/lib/weather/client.ts)
- [ ] Bonus Logic (src/lib/weather/bonus.ts)
  - Heavy rain (502-504): 1.5x
  - Thunderstorm (200-232): 1.5x
  - Extreme heat (>35°C) or cold (<0°C): 1.5x
  - Strong wind (>10 m/s): 1.5x
  - Snow (600-622): 1.5x
  - Multiple conditions do NOT stack (max 1.5x)
- [ ] Weather Badge component

## Phase 6: Betting Market
### Personal Bets ("Bet on Yourself")
- [ ] User sets target (distance/count), timeframe, stake
- [ ] Odds auto-calculated from history (1.5x-5.0x)
- [ ] Stake deducted immediately; success = stake * odds
- [ ] Progress updated on each new activity
- [ ] Cron resolves expired bets

### Public Pools (Pari-mutuel, 0% house cut)
- [ ] Anyone creates pool (e.g., "Red Team > 500km this week?")
- [ ] Users go Long or Short with $SC
- [ ] Odds = total_pool / position_total (dynamic)
- [ ] Cron resolves at resolve_date

### Files
- src/lib/betting/personal.ts, pools.ts, odds.ts
- src/app/api/betting/personal/route.ts, pools/route.ts
- Components: PersonalBetForm, PersonalBetCard, PoolCard, PoolEntryForm, OddsDisplay

## Phase 7: Dashboard & Real-time
- [ ] Realtime Hooks - subscribe to Supabase channels
- [ ] Team VS Panel - animated Red vs White comparison
- [ ] Live Ticker - stock-market scrolling banner
- [ ] Weekly Chart - bar chart of daily distance (recharts)
- [ ] Leaderboard - tabs: Distance / $SC / Streak, team filter
- [ ] Season Progress - progress bar + countdown

## Phase 8: Polish & Deploy
- [ ] Mobile-first responsive, PWA manifest
- [ ] Error boundaries, loading skeletons, toast notifications
- [ ] Vercel deploy, env vars, cron jobs (vercel.json)
- [ ] Register Strava webhook with production URL
- [ ] Security audit: no leaked keys, RLS correct, cron routes check CRON_SECRET

---

## Cron Jobs (vercel.json)
| Job | Schedule | Purpose |
|-----|----------|---------|
| survival-tax | Monday 00:00 | Weekly tax on inactive users |
| pool-resolution | Hourly | Resolve expired pools |
| bet-resolution | Hourly | Resolve expired personal bets |
| weekly-snapshot | Sunday 23:59 | Aggregate weekly team stats |
| season-check | Daily 00:00 | Season start/end lifecycle |

---

## Architecture Decisions
1. $SC transactions via PostgreSQL function - atomic to prevent race conditions
2. Pari-mutuel betting (0% house cut) - simple, fair, peer-to-peer
3. Current Weather API (free) over Historical API (paid)
4. Simple team assignment (balance by count) - unswappable for "shared fate"
5. Supabase Realtime for live dashboard - zero extra infra
6. Strava tokens in profiles - protected by RLS + service-role-only view

---

## Directory Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing / redirect
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── auth/callback/route.ts
│   ├── (protected)/
│   │   ├── layout.tsx          # Protected layout with nav
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── wallet/page.tsx
│   │   ├── betting/page.tsx
│   │   └── leaderboard/page.tsx
│   └── api/
│       ├── strava/webhook/route.ts
│       ├── strava/callback/route.ts
│       ├── mock/activity/route.ts
│       ├── betting/personal/route.ts
│       ├── betting/pools/route.ts
│       └── cron/
│           ├── survival-tax/route.ts
│           ├── pool-resolution/route.ts
│           ├── bet-resolution/route.ts
│           ├── weekly-snapshot/route.ts
│           └── season-check/route.ts
├── components/
│   ├── ui/                     # shadcn/ui
│   ├── layout/                 # Header, BottomNav
│   ├── dashboard/              # TeamVS, Ticker, Chart
│   ├── betting/                # BetForm, PoolCard, etc.
│   └── teams/                  # TeamBadge, etc.
├── hooks/
│   ├── use-realtime.ts
│   └── use-profile.ts
├── lib/
│   ├── supabase/               # client, server, middleware, admin
│   ├── strava/                 # auth, client, webhook, mock
│   ├── weather/                # client, bonus
│   ├── sc/                     # engine, survival-tax
│   ├── teams/                  # assignment, activity-rate
│   └── betting/                # personal, pools, odds
├── types/
│   └── index.ts                # All TypeScript types
└── middleware.ts                # Route protection
```

## Current Progress
- Next.js project initialized ✅
- Dependencies installed ✅
- shadcn/ui components installed ✅
- .env.example and .env.local created ✅
- Directory structure created ✅
- Phase 1: Supabase clients + Auth + Middleware + Auth pages ✅
- Phase 2: Database SQL migrations (4 files) ✅
- Phase 3: Types + Core logic (SC engine, teams, weather, strava, betting) ✅
- Phase 4-7: UI layout + Protected pages + Components ✅
- API Routes (Strava webhook, Betting, Cron jobs) ✅
- vercel.json with cron schedules ✅
- **BUILD PASSED** ✅ (70 source files, 8268 lines, 20 routes)
- Next step: Set up Supabase project, configure env vars, deploy to Vercel
