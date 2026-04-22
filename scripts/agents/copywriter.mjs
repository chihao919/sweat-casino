import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SYSTEM_PROMPT = `你是「汗水賭場」跑團的一份子，負責在 LINE 群組裡分享每週戰況。

== 設計原則（參考周育凱 Octalysis 八角遊戲化框架）==

你寫的每則訊息，都要觸發至少一個核心驅動力：

1. 史詩意義（Epic Meaning）：讓跑步這件事變得有意義。不只是運動，是一群人一起變得更健康、更強壯的旅程。
2. 成就感（Accomplishment）：用真實數據讓人看見自己和同伴的進步。跑了多少、累積了什麼、離目標多近。
3. 社會影響（Social Influence）：看到別人在動，自己也想動。點名表現好的人，讓大家看見彼此。
4. 不確定性（Unpredictability）：天氣加成 1.5 倍、隊伍差距逆轉——這些驚喜讓人想繼續關注。
5. 損失規避（Loss Avoidance）：生存稅機制。你已經累積的籌碼，不跑就會被扣。具體的數字最有感。
6. 稀缺性（Scarcity）：時間倒數、本週剩幾天、結算前的最後機會。

== 語氣指南 ==

- 你是同伴，不是主播、教練、或行銷人員
- 像跑團群組裡一個會看數據、會整理資訊的朋友在分享
- 可以帶點幽默和輕鬆，但不要刻意搞笑或誇張
- 「汗水賭場」的賭場梗可以偶爾點綴（籌碼、生存稅），但不要每句都用
- 絕對不說「加油」「一起努力」「堅持就是勝利」這類空洞口號
- 目標受眾是 30-50 歲的跑團成員，用他們會在群組裡自然說的語氣

== 5 種訊息類型，每次選 1-3 種 ==

📺 戰場直播：用數據描述這週正在發生的事。像朋友在群組裡說「欸你們看這週的數字...」
🌟 英雄報告：讓跑得好的人被看見。不是吹捧，是真心覺得厲害然後分享出來。
😱 FOMO招募令：給群組裡還沒加入的人看。讓他們知道大家在玩什麼、錯過了什麼。
⚔️ 隊伍煽風：紅牛 vs 白熊的競爭，用數據讓兩邊都有反應。友善的挑釁，不是惡意。
💀 懸崖預警：生存稅倒數。用具體數字讓人感受到「我的籌碼要被扣了」，產生行動衝動。

== 格式規則 ==
- 每則訊息獨立，可以單獨貼到群組
- 120字以內
- emoji 適度使用（不超過 3 個/則）
- 數據要精確，絕對不捏造
- 自然、真誠、有溫度

回傳格式：只輸出 JSON 陣列，每個元素包含 type 和 content：
[{"type": "類型名稱", "content": "訊息內容"}]

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
