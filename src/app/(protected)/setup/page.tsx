"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Link2,
  Smartphone,
  User,
  Watch,
} from "lucide-react";

/**
 * Onboarding page for new users.
 *
 * Guides them through:
 * 1. Setting a display name
 * 2. Installing Strava + connecting devices (Apple Watch / Garmin)
 * 3. Linking Strava to the game
 */

// Steps definition
const STEPS = [
  { id: 1, title: "設定暱稱", icon: User },
  { id: 2, title: "安裝 Strava", icon: Download },
  { id: 3, title: "連結裝置", icon: Watch },
  { id: 4, title: "串聯遊戲", icon: Link2 },
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, strava_athlete_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setIsStravaConnected(Boolean(profile.strava_athlete_id));

        // Auto-advance if already set up
        if (profile.display_name) setCurrentStep(2);
        if (profile.strava_athlete_id) setCurrentStep(4);
      }
      setProfileLoaded(true);
    }
    loadProfile();
  }, []);

  async function handleSaveName() {
    if (!displayName.trim()) {
      toast.error("請輸入暱稱");
      return;
    }
    setIsSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);

    if (error) {
      toast.error("儲存失敗，請重試");
    } else {
      toast.success("暱稱設定成功！");
      setCurrentStep(2);
    }
    setIsSaving(false);
  }

  function handleSkipToStrava() {
    setCurrentStep(3);
  }

  function handleGoToDashboard() {
    router.push("/dashboard");
  }

  // Strava OAuth URL
  const stravaClientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const stravaRedirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/strava/callback`
      : "";
  const stravaOAuthUrl = stravaClientId
    ? `https://www.strava.com/oauth/authorize?client_id=${stravaClientId}&redirect_uri=${encodeURIComponent(stravaRedirectUri)}&response_type=code&scope=read,activity:read_all`
    : null;

  if (!profileLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white">歡迎加入汗水賭場 🎰</h1>
        <p className="mt-2 text-base text-zinc-400">
          完成以下設定，準備開始你的汗水賭局！
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCompleted
                    ? "bg-green-600 text-white"
                    : isCurrent
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-5" />
                ) : (
                  <StepIcon className="size-5" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 ${
                    isCompleted ? "bg-green-600" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-zinc-500">
        步驟 {currentStep} / {STEPS.length}：{STEPS[currentStep - 1].title}
      </p>

      {/* Step 1: Set display name */}
      {currentStep === 1 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              👤 設定你的暱稱
            </CardTitle>
            <CardDescription className="text-zinc-400">
              這是其他玩家在排行榜和賭局中看到的名稱
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例如：跑步小王子"
              className="h-14 border-zinc-700 bg-zinc-800 text-lg text-white placeholder:text-zinc-500"
              maxLength={20}
            />
            <Button
              onClick={handleSaveName}
              disabled={isSaving || !displayName.trim()}
              className="h-14 w-full bg-red-600 text-lg font-semibold text-white hover:bg-red-500"
            >
              {isSaving ? "儲存中..." : "確認暱稱"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Install Strava */}
      {currentStep === 2 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              📱 安裝 Strava App
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Strava 是全球最受歡迎的跑步追蹤 App，我們用它來記錄你的跑步數據
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* What is Strava */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-base font-bold text-white">
                什麼是 Strava？
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Strava 是一款免費的運動追蹤 App，可以記錄跑步、騎車等活動的距離、配速和路線。
                汗水賭場會自動從 Strava 讀取你的跑步資料，計算獲得的 $SC（汗水幣）。
              </p>
            </div>

            {/* Download links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-300">
                下載 Strava：
              </h3>
              <a
                href="https://apps.apple.com/app/strava-run-ride-swim/id426826309"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                  🍎
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">App Store</p>
                  <p className="text-xs text-zinc-500">iPhone / iPad</p>
                </div>
                <ExternalLink className="size-5 text-zinc-500" />
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.strava"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                  🤖
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Google Play</p>
                  <p className="text-xs text-zinc-500">Android</p>
                </div>
                <ExternalLink className="size-5 text-zinc-500" />
              </a>
            </div>

            {/* Registration guide */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-base font-bold text-white">
                📝 註冊 Strava 帳號
              </h3>
              <ol className="mt-3 space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">1.</span>
                  打開 Strava App，點「註冊」
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">2.</span>
                  可以用 Google 帳號或 Email 註冊
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">3.</span>
                  填寫基本資料（姓名、生日等）
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">4.</span>
                  選擇免費方案即可（不需要付費訂閱）
                </li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep(3)}
                className="h-14 flex-1 bg-red-600 text-lg font-semibold text-white hover:bg-red-500"
              >
                已安裝，下一步
                <ChevronRight className="ml-1 size-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Connect devices */}
      {currentStep === 3 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              ⌚ 連結你的運動裝置
            </CardTitle>
            <CardDescription className="text-zinc-400">
              透過手錶記錄跑步更準確！以下裝置都可以自動同步資料到 Strava
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Apple Watch */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                  ⌚
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Apple Watch
                  </h3>
                  <Badge className="mt-1 bg-green-900/50 text-green-400 border-green-700 text-xs">
                    推薦
                  </Badge>
                </div>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">1.</span>
                  在 iPhone 上打開 Strava App
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">2.</span>
                  點右下角「你」→ 右上角齒輪 ⚙️
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">3.</span>
                  選擇「應用程式、服務與裝置」
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">4.</span>
                  開啟「健康」同步（Apple Health）
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">5.</span>
                  或直接在 Apple Watch 上安裝 Strava App，用手錶開始跑步活動
                </li>
              </ol>
            </div>

            {/* Garmin */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                  🏃
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Garmin</h3>
                  <Badge className="mt-1 bg-blue-900/50 text-blue-400 border-blue-700 text-xs">
                    專業跑者
                  </Badge>
                </div>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">1.</span>
                  打開手機上的 Garmin Connect App
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">2.</span>
                  點左上角「≡」→「設定」→「第三方應用程式」
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">3.</span>
                  找到 Strava，點「連結」
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-red-400">4.</span>
                  登入 Strava 帳號並授權，完成後 Garmin 的活動會自動同步到 Strava
                </li>
              </ol>
            </div>

            {/* Other devices */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="size-8 text-zinc-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    其他裝置 / 手機直接跑
                  </h3>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                沒有手錶？沒關係！直接用手機開啟 Strava App，
                點「記錄」按鈕開始跑步就可以了。支援 GPS 定位追蹤。
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                其他支援自動同步到 Strava 的品牌：Suunto、Polar、COROS、Fitbit 等
              </p>
            </div>

            <Button
              onClick={() => setCurrentStep(4)}
              className="h-14 w-full bg-red-600 text-lg font-semibold text-white hover:bg-red-500"
            >
              下一步：串聯遊戲
              <ChevronRight className="ml-1 size-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Connect Strava to game */}
      {currentStep === 4 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              🔗 串聯 Strava 到汗水賭場
            </CardTitle>
            <CardDescription className="text-zinc-400">
              最後一步！授權汗水賭場讀取你的 Strava 跑步紀錄
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isStravaConnected ? (
              <div className="rounded-xl border border-green-900/50 bg-green-950/30 p-5 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/50 text-3xl">
                  ✅
                </div>
                <h3 className="text-lg font-bold text-green-400">
                  Strava 已成功串聯！
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  你的跑步活動將自動同步到汗水賭場，每公里可賺取 10 $SC！
                </p>
              </div>
            ) : (
              <>
                {/* How it works */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="text-base font-bold text-white">
                    串聯後會發生什麼？
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      每次跑步完成後，資料自動同步
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      系統自動計算你賺到的 $SC
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      遇到惡劣天氣跑步還能獲得 1.5 倍獎勵
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      排行榜和隊伍分數即時更新
                    </li>
                  </ul>
                </div>

                {/* Privacy note */}
                <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4">
                  <p className="text-sm text-amber-300">
                    🔒 我們只會讀取跑步活動的距離、時間和路線資料。不會修改你的 Strava 帳號，也不會看到你的密碼。
                  </p>
                </div>

                {stravaOAuthUrl ? (
                  <a href={stravaOAuthUrl}>
                    <Button className="h-14 w-full bg-[#FC4C02] text-lg font-semibold text-white hover:bg-[#e04402]">
                      <ExternalLink className="mr-2 size-5" />
                      授權連結 Strava
                    </Button>
                  </a>
                ) : (
                  <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 text-center">
                    <p className="text-base font-semibold text-amber-300">
                      ⏳ Strava 串聯功能即將開放
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      目前系統正在設定 Strava 連線，遊戲開始前會通知你完成串聯！
                    </p>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={handleGoToDashboard}
              variant={isStravaConnected ? "default" : "outline"}
              className={
                isStravaConnected
                  ? "h-14 w-full bg-red-600 text-lg font-semibold text-white hover:bg-red-500"
                  : "h-14 w-full border-zinc-700 text-lg text-zinc-300 hover:bg-zinc-800"
              }
            >
              {isStravaConnected ? "🎮 進入遊戲" : "稍後再連結，先逛逛"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
