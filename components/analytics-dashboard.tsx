"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar, Legend, PolarAngleAxis, RadarChart, Radar, PolarGrid, PolarRadiusAxis } from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Calendar,
  Award,
  AlertTriangle,
  BarChart3,
  PieChartIcon,
  Activity,
  Music,
  X,
} from "lucide-react"
import { getStoredData, getWeeklyActivityData, getTopWeaknesses, getChordTypeWeaknesses, getHeatmapData, loadMockData, clearAllData, type UserStats } from "@/lib/storage"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

interface AnalyticsDashboardProps {
  onExit?: () => void
}

export function AnalyticsDashboard({ onExit }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; sessions: number }>>([])
  const [heatmapData, setHeatmapData] = useState<ReturnType<typeof getHeatmapData>>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("week")

  useEffect(() => {
    const loadData = () => {
      const userData = getStoredData()
      const weekData = getWeeklyActivityData()
      const heatmap = getHeatmapData()
      setStats(userData)
      setWeeklyData(weekData)
      setHeatmapData(heatmap)
    }

    loadData()
    // データが更新される可能性があるので定期的にリロード
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
    )
  }

  // 最近のセッションデータを取得
  const recentSessions = stats.sessions.slice(-10)

  // 進歩の傾向を計算
  const progressTrend =
    recentSessions.length >= 2 ? recentSessions[recentSessions.length - 1].score - recentSessions[0].score : 0

  const calculateLearningStreak = () => {
    if (stats.sessions.length === 0) return 0

    // セッションを日付でグループ化
    const sessionsByDate = new Map<string, number>()
    stats.sessions.forEach((session) => {
      const dateKey = new Date(session.date).toDateString()
      sessionsByDate.set(dateKey, (sessionsByDate.get(dateKey) || 0) + 1)
    })

    // 今日から遡って連続学習日数を計算
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      // 最大365日まで遡る
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateKey = checkDate.toDateString()

      if (sessionsByDate.has(dateKey)) {
        streak++
      } else {
        // 今日の場合は学習していなくてもストリークを継続
        if (i === 0) continue
        break
      }
    }

    return streak
  }

  const learningStreak = calculateLearningStreak()

  // チャート用データの準備
  const sessionChartData = recentSessions.map((session, index) => ({
    session: `セッション${recentSessions.length - index}`,
    score: (session.score / session.totalQuestions) * 100,
    responseTime: session.averageResponseTime / 1000,
    date: new Date(session.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
  }))

  const chordTypeWeaknesses = getChordTypeWeaknesses()
  const rootWeaknesses = getTopWeaknesses("root", 12)
  const intervalWeaknesses = getTopWeaknesses("interval", 3)

  // 音程別データに色を追加
  const intervalChartData = intervalWeaknesses.map((w, index) => ({
    ...w,
    fill: `var(--color-interval-${index + 1})`,
  }))

  const chordTypeData = [
    {
      type: "major",
      name: "メジャー",
      value: Object.values(stats.chordWeaknesses).filter(
        (w) =>
          !Object.keys(stats.chordWeaknesses)
            .find((k) => k.includes("m") || k.includes("7"))
            ?.includes("m"),
      ).length,
      fill: "var(--color-major)",
    },
    {
      type: "minor",
      name: "マイナー",
      value: Object.values(stats.chordWeaknesses).filter((w) =>
        Object.keys(stats.chordWeaknesses).find((k) => k.includes("m") && !k.includes("7") && !k.includes("-5")),
      ).length,
      fill: "var(--color-minor)",
    },
    {
      type: "seventh",
      name: "セブンス",
      value: Object.values(stats.chordWeaknesses).filter((w) =>
        Object.keys(stats.chordWeaknesses).find((k) => k.includes("7") && !k.includes("-5")),
      ).length,
      fill: "var(--color-seventh)",
    },
    {
      type: "m7b5",
      name: "m7-5",
      value: Object.values(stats.chordWeaknesses).filter((w) =>
        Object.keys(stats.chordWeaknesses).find((k) => k.includes("m7-5")),
      ).length,
      fill: "var(--color-m7b5)",
    },
  ].filter((item) => item.value > 0)

  const weeklyActivityChart = weeklyData.map((day, index) => ({
    date: new Date(day.date).toLocaleDateString("ja-JP", { weekday: "short" }),
    sessions: day.sessions,
    fullDate: day.date,
    fill: `var(--color-day-${index + 1})`,
  }))

  // 全期間のセッション数データを生成
  const allTimeActivityData = (() => {
    const sessionsByDate = new Map<string, { count: number; timestamp: number }>()

    stats.sessions.forEach((session) => {
      const date = new Date(session.date)
      const dateKey = date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
      const existing = sessionsByDate.get(dateKey)

      if (existing) {
        existing.count++
      } else {
        sessionsByDate.set(dateKey, { count: 1, timestamp: date.getTime() })
      }
    })

    return Array.from(sessionsByDate.entries())
      .map(([date, data]) => ({ date, sessions: data.count, timestamp: data.timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp)
  })()

  const handleLoadMockData = () => {
    const result = loadMockData()
    console.log("Generated mock data:", result)
    console.log("Total sessions:", result?.totalSessions)
    console.log("Sessions array length:", result?.sessions.length)
    window.location.reload()
  }

  const handleClearData = () => {
    if (confirm("全データをクリアしますか？")) {
      clearAllData()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 bg-background pb-20 relative">
      {/* 中断ボタン */}
      {onExit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="fixed top-4 right-4 w-8 h-8 z-10"
          aria-label="中断"
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* デバッグボタン */}
      <div className="fixed bottom-4 left-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleLoadMockData}>
          モックデータ読込
        </Button>
        <Button variant="outline" size="sm" onClick={handleClearData}>
          データクリア
        </Button>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-primary" />
              学習アナリティクス
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">あなたの音楽学習の進歩を詳しく分析</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              総セッション数: {stats.totalSessions}
            </Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">
              総問題数: {stats.totalQuestions}
            </Badge>
          </div>
        </div>

        {/* 概要カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">総合正答率</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {progressTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : progressTrend < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                ) : null}
                {progressTrend !== 0 && `${Math.abs(progressTrend)}問の変化`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">平均回答時間</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{(stats.averageResponseTime / 1000).toFixed(1)}秒</div>
              <p className="text-xs text-muted-foreground">全{stats.totalQuestions}問の平均</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">今週の活動</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {weeklyData.reduce((sum, day) => sum + day.sessions, 0)}
              </div>
              <p className="text-xs text-muted-foreground">セッション数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">学習ストリーク</CardTitle>
              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{learningStreak}日</div>
              <p className="text-xs text-muted-foreground">連続学習日数</p>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="progress" className="text-xs sm:text-sm px-2 py-2">
              進歩
            </TabsTrigger>
            <TabsTrigger value="weaknesses" className="text-xs sm:text-sm px-2 py-2">
              弱点分析
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm px-2 py-2">
              活動履歴
            </TabsTrigger>
            <TabsTrigger value="detailed" className="text-xs sm:text-sm px-2 py-2">
              詳細統計
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    スコアの推移
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">最近10セッションの正答率</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        score: {
                          label: "正答率",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="h-[250px]"
                    >
                      <LineChart data={sessionChartData}>
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="score" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    回答時間の推移
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">平均回答時間の変化</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      responseTime: {
                        label: "平均回答時間",
                        color: "hsl(221.2 83.2% 53.3%)",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <AreaChart data={sessionChartData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="responseTime" stroke="hsl(221.2 83.2% 53.3%)" fill="hsl(221.2 83.2% 53.3%)" fillOpacity={0.3} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weaknesses" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ルート音別正答率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    ルート音別正答率
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">各ルート音の正答率（最低3回出題）</CardDescription>
                </CardHeader>
                <CardContent>
                  {rootWeaknesses.length > 0 ? (
                    <ChartContainer
                      config={{
                        accuracy: {
                          label: "正答率 (%)",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={rootWeaknesses.map((w) => ({ root: w.name, accuracy: w.accuracy }))}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="root" />
                        <PolarGrid />
                        <Radar
                          dataKey="accuracy"
                          fill="var(--color-accuracy)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ルート音別解答速度 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    ルート音別解答速度
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">各ルート音の平均解答時間（秒）</CardDescription>
                </CardHeader>
                <CardContent>
                  {rootWeaknesses.length > 0 ? (
                    <ChartContainer
                      config={{
                        speed: {
                          label: "解答時間 (秒)",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={rootWeaknesses.map((w) => ({ root: w.name, speed: (w.avgResponseTime / 1000).toFixed(2) }))}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="root" />
                        <PolarGrid />
                        <Radar
                          dataKey="speed"
                          fill="var(--color-speed)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* コードタイプ別正答率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                    コードタイプ別正答率
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">各コードタイプの正答率（最低3回出題）</CardDescription>
                </CardHeader>
                <CardContent>
                  {chordTypeWeaknesses.length > 0 ? (
                    <ChartContainer
                      config={{
                        accuracy: {
                          label: "正答率 (%)",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={chordTypeWeaknesses.map((w) => ({ type: w.name, accuracy: w.accuracy }))}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="type" />
                        <PolarGrid />
                        <Radar
                          dataKey="accuracy"
                          fill="var(--color-accuracy)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Music className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* コードタイプ別解答速度 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                    コードタイプ別解答速度
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">各コードタイプの平均解答時間（秒）</CardDescription>
                </CardHeader>
                <CardContent>
                  {chordTypeWeaknesses.length > 0 ? (
                    <ChartContainer
                      config={{
                        speed: {
                          label: "解答時間 (秒)",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={chordTypeWeaknesses.map((w) => ({ type: w.name, speed: (w.avgResponseTime / 1000).toFixed(2) }))}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="type" />
                        <PolarGrid />
                        <Radar
                          dataKey="speed"
                          fill="var(--color-speed)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 音程別正答率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                    音程別正答率
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">3rd、5th、7thの正答率（最低3回出題）</CardDescription>
                </CardHeader>
                <CardContent>
                  {intervalWeaknesses.length > 0 ? (
                    <ChartContainer
                      config={{
                        accuracy: {
                          label: "正答率 (%)",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={intervalWeaknesses.map((w) => ({ interval: w.name, accuracy: w.accuracy }))}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="interval" />
                        <PolarGrid />
                        <Radar
                          dataKey="accuracy"
                          fill="var(--color-accuracy)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Target className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 音程別解答速度 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                    音程別解答速度
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">3rd、5th、7thの平均解答時間（秒）</CardDescription>
                </CardHeader>
                <CardContent>
                  {intervalWeaknesses.length > 0 ? (
                    <ChartContainer
                      config={{
                        speed: {
                          label: "解答時間 (秒)",
                          color: "hsl(221.2 83.2% 53.3%)",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px]"
                    >
                      <RadarChart data={intervalWeaknesses.map((w) => ({ interval: w.name, speed: (w.avgResponseTime / 1000).toFixed(2) }))}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="interval" />
                        <PolarGrid />
                        <Radar
                          dataKey="speed"
                          fill="var(--color-speed)"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">データがありません</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {/* 学習密度ヒートマップ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  学習密度カレンダー
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">過去90日間の学習活動（色が濃いほど活発）</CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapData.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                    <div className="inline-flex flex-col gap-1">
                      {/* 曜日ラベル */}
                      <div className="flex gap-1">
                        <div className="w-8 text-xs text-muted-foreground"></div>
                        {/* 週のグリッド */}
                        <div className="flex gap-1">
                          {Array.from({ length: 13 }).map((_, weekIndex) => {
                            // 各週の開始日を取得
                            const weekStart = heatmapData[weekIndex * 7]
                            if (!weekStart) return null

                            const monthLabel = weekStart.dateObj.toLocaleDateString("ja-JP", { month: "short" })
                            const showMonth = weekIndex === 0 || weekStart.dateObj.getDate() <= 7

                            return (
                              <div key={weekIndex} className="w-[52px] text-xs text-muted-foreground text-center">
                                {showMonth ? monthLabel : ""}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* カレンダーグリッド */}
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                        <div key={dayOfWeek} className="flex gap-1">
                          {/* 曜日ラベル */}
                          <div className="w-8 text-xs text-muted-foreground flex items-center">
                            {["日", "月", "火", "水", "木", "金", "土"][dayOfWeek]}
                          </div>

                          {/* 各週のセル */}
                          <div className="flex gap-1">
                            {Array.from({ length: 13 }).map((_, weekIndex) => {
                              const dataIndex = weekIndex * 7 + dayOfWeek
                              const dayData = heatmapData[dataIndex]

                              if (!dayData) return <div key={weekIndex} className="w-3 h-3 sm:w-4 sm:h-4" />

                              // セッション数に応じて色の濃さを決定
                              let bgColor = "bg-muted"
                              if (dayData.sessions >= 4) bgColor = "bg-blue-600"
                              else if (dayData.sessions === 3) bgColor = "bg-blue-500"
                              else if (dayData.sessions === 2) bgColor = "bg-blue-400"
                              else if (dayData.sessions === 1) bgColor = "bg-blue-300"

                              return (
                                <div
                                  key={weekIndex}
                                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${bgColor} cursor-pointer hover:ring-2 hover:ring-primary transition-all`}
                                  title={`${dayData.date}\n${dayData.sessions}セッション\n正答率: ${dayData.accuracy.toFixed(1)}%`}
                                />
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {/* 凡例 */}
                      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                        <span>少ない</span>
                        <div className="w-3 h-3 bg-muted rounded-sm" />
                        <div className="w-3 h-3 bg-blue-300 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                        <span>多い</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">データがありません</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  全期間の活動推移
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">全セッションの時系列推移</CardDescription>
              </CardHeader>
              <CardContent>
                {allTimeActivityData.length > 0 ? (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Chart */}
                    <div className="flex-1 min-w-0">
                      <ChartContainer
                        config={{
                          sessions: {
                            label: "セッション数",
                            color: "hsl(221.2 83.2% 53.3%)",
                          },
                        }}
                        className="h-[250px]"
                      >
                        <LineChart data={allTimeActivityData}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="sessions" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ChartContainer>
                    </div>

                    {/* Summary Statistics */}
                    <div className="lg:w-48 flex lg:flex-col gap-3 lg:gap-4 justify-between lg:justify-start">
                      <div className="flex-1 lg:flex-none">
                        <div className="text-xs text-muted-foreground mb-1">総セッション数</div>
                        <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                      </div>
                      <div className="flex-1 lg:flex-none">
                        <div className="text-xs text-muted-foreground mb-1">平均/日</div>
                        <div className="text-2xl font-bold">
                          {allTimeActivityData.length > 0
                            ? (stats.totalSessions / allTimeActivityData.length).toFixed(1)
                            : "0"}
                        </div>
                      </div>
                      <div className="flex-1 lg:flex-none">
                        <div className="text-xs text-muted-foreground mb-1">最多/日</div>
                        <div className="text-2xl font-bold">
                          {Math.max(...allTimeActivityData.map((d) => d.sessions), 0)}
                        </div>
                      </div>
                      <div className="flex-1 lg:flex-none">
                        <div className="text-xs text-muted-foreground mb-1">学習日数</div>
                        <div className="text-2xl font-bold">{allTimeActivityData.length}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">データがありません</p>
                      <p className="text-xs mt-1">左下の「モックデータ読込」ボタンでテストデータを生成できます</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  週間アクティビティ
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">過去7日間の学習セッション数</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    sessions: {
                      label: "セッション数",
                    },
                    "day-1": { color: "hsl(221.2 83.2% 53.3%)" },
                    "day-2": { color: "hsl(217 91% 60%)" },
                    "day-3": { color: "hsl(212 95% 68%)" },
                    "day-4": { color: "hsl(210 98% 73%)" },
                    "day-5": { color: "hsl(210 98% 78%)" },
                    "day-6": { color: "hsl(208 100% 85%)" },
                    "day-7": { color: "hsl(206 100% 91%)" },
                  }}
                  className="h-[250px]"
                >
                  <BarChart data={weeklyActivityChart}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sessions" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">最近のセッション履歴</CardTitle>
                <CardDescription className="text-xs sm:text-sm">直近10セッションの詳細</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {recentSessions.slice().reverse().map((session, index) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs sm:text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">
                            {new Date(session.date).toLocaleDateString("ja-JP", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            平均回答時間: {(session.averageResponseTime / 1000).toFixed(1)}秒
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm sm:text-lg font-bold">
                          {session.score}/{session.totalQuestions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((session.score / session.totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    コードタイプ分布
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">出題されたコードタイプの割合</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "コード数",
                      },
                      major: {
                        label: "メジャー",
                        color: "hsl(221.2 83.2% 53.3%)",
                      },
                      minor: {
                        label: "マイナー",
                        color: "hsl(212 95% 68%)",
                      },
                      seventh: {
                        label: "セブンス",
                        color: "hsl(216 92% 60%)",
                      },
                      m7b5: {
                        label: "m7-5",
                        color: "hsl(210 98% 78%)",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={chordTypeData}
                        dataKey="value"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        stroke="0"
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">学習統計サマリー</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">全体的な学習データ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* 総セッション数 */}
                    <div className="flex flex-col items-center">
                      <ChartContainer
                        config={{
                          sessions: {
                            label: "セッション",
                            color: "hsl(221.2 83.2% 53.3%)",
                          },
                        }}
                        className="mx-auto aspect-square w-full max-w-[150px]"
                      >
                        <RadialBarChart
                          data={[{ value: Math.min((stats.totalSessions / 100) * 100, 100) }]}
                          startAngle={90}
                          endAngle={450}
                          innerRadius={60}
                          outerRadius={80}
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                          <RadialBar dataKey="value" fill="hsl(221.2 83.2% 53.3%)" cornerRadius={10} />
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-foreground text-3xl font-bold"
                          >
                            {stats.totalSessions}
                          </text>
                        </RadialBarChart>
                      </ChartContainer>
                      <div className="text-sm text-muted-foreground mt-2">総セッション数</div>
                    </div>

                    {/* 総正解数 */}
                    <div className="flex flex-col items-center">
                      <ChartContainer
                        config={{
                          correct: {
                            label: "正解",
                            color: "hsl(212 95% 68%)",
                          },
                        }}
                        className="mx-auto aspect-square w-full max-w-[150px]"
                      >
                        <RadialBarChart
                          data={[{ value: Math.min((stats.totalCorrect / 500) * 100, 100) }]}
                          startAngle={90}
                          endAngle={450}
                          innerRadius={60}
                          outerRadius={80}
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                          <RadialBar dataKey="value" fill="hsl(212 95% 68%)" cornerRadius={10} />
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-foreground text-3xl font-bold"
                          >
                            {stats.totalCorrect}
                          </text>
                        </RadialBarChart>
                      </ChartContainer>
                      <div className="text-sm text-muted-foreground mt-2">総正解数</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <h4 className="font-semibold mb-2 text-sm">学習の推奨事項</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                      {stats.averageScore < 70 && <li>• 基礎的なコードトーンの復習をお勧めします</li>}
                      {rootWeaknesses.length > 0 && (
                        <li>• {rootWeaknesses[0].name}ルートのコードを重点的に練習しましょう</li>
                      )}
                      {stats.averageResponseTime > 5000 && <li>• 回答速度の向上を目指しましょう</li>}
                      {weeklyData.filter((d) => d.sessions > 0).length < 3 && (
                        <li>• 継続的な学習習慣を身につけましょう</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
