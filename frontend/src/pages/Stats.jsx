import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function Stats() {
  const [allData, setAllData] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const { activeGroup } = useAuth()

  useEffect(() => {
    if (!activeGroup) return
    Promise.all([
      api.get(`/tips/all?groupId=${activeGroup.id}`),
      api.get('/matches')
    ]).then(([a, m]) => {
      setAllData(a.data)
      setMatches(m.data)
      setLoading(false)
    })
  }, [activeGroup])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/40">
      Laddar statistik...
    </div>
  )

  // Only played matches with results
  const playedMatches = matches
    .filter(m => m.homeGoals !== null && m.homeGoals !== undefined)
    .sort((a, b) => a.id - b.id)

  if (playedMatches.length === 0) return (
    <div className="text-center py-20 text-white/40">
      <div className="text-5xl mb-4">📊</div>
      <p>Statistik visas när matcher har spelats och fått resultat.</p>
    </div>
  )

  // ── Beräkna stats per spelare ──────────────────────────────
  const playerStats = allData.map(u => {
    const tips = u.tips || []

    // Points per played match (in order)
    const pointsPerMatch = playedMatches.map(m => {
      const tip = tips.find(t => t.matchId === m.id)
      return tip ? tip.points : null  // null = no tip
    })

    const scoredTips = pointsPerMatch.filter(p => p !== null)
    const totalMatchPts = scoredTips.reduce((s, p) => s + p, 0)
    const avgPoints = scoredTips.length > 0
      ? (totalMatchPts / scoredTips.length).toFixed(2)
      : '0.00'

    // Streak calculation
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let streakMatches = [] // which matches were in best streak
    let tempMatches = []

    for (let i = 0; i < pointsPerMatch.length; i++) {
      const p = pointsPerMatch[i]
      if (p !== null && p > 0) {
        tempStreak++
        tempMatches.push(playedMatches[i])
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
          streakMatches = [...tempMatches]
        }
      } else if (p === 0) {
        tempStreak = 0
        tempMatches = []
      }
      // null (no tip) doesn't break streak
    }

    // Current streak (from end)
    for (let i = pointsPerMatch.length - 1; i >= 0; i--) {
      const p = pointsPerMatch[i]
      if (p === null) continue
      if (p > 0) currentStreak++
      else break
    }

    // Exact results (5p)
    const exactResults = scoredTips.filter(p => p === 5).length

    // Correct winner
    const correctWinner = playedMatches.filter((m, i) => {
      const p = pointsPerMatch[i]
      if (p === null) return false
      const tip = tips.find(t => t.matchId === m.id)
      if (!tip) return false
      return Math.sign(tip.homeGoals - tip.awayGoals) === Math.sign(m.homeGoals - m.awayGoals)
    }).length

    return {
      username: u.username,
      totalPoints: u.totalPoints,
      matchPoints: u.matchPoints,
      sidoPoints: u.sidoPoints,
      avgPoints,
      longestStreak,
      currentStreak,
      exactResults,
      correctWinner,
      tipsCount: scoredTips.length,
      pointsPerMatch,
      streakMatches,
    }
  }).sort((a, b) => parseFloat(b.avgPoints) - parseFloat(a.avgPoints))

  const maxAvg = Math.max(...playerStats.map(s => parseFloat(s.avgPoints)))
  const maxStreak = Math.max(...playerStats.map(s => s.longestStreak))

  const rankColor = i => i === 0 ? 'text-gold-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/60'
  const rankMedal = i => ['🥇','🥈','🥉'][i] || `${i+1}`

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Statistik</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Baserat på {playedMatches.length} spelade matcher · {activeGroup?.name}
        </p>
      </div>

      {/* ── SNITT-POÄNG ─────────────────────────────────────── */}
      <section className="card">
        <h2 className="font-display text-2xl text-gold-400 tracking-wide mb-1">
          📉 Snitt-poäng per match
        </h2>
        <p className="text-white/30 text-xs mb-5">
          Visar vem som är mest konsekvent – totalen kan bero på tur, snittet avslöjar kvaliteten.
        </p>

        <div className="space-y-3">
          {playerStats.map((s, i) => {
            const pct = maxAvg > 0 ? (parseFloat(s.avgPoints) / maxAvg) * 100 : 0
            return (
              <motion.div key={s.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold w-6 text-center ${rankColor(i)}`}>
                      {rankMedal(i)}
                    </span>
                    <span className={`font-medium ${i < 3 ? rankColor(i) : 'text-white'}`}>
                      {s.username}
                    </span>
                    <span className="text-white/30 text-xs">
                      ({s.tipsCount} tips)
                    </span>
                  </div>
                  <span className={`font-display text-xl ${rankColor(i)}`}>
                    {s.avgPoints}p
                  </span>
                </div>
                {/* Bar */}
                <div className="h-2 bg-pitch-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                    className={`h-full rounded-full ${
                      i === 0 ? 'bg-gold-500' :
                      i === 1 ? 'bg-gray-400' :
                      i === 2 ? 'bg-orange-500' :
                      'bg-pitch-500'
                    }`} />
                </div>
                {/* Mini breakdown */}
                <div className="flex gap-3 text-xs text-white/25 pl-8 flex-wrap">
                  <span>🎯 {s.exactResults}× femma</span>
                  <span>✅ {s.correctWinner} rätt vinnare</span>
                  <span>⚽ {s.matchPoints}p match</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── LÄNGSTA STREAK ──────────────────────────────────── */}
      <section className="card">
        <h2 className="font-display text-2xl text-gold-400 tracking-wide mb-1">
          🔥 Längsta poäng-streak
        </h2>
        <p className="text-white/30 text-xs mb-5">
          Antal matcher i rad med minst 1 poäng (0p bryter streaken, inget tips räknas neutral).
        </p>

        <div className="space-y-4">
          {[...playerStats]
            .sort((a, b) => b.longestStreak - a.longestStreak)
            .map((s, i) => {
              const pct = maxStreak > 0 ? (s.longestStreak / maxStreak) * 100 : 0
              const isLeader = i === 0
              return (
                <motion.div key={s.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold w-6 text-center ${rankColor(i)}`}>
                        {rankMedal(i)}
                      </span>
                      <span className={`font-medium ${isLeader ? 'text-gold-400' : 'text-white'}`}>
                        {s.username}
                      </span>
                      {s.currentStreak > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-grass-500/20 text-grass-400 font-medium">
                          🔥 {s.currentStreak} aktiv
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-display text-2xl ${isLeader ? 'text-gold-400' : 'text-white/80'}`}>
                        {s.longestStreak}
                      </span>
                      <span className="text-white/30 text-xs">matcher</span>
                    </div>
                  </div>

                  {/* Flame bar */}
                  <div className="h-3 bg-pitch-700 rounded-full overflow-hidden ml-8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                      className={`h-full rounded-full ${
                        isLeader
                          ? 'bg-gradient-to-r from-orange-500 to-red-500'
                          : 'bg-pitch-500'
                      }`} />
                  </div>

                  {/* Show which matches the streak covered */}
                  {s.streakMatches.length > 0 && isLeader && (
                    <div className="ml-8 mt-1 text-xs text-white/25">
                      Bästa streak: {s.streakMatches[0]?.round} match {s.streakMatches[0]?.id}
                      {s.streakMatches.length > 1 && ` → match ${s.streakMatches[s.streakMatches.length-1]?.id}`}
                    </div>
                  )}
                </motion.div>
              )
            })}
        </div>
      </section>


      {/* ── FLEST ANTAL 5OR ─────────────────────────────────── */}
      <section className="card">
        <h2 className="font-display text-2xl text-gold-400 tracking-wide mb-1">
          🎯 Flest exakta träffar (5p)
        </h2>
        <p className="text-white/30 text-xs mb-5">
          Antal gånger man gissat exakt rätt resultat – den svåraste poängen att få.
        </p>
        <div className="space-y-3">
          {[...playerStats]
            .sort((a,b) => b.exactResults - a.exactResults)
            .map((s, i) => {
              const maxFives = Math.max(...playerStats.map(p => p.exactResults)) || 1
              const pct = (s.exactResults / maxFives) * 100
              return (
                <motion.div key={s.username}
                  initial={{ opacity:0, x:-20 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.05 }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold w-6 text-center ${rankColor(i)}`}>{rankMedal(i)}</span>
                      <span className={`font-medium ${i < 3 ? rankColor(i) : 'text-white'}`}>{s.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`font-display text-2xl ${i===0 ? 'text-gold-400' : 'text-white/80'}`}>
                        {s.exactResults}
                      </span>
                      <span className="text-white/30 text-xs">× 🎯</span>
                    </div>
                  </div>
                  <div className="h-2 bg-pitch-700 rounded-full overflow-hidden ml-8">
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${pct}%` }}
                      transition={{ delay: i*0.05+0.2, duration:0.6 }}
                      className={`h-full rounded-full ${i===0 ? 'bg-emerald-500' : 'bg-pitch-500'}`} />
                  </div>
                </motion.div>
              )
            })}
        </div>
      </section>

      {/* ── MATCH-FÖR-MATCH TABELL ──────────────────────────── */}
      <section className="card overflow-x-auto">
        <h2 className="font-display text-2xl text-gold-400 tracking-wide mb-1">
          📋 Poäng per match
        </h2>
        <p className="text-white/30 text-xs mb-4">
          Grön = 5p · Ljusgrön = 3p · Gul = 1-2p · Röd = 0p · Grå = inget tips
        </p>

        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-white/40 font-medium pb-2 pr-3 sticky left-0 bg-pitch-800">
                Spelare
              </th>
              {playedMatches.slice(-20).map(m => (
                <th key={m.id} className="text-white/30 font-normal pb-2 px-0.5 min-w-6 text-center">
                  {m.id}
                </th>
              ))}
              <th className="text-white/40 font-medium pb-2 pl-2">Snitt</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map(s => (
              <tr key={s.username}>
                <td className="text-white font-medium py-1 pr-3 sticky left-0 bg-pitch-800">
                  {s.username}
                </td>
                {playedMatches.slice(-20).map((m, mi) => {
                  const idx = playedMatches.indexOf(m)
                  const p = s.pointsPerMatch[idx]
                  const bg = p === null ? 'bg-pitch-700' :
                             p === 5   ? 'bg-emerald-600' :
                             p >= 3    ? 'bg-green-700' :
                             p >= 1    ? 'bg-yellow-700' :
                                         'bg-red-800'
                  return (
                    <td key={m.id} className="px-0.5 py-1">
                      <div className={`w-6 h-6 rounded text-center leading-6 font-bold ${bg}
                        ${p === null ? 'text-white/20' : 'text-white'}`}>
                        {p === null ? '–' : p}
                      </div>
                    </td>
                  )
                })}
                <td className="pl-2 font-bold text-gold-400">{s.avgPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {playedMatches.length > 20 && (
          <p className="text-white/20 text-xs mt-2">Visar senaste 20 matcher</p>
        )}
      </section>
    </div>
  )
}
