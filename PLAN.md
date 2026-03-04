# Sweat Casino (汗水賭場) - Implementation Plan

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Deploy**: Vercel
- **APIs**: Strava (activity sync), OpenWeatherMap (weather bonuses)

## URLs & Resources
- **Production**: https://runrun-plum.vercel.app
- **GitHub**: https://github.com/chihao919/sweat-casino
- **Supabase Project**: sxtjcwurleltqocjwmuw (RunRun, Tokyo region)
- **Supabase Dashboard**: https://supabase.com/dashboard/project/sxtjcwurleltqocjwmuw
- **Vercel Project**: stevens-projects-f4d96467/runrun

## Env Vars
```
NEXT_PUBLIC_SUPABASE_URL ✅ 已設定
NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ 已設定
SUPABASE_SERVICE_ROLE_KEY ✅ 已設定
NEXT_PUBLIC_APP_URL ✅ 已設定
CRON_SECRET ✅ 已設定
STRAVA_CLIENT_ID ❌ 待填
STRAVA_CLIENT_SECRET ❌ 待填
STRAVA_WEBHOOK_VERIFY_TOKEN ❌ 待填
OPENWEATHERMAP_API_KEY ❌ 待填
```

---

## Phase 1: Project Setup & Auth ✅ DONE
- [x] Initialize Next.js project (TypeScript, Tailwind, App Router, src/)
- [x] Install deps: @supabase/supabase-js, @supabase/ssr, shadcn/ui, zustand, lucide-react, date-fns, recharts
- [x] Create .env.example and .env.local
- [x] Install shadcn/ui components
- [x] Supabase clients: client.ts, server.ts, middleware.ts, admin.ts
- [x] middleware.ts to protect (protected) route group
- [x] Auth pages: /login, /register, /auth/callback
- [x] Base layout: Header + mobile BottomNav

## Phase 2: Database Schema ✅ DONE
- [x] Migration 1: seasons, teams, weather_records
- [x] Migration 2: profiles, activities
- [x] Migration 3: sc_transactions, personal_bets, betting_pools, pool_entries, weekly_snapshots
- [x] Migration 4: DB functions + RLS policies
- [x] All 4 migrations pushed to remote Supabase

### Database Data
- [x] Teams seeded: Red Bulls (🐂) + White Bears (🐻‍❄️)
- [x] Season 1: Genesis created (2026/3/1 ~ 2026/5/31, active)

## Phase 3: Teams & $SC Engine ✅ DONE
- [x] Team Assignment (src/lib/teams/assignment.ts)
- [x] $SC Engine (src/lib/sc/engine.ts)
- [x] Survival Tax (src/lib/sc/survival-tax.ts)
- [x] Activity Rate (src/lib/teams/activity-rate.ts)

## Phase 4: Strava Integration ✅ DONE (code only, needs API keys)
- [x] OAuth Flow code (src/lib/strava/auth.ts)
- [x] Webhook endpoint (src/app/api/strava/webhook/route.ts)
- [x] Activity Pipeline code
- [x] Mock System (src/lib/strava/mock.ts)
- [x] Strava callback route
- [ ] **TODO**: Register Strava API app and fill keys
- [ ] **TODO**: Register webhook with production URL

## Phase 5: Weather Bonus System ✅ DONE (code only, needs API key)
- [x] OpenWeatherMap Client (src/lib/weather/client.ts)
- [x] Bonus Logic (src/lib/weather/bonus.ts)
- [ ] **TODO**: Get OpenWeatherMap API key

## Phase 6: Betting Market ✅ DONE
- [x] Personal Bets logic + API route
- [x] Public Pools logic + API route
- [x] Odds calculation + display helpers

## Phase 7: Dashboard & Real-time ✅ DONE
- [x] Realtime Hooks (use-realtime.ts)
- [x] Team VS Panel component
- [x] Live Ticker (marquee animation)
- [x] Weekly Chart (recharts BarChart)
- [x] Leaderboard page (Distance / $SC / Streak tabs)
- [x] Season Progress bar

## Phase 8: Polish & Deploy ✅ PARTIALLY DONE
- [x] Mobile-first responsive design
- [x] Dark theme with casino aesthetic
- [x] Vercel deployed + env vars configured
- [x] Cron jobs configured (daily schedule for Hobby plan)
- [x] Supabase Auth redirect URLs configured
- [ ] **TODO**: PWA manifest
- [ ] **TODO**: Error boundaries
- [ ] **TODO**: Loading skeletons (some done)

---

## Cron Jobs (vercel.json - adjusted for Hobby plan)
| Job | Schedule | Purpose |
|-----|----------|---------|
| survival-tax | Daily Mon 00:00 | Weekly tax on inactive users |
| pool-resolution | Daily 00:00 | Resolve expired pools |
| bet-resolution | Daily 00:00 | Resolve expired personal bets |
| weekly-snapshot | Daily Mon 00:00 | Aggregate weekly team stats |
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

## Project Stats
- **Source files**: 70+ (TypeScript/TSX/CSS)
- **Lines of code**: 15,000+
- **App routes**: 20
- **SQL migrations**: 4 files
- **Build**: ✅ Passes

---

## Known Issues / Next Steps
1. Vercel 部署端暫時有 internal error（build 成功但 deploy 階段失敗），前一版仍在線
2. 需要 Strava API keys 才能啟用跑步同步功能
3. 需要 OpenWeatherMap API key 才能啟用天氣加成
4. Types (src/types/index.ts) 與部分 API routes 的欄位名稱可能有些許不一致（例如 pool 的 side_a/side_b vs long/short），需要在實際測試時統一
5. 前端頁面資料抓取目前用 useEffect + supabase client，可考慮改用 Server Components 或 React Query
6. `middleware.ts` 使用的是已 deprecated 的 middleware convention，Next.js 16 建議改用 proxy

## Git Info
- Branch: main
- Last commit: feat: configure Supabase auth redirects and init config
- Remote: origin -> https://github.com/chihao919/sweat-casino.git
