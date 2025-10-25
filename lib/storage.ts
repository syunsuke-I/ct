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

  // 各キーの平均解答時間を計算
  const avgResponseTimes: Record<string, number> = {}
  stats.sessions.forEach((session) => {
    session.results.forEach((result) => {
      let key: string
      switch (type) {
        case "chord":
          key = result.question.chord
          break
        case "root":
          key = extractRoot(result.question.chord)
          break
        case "interval":
          key = result.question.toneName
          break
      }
      if (!avgResponseTimes[key]) {
        avgResponseTimes[key] = 0
      }
      avgResponseTimes[key] += result.responseTime
    })
  })

  Object.keys(avgResponseTimes).forEach((key) => {
    if (weaknesses[key]) {
      avgResponseTimes[key] = avgResponseTimes[key] / weaknesses[key].total
    }
  })

  return Object.entries(weaknesses)
    .filter(([_, data]) => data.total >= 3) // 最低3回は出題されたもののみ
    .map(([key, data]) => ({
      name: key,
      accuracy: (data.correct / data.total) * 100,
      total: data.total,
      correct: data.correct,
      avgResponseTime: avgResponseTimes[key] || 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // 正答率の低い順
    .slice(0, limit)
}

// コードタイプを抽出する関数
const getChordType = (chord: string): string => {
  if (chord.includes("m7-5")) return "m7-5"
  if (chord.includes("m7")) return "m7"
  if (chord.includes("7")) return "7"
  if (chord.includes("m")) return "m"
  return "Major"
}

// コードタイプ別の弱点を取得
export const getChordTypeWeaknesses = () => {
  const stats = getStoredData()
  const typeStats: Record<string, { total: number; correct: number }> = {}
  const avgResponseTimes: Record<string, number> = {}

  // コードタイプ別に集計
  Object.entries(stats.chordWeaknesses).forEach(([chord, data]) => {
    const type = getChordType(chord)
    if (!typeStats[type]) {
      typeStats[type] = { total: 0, correct: 0 }
    }
    typeStats[type].total += data.total
    typeStats[type].correct += data.correct
  })

  // 平均解答時間を計算
  stats.sessions.forEach((session) => {
    session.results.forEach((result) => {
      const type = getChordType(result.question.chord)
      if (!avgResponseTimes[type]) {
        avgResponseTimes[type] = 0
      }
      avgResponseTimes[type] += result.responseTime
    })
  })

  Object.keys(avgResponseTimes).forEach((type) => {
    if (typeStats[type]) {
      avgResponseTimes[type] = avgResponseTimes[type] / typeStats[type].total
    }
  })

  return Object.entries(typeStats)
    .filter(([_, data]) => data.total >= 3) // 最低3回は出題されたもののみ
    .map(([type, data]) => ({
      name: type,
      accuracy: (data.correct / data.total) * 100,
      total: data.total,
      correct: data.correct,
      avgResponseTime: avgResponseTimes[type] || 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // 正答率の低い順
}

// モックデータ生成（開発・テスト用）
export const generateMockData = (): UserStats => {
  const chords = ["C", "D", "E", "F", "G", "A", "B", "Cm", "Dm", "Em", "Fm", "Gm", "Am", "C7", "D7", "E7", "F7", "G7", "A7", "Cm7", "Dm7", "Em7", "Cm7-5", "Dm7-5"]
  const toneNames = ["3rd", "5th", "7th"]
  const sessions: SessionData[] = []

  // 個人差のあるパラメータ（リアルさを出すため）
  const weakChordTypes = ["m7-5", "Cm7"] // 苦手なコードタイプ
  const weakRoots = ["F", "B"] // 苦手なルート音
  const weakInterval = "7th" // 苦手な音程

  // 過去90日分のセッションを生成（3ヶ月）
  for (let day = 90; day >= 0; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    const dayOfWeek = date.getDay() // 0=日曜, 6=土曜

    // 学習進捗度（日が経つにつれて上達）
    const progressRate = 1 - (day / 90) * 0.4 // 90日前は60%、現在は100%の進捗

    // 曜日によって学習頻度を変える
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const skipProbability = isWeekend ? 0.3 : 0.4 // 週末の方が学習する確率が高い

    // ランダムに学習しない日を作る
    if (Math.random() < skipProbability) continue

    // 1日のセッション数（週末や休日は多め）
    const maxSessions = isWeekend ? 4 : 2
    const sessionsPerDay = Math.floor(Math.random() * maxSessions) + 1

    for (let i = 0; i < sessionsPerDay; i++) {
      const results: QuestionResult[] = []
      let correctCount = 0

      // 10問生成
      for (let q = 0; q < 10; q++) {
        const chord = chords[Math.floor(Math.random() * chords.length)]
        const toneName = toneNames[Math.floor(Math.random() * toneNames.length)]
        const root = extractRoot(chord)

        // 基本正答率（学習進捗に応じて上昇）
        let baseAccuracy = 0.5 + (progressRate * 0.3) // 50%→80%に上昇

        // 苦手な要素がある場合は正答率を下げる
        if (weakChordTypes.some(weak => chord.includes(weak))) baseAccuracy -= 0.15
        if (weakRoots.includes(root)) baseAccuracy -= 0.1
        if (toneName === weakInterval) baseAccuracy -= 0.1

        // ランダム要素を追加（±15%）
        const accuracy = Math.max(0.2, Math.min(0.95, baseAccuracy + (Math.random() - 0.5) * 0.3))
        const isCorrect = Math.random() < accuracy

        if (isCorrect) correctCount++

        // 回答時間も学習進捗に応じて短縮（6秒→2.5秒）
        const baseResponseTime = 6000 - (progressRate * 3500)

        // 苦手な要素は時間がかかる
        let responseMultiplier = 1.0
        if (weakChordTypes.some(weak => chord.includes(weak))) responseMultiplier += 0.3
        if (weakRoots.includes(root)) responseMultiplier += 0.2
        if (toneName === weakInterval) responseMultiplier += 0.2

        // 不正解の場合は時間がかかる傾向
        if (!isCorrect) responseMultiplier += 0.4

        const responseTime = Math.floor(baseResponseTime * responseMultiplier + (Math.random() - 0.5) * 1000)

        results.push({
          question: {
            chord,
            tonePosition: toneNames.indexOf(toneName) + 1,
            toneName,
            answer: "C",
            options: ["C", "D", "E", "F"],
            startTime: date.getTime(),
          },
          userAnswer: isCorrect ? "C" : ["D", "E", "F"][Math.floor(Math.random() * 3)],
          isCorrect,
          responseTime: Math.max(800, Math.min(12000, responseTime)), // 0.8秒〜12秒
        })
      }

      const sessionTime = new Date(date)
      // 時間帯もリアルに（朝7時〜夜11時）
      const hour = Math.floor(Math.random() * 16) + 7
      sessionTime.setHours(hour, Math.floor(Math.random() * 60))

      sessions.push({
        id: `mock-${date.toISOString()}-${i}`,
        date: sessionTime.toISOString(),
        score: correctCount,
        totalQuestions: 10,
        results,
        averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / 10,
      })
    }
  }

  // 統計を計算
  const stats: UserStats = {
    totalSessions: sessions.length,
    totalQuestions: sessions.length * 10,
    totalCorrect: sessions.reduce((sum, s) => sum + s.score, 0),
    averageScore: (sessions.reduce((sum, s) => sum + s.score, 0) / (sessions.length * 10)) * 100,
    averageResponseTime: sessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / sessions.length,
    chordWeaknesses: {},
    rootWeaknesses: {},
    intervalWeaknesses: {},
    weeklyActivity: {},
    sessions,
  }

  // コード別、ルート音別、音程別の統計を計算
  sessions.forEach((session) => {
    const dateKey = session.date.split("T")[0]
    stats.weeklyActivity[dateKey] = (stats.weeklyActivity[dateKey] || 0) + 1

    session.results.forEach((result) => {
      const chord = result.question.chord
      const root = extractRoot(chord)
      const interval = result.question.toneName

      if (!stats.chordWeaknesses[chord]) {
        stats.chordWeaknesses[chord] = { total: 0, correct: 0 }
      }
      stats.chordWeaknesses[chord].total++
      if (result.isCorrect) stats.chordWeaknesses[chord].correct++

      if (!stats.rootWeaknesses[root]) {
        stats.rootWeaknesses[root] = { total: 0, correct: 0 }
      }
      stats.rootWeaknesses[root].total++
      if (result.isCorrect) stats.rootWeaknesses[root].correct++

      if (!stats.intervalWeaknesses[interval]) {
        stats.intervalWeaknesses[interval] = { total: 0, correct: 0 }
      }
      stats.intervalWeaknesses[interval].total++
      if (result.isCorrect) stats.intervalWeaknesses[interval].correct++
    })
  })

  return stats
}

export const loadMockData = () => {
  const mockData = generateMockData()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData))
    console.log("✅ モックデータを読み込みました:", mockData)
    return mockData
  } catch (error) {
    console.error("❌ モックデータの保存に失敗しました:", error)
    return null
  }
}

export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log("✅ 全データをクリアしました")
  } catch (error) {
    console.error("❌ データのクリアに失敗しました:", error)
  }
}
