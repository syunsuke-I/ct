"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Menu, X, BarChart3, Play, Settings, HelpCircle, Trophy, TrendingUp, Calendar, Target } from "lucide-react"
import { getStoredData, getWeeklyActivityData } from "@/lib/storage"

interface FloatingMenuProps {
  currentView: "practice" | "analytics"
  onViewChange: (view: "practice" | "analytics") => void
}

export function FloatingMenu({ currentView, onViewChange }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState({
    todayBest: 0,
    weeklyAverage: 0,
    learningDays: 0,
    totalAccuracy: 0,
  })

  useEffect(() => {
    const userStats = getStoredData()
    const weeklyData = getWeeklyActivityData()

    // 今日のベストスコアを計算
    const today = new Date().toISOString().split("T")[0]
    const todaySessions = userStats.sessions.filter(s => s.date.startsWith(today))
    const todayBest = todaySessions.length > 0
      ? Math.max(...todaySessions.map(s => (s.score / s.totalQuestions) * 100))
      : 0

    // 週間平均を計算（過去7日間）
    const last7Days = userStats.sessions.filter(s => {
      const sessionDate = new Date(s.date)
      const daysDiff = (Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    })
    const weeklyAverage = last7Days.length > 0
      ? last7Days.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 100, 0) / last7Days.length
      : 0

    // 学習日数を計算（ユニークな日数）
    const learningDays = weeklyData.filter(d => d.sessions > 0).length

    // 総正答率
    const totalAccuracy = userStats.totalQuestions > 0
      ? (userStats.totalCorrect / userStats.totalQuestions) * 100
      : 0

    setStats({
      todayBest: Math.round(todayBest),
      weeklyAverage: Math.round(weeklyAverage),
      learningDays,
      totalAccuracy: Math.round(totalAccuracy),
    })
  }, [isOpen]) // メニューが開かれるたびに更新

  const menuItems = [
    {
      id: "practice",
      label: "Practice",
      icon: Play,
      description: "Start chord tone quiz",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "View learning data & progress",
    },
  ]

  const quickStats = [
    { icon: Trophy, label: "Today's best", value: `${stats.todayBest}%` },
    { icon: TrendingUp, label: "Weekly avg", value: `${stats.weeklyAverage}%` },
    { icon: Calendar, label: "Active days", value: `${stats.learningDays}` },
    { icon: Target, label: "Total accuracy", value: `${stats.totalAccuracy}%` },
  ]

  const handleMenuItemClick = (viewId: "practice" | "analytics") => {
    onViewChange(viewId)
    setIsOpen(false)
  }

  return (
    <>
      {/* フローティングメニューボタン */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </Button>
      </div>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* メニューパネル */}
      <div
        className={`fixed bottom-16 right-4 sm:bottom-24 sm:right-6 z-50 transition-all duration-300 transform ${
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <Card className="w-72 sm:w-80 p-4 sm:p-6 shadow-xl border-0 bg-white/95 backdrop-blur-md max-h-[80vh] overflow-y-auto">
          {/* ヘッダー */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-1">Music Practice</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Select a menu option</p>
          </div>

          {/* メインメニュー */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleMenuItemClick(item.id as "practice" | "analytics")}
                  className={`w-full h-auto p-3 sm:p-4 justify-start ${
                    isActive ? "bg-muted" : ""
                  } transition-all duration-200`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${
                        isActive ? "bg-muted" : "bg-muted/50"
                      } flex items-center justify-center`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-xs sm:text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{item.description}</div>
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-foreground"></div>}
                  </div>
                </Button>
              )
            })}
          </div>

          {/* クイック統計 */}
          <div className="border-t pt-3 sm:pt-4">
            <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-muted-foreground">Quick stats</h4>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs font-medium">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* フッター */}
          <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <HelpCircle className="w-3 h-3 mr-1" />
                Help
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
