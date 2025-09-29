export interface SessionData {
  id: string
  date: string
  score: number
  totalQuestions: number
  results: QuestionResult[]
  averageResponseTime: number
}

export interface QuestionResult {
  question: {
    chord: string
    tonePosition: number
    toneName: string
    answer: string
    options: string[]
    startTime: number
  }
  userAnswer: string
  isCorrect: boolean
  responseTime: number
}

export interface UserStats {
  totalSessions: number
  totalQuestions: number
  totalCorrect: number
  averageScore: number
  averageResponseTime: number
  chordWeaknesses: Record<string, { total: number; correct: number }>
  rootWeaknesses: Record<string, { total: number; correct: number }>
  intervalWeaknesses: Record<string, { total: number; correct: number }>
  weeklyActivity: Record<string, number> // YYYY-MM-DD -> session count
  sessions: SessionData[]
}

const STORAGE_KEY = "music-practice-data"

export const getStoredData = (): UserStats => {
  if (typeof window === "undefined") return getDefaultStats()

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return getDefaultStats()

    const data = JSON.parse(stored)
    return {
      ...getDefaultStats(),
      ...data,
    }
  } catch (error) {
    console.error("Error loading stored data:", error)
    return getDefaultStats()
  }
}

export const saveSessionData = (sessionData: SessionData): UserStats => {
  const currentStats = getStoredData()

  // セッションデータを追加
  const updatedSessions = [...currentStats.sessions, sessionData].slice(-50) // 最新50セッションのみ保持

  // 統計を更新
  const updatedStats: UserStats = {
    ...currentStats,
    sessions: updatedSessions,
    totalSessions: currentStats.totalSessions + 1,
    totalQuestions: currentStats.totalQuestions + sessionData.totalQuestions,
    totalCorrect: currentStats.totalCorrect + sessionData.score,
    averageScore:
      ((currentStats.totalCorrect + sessionData.score) / (currentStats.totalQuestions + sessionData.totalQuestions)) *
      100,
    averageResponseTime: calculateAverageResponseTime(updatedSessions),
  }

  // コード別、ルート音別、音程別の弱点を更新
  sessionData.results.forEach((result) => {
    const chord = result.question.chord
    const root = extractRoot(chord)
    const interval = result.question.toneName

    // コード別統計
    if (!updatedStats.chordWeaknesses[chord]) {
      updatedStats.chordWeaknesses[chord] = { total: 0, correct: 0 }
    }
    updatedStats.chordWeaknesses[chord].total++
    if (result.isCorrect) updatedStats.chordWeaknesses[chord].correct++

    // ルート音別統計
    if (!updatedStats.rootWeaknesses[root]) {
      updatedStats.rootWeaknesses[root] = { total: 0, correct: 0 }
    }
    updatedStats.rootWeaknesses[root].total++
    if (result.isCorrect) updatedStats.rootWeaknesses[root].correct++

    // 音程別統計
    if (!updatedStats.intervalWeaknesses[interval]) {
      updatedStats.intervalWeaknesses[interval] = { total: 0, correct: 0 }
    }
    updatedStats.intervalWeaknesses[interval].total++
    if (result.isCorrect) updatedStats.intervalWeaknesses[interval].correct++
  })

  // 週間アクティビティを更新
  const today = new Date().toISOString().split("T")[0]
  updatedStats.weeklyActivity[today] = (updatedStats.weeklyActivity[today] || 0) + 1

  // localStorageに保存
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats))
  } catch (error) {
    console.error("Error saving data:", error)
  }

  return updatedStats
}

const getDefaultStats = (): UserStats => ({
  totalSessions: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  averageScore: 0,
  averageResponseTime: 0,
  chordWeaknesses: {},
  rootWeaknesses: {},
  intervalWeaknesses: {},
  weeklyActivity: {},
  sessions: [],
})

const calculateAverageResponseTime = (sessions: SessionData[]): number => {
  if (sessions.length === 0) return 0

  const totalTime = sessions.reduce((sum, session) => sum + session.averageResponseTime, 0)
  return totalTime / sessions.length
}

const extractRoot = (chord: string): string => {
  // コード名からルート音を抽出
  if (chord.includes("b")) {
    return chord.substring(0, 2) // Bb, Eb, Ab, Db, Gb
  }
  if (chord.includes("#")) {
    return chord.substring(0, 2) // C#, D#, F#, G#, A#
  }
  return chord.charAt(0) // C, D, E, F, G, A, B
}

export const getWeeklyActivityData = (): Array<{ date: string; sessions: number }> => {
  const stats = getStoredData()
  const today = new Date()
  const weekData = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split("T")[0]

    weekData.push({
      date: dateString,
      sessions: stats.weeklyActivity[dateString] || 0,
    })
  }

  return weekData
}

export const getTopWeaknesses = (type: "chord" | "root" | "interval", limit = 5) => {
  const stats = getStoredData()
  let weaknesses: Record<string, { total: number; correct: number }>

  switch (type) {
    case "chord":
      weaknesses = stats.chordWeaknesses
      break
    case "root":
      weaknesses = stats.rootWeaknesses
      break
    case "interval":
      weaknesses = stats.intervalWeaknesses
      break
  }

  return Object.entries(weaknesses)
    .filter(([_, data]) => data.total >= 3) // 最低3回は出題されたもののみ
    .map(([key, data]) => ({
      name: key,
      accuracy: (data.correct / data.total) * 100,
      total: data.total,
      correct: data.correct,
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // 正答率の低い順
    .slice(0, limit)
}
