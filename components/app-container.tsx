"use client"

import { useState } from "react"
import { FirstView } from "./first-view"
import { MusicPracticeApp } from "./music-practice-app"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { FloatingMenu } from "./floating-menu"

export function AppContainer() {
  const [currentView, setCurrentView] = useState<"first-view" | "practice" | "analytics">("first-view")

  const handleExit = () => {
    setCurrentView("first-view")
  }

  return (
    <div className="relative">
      {currentView === "first-view" && <FirstView onSelectView={setCurrentView} />}
      {currentView === "practice" && <MusicPracticeApp onExit={handleExit} />}
      {currentView === "analytics" && <AnalyticsDashboard onExit={handleExit} />}

      {currentView !== "first-view" && <FloatingMenu currentView={currentView} onViewChange={setCurrentView} />}
    </div>
  )
}
