import { useEffect, useState } from 'react'
import api from '../lib/api'

const FLAG = t => ({
  'Sverige':'🇸🇪','Mexiko':'🇲🇽','Kanada':'🇨🇦','USA':'🇺🇸','Brasilien':'🇧🇷',
  'Frankrike':'🇫🇷','Argentina':'🇦🇷','Spanien':'🇪🇸','England':'🇬🇧','Portugal':'🇵🇹',
  'Belgien':'🇧🇪','Nederländerna':'🇳🇱','Tyskland':'🇩🇪','Japan':'🇯🇵','Tunisien':'🇹🇳',
  'Marocko':'🇲🇦','Sydkorea':'🇰🇷','Australien':'🇦🇺','Kroatien':'🇭🇷','Uruguay':'🇺🇾',
  'Schweiz':'🇨🇭','Saudiarabien':'🇸🇦','Ghana':'🇬🇭','Senegal':'🇸🇳','Norge':'🇳🇴',
}[t] || '🏳️')

const ROUNDS = ['Grupp A','Grupp B','Grupp C','Grupp D','Grupp E','Grupp F',
  'Grupp G','Grupp H','Grupp I','Grupp J','Grupp K','Grupp L',
  'Åttondelsfinal','Kvartsfinal','Semifinal','Match om 3:e plats','Final']

export default function Schedule() {
  const [matches, setMatches] = useState([])
  const [filter,  setFilter]  = useState('all')

  useEffect(() => { api.get('/matches').then(r => setMatches(r.data)) }, [])

  const rounds = [...new Set(matches.map(m => m.round))]
    .sort((a,b) => ROUNDS.indexOf(a) - ROUNDS.indexOf(b))

  const visible = filter === 'all' ? matches
    : filter === 'played' ? matches.filter(m => m.homeGoals !== null)
    : matches.filter(m => m.homeGoals === null && m.homeTeam)

  const grouped = ROUNDS.reduce((acc, r) => {
    const ms = visible.filter(m => m.round === r)
    if (ms.length) acc[r] = ms
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Spelschema</h1>
        <p className="text-white/40 text-sm">VM 2026 · Alla matcher</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['all','Alla'],['played','Spelade'],['upcoming','Kommande']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter===val ? 'bg-gold-500 text-pitch-900' : 'btn-ghost'}`}>
            {label}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([round, rMatches]) => (
        <div key={round} className="card">
          <h2 className={`font-display text-2xl tracking-wide mb-4
            ${round === 'Grupp F' ? 'text-grass-400' : 'text-gold-400'}`}>
            {round === 'Grupp F' ? '⭐ ' : ''}{round.toUpperCase()}
          </h2>
          <div className="space-y-2">
            {rMatches.map(m => (
              <div key={m.id}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl border transition-colors
                  ${m.homeGoals !== null
                    ? 'bg-pitch-700/50 border-pitch-600/50'
                    : 'bg-pitch-700/20 border-pitch-600/30'}`}>

                <span className="text-white/30 text-xs w-5">{m.id}</span>

                {/* Home */}
                <div className="flex-1 flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-right hidden sm:block">
                    {m.homeTeam || '?'}
                  </span>
                  <span className="text-xl">{FLAG(m.homeTeam)}</span>
                </div>

                {/* Score / vs */}
                <div className="w-20 text-center">
                  {m.homeGoals !== null ? (
                    <span className="font-display text-2xl text-white">
                      {m.homeGoals} – {m.awayGoals}
                    </span>
                  ) : (
                    <div className="text-xs text-white/30">{m.matchDate || 'TBD'}</div>
                  )}
                </div>

                {/* Away */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xl">{FLAG(m.awayTeam)}</span>
                  <span className="text-sm font-medium hidden sm:block">
                    {m.awayTeam || '?'}
                  </span>
                </div>

                {/* Lock indicator */}
                {m.isLocked && m.homeGoals === null && (
                  <span className="text-xs text-white/30">🔒</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
