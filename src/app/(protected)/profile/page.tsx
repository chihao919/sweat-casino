"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { TeamBadge } from "@/components/teams/team-badge";
import { createClient } from "@/lib/supabase/client";
import { Profile, Activity } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { format, parseISO, differenceInDays } from "date-fns";
import { Camera, ExternalLink, RefreshCw, Unlink, User } from "lucide-react";

function getStravaOAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI
    || (typeof window !== "undefined" ? `${window.location.origin}/api/strava/callback` : "");
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,activity:read_all`;
}

interface ProfileStats {
  totalDistance: number;
  totalActivities: number;
  currentStreak: number;
  longestStreak: number;
}

function calculateStats(activities: Activity[]): ProfileStats {
  if (activities.length === 0) {
    return { totalDistance: 0, totalActivities: 0, currentStreak: 0, longestStreak: 0 };
  }

  const totalDistance = activities.reduce((sum, a) => sum + a.distance_km, 0);

  // Sort by date descending for streak calculation
  const sorted = [...activities].sort(
    (a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  );

  // Build a set of unique activity dates
  const dateDaySet = new Set(
    sorted.map((a) => format(parseISO(a.activity_date), "yyyy-MM-dd"))
  );
  const uniqueDates = Array.from(dateDaySet).sort().reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;

  // Check current streak starting from today or yesterday
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const hasToday = dateDaySet.has(todayStr);
  const startCheck = hasToday
    ? new Date()
    : new Date(Date.now() - 86400000);

  const startCheckStr = format(startCheck, "yyyy-MM-dd");
  if (dateDaySet.has(startCheckStr)) {
    currentStreak = 1;
    let checkDate = new Date(startCheck);
    for (let i = 1; i <= 365; i++) {
      checkDate = new Date(checkDate.getTime() - 86400000);
      const checkStr = format(checkDate, "yyyy-MM-dd");
      if (dateDaySet.has(checkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak from all unique dates
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = differenceInDays(
      parseISO(uniqueDates[i - 1]),
      parseISO(uniqueDates[i])
    );
    if (diff === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    totalDistance,
    totalActivities: activities.length,
    currentStreak,
    longestStreak,
  };
}

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-center">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-white">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-neutral-400">{unit}</span>}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserEmail(user.email ?? "");

        const [profileRes, activitiesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*, team:teams(*)")
            .eq("id", user.id)
            .single<Profile>(),
          supabase
            .from("activities")
            .select("*")
            .eq("user_id", user.id),
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
          setDisplayName(profileRes.data.display_name ?? "");
        }
        if (activitiesRes.data) setActivities(activitiesRes.data as Activity[]);
      } catch (err) {
        console.error("ProfilePage: failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  async function handleSaveDisplayName() {
    if (!profile) return;
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to save display name.");
    } else {
      toast.success("Display name updated!");
      setProfile((prev) => (prev ? { ...prev, display_name: displayName } : prev));
    }
    setIsSaving(false);
  }

  async function handleDisconnectStrava() {
    if (!profile) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        strava_athlete_id: null,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to disconnect Strava.");
    } else {
      toast.success("Strava disconnected.");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              strava_athlete_id: null,
              strava_access_token: null,
              strava_refresh_token: null,
              strava_token_expires_at: null,
            }
          : prev
      );
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片檔案");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("圖片大小不能超過 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { avatar_url } = await res.json();
      toast.success("頭像已更新！");
      setProfile((prev) => (prev ? { ...prev, avatar_url } : prev));
    } else {
      const { error } = await res.json();
      toast.error("頭像上傳失敗：" + (error || "未知錯誤"));
    }
    setIsUploadingAvatar(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl bg-neutral-800" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const stats = calculateStats(activities);
  const initials = (profile.display_name ?? profile.username ?? "SC").slice(0, 2).toUpperCase();
  const teamInfo = profile.team
    ? {
        name: profile.team.name,
        color: profile.team.color,
        emoji: profile.team.name.toLowerCase().includes("red") ? "🐂" : "🐻‍❄️",
      }
    : null;

  const isStravaConnected = Boolean(profile.strava_athlete_id);

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="relative">
            <Avatar className="size-20 ring-2 ring-red-600 ring-offset-2 ring-offset-neutral-900">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-neutral-800 text-2xl font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 transition-colors"
            >
              {isUploadingAvatar ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black text-white">
              {profile.display_name ?? profile.username ?? "Anonymous Athlete"}
            </h2>
            {profile.username && profile.display_name && (
              <p className="text-sm text-neutral-500">@{profile.username}</p>
            )}
          </div>

          {teamInfo ? (
            <TeamBadge team={teamInfo} size="lg" />
          ) : (
            <Badge variant="outline" className="border-neutral-700 text-neutral-400">
              未分配隊伍
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          統計數據
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="總距離"
            value={stats.totalDistance.toFixed(1)}
            unit="km"
          />
          <StatCard label="總活動數" value={stats.totalActivities} />
          <StatCard
            label="目前連續"
            value={`${stats.currentStreak}🔥`}
            unit="天"
          />
          <StatCard
            label="最長連續"
            value={stats.longestStreak}
            unit="天"
          />
          <StatCard
            label="$SC 餘額"
            value={formatSC(profile.sc_balance)}
          />
        </div>
      </div>

      {/* Strava connection */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-semibold text-neutral-300">
            <span>Strava 連結</span>
            {isStravaConnected ? (
              <Badge className="bg-green-900/50 text-green-400 border-green-700">已連結</Badge>
            ) : (
              <Badge variant="outline" className="border-neutral-700 text-neutral-500">
                未連結
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isStravaConnected ? (
            <>
              <div className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2">
                <p className="text-xs text-neutral-500">Athlete ID</p>
                <p className="font-mono text-sm text-neutral-300">
                  {profile.strava_athlete_id}
                </p>
              </div>
              {profile.strava_token_expires_at && (
                <div className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2">
                  <p className="text-xs text-neutral-500">Token expires</p>
                  <p className="text-sm text-neutral-300">
                    {format(parseISO(profile.strava_token_expires_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300"
                onClick={handleDisconnectStrava}
              >
                <Unlink className="mr-2 size-4" />
                解除連結 Strava
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-neutral-400">
                連結您的 Strava 帳號，自動同步跑步活動並賺取 $SC。
              </p>
              <Button asChild className="w-full bg-[#FC4C02] font-semibold text-white hover:bg-[#e04402]">
                <a href="/api/strava/connect">
                  <ExternalLink className="mr-2 size-4" />
                  連結 Strava
                </a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
            <User className="size-4" />
            編輯個人資料
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-xs text-neutral-400">
              顯示名稱（建議跟 LINE 名稱一致，方便辨識）
            </Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="您的公開名稱"
                className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-red-600"
              />
              <Button
                onClick={handleSaveDisplayName}
                disabled={isSaving || displayName === profile.display_name}
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="size-4 animate-spin" /> : "儲存"}
              </Button>
            </div>
          </div>

          <Separator className="bg-neutral-800" />

          <div className="space-y-1">
            <Label className="text-xs text-neutral-400">電子郵件</Label>
            <p className="text-sm text-neutral-300">{userEmail || "—"}</p>
            <p className="text-xs text-neutral-600">電子郵件無法在此變更。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
