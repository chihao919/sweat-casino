"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Captures the ?ref= query param and stores it in a cookie.
 * Must be inside a Suspense boundary because it uses useSearchParams().
 */
function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      document.cookie = `referrer_id=${ref}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }, [searchParams]);

  if (!searchParams.get("ref")) return null;

  return (
    <Card className="mb-6 border-yellow-400/50 bg-gradient-to-r from-yellow-950/50 to-zinc-900">
      <CardContent className="py-4 text-center">
        <p className="text-lg font-bold text-yellow-400">🎁 你的朋友邀請你加入！</p>
        <p className="mt-1 text-sm text-muted-foreground">
          立即註冊即可獲得 100 $SC 註冊獎勵，邀請你的朋友也能獲得 50 $SC！
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * /invite — Public landing page for recruiting new players.
 */
export default function InvitePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.10)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-lg px-5 py-10">
        {/* Referral banner */}
        <Suspense>
          <ReferralCapture />
        </Suspense>

        {/* Hero */}
        <div className="text-center">
          <div className="text-8xl">🎰</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight">
            汗水賭場
          </h1>
          <p className="mt-3 text-2xl text-red-500 dark:text-red-400 font-bold">
            用汗水下注，讓跑步變成一場賭局
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            4 月 1 日（週二）正式開賽 🔥
          </p>
        </div>

        {/* 100% Free banner */}
        <Card className="mt-8 border-green-300 dark:border-green-900/50 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-zinc-900">
          <CardContent className="py-5 text-center">
            <p className="text-4xl font-black text-green-600 dark:text-green-400">💰 完全免費</p>
            <p className="mt-2 text-lg text-muted-foreground">
              不用花一毛錢！Strava、遊戲內貨幣，全部免費
            </p>
          </CardContent>
        </Card>

        {/* Pain point → Solution */}
        <div className="mt-8 space-y-4">
          <h2 className="text-center text-3xl font-black">
            😤 以前跑步好麻煩
          </h2>

          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <p className="text-lg font-bold">跑完還要手動上傳紀錄</p>
                  <p className="text-base text-muted-foreground">忘記按上傳，成績就消失了</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <p className="text-lg font-bold">跑完就結束了，沒有動力</p>
                  <p className="text-base text-muted-foreground">缺少持續跑步的理由</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <p className="text-lg font-bold">一個人跑太無聊</p>
                  <p className="text-base text-muted-foreground">沒有競爭，沒有陪伴</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-center text-3xl font-black pt-2">
            ✅ 汗水賭場幫你解決
          </h2>

          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⌚</span>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">手錶自動同步，跑完即上傳</p>
                  <p className="text-base text-muted-foreground">
                    串聯 Apple Watch、Garmin 或手機，跑完自動同步到遊戲，不用手動操作！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">💰</span>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">每公里賺 $SC，累積虛擬貨幣</p>
                  <p className="text-base text-muted-foreground">
                    每跑 1km = 10 $SC｜惡劣天氣跑步 = 1.5 倍獎勵！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚔️</span>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">紅白對決，團隊 PK</p>
                  <p className="text-base text-muted-foreground">
                    自動分成紅牛隊 🐂 vs 白熊隊 🐻‍❄️，每週比拼誰跑得多！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">🎲</span>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">下注對賭，挑戰自己</p>
                  <p className="text-base text-muted-foreground">
                    用 $SC 對自己下注：「這週我要跑 20km」。成功加倍奉還，失敗全部沒收！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-3xl">💀</span>
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">不跑就扣錢！生存淘汰稅</p>
                  <p className="text-base text-muted-foreground">
                    每週跑不到 20km？扣 5% $SC！逼你出門動起來
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to set up watch */}
        <div id="setup" className="mt-10 scroll-mt-6">
          <h2 className="text-center text-3xl font-black">
            ⌚ 手錶設定超簡單
          </h2>
          <p className="mt-2 text-center text-lg text-muted-foreground">
            只要 3 步驟，以後跑步自動同步
          </p>

          <div className="mt-5 space-y-4">
            {/* Step 1 */}
            <Card>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">
                  1
                </div>
                <div>
                  <p className="font-bold text-xl">下載 Strava（免費）</p>
                  <p className="mt-1 text-base text-muted-foreground">
                    到 App Store 搜尋「Strava」，下載並用 Google 帳號註冊。
                    <span className="text-green-600 dark:text-green-400 font-semibold"> 選免費方案就好！</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">
                  2
                </div>
                <div>
                  <p className="font-bold text-xl">連結你的手錶</p>
                  <div className="mt-2 space-y-2 text-base text-muted-foreground">
                    <p>
                      <span className="text-foreground font-semibold">⌚ Apple Watch：</span>
                      Strava App → 設定 → 應用程式與裝置 → 開啟 Apple Health 同步。或直接在手錶安裝 Strava App。
                    </p>
                    <p>
                      <span className="text-foreground font-semibold">🏃 Garmin：</span>
                      Garmin Connect App → 設定 → 第三方應用 → 連結 Strava。
                    </p>
                    <p>
                      <span className="text-foreground font-semibold">📱 沒手錶？</span>
                      沒關係！直接用手機開 Strava 跑步一樣可以！
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">
                  3
                </div>
                <div>
                  <p className="font-bold text-xl">登入汗水賭場，串聯 Strava</p>
                  <p className="mt-1 text-base text-muted-foreground">
                    用 Google 帳號登入網站，按「連結 Strava」授權。
                    <span className="text-green-600 dark:text-green-400 font-semibold"> 之後跑步完成就自動計分！</span>
                  </p>
                  <Link
                    href="/login"
                    className="mt-2 inline-block text-base font-semibold text-red-500 dark:text-red-400 underline"
                  >
                    👉 點此登入並串聯 Strava
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center space-y-4">
          <Link href="/login">
            <Button className="h-16 w-full bg-red-600 text-xl font-black text-white hover:bg-red-500 shadow-lg shadow-red-900/30">
              🎰 立即加入汗水賭場
            </Button>
          </Link>

          <a href="#setup">
            <Button variant="outline" className="h-14 w-full text-lg font-bold">
              ⌚ 已加入？設定教學
            </Button>
          </a>

          <div className="flex gap-3">
            <Link href="/players" className="flex-1">
              <Button
                variant="outline"
                className="h-12 w-full"
              >
                👀 報名名單
              </Button>
            </Link>
            <Link href="/guide" className="flex-1">
              <Button
                variant="outline"
                className="h-12 w-full"
              >
                📖 完整規則
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            完全免費 • 不用付費訂閱 • 用汗水下注 💦
          </p>
        </div>
      </div>
    </div>
  );
}
