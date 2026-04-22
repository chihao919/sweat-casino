import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// --- Adjust these if discover-schema.mjs shows different names ---
const TABLES = {
  profiles: 'profiles',
  runs: 'runs',
}
const COLS = {
  profiles: {
    id: 'id',
    name: 'display_name',
    team: 'team',
    balance: 'sc_balance',
    stravaConnected: 'strava_connected',
  },
  runs: {
    userId: 'user_id',
    distanceKm: 'distance_km',
    scEarned: 'sc_earned',
    startedAt: 'started_at',
    weatherBonus: 'has_weather_bonus',
  },
}
// ----------------------------------------------------------------

function supabaseGet(table, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
}

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export async function collectData() {
  const { monday, sunday } = getWeekBounds()
  const c = COLS

  const playersRes = await supabaseGet(TABLES.profiles, {
    select: `${c.profiles.id},${c.profiles.name},${c.profiles.team},${c.profiles.balance}`,
    [`${c.profiles.stravaConnected}`]: 'eq.true',
    order: `${c.profiles.name}.asc`,
  })
  if (!playersRes.ok) throw new Error(`Failed to fetch players: ${playersRes.status}`)
  const players = await playersRes.json()

  const runsRes = await supabaseGet(TABLES.runs, {
    select: `${c.runs.userId},${c.runs.distanceKm},${c.runs.scEarned},${c.runs.startedAt},${c.runs.weatherBonus}`,
    [`${c.runs.startedAt}`]: `gte.${monday.toISOString()}`,
    [`${c.runs.startedAt}`]: `lte.${sunday.toISOString()}`,
  })
  // Note: two params with same key — use manual URL for gte/lte pair
  const runsUrl = new URL(`${SUPABASE_URL}/rest/v1/${TABLES.runs}`)
  runsUrl.searchParams.set('select', `${c.runs.userId},${c.runs.distanceKm},${c.runs.scEarned},${c.runs.startedAt},${c.runs.weatherBonus}`)
  runsUrl.searchParams.append(`${c.runs.startedAt}`, `gte.${monday.toISOString()}`)
  runsUrl.searchParams.append(`${c.runs.startedAt}`, `lte.${sunday.toISOString()}`)

  const runsRes2 = await fetch(runsUrl.toString(), {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  if (!runsRes2.ok) throw new Error(`Failed to fetch runs: ${runsRes2.status}`)
  const runs = await runsRes2.json()

  const runsByPlayer = {}
  for (const run of runs) {
    const uid = run[c.runs.userId]
    if (!runsByPlayer[uid]) {
      runsByPlayer[uid] = { totalKm: 0, runCount: 0, scEarned: 0, hadWeatherBonus: false }
    }
    runsByPlayer[uid].totalKm += run[c.runs.distanceKm] || 0
    runsByPlayer[uid].runCount += 1
    runsByPlayer[uid].scEarned += run[c.runs.scEarned] || 0
    if (run[c.runs.weatherBonus]) runsByPlayer[uid].hadWeatherBonus = true
  }

  const enriched = players.map(p => ({
    id: p[c.profiles.id],
    name: p[c.profiles.name],
    team: p[c.profiles.team],
    scBalance: p[c.profiles.balance] || 0,
    weekKm: runsByPlayer[p[c.profiles.id]]?.totalKm || 0,
    runCount: runsByPlayer[p[c.profiles.id]]?.runCount || 0,
    weekScEarned: runsByPlayer[p[c.profiles.id]]?.scEarned || 0,
    hadWeatherBonus: runsByPlayer[p[c.profiles.id]]?.hadWeatherBonus || false,
  }))

  const teamStats = { red: { totalKm: 0, active: 0, players: [] }, white: { totalKm: 0, active: 0, players: [] } }
  for (const p of enriched) {
    const t = p.team === 'red' ? 'red' : 'white'
    teamStats[t].totalKm += p.weekKm
    if (p.weekKm > 0) teamStats[t].active++
    teamStats[t].players.push(p)
  }

  return { players: enriched, teamStats, weekStart: monday, today: new Date() }
}
