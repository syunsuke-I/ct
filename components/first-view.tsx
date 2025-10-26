"use client"

import { Card } from "@/components/ui/card"
import { Music, BarChart3 } from "lucide-react"

interface FirstViewProps {
  onSelectView: (view: "practice" | "analytics") => void
}

export function FirstView({ onSelectView }: FirstViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-12">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Code Tone Lesson</h1>
        </div>

        {/* メニューオプション */}
        <div className="space-y-3">
          {/* 練習を開始 */}
          <Card
            onClick={() => onSelectView("practice")}
            className="cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.98]"
          >
            <div className="p-6 flex items-center gap-4">
              <Music className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-medium">Start</h2>
            </div>
          </Card>

          {/* アナリティクスを見る */}
          <Card
            onClick={() => onSelectView("analytics")}
            className="cursor-pointer transition-all hover:bg-muted/50 active:scale-[0.98]"
          >
            <div className="p-6 flex items-center gap-4">
              <BarChart3 className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-medium">Show analytics</h2>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
