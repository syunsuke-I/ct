"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Music, RotateCcw, Trophy, TrendingUp, AlertCircle, Clock, X } from "lucide-react"
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

// コード名を整形する関数（bや#を上付き文字にする）
const formatChordName = (chord: string) => {
  // ルート音とそれ以降を分離
  const match = chord.match(/^([A-G])([b#]?)(.*)$/)
  if (!match) return chord

  const [, root, accidental, suffix] = match

  return (
    <>
      {root}
      {accidental && <sup className="text-[0.6em]">{accidental}</sup>}
      {suffix}
    </>
  )
}

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

interface MusicPracticeAppProps {
  onExit?: () => void
}

export function MusicPracticeApp({ onExit }: MusicPracticeAppProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<QuestionResult[]>([])
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`)
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
  const checkAnswer = (answer: string) => {
    if (!currentQuestion || showResult) return

    const isCorrect = answer === currentQuestion.answer
    const responseTime = Date.now() - currentQuestion.startTime
    setAnsweredTime(responseTime)
    setSelectedAnswer(answer)
    setShowResult(true)

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer: answer,
      isCorrect: isCorrect,
      responseTime: responseTime,
    }
    setResults((prev) => [...prev, result])

    if (isCorrect) {
      setScore(score + 1)
      toast.success("Correct!", {
        description: `${currentQuestion.toneName} of ${currentQuestion.chord} is ${currentQuestion.answer}`,
        duration: 2000,
      })
    } else {
      toast.error("Wrong", {
        description: `Correct answer: ${currentQuestion.answer}`,
        duration: 2000,
        style: {
          background: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
          border: "1px solid hsl(var(--destructive))",
        },
      })
    }

    // 即座に次の問題へ移行
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

  const getAdvice = () => {
    const percentage = (score / 10) * 100

    if (percentage >= 90) return "Excellent! Your understanding of chord tones is improving."
    if (percentage >= 70) return "Good work! Keep practicing consistently."
    if (percentage >= 50) return "You have the basics. Focus on your weak areas."
    return "Review the fundamentals. Take it one step at a time."
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
    const advice = getAdvice()

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-3xl p-12 animate-scale-in border-0 bg-muted/30">
          {/* ヘッダー部分 */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-background flex items-center justify-center">
              <Trophy className="w-10 h-10 text-foreground" />
            </div>
            <h2 className="text-3xl font-semibold mb-3 text-balance">Session Complete</h2>
            <p className="text-muted-foreground">{score} out of 10 correct</p>
          </div>

          {/* スコア表示 */}
          <div className="mb-12 text-center">
            <div className="text-6xl font-bold mb-4">{Math.round((score / 10) * 100)}%</div>
            <Progress value={(score / 10) * 100} className="h-3 mb-6" />
            <p className="text-sm text-muted-foreground mb-8">{advice}</p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="font-mono font-semibold text-foreground">{(stats.timing.average / 1000).toFixed(1)}s</div>
                <div>Avg time</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-semibold text-foreground">{(stats.timing.fastest / 1000).toFixed(1)}s</div>
                <div>Fastest</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-semibold text-foreground">{(stats.timing.slowest / 1000).toFixed(1)}s</div>
                <div>Slowest</div>
              </div>
            </div>
          </div>

          {/* 詳細統計 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* コードタイプ別統計 */}
            <div className="bg-background/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                By chord type
              </h3>
              <div className="space-y-3 text-sm">
                {stats.chordTypes.major.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Major</span>
                    <span className="font-mono font-semibold">
                      {stats.chordTypes.major.correct}/{stats.chordTypes.major.total}
                    </span>
                  </div>
                )}
                {stats.chordTypes.minor.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minor</span>
                    <span className="font-mono font-semibold">
                      {stats.chordTypes.minor.correct}/{stats.chordTypes.minor.total}
                    </span>
                  </div>
                )}
                {stats.chordTypes.seventh.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seventh</span>
                    <span className="font-mono font-semibold">
                      {stats.chordTypes.seventh.correct}/{stats.chordTypes.seventh.total}
                    </span>
                  </div>
                )}
                {stats.chordTypes.m7b5.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">m7-5</span>
                    <span className="font-mono font-semibold">
                      {stats.chordTypes.m7b5.correct}/{stats.chordTypes.m7b5.total}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 音程別統計 */}
            <div className="bg-background/50 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center text-sm">
                <Music className="w-4 h-4 mr-2" />
                By interval
              </h3>
              <div className="space-y-3 text-sm">
                {stats.intervals.third.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">3rd</span>
                    <span className="font-mono font-semibold">
                      {stats.intervals.third.correct}/{stats.intervals.third.total}
                    </span>
                  </div>
                )}
                {stats.intervals.fifth.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">5th</span>
                    <span className="font-mono font-semibold">
                      {stats.intervals.fifth.correct}/{stats.intervals.fifth.total}
                    </span>
                  </div>
                )}
                {stats.intervals.seventh.total > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">7th</span>
                    <span className="font-mono font-semibold">
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
              <h3 className="font-semibold mb-4 flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Review needed
              </h3>
              <div className="space-y-2">
                {stats.incorrectAnswers.map((result, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-background/50 rounded-lg text-sm">
                    <div>
                      <span className="font-mono font-semibold text-base">{formatChordName(result.question.chord)}</span>
                      <span className="text-muted-foreground ml-3">{result.question.toneName}</span>
                      <span className="text-muted-foreground ml-3">({(result.responseTime / 1000).toFixed(1)}s)</span>
                    </div>
                    <div className="text-right font-mono text-xs space-y-1">
                      <div className="text-muted-foreground">Your: {formatChordName(result.userAnswer)}</div>
                      <div className="text-foreground font-semibold">Correct: {formatChordName(result.question.answer)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={startNewSession} className="w-full h-14 text-base" size="lg">
            <RotateCcw className="w-5 h-5 mr-2" />
            Practice again
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-12 animate-fade-in relative border-0 bg-muted/30">
        {/* 中断ボタン */}
        {onExit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="absolute top-4 right-4 w-10 h-10"
            aria-label="Exit"
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* ヘッダー */}
        <div className="mb-12">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span>Question {questionNumber}/10</span>
            <span>Score: {score}/10</span>
          </div>

          <Progress value={((questionNumber - 1) / 10) * 100} className="h-2" />
        </div>

        {/* 問題 */}
        <div className="mb-12 relative">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="text-6xl font-bold font-mono">{formatChordName(currentQuestion.chord)}</div>
              <p className="text-lg text-muted-foreground">What is the {currentQuestion.toneName}?</p>
            </div>

            {/* 時間表示 */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={`font-mono ${showResult ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
                {showResult && answeredTime !== null
                  ? `${(answeredTime / 1000).toFixed(1)}s`
                  : `${(elapsedTime / 1000).toFixed(1)}s`}
              </span>
            </div>
          </div>

          {/* 次の問題プレビュー */}
          {questionNumber < 10 && !showResult && (
            <div className="absolute right-24 top-12 opacity-15 text-right">
              <div className="text-3xl font-mono">{formatChordName(questions[questionNumber].chord)}</div>
              <p className="text-xs mt-1">{questions[questionNumber].toneName}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              variant="outline"
              size="lg"
              onClick={() => checkAnswer(option)}
              disabled={showResult}
              className={`h-20 text-2xl font-mono transition-all duration-200 border-2 ${
                showResult && option === currentQuestion.answer
                  ? "bg-foreground text-background border-foreground hover:bg-foreground"
                  : showResult && selectedAnswer === option && option !== currentQuestion.answer
                    ? "bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted"
                    : "hover:bg-muted/50"
              }`}
            >
              {formatChordName(option)}
            </Button>
          ))}
        </div>

        {/* 結果表示 */}
        {showResult && (
          <div className="text-center mt-6">
            <div className="text-xs text-muted-foreground">Next question...</div>
          </div>
        )}
      </Card>
      <Toaster />
    </div>
  )
}
