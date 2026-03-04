"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface Player {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  teamId: string | null;
  team: Team | null;
  joinedAt: string;
}

interface PlayersData {
  total: number;
  unassigned: number;
  teamCounts: Record<string, number>;
  teams: Team[];
  players: Player[];
}

export default function PlayersPage() {
  const [data, setData] = useState<PlayersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/players")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Game start date
  const gameStart = new Date("2026-03-11T00:00:00+08:00");
  const now = new Date();
  const daysUntilStart = Math.max(
    0,
    Math.ceil((gameStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.1)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/login" className="inline-block">
            <h1 className="text-4xl font-black tracking-tight text-white">
              汗水賭場 🎰
            </h1>
          </Link>
          <p className="mt-2 text-lg text-zinc-400">已報名玩家一覽</p>
        </div>

        {/* Countdown banner */}
        <Card className="mb-6 border-red-900/50 bg-gradient-to-r from-red-950/60 to-zinc-900">
          <CardContent className="py-5 text-center">
            {daysUntilStart > 0 ? (
              <>
                <p className="text-2xl font-bold text-red-400">
                  🔥 距離開賽還有 {daysUntilStart} 天
                </p>
                <p className="mt-2 text-base text-zinc-300">
                  3 月 11 日（週三）正式開賽！
                  <br />
                  比賽開始前會完成分隊，現在先來登記報名吧！
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-green-400">
                🎮 遊戲已經開始！
              </p>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-zinc-800"
              />
            ))}
          </div>
        ) : !data ? (
          <p className="text-center text-zinc-500">載入失敗</p>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="py-4 text-center">
                  <p className="text-3xl font-bold text-white">{data.total}</p>
                  <p className="text-sm text-zinc-400">總報名人數</p>
                </CardContent>
              </Card>
              {data.teams.map((team) => (
                <Card
                  key={team.id}
                  className={`border-zinc-800 ${
                    team.color === "red"
                      ? "bg-red-950/40"
                      : "bg-zinc-800/60"
                  }`}
                >
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-white">
                      {data.teamCounts[team.name] || 0}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {team.emoji} {team.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Notice */}
            <Card className="mb-6 border-amber-900/30 bg-amber-950/20">
              <CardContent className="py-4">
                <p className="text-center text-base text-amber-300">
                  📢 系統會在開賽前自動完成分隊，確保紅白兩隊人數均衡！
                </p>
              </CardContent>
            </Card>

            {/* Player list */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  報名名單
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  已登入並完成報名的玩家
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.players.length === 0 ? (
                  <p className="py-8 text-center text-zinc-500">
                    還沒有人報名，成為第一個吧！
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.players.map((player, idx) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                      >
                        {/* Number */}
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                          {idx + 1}
                        </span>

                        {/* Avatar */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-lg">
                          {player.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={player.avatarUrl}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            "🏃"
                          )}
                        </div>

                        {/* Name + team */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-medium text-white">
                            {player.displayName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(player.joinedAt).toLocaleDateString(
                              "zh-TW"
                            )}
                            {" 加入"}
                          </p>
                        </div>

                        {/* Team badge */}
                        {player.team ? (
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                              player.team.color === "red"
                                ? "bg-red-900/60 text-red-300"
                                : "bg-zinc-700 text-zinc-200"
                            }`}
                          >
                            {player.team.emoji} {player.team.name}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-500">
                            待分隊
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="mt-8 text-center space-y-4">
              <Link href="/login">
                <Button className="bg-red-600 text-white font-semibold hover:bg-red-500 h-14 text-lg px-10">
                  🎰 立即報名
                </Button>
              </Link>
              <Link
                href="/guide"
                className="block text-base text-zinc-400 hover:text-zinc-300 hover:underline"
              >
                📖 查看遊戲規則
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
