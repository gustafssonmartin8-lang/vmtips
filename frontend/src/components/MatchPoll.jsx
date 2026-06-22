import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'

export default function MatchPoll({ match }) {
  const [poll, setPoll] = useState(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    if (!match?.id || match.homeGoals !== null) return
    api.get(`/polls/${match.id}`).then(r => setPoll(r.data)).catch(() => {})
  }, [match?.id])

  const vote = async (v) => {
    if (poll?.myVote || voting) return
    setVoting(true)
    try {
      await api.post(`/polls/${match.id}`, { vote: v })
      const r = await api.get(`/polls/${match.id}`)
      setPoll(r.data)
    } catch {}
    setVoting(false)
  }

  if (!poll || match.homeGoals !== null) return null

  const { myVote, total, votes } = poll
  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0

  const options = [
    { key: '1', label: match.homeTeam || '?', short: '1' },
    { key: 'X', label: 'Oavgjort', short: 'X' },
    { key: '2', label: match.awayTeam || '?', short: '2' },
  ]

  const counts = { '1': votes.home, 'X': votes.draw, '2': votes.away }

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">
        {myVote ? `Röstning · ${total} röst${total !== 1 ? 'er' : ''}` : 'Vad tror du? Rösta!'}
      </div>

      {!myVote ? (
        // Voting buttons
        <div className="flex gap-2">
          {options.map(opt => (
            <button key={opt.key} onClick={() => vote(opt.key)}
              disabled={voting}
              className="flex-1 py-2 rounded-xl text-sm font-bold border transition-all
                bg-pitch-700 border-pitch-600 hover:border-gold-500 hover:text-gold-400
                text-white/70 disabled:opacity-50">
              <div>{opt.short}</div>
              <div className="text-xs font-normal text-white/40 truncate px-1">{opt.label}</div>
            </button>
          ))}
        </div>
      ) : (
        // Results bars
        <div className="space-y-1.5">
          {options.map(opt => {
            const p = pct(counts[opt.key])
            const isMyVote = myVote === opt.key
            return (
              <div key={opt.key} className="flex items-center gap-2">
                <span className={`text-xs font-bold w-4 text-center ${isMyVote ? 'text-gold-400' : 'text-white/40'}`}>
                  {opt.short}
                </span>
                <div className="flex-1 h-5 bg-pitch-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full flex items-center justify-end pr-1.5
                      ${isMyVote ? 'bg-gold-500' : 'bg-pitch-500'}`}>
                    {p >= 15 && <span className="text-xs font-bold text-white">{p}%</span>}
                  </motion.div>
                </div>
                <span className="text-xs text-white/40 w-8 text-right">{p < 15 ? `${p}%` : ''}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
