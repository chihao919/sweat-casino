import { collectData } from './agents/data-collector.mjs'
import { analyze } from './agents/analyst.mjs'
import { generateMessages, buildContext } from './agents/copywriter.mjs'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function divider(char = '─', len = 44) { return char.repeat(len) }

async function run() {
  const startTime = Date.now()

  console.log('\n' + divider('═'))
  console.log('  🎰  汗水賭場 Daily Motivator Agent Team')
  console.log(divider('═'))
  console.log(`  ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`)
  console.log(divider('─'))

  // Agent 1: Data Collection
  console.log('\n📊 [Agent 1 / Data Collector] Fetching player data...')
  let data
  try {
    data = await collectData()
  } catch (err) {
    console.error(`\n❌ Data collection failed: ${err.message}`)
    console.error('   → Check SUPABASE_URL, SUPABASE_ANON_KEY in .env')
    console.error('   → Or run: node scripts/discover-schema.mjs to inspect tables')
    process.exit(1)
  }

  const { players, teamStats } = data
  console.log(`   ✓ ${players.length} players loaded`)
  console.log(`   🐂 Red Bull: ${teamStats.red.players.length} players, ${teamStats.red.totalKm.toFixed(1)} km this week`)
  console.log(`   🐻‍❄️ White Bear: ${teamStats.white.players.length} players, ${teamStats.white.totalKm.toFixed(1)} km this week`)

  // Agent 2: Analysis
  console.log('\n🧠 [Agent 2 / Analyst] Analyzing progress...')
  const analysis = analyze(data)
  const { categories, teamLeader, daysLeft, activePlayers } = analysis
  console.log(`   Days left this week: ${daysLeft}`)
  console.log(`   Active players: ${activePlayers}/${players.length}`)
  console.log(`   🔴 Danger zone: ${categories.danger.length} players`)
  console.log(`   ⚠️  Behind pace: ${categories.behind.length} players`)
  console.log(`   🏆 Crushers: ${categories.crushers.length} players`)
  console.log(`   Team leader: ${teamLeader === 'red' ? '🐂 Red Bull' : '🐻‍❄️ White Bear'}`)

  if (process.env.DEBUG === 'true') {
    console.log('\n--- Context sent to copywriter ---')
    console.log(buildContext(analysis))
    console.log('─'.repeat(34))
  }

  // Agent 3: Copywriting
  console.log('\n✍️  [Agent 3 / Copywriter] Generating LINE messages...')
  const toneOverride = process.env.TONE_OVERRIDE || null
  if (toneOverride) console.log(`   🎨 Tone override: "${toneOverride}"`)

  let messages
  try {
    messages = await generateMessages(analysis, toneOverride)
  } catch (err) {
    console.error(`\n❌ Copywriting failed: ${err.message}`)
    process.exit(1)
  }
  console.log(`   ✓ Generated ${messages.length} message(s)`)

  const TYPE_EMOJI = {
    '戰場直播': '📺',
    '英雄報告': '🌟',
    'FOMO招募令': '😱',
    '隊伍煽風': '⚔️',
    '懸崖預警': '💀',
  }

  // Output
  console.log('\n' + divider('═'))
  console.log('  📱  LINE 訊息（複製下方內容發到群組）')
  console.log(divider('═'))

  messages.forEach((msg, i) => {
    const type = msg.type || '一般'
    const content = msg.content || String(msg)
    const icon = TYPE_EMOJI[type] || '💬'
    console.log(`\n${icon} 【第 ${i + 1} 則 — ${type}】`)
    console.log(content)
    if (i < messages.length - 1) console.log('\n' + divider('·'))
  })

  // Save report
  const today = new Date().toISOString().split('T')[0]
  const reportDir = join(ROOT, 'reports')
  mkdirSync(reportDir, { recursive: true })
  const report = {
    date: today,
    generated_at: new Date().toISOString(),
    summary: {
      total_players: players.length,
      active_players: activePlayers,
      days_left: daysLeft,
      danger_count: categories.danger.length,
      behind_count: categories.behind.length,
      crusher_count: categories.crushers.length,
      team_leader: teamLeader,
    },
    messages,
  }
  const reportPath = join(reportDir, `${today}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + divider('─'))
  console.log(`✅ Done in ${elapsed}s  |  Saved: reports/${today}.json`)
  console.log(divider('─') + '\n')
}

run()
