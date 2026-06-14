import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const MEDALS = ['🥇','🥈','🥉']
const MEDAL_STYLES = [
  'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-yellow-600/50',
  'bg-gradient-to-r from-gray-700/40 to-gray-600/20 border-gray-500/50',
  'bg-gradient-to-r from-orange-900/40 to-orange-800/20 border-orange-700/50',
]

function getPeppLine(entry, allEntries, index) {
  const lines = []
  // Rank-based
  if (index === 0) lines.push("🔥 Leder tävlingen!")
  if (index === allEntries.length - 1) lines.push("💪 Kämpar på – det vänder!")
  // Stats-based
  if (entry.exactResults >= 3) lines.push(`🎯 ${entry.exactResults} exakta träffar!`)
  if (entry.longestStreak >= 5) lines.push(`🔥 ${entry.longestStreak} matcher i rad med poäng!`)
  if (entry.sidoPoints > 0) lines.push(`⭐ ${entry.sidoPoints}p på sido-tipps!`)
  if (entry.correctWinner && entry.correctWinner > entry.tipsCount * 0.7)
    lines.push("✅ Gissar rätt vinnare oftast!")
  if (entry.avgPoints && parseFloat(entry.avgPoints) >= 2.5)
    lines.push(`📈 Snitt ${entry.avgPoints}p/match – imponerande!`)
  if (entry.matchPoints === 0 && entry.sidoPoints > 0)
    lines.push("⭐ Satsar på sido-tipps!")
  if (lines.length === 0) lines.push("⚽ Håller koll på varje match!")
  return lines[0]
}

export default function Leaderboard() {
  const [board, setBoard] = useState([])
  const [prevBoard, setPrevBoard] = useState([])
  const [enriched, setEnriched] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMovement, setShowMovement] = useState(false)
  const { user, activeGroup } = useAuth()
  const prevRef = useRef([])

  const fetchData = async () => {
    const [lb, tips, matches] = await Promise.all([
      api.get(`/leaderboard?groupId=${activeGroup?.id || 1}`),
      api.get(`/tips/all?groupId=${activeGroup?.id || 1}`),
      api.get('/matches'),
    ])

    const playedMatches = matches.data.filter(m => m.homeGoals !== null)

    const enrichedBoard = lb.data.map(entry => {
      const userData = tips.data.find(u => u.username === entry.username)
      const userTips = userData?.tips || []
      const scoredTips = userTips.filter(t => playedMatches.find(m => m.id === t.matchId))
      const exactResults = scoredTips.filter(t => t.points === 5).length
      const correctWinner = scoredTips.filter(t => {
        const m = playedMatches.find(pm => pm.id === t.matchId)
        if (!m || !userData) return false
        return Math.sign(t.homeGoals - t.awayGoals) === Math.sign(m.homeGoals - m.awayGoals)
      }).length

      // Streak
      let longestStreak = 0, tempStreak = 0
      const sortedTips = scoredTips.sort((a,b) => a.matchId - b.matchId)
      for (const t of sortedTips) {
        if (t.points > 0) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak) }
        else tempStreak = 0
      }

      const avgPoints = scoredTips.length > 0
        ? (scoredTips.reduce((s,t) => s + t.points, 0) / scoredTips.length).toFixed(2)
        : '0.00'

      return { ...entry, exactResults, correctWinner, longestStreak, avgPoints, tipsCount: scoredTips.length }
    })

    // Detect rank changes
    if (prevRef.current.length > 0) {
      const withMovement = enrichedBoard.map(e => {
        const prev = prevRef.current.find(p => p.username === e.username)
        const prevRank = prev?.rank || e.rank
        return { ...e, prevRank, moved: prevRank - e.rank } // positive = moved up
      })
      setEnriched(withMovement)
      setShowMovement(true)
      setTimeout(() => setShowMovement(false), 3000)
    } else {
      setEnriched(enrichedBoard)
    }

    prevRef.current = enrichedBoard
    setBoard(lb.data)
    setLoading(false)
  }

  useEffect(() => {
    if (!activeGroup) return
    fetchData()
    const iv = setInterval(fetchData, 30000)
    return () => clearInterval(iv)
  }, [activeGroup])

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar topplista...</div>

  const max = enriched[0]?.totalPoints || 1

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="font-display text-5xl text-gold-400 tracking-widest">TOPPLISTA</h1>
        <p className="text-white/40 text-sm mt-1">Uppdateras automatiskt · {activeGroup?.name}</p>
      </div>

      {/* Podium top 3 */}
      {enriched.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-4">
          {[enriched[1], enriched[0], enriched[2]].map((entry, i) => {
            const isCenter = i === 1
            const heights = ['h-24','h-32','h-20']
            const realRank = [1,0,2][i]
            return (
              <motion.div key={entry.username}
                initial={{ opacity:0, y:30 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2">
                <div className="text-2xl">{MEDALS[realRank]}</div>
                <div className={`text-sm font-bold ${entry.username === user?.username ? 'text-gold-400' : 'text-white'}`}>
                  {entry.username}
                </div>
                <div className={`${heights[i]} w-20 rounded-t-xl flex items-end justify-center pb-2
                  ${isCenter ? 'bg-gold-500/30 border border-gold-500/50' : 'bg-pitch-700 border border-pitch-600'}`}>
                  <span className="font-display text-2xl text-white">{entry.totalPoints}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {enriched.map((entry, i) => {
          const isMe = entry.username === user?.username
          const barPct = Math.round((entry.totalPoints / max) * 100)
          const moved = entry.moved || 0

          return (
            <motion.div key={entry.username}
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.04 }}
              layout
              className={`relative overflow-hidden rounded-xl border px-5 py-3
                ${i < 3 ? MEDAL_STYLES[i] : 'bg-pitch-800 border-pitch-600'}
                ${isMe ? 'ring-2 ring-gold-500/50' : ''}`}>

              {/* Progress bar */}
              <div className="absolute inset-0 opacity-10"
                style={{ width:`${barPct}%`, background:'linear-gradient(90deg,#22c55e,#15803d)' }} />

              <div className="relative flex items-center gap-4">
                <span className="font-display text-3xl text-white/40 w-8 text-center">
                  {i < 3 ? MEDALS[i] : `${i+1}`}
                </span>

                {/* Movement indicator */}
                {showMovement && moved !== 0 && (
                  <motion.div
                    initial={{ opacity:0, scale:0.5 }}
                    animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0 }}
                    className={`text-xs font-bold ${moved > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {moved > 0 ? `▲${moved}` : `▼${Math.abs(moved)}`}
                  </motion.div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${isMe ? 'text-gold-400' : 'text-white'}`}>
                      {entry.username}
                    </span>
                    {isMe && <span className="badge bg-gold-500/20 text-gold-400 text-xs">Du</span>}
                  </div>
                  <div className="text-xs text-white/35 mt-0.5">
                    {getPeppLine(entry, enriched, i)}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-display text-3xl text-white">{entry.totalPoints}</div>
                  <div className="text-xs text-white/30">
                    {entry.matchPoints}p match · {entry.sidoPoints}p sido
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
