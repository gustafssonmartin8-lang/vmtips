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
  A:['Mexiko','Sydafrika','Sydkorea','Tjeckien'],
  B:['Kanada','Bosnien-Hercegovina','Qatar','Schweiz'],
  C:['Brasilien','Marocko','Haiti','Skottland'],
  D:['USA','Paraguay','Australien','Turkiet'],
  E:['Tyskland','Curacao','Elfenbenskusten','Ecuador'],
  F:['Nederländerna','Japan','Sverige','Tunisien'],
  G:['Belgien','Egypten','Iran','Nya Zeeland'],
  H:['Spanien','Kap Verde','Saudiarabien','Uruguay'],
  I:['Frankrike','Senegal','Irak','Norge'],
  J:['Argentina','Algeriet','Österrike','Jordanien'],
  K:['Portugal','Kongo-Kinshasa','Uzbekistan','Colombia'],
  L:['England','Kroatien','Ghana','Panama'],
}

function calcStandings(groupMatches, teams) {
  const t = {}
  teams.forEach(n => { t[n] = {team:n,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,pts:0} })
  groupMatches.forEach(m => {
    if (m.homeGoals === null || m.homeGoals === undefined) return
    const h = t[m.homeTeam], a = t[m.awayTeam]
    if (!h || !a) return
    h.played++; a.played++
    h.gf += m.homeGoals; h.ga += m.awayGoals
    a.gf += m.awayGoals; a.ga += m.homeGoals
    if (m.homeGoals > m.awayGoals) { h.won++; h.pts+=3; a.lost++ }
    else if (m.homeGoals < m.awayGoals) { a.won++; a.pts+=3; h.lost++ }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++ }
  })
  return Object.values(t).sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const gd = (b.gf-b.ga) - (a.gf-a.ga)
    if (gd !== 0) return gd
    return b.gf - a.gf
  })
}

// Official FIFA 2026 R32 bracket (simplified fixed structure)
// Each entry: [home_group_pos, away_group_pos]
// pos: '1X' = winner of group X, '2X' = runner-up, '3' = best third (indexed)
// Official FIFA 2026 R32 pairings (source: FIFA/FIFAwatch)
const R32 = [
  ['2A','2B'],      // Match 65: 2A vs 2B
  ['1C','2F'],      // Match 66: 1C vs 2F
  ['1E','3third'],  // Match 67: 1E vs 3(A/B/C/D/F)
  ['1F','2C'],      // Match 68: 1F vs 2C
  ['2E','2I'],      // Match 69: 2E vs 2I
  ['1I','3third'],  // Match 70: 1I vs 3(C/D/F/G/H)
  ['1A','3third'],  // Match 71: 1A vs 3(C/E/F/H/I)
  ['1L','3third'],  // Match 72: 1L vs 3(E/H/I/J/K)
  ['1G','3third'],  // Match 73: 1G vs 3(A/E/H/I/J)
  ['1D','3third'],  // Match 74: 1D vs 3(B/E/F/I/J)
  ['1H','2J'],      // Match 75: 1H vs 2J
  ['2K','2L'],      // Match 76: 2K vs 2L
  ['1B','3third'],  // Match 77: 1B vs 3(E/F/G/I/J)
  ['2D','2G'],      // Match 78: 2D vs 2G
  ['1J','2H'],      // Match 79: 1J vs 2H
  ['1K','3third'],  // Match 80: 1K vs 3(D/I/J/L)
]

function MatchCard({ home, away, prelim }) {
  const hasResult = home?.goals !== null && home?.goals !== undefined && away

  const TeamRow = ({ t, won }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${won ? 'bg-pitch-600/40' : ''}`}>
      {t?.name ? (
        <>
          <span className="text-sm shrink-0">{FLAG(t.name)}</span>
          <span className={`text-xs truncate flex-1 ${won ? 'font-bold text-white' : 'text-white/70'}`}>
            {t.name}
          </span>
          {hasResult && <span className={`text-xs font-bold shrink-0 ${won ? 'text-gold-400' : 'text-white/40'}`}>{t.goals}</span>}
        </>
      ) : (
        <span className="text-xs text-white/20 italic flex-1">TBD</span>
      )}
    </div>
  )

  const homeWon = hasResult && home.goals > away.goals
  const awayWon = hasResult && away.goals > home.goals

  return (
    <div className={`rounded-lg overflow-hidden border min-w-0 bg-pitch-800
      ${prelim ? 'border-white/10' : hasResult ? 'border-pitch-500' : 'border-pitch-700'}`}>
      <TeamRow t={home} won={homeWon} />
      <div className="h-px bg-pitch-700" />
      <TeamRow t={away} won={awayWon} />
      {prelim && home?.name && (
        <div className="text-center text-white/20 text-xs py-0.5 bg-pitch-900/30">prelim.</div>
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

  // Build standings per group
  const standings = {}
  Object.entries(GROUPS).forEach(([g, teams]) => {
    standings[g] = calcStandings(matches.filter(m => m.round === `Grupp ${g}`), teams)
  })

  // Best thirds ranked
  const thirds = Object.entries(standings)
    .map(([g, s]) => s[2] ? { ...s[2], group: g } : null)
    .filter(x => x && x.played > 0)
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if ((b.gf-b.ga) !== (a.gf-a.ga)) return (b.gf-b.ga)-(a.gf-a.ga)
      return b.gf - a.gf
    })

  // Helper: get team from position string
  const getPos = (pos) => {
    const rank = parseInt(pos[0]) - 1
    const group = pos[1].toUpperCase()
    const s = standings[group]
    if (!s) return null
    return s[rank] ? { name: s[rank].team } : null
  }

  // Get nth best third (fresh each render)
  const getThird = (n) => thirds[n] ? { name: thirds[n].team } : null

  // Build confirmed knockout matches
  const kMatches = matches.filter(m =>
    ['Sextondelsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Final','Match om 3:e plats'].includes(m.round)
  )
  const getKO = (round, i) => {
    const rm = kMatches.filter(m => m.round === round)
    return rm[i] || null
  }

  // Build R32 cards - track third index separately
  let thirdCount = 0
  const r32Cards = R32.map((pair, i) => {
    const db = getKO('Sextondelsfinal', i)
    if (db?.homeTeam) {
      return {
        home: { name: db.homeTeam, goals: db.homeGoals },
        away: { name: db.awayTeam, goals: db.awayGoals },
        prelim: false
      }
    }
    const homePos = pair[0]
    const awayPos = pair[1]
    const isThird = awayPos === '3third'
    const home = getPos(homePos)
    const away = isThird ? getThird(thirdCount++) : getPos(awayPos)
    return { home, away, prelim: true }
  })

  const buildRound = (round, count) =>
    Array.from({ length: count }, (_, i) => {
      const m = getKO(round, i)
      return {
        home: m?.homeTeam ? { name: m.homeTeam, goals: m.homeGoals } : null,
        away: m?.awayTeam ? { name: m.awayTeam, goals: m.awayGoals } : null,
        prelim: false
      }
    })

  const r16 = buildRound('Åttondelsfinal', 8)
  const qf  = buildRound('Kvartsfinal', 4)
  const sf  = buildRound('Semifinal', 2)
  const fin = buildRound('Final', 1)
  const third = buildRound('Match om 3:e plats', 1)

  const hasPrelim = r32Cards.some(m => m.prelim && m.home)

  const RoundCol = ({ title, items, w = 'w-36' }) => (
    <div className={`flex flex-col shrink-0 ${w}`}>
      <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2 px-1">{title}</div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {items.map((m, i) => <motion.div key={i} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.03}}><MatchCard {...m} /></motion.div>)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Slutspel</h1>
        <p className="text-white/40 text-sm mt-0.5">VM 2026 · Knockout-bracket</p>
      </div>

      {hasPrelim && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-900/20 border border-yellow-700/40 text-sm">
          <span className="text-yellow-400 shrink-0">⚠️</span>
          <span className="text-yellow-300/80">Preliminärt bracket baserat på nuvarande grupptabeller · Uppdateras när fler matcher spelas</span>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto pb-4">
        <div className="flex gap-3 items-stretch" style={{minHeight:'680px', minWidth:'950px'}}>
          <RoundCol title="16-delsfinal" items={r32Cards.slice(0,8)} />
          <RoundCol title="8-delsfinal" items={r16.slice(0,4)} />
          <RoundCol title="Kvartsf." items={qf.slice(0,2)} />
          <div className="flex flex-col justify-around shrink-0 w-36 gap-2">
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">Semifinal</div>
              <MatchCard {...sf[0]} />
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold text-gold-400 uppercase tracking-wider text-center mb-2">🏆 Final</div>
                <MatchCard {...(fin[0] || {})} />
              </div>
              <div>
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">🥉 Brons</div>
                <MatchCard {...(third[0] || {})} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">Semifinal</div>
              <MatchCard {...(sf[1] || {})} />
            </div>
          </div>
          <RoundCol title="Kvartsf." items={qf.slice(2,4)} />
          <RoundCol title="8-delsfinal" items={r16.slice(4,8)} />
          <RoundCol title="16-delsfinal" items={r32Cards.slice(8,16)} />
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-5">
        {[
          {title:'16-delsfinal', items:r32Cards},
          {title:'8-delsfinal', items:r16},
          {title:'Kvartsfinal', items:qf},
          {title:'Semifinal', items:sf},
          {title:'🥉 Bronsmatch', items:third},
          {title:'🏆 Final', items:fin},
        ].map(({title, items}) => (
          <div key={title}>
            <h2 className="font-display text-xl text-gold-400 mb-2">{title}</h2>
            <div className="space-y-2">{items.map((m,i) => <MatchCard key={i} {...m} />)}</div>
          </div>
        ))}
      </div>

      <p className="text-white/20 text-xs text-center">
        "prelim." = baserat på nuvarande ställning · Uppdateras automatiskt
      </p>
    </div>
  )
}
