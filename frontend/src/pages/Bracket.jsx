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

const GROUPS = {
  A: ['Mexiko','Sydafrika','Sydkorea','Tjeckien'],
  B: ['Kanada','Bosnien-Hercegovina','Qatar','Schweiz'],
  C: ['Brasilien','Marocko','Haiti','Skottland'],
  D: ['USA','Paraguay','Australien','Turkiet'],
  E: ['Tyskland','Curacao','Elfenbenskusten','Ecuador'],
  F: ['Nederländerna','Japan','Sverige','Tunisien'],
  G: ['Belgien','Egypten','Iran','Nya Zeeland'],
  H: ['Spanien','Kap Verde','Saudiarabien','Uruguay'],
  I: ['Frankrike','Senegal','Irak','Norge'],
  J: ['Argentina','Algeriet','Österrike','Jordanien'],
  K: ['Portugal','Kongo-Kinshasa','Uzbekistan','Colombia'],
  L: ['England','Kroatien','Ghana','Panama'],
}

// Fixed R32 matchups (group winners vs runners-up or thirds)
// Based on FIFA 2026 bracket structure:
// Match 65: 1A vs 2B | Match 66: 1C vs 3(ABCDFGHI) | Match 67: 1E vs 3(ABCDHIJ)
// Match 68: 1F vs 2C | Match 69: 1E vs 2I? ... simplified fixed pairings:
const R32_FIXED = [
  { home: '1A', away: '2B', label: '1A vs 2B' },
  { home: '1C', away: '3X', label: '1C vs 3a' },
  { home: '1E', away: '3X', label: '1E vs 3b' },
  { home: '1F', away: '2C', label: '1F vs 2C' },
  { home: '1I', away: '3X', label: '1I vs 3c' },
  { home: '1A', away: '3X', label: '1A vs 3d' }, // simplified
  { home: '1L', away: '3X', label: '1L vs 3e' },
  { home: '1G', away: '3X', label: '1G vs 3f' },
  { home: '1D', away: '3X', label: '1D vs 3g' },
  { home: '1H', away: '2J', label: '1H vs 2J' },
  { home: '2K', away: '2L', label: '2K vs 2L' },
  { home: '1B', away: '3X', label: '1B vs 3h' },
  { home: '2D', away: '2G', label: '2D vs 2G' },
  { home: '1J', away: '2H', label: '1J vs 2H' },
  { home: '2E', away: '2I', label: '2E vs 2I' },
  { home: '1K', away: '3X', label: '1K vs 3i' },
]

function calcStandings(matches, teams) {
  const table = {}
  teams.forEach(t => { table[t] = { team: t, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, pts:0 } })
  matches.forEach(m => {
    if (m.homeGoals === null || m.homeGoals === undefined) return
    const h = table[m.homeTeam], a = table[m.awayTeam]
    if (!h || !a) return
    h.played++; a.played++
    h.gf += m.homeGoals; h.ga += m.awayGoals
    a.gf += m.awayGoals; a.ga += m.homeGoals
    if (m.homeGoals > m.awayGoals) { h.won++; h.pts+=3; a.lost++ }
    else if (m.homeGoals < m.awayGoals) { a.won++; a.pts+=3; h.lost++ }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++ }
  })
  return Object.values(table).sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const gdB = b.gf-b.ga, gdA = a.gf-a.ga
    if (gdB !== gdA) return gdB - gdA
    return b.gf - a.gf
  })
}

function calcBestThirds(allStandings) {
  return Object.entries(allStandings)
    .map(([g, s]) => s[2] ? { ...s[2], group: g } : null)
    .filter(x => x && x.played > 0)
    .sort((a,b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if ((b.gf-b.ga) !== (a.gf-a.ga)) return (b.gf-b.ga)-(a.gf-a.ga)
      return b.gf - a.gf
    })
    .slice(0, 8)
}

function MatchCard({ home, away, label, preliminary }) {
  const hasResult = home && away && home.goals !== null && home.goals !== undefined

  const TeamRow = ({ t, won }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${won ? 'bg-pitch-600/50' : ''}`}>
      {t?.name ? (
        <>
          <span className="text-base shrink-0">{FLAG(t.name)}</span>
          <span className={`text-xs truncate flex-1 ${won ? 'font-bold text-white' : 'text-white/70'}`}>
            {t.name}
          </span>
          {t.goals !== undefined && t.goals !== null &&
            <span className={`text-xs font-bold shrink-0 ${won ? 'text-gold-400' : 'text-white/40'}`}>
              {t.goals}
            </span>}
        </>
      ) : (
        <span className="text-xs text-white/25 italic flex-1">{label || 'TBD'}</span>
      )}
    </div>
  )

  const homeWon = hasResult && home.goals > away.goals
  const awayWon = hasResult && away.goals > home.goals

  return (
    <div className={`rounded-lg overflow-hidden border min-w-0
      ${preliminary ? 'border-white/10 opacity-70' : hasResult ? 'border-pitch-500' : 'border-pitch-700'}
      bg-pitch-800`}>
      <TeamRow t={home} won={homeWon} />
      <div className="h-px bg-pitch-700" />
      <TeamRow t={away} won={awayWon} />
      {preliminary && (
        <div className="text-center text-white/20 text-xs py-0.5 bg-pitch-900/40">prelim.</div>
      )}
    </div>
  )
}

export default function Bracket() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/matches').then(r => { setMatches(r.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>

  // Build standings from group matches
  const allStandings = {}
  Object.entries(GROUPS).forEach(([g, teams]) => {
    allStandings[g] = calcStandings(matches.filter(m => m.round === `Grupp ${g}`), teams)
  })
  const bestThirds = calcBestThirds(allStandings)

  // Helper to get team by position
  const getTeam = (pos) => {
    const rank = parseInt(pos[0]) - 1
    const group = pos[1]
    if (group === 'X') {
      // best third
      const idx = parseInt(pos[2] || 0)
      const t = bestThirds[idx]
      return t ? { name: t.team } : null
    }
    const s = allStandings[group]
    return s?.[rank] ? { name: s[rank].team } : null
  }

  // Get confirmed knockout matches from DB
  const knockoutMatches = matches.filter(m =>
    ['Sextondelsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Final','Match om 3:e plats'].includes(m.round)
  )

  const getKnockout = (round, idx) => {
    const rm = knockoutMatches.filter(m => m.round === round)
    return rm[idx] || null
  }

  // Build R32 – use DB data if available, otherwise preliminary
  const buildR32 = () => {
    return R32_FIXED.map((fixture, i) => {
      const dbMatch = getKnockout('Sextondelsfinal', i)
      if (dbMatch?.homeTeam) {
        return {
          home: { name: dbMatch.homeTeam, goals: dbMatch.homeGoals },
          away: { name: dbMatch.awayTeam, goals: dbMatch.awayGoals },
          preliminary: false
        }
      }
      return {
        home: getTeam(fixture.home),
        away: getTeam(fixture.away),
        preliminary: true,
        label: fixture.label
      }
    })
  }

  const buildRound = (round, count) => {
    return Array.from({ length: count }, (_, i) => {
      const m = getKnockout(round, i)
      return {
        home: m?.homeTeam ? { name: m.homeTeam, goals: m.homeGoals } : null,
        away: m?.awayTeam ? { name: m.awayTeam, goals: m.awayGoals } : null,
        preliminary: false
      }
    })
  }

  const r32 = buildR32()
  const r16 = buildRound('Åttondelsfinal', 8)
  const qf  = buildRound('Kvartsfinal', 4)
  const sf  = buildRound('Semifinal', 2)
  const fin = buildRound('Final', 1)
  const third = buildRound('Match om 3:e plats', 1)

  const groupStageComplete = matches.filter(m =>
    ['Grupp A','Grupp B','Grupp C','Grupp D','Grupp E','Grupp F',
     'Grupp G','Grupp H','Grupp I','Grupp J','Grupp K','Grupp L'].includes(m.round)
    && m.homeGoals !== null
  ).length === 72

  const prelimCount = r32.filter(m => m.preliminary && (m.home || m.away)).length

  const RoundCol = ({ title, items, width = 'w-36' }) => (
    <div className={`flex flex-col shrink-0 ${width}`}>
      <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">
        {title}
      </div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {items.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity:0, scale:0.95 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay: i * 0.04 }}>
            <MatchCard {...m} />
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Slutspel</h1>
        <p className="text-white/40 text-sm mt-0.5">VM 2026 · Knockout-bracket</p>
      </div>

      {/* Status banner */}
      {!groupStageComplete && prelimCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-900/20 border border-yellow-700/40 text-sm">
          <span className="text-yellow-400">⚠️</span>
          <span className="text-yellow-300/80">
            Preliminärt bracket baserat på nuvarande grupptabeller · Uppdateras när fler matcher spelas
          </span>
        </div>
      )}

      {/* Desktop horizontal bracket */}
      <div className="hidden sm:block overflow-x-auto pb-6">
        <div className="flex gap-3 items-stretch" style={{ minHeight: '700px', minWidth: '900px' }}>
          <RoundCol title="Sextondelsfinal" items={r32.slice(0,8)} />
          <RoundCol title="Åttondelsfinal" items={r16.slice(0,4)} />
          <RoundCol title="Kvartsfinal" items={qf.slice(0,2)} />
          <div className="flex flex-col gap-4 shrink-0 w-36">
            <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">Semifinal</div>
            <div className="flex flex-col gap-2">
              <MatchCard {...sf[0]} />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <div className="text-xs font-bold text-gold-400 uppercase tracking-wider text-center mb-2">🏆 Final</div>
                <MatchCard {...fin[0]} />
              </div>
              <div>
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">🥉 Brons</div>
                <MatchCard {...third[0]} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <MatchCard {...(sf[1] || {})} />
            </div>
          </div>
          <RoundCol title="Kvartsfinal" items={qf.slice(2,4)} />
          <RoundCol title="Åttondelsfinal" items={r16.slice(4,8)} />
          <RoundCol title="Sextondelsfinal" items={r32.slice(8,16)} />
        </div>
      </div>

      {/* Mobile vertical list */}
      <div className="sm:hidden space-y-6">
        {[
          { title: 'Sextondelsfinal', items: r32 },
          { title: 'Åttondelsfinal', items: r16 },
          { title: 'Kvartsfinal', items: qf },
          { title: 'Semifinal', items: sf },
          { title: '🥉 Bronsmatch', items: third },
          { title: '🏆 Final', items: fin },
        ].map(({ title, items }) => (
          <div key={title}>
            <h2 className="font-display text-xl text-gold-400 mb-3">{title}</h2>
            <div className="space-y-2">
              {items.map((m, i) => <MatchCard key={i} {...m} />)}
            </div>
          </div>
        ))}
      </div>

      <p className="text-white/20 text-xs text-center">
        "prelim." = preliminärt baserat på nuvarande ställning · Uppdateras automatiskt
      </p>
    </div>
  )
}
