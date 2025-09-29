"use client"

import { useState } from "react"
import { MusicPracticeApp } from "./music-practice-app"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { FloatingMenu } from "./floating-menu"

export function AppContainer() {
  const [currentView, setCurrentView] = useState<"practice" | "analytics">("practice")

  return (
    <div className="relative">
      {currentView === "practice" ? <MusicPracticeApp /> : <AnalyticsDashboard />}

      <FloatingMenu currentView={currentView} onViewChange={setCurrentView} />
    </div>
  )
}
