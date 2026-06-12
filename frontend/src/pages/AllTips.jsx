import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const FLAG = t => ({
  'Sverige':'🇸🇪','Mexiko':'🇲🇽','Kanada':'🇨🇦','USA':'🇺🇸','Brasilien':'🇧🇷',
  'Frankrike':'🇫🇷','Argentina':'🇦🇷','Spanien':'🇪🇸','England':'🇬🇧','Portugal':'🇵🇹',
  'Belgien':'🇧🇪','Nederländerna':'🇳🇱','Tyskland':'🇩🇪','Japan':'🇯🇵','Tunisien':'🇹🇳',
}[t] || '⚽')

const ROUNDS = ['Grupp A','Grupp B','Grupp C','Grupp D','Grupp E','Grupp F',
  'Grupp G','Grupp H','Grupp I','Grupp J','Grupp K','Grupp L',
  'Åttondelsfinal','Kvartsfinal','Semifinal','Match om 3:e plats','Final']

export default function AllTips() {
  const [allData, setAllData] = useState([])
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState(null)
  const { user, activeGroup } = useAuth()

  useEffect(() => {
    Promise.all([api.get(`/tips/all?groupId=${activeGroup?.id || 1}`), api.get('/matches')]).then(([a, m]) => {
      setAllData(a.data)
      setMatches(m.data)
      setSelected(a.data.find(u => u.userId === user.userId)?.userId || a.data[0]?.userId)
    })
  }, [])

  const userData = allData.find(u => u.userId === selected)

  const grouped = ROUNDS.reduce((acc, r) => {
    const ms = matches.filter(m => m.round === r)
    if (ms.length) acc[r] = ms
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Alla Tips</h1>
        <p className="text-white/40 text-sm mt-0.5">Se hur alla har tippat</p>
      </div>

      {/* Player selector */}
      <div className="flex gap-2 flex-wrap">
        {allData.map(u => (
          <button key={u.userId} onClick={() => setSelected(u.userId)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${selected === u.userId
                ? 'bg-gold-500 text-pitch-900 border-gold-500'
                : 'bg-pitch-800 text-white/60 border-pitch-600 hover:border-gold-500/50 hover:text-white'}`}>
            {u.username === user.username ? `${u.username} (jag)` : u.username}
            <span className="ml-2 text-xs opacity-70">{u.totalPoints}p</span>
          </button>
        ))}
      </div>

      {userData && (
        <>
          {/* Sido-tipps */}
          <div className="card">
            <h2 className="font-display text-2xl text-gold-400 mb-4">⭐ {userData.username}s Sido-Tipps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[['🥅 Skyttekung', userData.sidoTip?.skyttekung],
                ['🎯 Assistkung', userData.sidoTip?.assistkung],
                ['🟡 Flest gula kort', userData.sidoTip?.gultKort]].map(([label, val]) => (
                <div key={label} className="bg-pitch-700/50 rounded-xl p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">{label}</div>
                  <div className={`font-bold ${val ? 'text-white' : 'text-white/20 italic text-sm'}`}>
                    {val || 'Ej ifyllt'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match tips */}
          {Object.entries(grouped).map(([round, rMatches]) => (
            <div key={round} className="card">
              <h2 className={`font-display text-2xl tracking-wide mb-4
                ${round === 'Grupp F' ? 'text-grass-400' : 'text-gold-400'}`}>
                {round === 'Grupp F' ? '⭐ ' : ''}{round.toUpperCase()}
              </h2>
              <div className="space-y-1.5">
                {rMatches.map(match => {
                  const tip = userData.tips.find(t => t.matchId === match.id)
                  const pts = tip?.points
                  return (
                    <div key={match.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-pitch-700/30
                                 border border-pitch-600/30">
                      <span className="text-white/40 text-xs w-5 text-right">{match.id}</span>
                      <span className="flex-1 text-sm text-right truncate text-white/80">
                        {FLAG(match.homeTeam)} {match.homeTeam || '?'}
                      </span>
                      <div className="flex items-center gap-1 font-bold">
                        <span className={tip ? 'text-white' : 'text-white/20'}>
                          {tip ? tip.homeGoals : '–'}
                        </span>
                        <span className="text-white/30 text-sm">–</span>
                        <span className={tip ? 'text-white' : 'text-white/20'}>
                          {tip ? tip.awayGoals : '–'}
                        </span>
                      </div>
                      <span className="flex-1 text-sm truncate text-white/80">
                        {FLAG(match.awayTeam)} {match.awayTeam || '?'}
                      </span>
                      {match.homeGoals !== null && (
                        <span className="text-xs text-white/30">({match.homeGoals}–{match.awayGoals})</span>
                      )}
                      {pts !== undefined && match.homeGoals !== null && (
                        <span className={`badge w-8 text-center
                          ${pts===5?'bg-emerald-500/20 text-emerald-300':
                            pts>=3?'bg-green-500/20 text-green-300':
                            pts>=1?'bg-yellow-500/20 text-yellow-300':
                            'bg-red-500/20 text-red-400'}`}>{pts}p</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
