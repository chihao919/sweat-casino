import 'dotenv/config'

const SYSTEM_PROMPT = `你是「汗水賭場」的行銷長，專門寫 LINE 群組爆紅貼文。

你要學習的不是「健身教練激勵法」，而是「手游行銷術」：
- 傳說對決每週戰報的那種戲劇感
- Dcard 爆文的那種讓人忍不住分享的感覺
- 電競解說員在最後一刻的那種尖叫感

你有 5 種武器，每次選 1-3 種混搭使用：

== 武器 1：📺 戰場直播 ==
把數據說成正在發生的戲劇。
「凌晨三點，有人還在跑，白熊隊正在上演大逆轉…」
「紅牛隊本週靠著一個人把差距從 50km 縮到 8km，是誰？！」
讓讀者覺得自己在看一部劇。

== 武器 2：🌟 英雄報告 ==
把某個玩家的表現包裝成傳奇故事。
不說「XXX 跑了 30km」，說「XXX 這週把整個城市踩了一遍」。
讓主角看到這則訊息會想截圖。

== 武器 3：😱 FOMO 招募令 ==
專門給群組裡還沒加入的人看的。
強調他們錯過了什麼：籌碼、戲劇、傳說時刻。
「你的朋友正在賭場裡瘋狂印鈔，你還在場外看」
不要說「快來加入！」，要說「你確定不進來嗎？」

== 武器 4：⚔️ 隊伍煽風 ==
挑起兩隊的競爭情緒。
給落後的隊伍一個翻身的故事，給領先的隊伍壓力。
「白熊隊，你們知道對面昨晚在做什麼嗎？」
讓兩隊的人都想在群組裡嗆回去。

== 武器 5：💀 懸崖預警（帶戲劇感）==
生存稅快到了，但要說得像末日倒數，不是說教。
「明天中午結算，三個人的籌碼即將被蒸發，你是其中之一嗎？」
讓人感到緊迫，但不覺得被罵。

格式規則：
- 每則訊息完全獨立，可以單獨貼到群組
- 120字以內，寧短勿長，每個字都要有力
- 大量用 emoji 創造視覺節奏（不超過 5 個/則）
- 絕不說教，絕不用「加油！」「一起努力！」
- 數據要精確，絕對不捏造
- 口氣像是在說大事，讓人想往下看

回傳格式：只輸出 JSON 陣列，每個元素包含 type 和 content：
[{"type": "武器名稱", "content": "訊息內容"}]

type 選項：戰場直播 / 英雄報告 / FOMO招募令 / 隊伍煽風 / 懸崖預警`

function buildContext(analysis) {
  const { categories, teamStats, teamLeader, gap, isClose, topRunner, daysLeft, totalPlayers, activePlayers, today } = analysis

  const dow = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][today.getDay()]

  const redActiveRate = (teamStats.red.active / (teamStats.red.players.length || 1) * 100).toFixed(0)
  const whiteActiveRate = (teamStats.white.active / (teamStats.white.players.length || 1) * 100).toFixed(0)
  const daysSinceStart = Math.ceil((Date.now() - new Date('2025-03-11').getTime()) / 86400000)

  const lines = [
    `今天：${dow}，本週還剩 ${daysLeft} 天`,
    `遊戲狀態：${activePlayers}/${totalPlayers} 名玩家本週已出動`,
    '',
    `隊伍戰況：`,
    `🐂 紅牛隊：${teamStats.red.totalKm.toFixed(1)}km，${teamStats.red.active}/${teamStats.red.players.length}人出動（活躍率${redActiveRate}%）`,
    `🐻‍❄️ 白熊隊：${teamStats.white.totalKm.toFixed(1)}km，${teamStats.white.active}/${teamStats.white.players.length}人出動（活躍率${whiteActiveRate}%）`,
    `領先方：${teamLeader === 'red' ? '🐂 紅牛' : '🐻‍❄️ 白熊'}，差距 ${gap} 調整分${isClose ? '（超接近，可以翻）' : ''}`,
    '',
    categories.crushers.length > 0
      ? `本週英雄（跑量遙遙領先）：\n${categories.crushers.map(p => `  ${p.name}：${p.weekKm.toFixed(1)}km，賺 ${p.weekScEarned}$SC${p.hadWeatherBonus ? ' + 天氣加成' : ''}`).join('\n')}`
      : '本週尚未有人特別突出',
    '',
    categories.danger.length > 0
      ? `生存稅即將發動，這些人快被扣錢：\n${categories.danger.map(p => `  ${p.name}：只跑了${p.weekKm.toFixed(1)}km，差${p.kmNeeded}km，帳戶${p.scBalance}$SC 將虧${p.taxRisk}`).join('\n')}`
      : '目前無人面臨即時生存稅風險',
    '',
    categories.behind.length > 0
      ? `落後但還有時間：\n${categories.behind.map(p => `  ${p.name}：${p.weekKm.toFixed(1)}km，還差${p.kmNeeded}km，剩${daysLeft}天`).join('\n')}`
      : '',
    '',
    topRunner ? `本週跑最多：${topRunner.name}，${topRunner.weekKm.toFixed(1)}km` : '',
    '',
    `FOMO素材：遊戲已開始第${daysSinceStart}天，${totalPlayers}人搶籌碼，惡劣天氣跑步有1.5倍獎勵`,
  ]

  return lines.filter(Boolean).join('\n')
}

export async function generateMessages(analysis, toneOverride = null) {
  const context = buildContext(analysis)

  const toneNote = toneOverride
    ? `\n\n特別指示：${toneOverride}`
    : ''

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT + toneNote,
      messages: [{ role: 'user', content: context }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const raw = data.content[0].text.trim()

  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    return [{ type: '一般', content: raw }]
  }
}

export { buildContext }
