import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const FLAG = t => ({
  'Sverige':'🇸🇪','Mexiko':'🇲🇽','Kanada':'🇨🇦','USA':'🇺🇸','Brasilien':'🇧🇷',
  'Frankrike':'🇫🇷','Argentina':'🇦🇷','Spanien':'🇪🇸','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹',
  'Belgien':'🇧🇪','Nederländerna':'🇳🇱','Tyskland':'🇩🇪','Japan':'🇯🇵','Tunisien':'🇹🇳',
}[t] || '⚽')

const ROUNDS = ['Grupp A','Grupp B','Grupp C','Grupp D','Grupp E','Grupp F',
  'Grupp G','Grupp H','Grupp I','Grupp J','Grupp K','Grupp L',
  'Åttondelsfinal','Kvartsfinal','Semifinal','Match om 3:e plats','Final']

const SCHEDULE_ORDER = [
  1,2,7,8,19,13,14,20,25,31,26,32,43,37,44,38,49,50,55,56,61,67,
  68,62,3,9,10,4,21,15,16,22,33,27,28,34,45,39,46,40,57,51,52,58,
  63,69,70,64,11,12,17,18,5,6,29,30,35,36,23,24,53,54,47,48,41,42,
  71,72,65,66,59,60,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88
]
const sortBySchedule = (matches) => [...matches].sort((a, b) =>
  (SCHEDULE_ORDER.indexOf(a.id) ?? 999) - (SCHEDULE_ORDER.indexOf(b.id) ?? 999)
)

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

  // Sort all matches chronologically by ID (schedule order)
  const sortedMatches = sortBySchedule(matches)

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

          {/* Match tips – kronologisk ordning */}
          <div className="card">
            <h2 className="font-display text-2xl text-gold-400 mb-4">Alla matcher</h2>
            <div className="space-y-1.5">
              {sortedMatches.map(match => {
                const tip = userData.tips.find(t => t.matchId === match.id)
                const pts = tip?.points
                const isSweden = match.round === 'Grupp F'
                return (
                  <div key={match.id}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg border
                      ${isSweden ? 'bg-green-900/20 border-green-800/40' : 'bg-pitch-700/30 border-pitch-600/30'}`}>
                    <span className="text-white/30 text-xs w-5 text-right shrink-0">{match.id}</span>
                    <span className="flex-1 text-xs sm:text-sm text-right truncate text-white/80">
                      {FLAG(match.homeTeam)} {match.homeTeam || '?'}
                    </span>
                    <div className="flex items-center gap-1 font-bold shrink-0">
                      <span className={tip ? 'text-white' : 'text-white/20'}>
                        {tip ? tip.homeGoals : '–'}
                      </span>
                      <span className="text-white/30 text-xs">–</span>
                      <span className={tip ? 'text-white' : 'text-white/20'}>
                        {tip ? tip.awayGoals : '–'}
                      </span>
                    </div>
                    <span className="flex-1 text-xs sm:text-sm truncate text-white/80">
                      {FLAG(match.awayTeam)} {match.awayTeam || '?'}
                    </span>
                    <span className="text-xs text-white/25 shrink-0 hidden sm:block">{match.round}</span>
                    {match.homeGoals !== null && (
                      <span className="text-xs text-white/30 shrink-0">({match.homeGoals}–{match.awayGoals})</span>
                    )}
                    {pts !== undefined && match.homeGoals !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0
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
        </>
      )}
    </div>
  )
}
