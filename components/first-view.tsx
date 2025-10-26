"use client"

import { Card } from "@/components/ui/card"
import { Music, BarChart3 } from "lucide-react"

interface FirstViewProps {
  onSelectView: (view: "practice" | "analytics") => void
}

export function FirstView({ onSelectView }: FirstViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-16">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Chord Tone Practice</h1>
          <p className="text-sm text-muted-foreground">Select an option to begin</p>
        </div>

        {/* メニューオプション */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 練習を開始 */}
          <Card
            onClick={() => onSelectView("practice")}
            className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-[0.97] border-0 bg-muted/30"
          >
            <div className="p-12 flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <Music className="w-8 h-8 text-foreground" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-medium">Practice</h2>
                <p className="text-xs text-muted-foreground">Start training</p>
              </div>
            </div>
          </Card>

          {/* アナリティクスを見る */}
          <Card
            onClick={() => onSelectView("analytics")}
            className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-[0.97] border-0 bg-muted/30"
          >
            <div className="p-12 flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-foreground" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-medium">Analytics</h2>
                <p className="text-xs text-muted-foreground">View progress</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
