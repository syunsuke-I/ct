"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts"
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
import { getStoredData, getWeeklyActivityData, getTopWeaknesses, type UserStats } from "@/lib/storage"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

interface AnalyticsDashboardProps {
  onExit?: () => void
}

export function AnalyticsDashboard({ onExit }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; sessions: number }>>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("week")

  useEffect(() => {
    const loadData = () => {
      const userData = getStoredData()
      const weekData = getWeeklyActivityData()
      setStats(userData)
      setWeeklyData(weekData)
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
  const recentSessions = stats.sessions.slice(-10).reverse()

  // 進歩の傾向を計算
  const progressTrend =
    recentSessions.length >= 2 ? recentSessions[0].score - recentSessions[recentSessions.length - 1].score : 0

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

  const chordWeaknesses = getTopWeaknesses("chord", 8)
  const rootWeaknesses = getTopWeaknesses("root", 12)
  const intervalWeaknesses = getTopWeaknesses("interval", 3)

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

  const weeklyActivityChart = weeklyData.map((day) => ({
    date: new Date(day.date).toLocaleDateString("ja-JP", { weekday: "short" }),
    sessions: day.sessions,
    fullDate: day.date,
  }))

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
                  <ChartContainer
                    config={{
                      score: {
                        label: "正答率",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <LineChart data={sessionChartData}>
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
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
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <AreaChart data={sessionChartData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="responseTime" stroke="var(--color-responseTime)" fill="var(--color-responseTime)" fillOpacity={0.3} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weaknesses" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    ルート音別弱点
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">正答率の低いルート音（最低3回出題）</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {rootWeaknesses.slice(0, 6).map((weakness, index) => (
                      <div key={weakness.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs sm:text-sm font-mono font-bold">
                            {weakness.name}
                          </div>
                          <div>
                            <p className="font-medium text-xs sm:text-sm">{weakness.name}ルート</p>
                            <p className="text-xs text-muted-foreground">
                              {weakness.correct}/{weakness.total}問正解
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-bold text-red-600">
                            {weakness.accuracy.toFixed(1)}%
                          </div>
                          <Progress value={weakness.accuracy} className="w-16 sm:w-20 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                    コード別弱点
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">苦手なコードタイプ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {chordWeaknesses.slice(0, 6).map((weakness, index) => (
                      <div key={weakness.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold">
                            {weakness.name.length > 4 ? weakness.name.substring(0, 3) : weakness.name}
                          </div>
                          <div>
                            <p className="font-medium text-xs sm:text-sm">{weakness.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {weakness.correct}/{weakness.total}問正解
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-bold text-red-600">
                            {weakness.accuracy.toFixed(1)}%
                          </div>
                          <Progress value={weakness.accuracy} className="w-16 sm:w-20 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                  音程別成績
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">3rd、5th、7thの正答率比較</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    accuracy: {
                      label: "正答率",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <BarChart data={intervalWeaknesses.map((w) => ({ name: w.name, accuracy: w.accuracy, total: w.total }))}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="accuracy" fill="var(--color-accuracy)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
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
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <BarChart data={weeklyActivityChart}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sessions" fill="var(--color-sessions)" />
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
                  {recentSessions.map((session, index) => (
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
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">総セッション数</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalCorrect}</div>
                      <div className="text-xs text-muted-foreground">総正解数</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-orange-600">
                        {Object.keys(stats.chordWeaknesses).length}
                      </div>
                      <div className="text-xs text-muted-foreground">学習したコード数</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">
                        {Object.keys(stats.rootWeaknesses).length}
                      </div>
                      <div className="text-xs text-muted-foreground">学習したルート音数</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
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
