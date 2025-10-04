"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Music, RotateCcw, Trophy, TrendingUp, AlertCircle, Clock } from "lucide-react"
import { saveSessionData, type SessionData } from "@/lib/storage"

const CHORD_TONES = {
  // メジャーコード
  C: ["C", "E", "G"],
  D: ["D", "F#", "A"],
  E: ["E", "G#", "B"],
  F: ["F", "A", "C"],
  G: ["G", "B", "D"],
  A: ["A", "C#", "E"],
  B: ["B", "D#", "F#"],
  Bb: ["Bb", "D", "F"],
  Eb: ["Eb", "G", "Bb"],
  Ab: ["Ab", "C", "Eb"],
  Db: ["Db", "F", "Ab"],
  Gb: ["Gb", "Bb", "Db"],

  // マイナーコード
  Cm: ["C", "Eb", "G"],
  Dm: ["D", "F", "A"],
  Em: ["E", "G", "B"],
  Fm: ["F", "Ab", "C"],
  Gm: ["G", "Bb", "D"],
  Am: ["A", "C", "E"],
  Bm: ["B", "D", "F#"],
  Bbm: ["Bb", "Db", "F"],
  Ebm: ["Eb", "Gb", "Bb"],
  Abm: ["Ab", "B", "Eb"],
  Dbm: ["Db", "E", "Ab"],
  Gbm: ["Gb", "A", "Db"],

  // セブンスコード
  C7: ["C", "E", "G", "Bb"],
  Cm7: ["C", "Eb", "G", "Bb"],
  D7: ["D", "F#", "A", "C"],
  Dm7: ["D", "F", "A", "C"],
  E7: ["E", "G#", "B", "D"],
  Em7: ["E", "G", "B", "D"],
  F7: ["F", "A", "C", "Eb"],
  Fm7: ["F", "Ab", "C", "Eb"],
  G7: ["G", "B", "D", "F"],
  Gm7: ["G", "Bb", "D", "F"],
  A7: ["A", "C#", "E", "G"],
  Am7: ["A", "C", "E", "G"],
  Bb7: ["Bb", "D", "F", "Ab"],
  Bbm7: ["Bb", "Db", "F", "Ab"],
  Eb7: ["Eb", "G", "Bb", "Db"],
  Ebm7: ["Eb", "Gb", "Bb", "Db"],

  // m7-5コード
  "Cm7-5": ["C", "Eb", "Gb", "Bb"],
  "Dm7-5": ["D", "F", "Ab", "C"],
  "Em7-5": ["E", "G", "Bb", "D"],
  "Fm7-5": ["F", "Ab", "B", "Eb"],
  "Gm7-5": ["G", "Bb", "Db", "F"],
  "Am7-5": ["A", "C", "Eb", "G"],
  "Bm7-5": ["B", "D", "F", "A"],
  "Bbm7-5": ["Bb", "Db", "E", "Ab"],
  "Ebm7-5": ["Eb", "Gb", "A", "Db"],
  "Abm7-5": ["Ab", "B", "D", "Gb"],
  "Dbm7-5": ["Db", "E", "G", "B"],
  "Gbm7-5": ["Gb", "A", "C", "E"],
}

const TONE_NAMES = ["3rd", "5th", "7th"]

type Question = {
  chord: string
  tonePosition: number
  toneName: string
  answer: string
  options: string[]
  startTime: number
}

type QuestionResult = {
  question: Question
  userAnswer: string
  isCorrect: boolean
  responseTime: number
}

export function MusicPracticeApp() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<QuestionResult[]>([])
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [answeredTime, setAnsweredTime] = useState<number | null>(null)

  // 選択肢を生成する関数
  const generateOptions = (correctAnswer: string): string[] => {
    const allNotes = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]
    const options = [correctAnswer]

    while (options.length < 4) {
      const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)]
      if (!options.includes(randomNote)) {
        options.push(randomNote)
      }
    }

    return options.sort(() => Math.random() - 0.5)
  }

  const generateQuestion = (): Question => {
    const chords = Object.keys(CHORD_TONES)
    const randomChord = chords[Math.floor(Math.random() * chords.length)]
    const tones = CHORD_TONES[randomChord as keyof typeof CHORD_TONES]

    // Rootを除外するため、インデックス1以降から選択（3rd、5th、7th）
    const availableIndices = []
    for (let i = 1; i < tones.length; i++) {
      availableIndices.push(i)
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    const answer = tones[randomIndex]

    return {
      chord: randomChord,
      tonePosition: randomIndex,
      toneName: TONE_NAMES[randomIndex - 1], // インデックス調整
      answer: answer,
      options: generateOptions(answer),
      startTime: Date.now(),
    }
  }

  // 新しいセッションを開始
  const startNewSession = () => {
    const newQuestions = Array.from({ length: 10 }, () => generateQuestion())
    setQuestions(newQuestions)
    const firstQuestion = { ...newQuestions[0], startTime: Date.now() }
    setCurrentQuestion(firstQuestion)
    setQuestionNumber(1)
    setScore(0)
    setSelectedAnswer("")
    setShowResult(false)
    setIsComplete(false)
    setResults([])
    setElapsedTime(0)
    setAnsweredTime(null)
  }

  // 答えを確認
  const checkAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.answer
    const responseTime = Date.now() - currentQuestion.startTime
    setAnsweredTime(responseTime)
    setShowResult(true)

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect: isCorrect,
      responseTime: responseTime,
    }
    setResults((prev) => [...prev, result])

    if (isCorrect) {
      setScore(score + 1)
      toast.success("正解！", {
        description: `${currentQuestion.chord}の${currentQuestion.toneName}は${currentQuestion.answer}です`,
        duration: 2000,
      })
    } else {
      toast.error("不正解", {
        description: `正解は${currentQuestion.answer}でした`,
        duration: 2000,
        style: {
          background: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
          border: "1px solid hsl(var(--destructive))",
        },
      })
    }

    setTimeout(() => {
      if (questionNumber < 10) {
        const nextQuestion = { ...questions[questionNumber], startTime: Date.now() }
        setCurrentQuestion(nextQuestion)
        setQuestionNumber(questionNumber + 1)
        setSelectedAnswer("")
        setShowResult(false)
        setElapsedTime(0)
        setAnsweredTime(null)
      } else {
        const sessionData: SessionData = {
          id: sessionId,
          date: new Date().toISOString(),
          score: score + (isCorrect ? 1 : 0),
          totalQuestions: 10,
          results: [...results, result],
          averageResponseTime: [...results, result].reduce((sum, r) => sum + r.responseTime, 0) / 10,
        }
        saveSessionData(sessionData)
        setIsComplete(true)
      }
    }, 2000)
  }

  const getDetailedStats = () => {
    const incorrectAnswers = results.filter((r) => !r.isCorrect)

    // コードタイプ別の統計
    const majorChords = results.filter((r) => !r.question.chord.includes("m") && !r.question.chord.includes("7"))
    const minorChords = results.filter(
      (r) => r.question.chord.includes("m") && !r.question.chord.includes("7") && !r.question.chord.includes("-5"),
    )
    const seventhChords = results.filter((r) => r.question.chord.includes("7") && !r.question.chord.includes("-5"))
    const m7b5Chords = results.filter((r) => r.question.chord.includes("m7-5"))

    // 音程別の統計
    const thirdQuestions = results.filter((r) => r.question.toneName === "3rd")
    const fifthQuestions = results.filter((r) => r.question.toneName === "5th")
    const seventhQuestions = results.filter((r) => r.question.toneName === "7th")

    // 回答時間の統計
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    const fastestResponse = Math.min(...results.map((r) => r.responseTime))
    const slowestResponse = Math.max(...results.map((r) => r.responseTime))

    return {
      incorrectAnswers,
      chordTypes: {
        major: { total: majorChords.length, correct: majorChords.filter((r) => r.isCorrect).length },
        minor: { total: minorChords.length, correct: minorChords.filter((r) => r.isCorrect).length },
        seventh: { total: seventhChords.length, correct: seventhChords.filter((r) => r.isCorrect).length },
        m7b5: { total: m7b5Chords.length, correct: m7b5Chords.filter((r) => r.isCorrect).length },
      },
      intervals: {
        third: { total: thirdQuestions.length, correct: thirdQuestions.filter((r) => r.isCorrect).length },
        fifth: { total: fifthQuestions.length, correct: fifthQuestions.filter((r) => r.isCorrect).length },
        seventh: { total: seventhQuestions.length, correct: seventhQuestions.filter((r) => r.isCorrect).length },
      },
      timing: {
        average: averageResponseTime,
        fastest: fastestResponse,
        slowest: slowestResponse,
      },
    }
  }

  const getAdvice = (stats: ReturnType<typeof getDetailedStats>) => {
    const percentage = (score / 10) * 100

    if (percentage >= 90) return "素晴らしい！コードトーンの理解が深まっています。"
    if (percentage >= 70) return "良い調子です！継続して練習を続けましょう。"
    if (percentage >= 50) return "基礎は身についています。苦手な部分を重点的に練習しましょう。"
    return "基礎から復習することをお勧めします。焦らず一歩ずつ進めましょう。"
  }

  // リアルタイム経過時間更新
  useEffect(() => {
    if (!currentQuestion || showResult) {
      return
    }

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - currentQuestion.startTime)
    }, 100)

    return () => clearInterval(timer)
  }, [currentQuestion, showResult])

  // 初期化
  useEffect(() => {
    startNewSession()
  }, [])

  if (isComplete) {
    const stats = getDetailedStats()
    const advice = getAdvice(stats)

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 animate-scale-in">
          {/* ヘッダー部分 */}
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2 text-balance">セッション完了！</h2>
            <p className="text-muted-foreground">10問中{score}問正解</p>
          </div>

          {/* スコア表示 */}
          <div className="mb-8 text-center">
            <div className="text-4xl font-bold mb-2">{Math.round((score / 10) * 100)}%</div>
            <Progress value={(score / 10) * 100} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground">{advice}</p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>平均回答時間: {(stats.timing.average / 1000).toFixed(1)}秒</p>
              <p>
                最速: {(stats.timing.fastest / 1000).toFixed(1)}秒 | 最遅: {(stats.timing.slowest / 1000).toFixed(1)}秒
              </p>
            </div>
          </div>

          {/* 詳細統計 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* コードタイプ別統計 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                コードタイプ別成績
              </h3>
              <div className="space-y-2 text-sm">
                {stats.chordTypes.major.total > 0 && (
                  <div className="flex justify-between">
                    <span>メジャーコード</span>
                    <span>
                      {stats.chordTypes.major.correct}/{stats.chordTypes.major.total}
                    </span>
                  </div>
                )}
                {stats.chordTypes.minor.total > 0 && (
                  <div className="flex justify-between">
                    <span>マイナーコード</span>
                    <span>
                      {stats.chordTypes.minor.correct}/{stats.chordTypes.minor.total}
                    </span>
                  </div>
                )}
                {stats.chordTypes.seventh.total > 0 && (
                  <div className="flex justify-between">
                    <span>セブンスコード</span>
                    <span>
                      {stats.chordTypes.seventh.correct}/{stats.chordTypes.seventh.total}
                    </span>
                  </div>
                )}
                {stats.chordTypes.m7b5.total > 0 && (
                  <div className="flex justify-between">
                    <span>m7-5コード</span>
                    <span>
                      {stats.chordTypes.m7b5.correct}/{stats.chordTypes.m7b5.total}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 音程別統計 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Music className="w-4 h-4 mr-2" />
                音程別成績
              </h3>
              <div className="space-y-2 text-sm">
                {stats.intervals.third.total > 0 && (
                  <div className="flex justify-between">
                    <span>3rd</span>
                    <span>
                      {stats.intervals.third.correct}/{stats.intervals.third.total}
                    </span>
                  </div>
                )}
                {stats.intervals.fifth.total > 0 && (
                  <div className="flex justify-between">
                    <span>5th</span>
                    <span>
                      {stats.intervals.fifth.correct}/{stats.intervals.fifth.total}
                    </span>
                  </div>
                )}
                {stats.intervals.seventh.total > 0 && (
                  <div className="flex justify-between">
                    <span>7th</span>
                    <span>
                      {stats.intervals.seventh.correct}/{stats.intervals.seventh.total}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 間違えた問題の詳細 */}
          {stats.incorrectAnswers.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                復習が必要な問題
              </h3>
              <div className="space-y-2">
                {stats.incorrectAnswers.map((result, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                    <div>
                      <span className="font-mono font-semibold">{result.question.chord}</span>
                      <span className="text-muted-foreground ml-2">の{result.question.toneName}</span>
                      <span className="text-muted-foreground ml-2">({(result.responseTime / 1000).toFixed(1)}秒)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600">あなたの回答: {result.userAnswer}</div>
                      <div className="text-green-600">正解: {result.question.answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={startNewSession} className="w-full" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            もう一度練習する
          </Button>
        </Card>
        <Toaster />
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Music className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 animate-fade-in">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-6 h-6 mr-2 text-muted-foreground" />
            <h1 className="text-xl font-semibold">コードトーン練習</h1>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>問題 {questionNumber}/10</span>
            <span>正解数: {score}</span>
          </div>

          <Progress value={((questionNumber - 1) / 10) * 100} className="h-1" />
        </div>

        {/* 問題 */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="text-4xl font-bold mb-2 font-mono">{currentQuestion.chord}</div>
            <p className="text-lg text-muted-foreground">の{currentQuestion.toneName}は？</p>
          </div>

          {/* 時間表示 */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={`font-mono ${showResult ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
              {showResult && answeredTime !== null
                ? `${(answeredTime / 1000).toFixed(1)}秒`
                : `${(elapsedTime / 1000).toFixed(1)}秒`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              variant={selectedAnswer === option ? "default" : "outline"}
              size="lg"
              onClick={() => !showResult && setSelectedAnswer(option)}
              disabled={showResult}
              className={`h-16 text-lg font-mono transition-all duration-200 ${
                showResult && option === currentQuestion.answer
                  ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                  : showResult && selectedAnswer === option && option !== currentQuestion.answer
                    ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-100"
                    : ""
              }`}
            >
              {option}
            </Button>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="text-center">
          {!showResult ? (
            <Button onClick={checkAnswer} disabled={!selectedAnswer} size="lg" className="w-full">
              答えを確認
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">次の問題まで...</div>
          )}
        </div>
      </Card>
      <Toaster />
    </div>
  )
}
