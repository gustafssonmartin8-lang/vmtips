import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../lib/avatars'
import RecapPopup from '../components/RecapPopup'

const MEDALS = ['🥇','🥈','🥉']
const MEDAL_STYLES = [
  'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-yellow-600/50',
  'bg-gradient-to-r from-gray-700/40 to-gray-600/20 border-gray-500/50',
  'bg-gradient-to-r from-orange-900/40 to-orange-800/20 border-orange-700/50',
]

function CountUp({ target, duration = 1200 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const steps = 40
    const inc = target / steps
    let cur = 0
    const iv = setInterval(() => {
      cur = Math.min(cur + inc, target)
      setVal(Math.round(cur))
      if (cur >= target) clearInterval(iv)
    }, duration / steps)
    return () => clearInterval(iv)
  }, [target])
  return <>{val}</>
}


// Match IDs in chronological play order
// Kronologisk ordning härleds från matchernas faktiska tid (startsAt/matchDate),
// så det funkar för alla ronder utan att underhålla en manuell lista.
function buildOrderMap(matches) {
  const withTime = matches.map(m => ({
    id: m.id,
    t: m.startsAt ? new Date(m.startsAt).getTime()
       : (m.matchDate ? new Date(m.matchDate).getTime() : Number.MAX_SAFE_INTEGER),
  }))
  withTime.sort((a, b) => a.t - b.t || a.id - b.id)
  const map = {}
  withTime.forEach((m, i) => { map[m.id] = i })
  return map
}

function RecentDots({ tips }) {
  if (!tips?.length) return null
  const last5 = tips.slice(-5)   // kronologiskt: äldst vänster, senast höger
  const color = p => p === 5 ? 'bg-emerald-500' : p >= 3 ? 'bg-green-600' : p >= 1 ? 'bg-yellow-500' : 'bg-red-600'
  return (
    <div className="flex gap-1 items-center">
      <span className="text-[9px] text-white/25 uppercase tracking-wider mr-0.5">Senaste →</span>
      {last5.map((t, i) => {
        const isLatest = i === last5.length - 1
        const label = `${t.homeTeam || '?'}–${t.awayTeam || '?'}: ${t.points}p`
        return (
          <motion.div key={t.matchId}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${color(t.points)} ${isLatest ? 'ring-2 ring-gold-400 ring-offset-1 ring-offset-pitch-800' : ''}`}
            title={label}>
            {t.points}
          </motion.div>
        )
      })}
    </div>
  )
}

function getPeppLine(entry, allEntries, index) {
  const rank = entry.displayRank || (index + 1)
  const sharedLeaders = allEntries.filter(e => e.displayRank === 1).length
  if (rank === 1) return sharedLeaders > 1 ? '🔥 Delad ledning!' : '🔥 Leder tävlingen!'
  if (index === allEntries.length - 1) return '💪 Kämpar på – det vänder!'
  if (entry.exactResults >= 3) return `🎯 ${entry.exactResults} exakta träffar!`
  if (entry.longestStreak >= 5) return `🔥 ${entry.longestStreak} matcher i rad med poäng!`
  if (entry.sidoPoints > 0) return `⭐ ${entry.sidoPoints}p på sido-tipps!`
  if (entry.avgPoints && parseFloat(entry.avgPoints) >= 2.5) return `📈 Snitt ${entry.avgPoints}p/match!`
  return '⚽ Håller koll på varje match!'
}

export default function Leaderboard() {
  const [enriched, setEnriched] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMovement, setShowMovement] = useState(false)
  const [recap, setRecap] = useState(null)
  const prevRef = useRef([])
  const { user, activeGroup } = useAuth()

  const fetchData = async () => {
    const [lb, tips, matches] = await Promise.all([
      api.get(`/leaderboard?groupId=${activeGroup?.id || 1}`),
      api.get(`/tips/all?groupId=${activeGroup?.id || 1}`),
      api.get('/matches'),
    ])

    const orderMap = buildOrderMap(matches.data)
    const playOrder = id => (id in orderMap ? orderMap[id] : Number.MAX_SAFE_INTEGER)
    const matchById = Object.fromEntries(matches.data.map(m => [m.id, m]))

    const playedMatches = matches.data.filter(m => m.homeGoals !== null)
      .sort((a, b) => playOrder(a.id) - playOrder(b.id))

    const board = lb.data.map(entry => {
      const userData = tips.data.find(u => u.username === entry.username)
      const userTips = (userData?.tips || [])
        .filter(t => playedMatches.find(m => m.id === t.matchId))
        .sort((a, b) => playOrder(a.matchId) - playOrder(b.matchId))
        .map(t => ({ ...t,
          homeTeam: matchById[t.matchId]?.homeTeam,
          awayTeam: matchById[t.matchId]?.awayTeam }))

      const exactResults = userTips.filter(t => t.points === 5).length
      let longestStreak = 0, tempStreak = 0
      for (const t of userTips) {
        if (t.points > 0) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak) }
        else tempStreak = 0
      }
      const avgPoints = userTips.length > 0
        ? (userTips.reduce((s, t) => s + t.points, 0) / userTips.length).toFixed(2)
        : '0.00'

      const prev = prevRef.current.find(p => p.username === entry.username)
      const prevRank = prev?.rank ?? entry.rank
      const moved = prevRank - entry.rank

      return { ...entry, exactResults, longestStreak, avgPoints,
               recentTips: userTips, tipsCount: userTips.length, prevRank, moved }
    })

    if (prevRef.current.length > 0 && board.some(e => e.moved !== 0)) {
      setShowMovement(true)
      setTimeout(() => setShowMovement(false), 3000)
    }
    // Compute shared ranks (ties get same rank)
    let lastPoints = null, lastRank = 0
    board.forEach((e, i) => {
      if (e.totalPoints !== lastPoints) {
        lastRank = i + 1
        lastPoints = e.totalPoints
      }
      e.displayRank = lastRank
    })

    prevRef.current = board
    setEnriched(board)
    setLoading(false)
  }

  useEffect(() => {
    if (!activeGroup) return
    fetchData()
    const iv = setInterval(fetchData, 30000)
    return () => clearInterval(iv)
  }, [activeGroup])

  // Recap: hämta missade matcher en gång när topplistan öppnas
  useEffect(() => {
    if (!activeGroup) return
    let cancelled = false
    api.get(`/recap?groupId=${activeGroup.id || 1}`)
      .then(r => {
        if (cancelled) return
        const ms = r.data?.matches || []
        if (ms.length > 0) setRecap(ms)
        else api.post('/recap/seen').catch(() => {}) // inget att visa: uppdatera ändå så nästa gång funkar
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [activeGroup])

  const closeRecap = () => {
    setRecap(null)
    api.post('/recap/seen').catch(() => {})
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar topplista...</div>

  const max = enriched[0]?.totalPoints || 1

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {recap && <RecapPopup matches={recap} onClose={closeRecap} />}
      <div className="text-center">
        <h1 className="font-display text-5xl text-gold-400 tracking-widest">TOPPLISTA</h1>
        <p className="text-white/40 text-sm mt-1">Uppdateras var 30:e sekund · {activeGroup?.name}</p>
      </div>

      {/* Podium */}
      {enriched.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-4">
          {[enriched[1], enriched[0], enriched[2]].map((entry, i) => {
            const isCenter = i === 1
            const realRank = [1,0,2][i]
            const heights = ['h-24','h-32','h-20']
            return (
              <motion.div key={entry.username}
                initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2">
                <div className="text-2xl">{MEDALS[realRank]}</div>
                <Avatar username={entry.username} size={isCenter ? 56 : 46} ring={isCenter} />
                <div className={`text-sm font-bold ${entry.username === user?.username ? 'text-gold-400' : 'text-white'}`}>
                  {entry.username}
                </div>
                <div className={`${heights[i]} w-20 rounded-t-xl flex flex-col items-center justify-end pb-2
                  ${isCenter ? 'bg-gold-500/30 border border-gold-500/50' : 'bg-pitch-700 border border-pitch-600'}`}>
                  <span className="font-display text-2xl text-white">
                    <CountUp target={entry.totalPoints} duration={1000 + i*200} />
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {enriched.map((entry, i) => {
            const isMe = entry.username === user?.username
            const barPct = Math.round((entry.totalPoints / max) * 100)
            const moved = entry.moved || 0

            return (
              <motion.div key={entry.username}
                layout
                initial={{ opacity:0, x:-30 }}
                animate={{ opacity:1, x:0 }}
                transition={{ layout: { type:'spring', stiffness:300, damping:30 }, delay: i * 0.05 }}
                className={`relative overflow-hidden rounded-xl border px-4 py-3
                  ${i < 3 ? MEDAL_STYLES[i] : 'bg-pitch-800 border-pitch-600'}
                  ${isMe ? 'ring-2 ring-gold-500/50' : ''}`}>

                {/* Progress bar */}
                <motion.div
                  className="absolute inset-y-0 left-0 opacity-10"
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                  style={{ background: 'linear-gradient(90deg,#22c55e,#15803d)' }} />

                <div className="relative flex items-center gap-3">
                  {/* Rank */}
                  <span className="font-display text-2xl text-white/40 w-7 text-center shrink-0">
                    {entry.displayRank <= 3 ? MEDALS[entry.displayRank - 1] : `${entry.displayRank}`}
                  </span>

                  {/* Movement */}
                  <AnimatePresence>
                    {showMovement && moved !== 0 && (
                      <motion.span
                        initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }}
                        exit={{ opacity:0 }}
                        className={`text-xs font-bold shrink-0 ${moved > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {moved > 0 ? `▲${moved}` : `▼${Math.abs(moved)}`}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Avatar */}
                  <Avatar username={entry.username} size={40} ring={isMe} />

                  {/* Name + pepp + recent dots */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold ${isMe ? 'text-gold-400' : 'text-white'}`}>
                        {entry.username}
                      </span>
                      {isMe && <span className="text-xs px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400">Du</span>}
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">{getPeppLine(entry, enriched, i)}</div>
                    {entry.recentTips?.length > 0 && (
                      <div className="mt-1.5">
                        <RecentDots tips={entry.recentTips} />
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <div className="font-display text-3xl text-white">
                      <CountUp target={entry.totalPoints} duration={800 + i*100} />
                    </div>
                    <div className="text-xs text-white/30">
                      {entry.matchPoints}m · {entry.sidoPoints}s
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
