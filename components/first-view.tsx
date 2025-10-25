"use client"

import { Card } from "@/components/ui/card"
import { Music, BarChart3 } from "lucide-react"

interface FirstViewProps {
  onSelectView: (view: "practice" | "analytics") => void
}

export function FirstView({ onSelectView }: FirstViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        {/* ヘッダー */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Music className="w-12 h-12 text-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">コードトーン練習</h1>
          <p className="text-muted-foreground">練習を開始するか、学習データを確認してください</p>
        </div>

        {/* メニューオプション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 練習を開始 */}
          <Card
            onClick={() => onSelectView("practice")}
            className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-8 flex flex-col items-center justify-center space-y-4 min-h-[280px]">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <Music className="w-8 h-8 text-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">練習を開始</h2>
                <p className="text-sm text-muted-foreground">コードトーンの理解を深める</p>
              </div>
            </div>
          </Card>

          {/* アナリティクスを見る */}
          <Card
            onClick={() => onSelectView("analytics")}
            className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-8 flex flex-col items-center justify-center space-y-4 min-h-[280px]">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <BarChart3 className="w-8 h-8 text-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">アナリティクスを見る</h2>
                <p className="text-sm text-muted-foreground">学習の進捗を分析する</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
