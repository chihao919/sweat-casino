const SURVIVAL_TAX_KM = 5
const SURVIVAL_TAX_RATE = 0.05

export function analyze({ players, teamStats, today }) {
  const dow = today.getDay()
  const daysIntoWeek = dow === 0 ? 6 : dow - 1
  const daysLeft = 6 - daysIntoWeek

  const sorted = [...players].sort((a, b) => b.weekKm - a.weekKm)
  const topCutoff = sorted[Math.floor(sorted.length * 0.25)]?.weekKm ?? 10

  const danger = []
  const behind = []
  const onTrack = []
  const crushers = []

  for (const p of players) {
    const atRisk = p.weekKm < SURVIVAL_TAX_KM
    const taxAmount = Math.floor(p.scBalance * SURVIVAL_TAX_RATE)

    if (atRisk && daysLeft <= 2) {
      danger.push({ ...p, daysLeft, taxRisk: taxAmount, kmNeeded: +(SURVIVAL_TAX_KM - p.weekKm).toFixed(2) })
    } else if (atRisk) {
      behind.push({ ...p, daysLeft, taxRisk: taxAmount, kmNeeded: +(SURVIVAL_TAX_KM - p.weekKm).toFixed(2) })
    } else if (p.weekKm >= topCutoff) {
      crushers.push(p)
    } else {
      onTrack.push(p)
    }
  }

  const redRate = teamStats.red.active / (teamStats.red.players.length || 1)
  const whiteRate = teamStats.white.active / (teamStats.white.players.length || 1)
  const redScore = teamStats.red.totalKm * redRate
  const whiteScore = teamStats.white.totalKm * whiteRate

  const teamLeader = redScore >= whiteScore ? 'red' : 'white'
  const gap = Math.abs(redScore - whiteScore).toFixed(1)
  const isClose = Math.abs(redScore - whiteScore) < 5

  return {
    categories: { danger, behind, onTrack, crushers },
    teamStats,
    teamLeader,
    gap,
    isClose,
    topRunner: sorted[0] ?? null,
    daysLeft,
    today,
    totalPlayers: players.length,
    activePlayers: players.filter(p => p.weekKm > 0).length,
  }
}
