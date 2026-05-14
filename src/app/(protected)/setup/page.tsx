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
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  ChevronRight,
  Download,
  User,
} from "lucide-react";

/**
 * Onboarding page for new users.
 *
 * Guides them through:
 * 1. Setting a display name
 * 2. Done — start running!
 */

// Steps definition
const STEPS = [
  { id: 1, title: "設定暱稱", icon: User },
  { id: 2, title: "開始跑步", icon: Download },
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name ?? "");
        if (profile.display_name) setCurrentStep(2);
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

  function handleGoToDashboard() {
    router.push("/dashboard");
  }

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
              建議跟 LINE 名稱一致，方便大家辨識你是誰！
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

      {/* Step 2: Ready to go */}
      {currentStep === 2 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              🏃 準備開始跑步！
            </CardTitle>
            <CardDescription className="text-zinc-400">
              RunRun 會自動從 Apple Health 讀取你的跑步紀錄
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-green-900/50 bg-green-950/30 p-5 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/50 text-3xl">
                ✅
              </div>
              <h3 className="text-lg font-bold text-green-400">
                設定完成！
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                用 Apple Watch、Garmin 或任何跑步 App 跑步，資料會自動同步到 Apple Health，RunRun 會自動讀取計分。每公里可賺取 10 $SC！
              </p>
            </div>

            <Button
              onClick={handleGoToDashboard}
              className="h-14 w-full bg-red-600 text-lg font-semibold text-white hover:bg-red-500"
            >
              🎮 進入遊戲
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
