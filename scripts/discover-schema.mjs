import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY

async function query(table, limit = 1) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?limit=${limit}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
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
