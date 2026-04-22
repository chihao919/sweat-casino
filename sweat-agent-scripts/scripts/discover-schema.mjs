import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

async function query(table, limit = 1) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?limit=${limit}`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  if (!res.ok) return { error: res.status }
  const data = await res.json()
  return { ok: true, columns: data[0] ? Object.keys(data[0]) : [], sample: data[0] }
}

const CANDIDATE_TABLES = [
  'profiles', 'users',
  'runs', 'activities', 'workouts',
  'bets', 'self_bets', 'wagers',
  'pool_bets', 'public_bets',
  'teams',
]

console.log('🔍 Probing Supabase tables...\n')

for (const table of CANDIDATE_TABLES) {
  const result = await query(table)
  if (result.ok) {
    console.log(`✅ ${table}`)
    console.log(`   columns: ${result.columns.join(', ')}`)
    if (result.sample) console.log(`   sample:  ${JSON.stringify(result.sample).slice(0, 120)}`)
  } else {
    console.log(`❌ ${table} (${result.error})`)
  }
}
