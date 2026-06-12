import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const MEDALS = ['🥇','🥈','🥉']
const MEDAL_STYLES = [
  'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-yellow-600/50',
  'bg-gradient-to-r from-gray-700/40 to-gray-600/20 border-gray-500/50',
  'bg-gradient-to-r from-orange-900/40 to-orange-800/20 border-orange-700/50',
]

export default function Leaderboard() {
  const [board, setBoard]       = useState([])
  const [loading, setLoading]   = useState(true)
  const { user, activeGroup } = useAuth()

  useEffect(() => {
    api.get(`/leaderboard?groupId=${activeGroup?.id || 1}`).then(r => { setBoard(r.data); setLoading(false) })
    const iv = setInterval(() => api.get(`/leaderboard?groupId=${activeGroup?.id || 1}`).then(r => setBoard(r.data)), 30000)
    return () => clearInterval(iv)
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar topplista...</div>

  const max = board[0]?.totalPoints || 1

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="font-display text-5xl text-gold-400 tracking-widest">TOPPLISTA</h1>
        <p className="text-white/40 text-sm mt-1">Uppdateras var 30:e sekund</p>
      </div>

      {/* Top 3 podium */}
      {board.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {[board[1], board[0], board[2]].map((entry, i) => {
            const isCenter = i === 1
            const heights = ['h-24','h-32','h-20']
            return (
              <motion.div key={entry.username}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2">
                <div className="text-2xl">{MEDALS[[1,0,2][i]]}</div>
                <div className={`text-sm font-bold ${entry.username === user.username ? 'text-gold-400' : 'text-white'}`}>
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
        {board.map((entry, i) => {
          const isMe    = entry.username === user.username
          const barPct  = Math.round((entry.totalPoints / max) * 100)
          return (
            <motion.div key={entry.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`relative overflow-hidden rounded-xl border px-5 py-4
                ${i < 3 ? MEDAL_STYLES[i] : 'bg-pitch-800 border-pitch-600'}
                ${isMe ? 'ring-2 ring-gold-500/50' : ''}`}>

              {/* Progress bar bg */}
              <div className="absolute inset-0 opacity-10"
                style={{ width: `${barPct}%`, background: 'linear-gradient(90deg,#22c55e,#15803d)' }} />

              <div className="relative flex items-center gap-4">
                <span className="font-display text-3xl text-white/40 w-8 text-center">
                  {i < 3 ? MEDALS[i] : `${i+1}`}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${isMe ? 'text-gold-400' : 'text-white'}`}>
                      {entry.username}
                    </span>
                    {isMe && <span className="badge bg-gold-500/20 text-gold-400 text-xs">Du</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-white/40 mt-0.5">
                    <span>⚽ {entry.matchPoints}p match</span>
                    <span>⭐ {entry.sidoPoints}p sido</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display text-3xl text-white">{entry.totalPoints}</div>
                  <div className="text-xs text-white/30">poäng</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
