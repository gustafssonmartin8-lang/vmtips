import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'

const FLAG = t => ({
  'Sverige':'🇸🇪','Mexiko':'🇲🇽','Kanada':'🇨🇦','USA':'🇺🇸','Brasilien':'🇧🇷',
  'Frankrike':'🇫🇷','Argentina':'🇦🇷','Spanien':'🇪🇸','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹',
  'Belgien':'🇧🇪','Nederländerna':'🇳🇱','Tyskland':'🇩🇪','Japan':'🇯🇵','Tunisien':'🇹🇳',
  'Marocko':'🇲🇦','Sydkorea':'🇰🇷','Australien':'🇦🇺','Kroatien':'🇭🇷','Uruguay':'🇺🇾',
  'Schweiz':'🇨🇭','Saudiarabien':'🇸🇦','Ghana':'🇬🇭','Senegal':'🇸🇳','Norge':'🇳🇴',
  'Ecuador':'🇪🇨','Österrike':'🇦🇹','Colombia':'🇨🇴','Sydafrika':'🇿🇦','Qatar':'🇶🇦',
  'Tjeckien':'🇨🇿','Haiti':'🇭🇹','Skottland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Turkiet':'🇹🇷','Curacao':'🇨🇼',
  'Iran':'🇮🇷','Kap Verde':'🇨🇻','Irak':'🇮🇶','Algeriet':'🇩🇿','Jordanien':'🇯🇴',
  'Elfenbenskusten':'🇨🇮','Paraguay':'🇵🇾','Egypten':'🇪🇬','Nya Zeeland':'🇳🇿',
  'Bosnien-Hercegovina':'🇧🇦','Uzbekistan':'🇺🇿','Kongo-Kinshasa':'🇨🇩','Panama':'🇵🇦',
}[t] || '🏳️')

function MatchCard({ match, compact = false }) {
  const hasResult = match?.homeGoals !== null && match?.homeGoals !== undefined
  const homeWon = hasResult && match.homeGoals > match.awayGoals
  const awayWon = hasResult && match.awayGoals > match.homeGoals

  const TeamRow = ({ team, goals, won }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 ${won ? 'bg-pitch-600/60' : ''}`}>
      {team ? (
        <>
          <span className="text-sm shrink-0">{FLAG(team)}</span>
          <span className={`text-xs truncate flex-1 ${won ? 'text-white font-bold' : 'text-white/70'}`}>
            {compact ? team.split(' ')[0] : team}
          </span>
          {hasResult && <span className={`text-xs font-bold shrink-0 ${won ? 'text-gold-400' : 'text-white/50'}`}>{goals}</span>}
        </>
      ) : (
        <span className="text-xs text-white/25 italic flex-1">TBD</span>
      )}
    </div>
  )

  return (
    <div className={`rounded-lg overflow-hidden border
      ${hasResult ? 'border-pitch-600' : 'border-pitch-700 opacity-60'}
      bg-pitch-800 min-w-0`}>
      <TeamRow team={match?.homeTeam} goals={match?.homeGoals} won={homeWon} />
      <div className="h-px bg-pitch-700" />
      <TeamRow team={match?.awayTeam} goals={match?.awayGoals} won={awayWon} />
    </div>
  )
}

function RoundColumn({ title, matches, compact }) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="text-xs font-bold text-white/40 uppercase tracking-wider text-center mb-3 px-1">
        {title}
      </div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {matches.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}>
            <MatchCard match={m} compact={compact} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Bracket() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/matches').then(r => {
      setMatches(r.data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>
  )

  const getMatch = (round, idx) => {
    const roundMatches = matches.filter(m => m.round === round)
    return roundMatches[idx] || null
  }

  // Build rounds
  const r32 = Array.from({ length: 16 }, (_, i) => getMatch('Sextondelsfinal', i))
  const r16 = Array.from({ length: 8 }, (_, i) => getMatch('Åttondelsfinal', i))
  const qf  = Array.from({ length: 4 }, (_, i) => getMatch('Kvartsfinal', i))
  const sf  = Array.from({ length: 2 }, (_, i) => getMatch('Semifinal', i))
  const fin = [getMatch('Final', 0)]
  const third = [getMatch('Match om 3:e plats', 0)]

  const hasAnyKnockout = matches.some(m =>
    ['Sextondelsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Final'].includes(m.round)
    && (m.homeTeam || m.awayTeam)
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Slutspel</h1>
        <p className="text-white/40 text-sm mt-0.5">VM 2026 · Knockout-bracket</p>
      </div>

      {!hasAnyKnockout ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-white/50 text-lg">Slutspelet börjar 28 juni</p>
          <p className="text-white/30 text-sm mt-2">Lagen fylls i när gruppspelet är klart</p>
        </div>
      ) : (
        <>
          {/* Desktop bracket - horizontal scroll */}
          <div className="hidden sm:block overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max items-stretch"
              style={{ minHeight: '600px' }}>
              <RoundColumn title="Sextondelsfinal (16)" matches={r32.slice(0,8)} />
              <RoundColumn title="Åttondelsfinal (8)" matches={r16.slice(0,4)} />
              <RoundColumn title="Kvartsfinal (4)" matches={qf.slice(0,2)} />
              <div className="flex flex-col gap-4">
                <RoundColumn title="Semifinal" matches={sf.slice(0,1)} />
                <RoundColumn title="Semifinal" matches={sf.slice(1,2)} />
              </div>
              <div className="flex flex-col justify-center gap-6">
                <RoundColumn title="🏆 Final" matches={fin} />
                <RoundColumn title="🥉 Bronsmatch" matches={third} />
              </div>
              <RoundColumn title="Kvartsfinal (4)" matches={qf.slice(2,4)} />
              <RoundColumn title="Åttondelsfinal (8)" matches={r16.slice(4,8)} />
              <RoundColumn title="Sextondelsfinal (16)" matches={r32.slice(8,16)} />
            </div>
          </div>

          {/* Mobile - vertical list per round */}
          <div className="sm:hidden space-y-6">
            {[
              { title: 'Sextondelsfinal', matches: r32 },
              { title: 'Åttondelsfinal', matches: r16 },
              { title: 'Kvartsfinal', matches: qf },
              { title: 'Semifinal', matches: sf },
              { title: '🥉 Bronsmatch', matches: third },
              { title: '🏆 Final', matches: fin },
            ].map(({ title, matches: rMatches }) => (
              <div key={title}>
                <h2 className="font-display text-xl text-gold-400 mb-3">{title}</h2>
                <div className="grid grid-cols-1 gap-2">
                  {rMatches.map((m, i) => (
                    <MatchCard key={i} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
