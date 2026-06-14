import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const ACHIEVEMENT_DEFS = [
  {
    id: 'first_five',
    emoji: '🎯',
    name: 'Femman',
    desc: 'Gissade ett exakt rätt resultat',
    check: s => s.exactResults >= 1,
    color: 'from-emerald-900/60 to-emerald-800/30 border-emerald-600/50',
    textColor: 'text-emerald-400',
  },
  {
    id: 'five_master',
    emoji: '🎳',
    name: 'Femmornas kung',
    desc: '5 exakta resultat',
    check: s => s.exactResults >= 5,
    color: 'from-emerald-900/80 to-emerald-700/40 border-emerald-500/70',
    textColor: 'text-emerald-300',
  },
  {
    id: 'ten_fives',
    emoji: '💎',
    name: 'Diamantskarp',
    desc: '10 exakta resultat',
    check: s => s.exactResults >= 10,
    color: 'from-cyan-900/60 to-cyan-800/30 border-cyan-500/50',
    textColor: 'text-cyan-300',
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    name: 'På eld',
    desc: '3 matcher i rad med poäng',
    check: s => s.longestStreak >= 3,
    color: 'from-orange-900/60 to-red-900/30 border-orange-600/50',
    textColor: 'text-orange-400',
  },
  {
    id: 'streak_7',
    emoji: '🌋',
    name: 'Vulkan',
    desc: '7 matcher i rad med poäng',
    check: s => s.longestStreak >= 7,
    color: 'from-red-900/70 to-orange-900/40 border-red-500/60',
    textColor: 'text-red-400',
  },
  {
    id: 'streak_15',
    emoji: '☄️',
    name: 'Komet',
    desc: '15 matcher i rad med poäng',
    check: s => s.longestStreak >= 15,
    color: 'from-purple-900/70 to-red-900/40 border-purple-500/60',
    textColor: 'text-purple-300',
  },
  {
    id: 'sweden_win',
    emoji: '🇸🇪',
    name: 'Sverige-tro',
    desc: 'Tippade Sverige-vinst i en match',
    check: s => s.swedenWin,
    color: 'from-blue-900/60 to-yellow-900/20 border-blue-600/40',
    textColor: 'text-blue-300',
  },
  {
    id: 'sido_point',
    emoji: '⭐',
    name: 'Sidomästare',
    desc: 'Fick poäng på ett sido-tipp',
    check: s => s.sidoPoints > 0,
    color: 'from-yellow-900/60 to-yellow-800/30 border-yellow-600/40',
    textColor: 'text-yellow-400',
  },
  {
    id: 'sido_master',
    emoji: '🌟',
    name: 'Sidog',
    desc: 'Rätt på alla tre sido-tipps',
    check: s => s.sidoPoints >= 15,
    color: 'from-yellow-800/80 to-gold-900/50 border-yellow-500/60',
    textColor: 'text-yellow-300',
  },
  {
    id: 'high_avg',
    emoji: '📈',
    name: 'Konsekvent',
    desc: 'Snitt över 2.0p per match',
    check: s => parseFloat(s.avgPoints) >= 2.0,
    color: 'from-green-900/60 to-green-800/30 border-green-600/40',
    textColor: 'text-green-400',
  },
  {
    id: 'lucky',
    emoji: '🍀',
    name: 'Lyckträff',
    desc: 'Fick en femma på första försöket',
    check: s => s.firstMatchFive,
    color: 'from-green-800/60 to-emerald-900/30 border-green-500/40',
    textColor: 'text-green-300',
  },
  {
    id: 'zero_hero',
    emoji: '🧱',
    name: 'Järnvilja',
    desc: 'Tippade alla gruppspelsmatcher',
    check: s => s.tipsCount >= 72,
    color: 'from-slate-800/60 to-slate-700/30 border-slate-500/40',
    textColor: 'text-slate-300',
  },
]

export default function Achievements() {
  const [allData, setAllData] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const { user, activeGroup } = useAuth()

  useEffect(() => {
    if (!activeGroup) return
    Promise.all([
      api.get(`/tips/all?groupId=${activeGroup.id}`),
      api.get('/matches'),
    ]).then(([a, m]) => {
      setAllData(a.data)
      setMatches(m.data)
      // Default to current user
      setSelected(a.data.find(u => u.userId === user?.userId)?.userId || a.data[0]?.userId)
      setLoading(false)
    })
  }, [activeGroup])

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>

  const playedMatches = matches.filter(m => m.homeGoals !== null)

  const calcStats = (userData) => {
    const tips = userData?.tips || []
    const scoredTips = tips.filter(t => playedMatches.find(m => m.id === t.matchId))
    const exactResults = scoredTips.filter(t => t.points === 5).length

    let longestStreak = 0, tempStreak = 0
    const sorted = [...scoredTips].sort((a,b) => a.matchId - b.matchId)
    for (const t of sorted) {
      if (t.points > 0) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak) }
      else tempStreak = 0
    }

    const avgPoints = scoredTips.length > 0
      ? (scoredTips.reduce((s,t) => s + t.points, 0) / scoredTips.length).toFixed(2)
      : '0.00'

    // Sweden win tip (match 32, 33, 35 are Sweden matches)
    const swedenMatches = [32, 33, 35]
    const swedenWin = swedenMatches.some(mid => {
      const tip = tips.find(t => t.matchId === mid)
      if (!tip) return false
      // For match 32 (Sverige-Tunisien) home win = Sverige wins
      // For match 33 (Ned-Sverige) away win = Sverige wins  
      // For match 35 (Japan-Sverige) away win = Sverige wins
      if (mid === 32) return tip.homeGoals > tip.awayGoals
      return tip.awayGoals > tip.homeGoals
    })

    // First match five
    const firstTip = sorted[0]
    const firstMatchFive = firstTip?.points === 5

    return {
      exactResults,
      longestStreak,
      avgPoints,
      swedenWin,
      firstMatchFive,
      sidoPoints: userData?.sidoPoints || 0,
      tipsCount: scoredTips.length,
    }
  }

  const selectedUser = allData.find(u => u.userId === selected)
  const stats = selectedUser ? calcStats(selectedUser) : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">🏅 Achievements</h1>
        <p className="text-white/40 text-sm mt-0.5">Samla märken under turneringen</p>
      </div>

      {/* Player selector */}
      <div className="flex gap-2 flex-wrap">
        {allData.map(u => (
          <button key={u.userId} onClick={() => setSelected(u.userId)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${selected === u.userId
                ? 'bg-gold-500 text-pitch-900 border-gold-500'
                : 'bg-pitch-800 text-white/60 border-pitch-600 hover:text-white'}`}>
            {u.username === user?.username ? `${u.username} (jag)` : u.username}
          </button>
        ))}
      </div>

      {stats && (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { label: 'Exakta', value: stats.exactResults, emoji: '🎯' },
              { label: 'Längsta streak', value: stats.longestStreak, emoji: '🔥' },
              { label: 'Snitt', value: `${stats.avgPoints}p`, emoji: '📈' },
              { label: 'Sido-poäng', value: `${stats.sidoPoints}p`, emoji: '⭐' },
            ].map(s => (
              <div key={s.label} className="card text-center py-3">
                <div className="text-2xl">{s.emoji}</div>
                <div className="font-display text-2xl text-gold-400 mt-1">{s.value}</div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Achievements grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACHIEVEMENT_DEFS.map((ach, i) => {
              const earned = ach.check(stats)
              return (
                <motion.div key={ach.id}
                  initial={{ opacity:0, scale:0.9 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative rounded-2xl border p-4 text-center transition-all
                    ${earned
                      ? `bg-gradient-to-br ${ach.color}`
                      : 'bg-pitch-800/50 border-pitch-700 opacity-40 grayscale'}`}>

                  {earned && (
                    <motion.div
                      initial={{ scale:0 }}
                      animate={{ scale:1 }}
                      transition={{ type:'spring', delay: i*0.04 + 0.2 }}
                      className="absolute -top-2 -right-2 bg-gold-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ✓
                    </motion.div>
                  )}

                  <div className={`text-4xl mb-2 ${earned ? '' : 'grayscale'}`}>
                    {ach.emoji}
                  </div>
                  <div className={`font-bold text-sm ${earned ? ach.textColor : 'text-white/40'}`}>
                    {ach.name}
                  </div>
                  <div className="text-xs text-white/30 mt-1">{ach.desc}</div>

                  {!earned && (
                    <div className="text-xs text-white/20 mt-2">🔒 Låst</div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Earned count */}
          <div className="text-center text-white/30 text-sm">
            {ACHIEVEMENT_DEFS.filter(a => a.check(stats)).length} av {ACHIEVEMENT_DEFS.length} achievements upplåsta
          </div>
        </>
      )}
    </div>
  )
}
