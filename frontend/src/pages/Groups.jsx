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
  'Grupp A': ['Mexiko','Sydafrika','Sydkorea','Tjeckien'],
  'Grupp B': ['Kanada','Bosnien-Hercegovina','Qatar','Schweiz'],
  'Grupp C': ['Brasilien','Marocko','Haiti','Skottland'],
  'Grupp D': ['USA','Paraguay','Australien','Turkiet'],
  'Grupp E': ['Tyskland','Curacao','Elfenbenskusten','Ecuador'],
  'Grupp F': ['Nederländerna','Japan','Sverige','Tunisien'],
  'Grupp G': ['Belgien','Egypten','Iran','Nya Zeeland'],
  'Grupp H': ['Spanien','Kap Verde','Saudiarabien','Uruguay'],
  'Grupp I': ['Frankrike','Senegal','Irak','Norge'],
  'Grupp J': ['Argentina','Algeriet','Österrike','Jordanien'],
  'Grupp K': ['Portugal','Kongo-Kinshasa','Uzbekistan','Colombia'],
  'Grupp L': ['England','Kroatien','Ghana','Panama'],
}

function calcStandings(matches, teams) {
  const table = {}
  teams.forEach(t => {
    table[t] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }
  })
  matches.forEach(m => {
    if (m.homeGoals === null || m.homeGoals === undefined) return
    const h = table[m.homeTeam], a = table[m.awayTeam]
    if (!h || !a) return
    h.played++; a.played++
    h.gf += m.homeGoals; h.ga += m.awayGoals
    a.gf += m.awayGoals; a.ga += m.homeGoals
    if (m.homeGoals > m.awayGoals) { h.won++; h.pts += 3; a.lost++ }
    else if (m.homeGoals < m.awayGoals) { a.won++; a.pts += 3; h.lost++ }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++ }
  })
  return Object.values(table).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const gdB = b.gf - b.ga, gdA = a.gf - a.ga
    if (gdB !== gdA) return gdB - gdA
    return b.gf - a.gf
  })
}

function calcBestThirds(allGroupData) {
  const thirds = Object.entries(allGroupData).map(([group, standings]) => {
    const third = standings[2]
    if (!third || third.played === 0) return null
    return { ...third, group }
  }).filter(Boolean)
  return thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const gdB = b.gf - b.ga, gdA = a.gf - a.ga
    if (gdB !== gdA) return gdB - gdA
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.group.localeCompare(b.group)
  })
}

function GroupTable({ groupName, teams, matches, bestThirds }) {
  const standings = calcStandings(matches, teams)
  const isSweden = teams.includes('Sverige')
  const bestThirdTeams = bestThirds?.slice(0, 8).map(t => t.team) || []

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className={`rounded-2xl border overflow-hidden
        ${isSweden ? 'border-yellow-500/40' : 'border-pitch-600'} bg-pitch-800`}>
      <div className={`px-4 py-2.5 flex items-center gap-2
        ${isSweden ? 'bg-gradient-to-r from-blue-900/60 to-yellow-900/30' : 'bg-pitch-700/50'}`}>
        <span className={`font-display text-lg tracking-wide
          ${isSweden ? 'text-yellow-400' : 'text-gold-400'}`}>
          {isSweden ? '⭐ ' : ''}{groupName}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/30 text-xs border-b border-pitch-700">
            <th className="text-left px-3 py-1.5 font-medium w-6">#</th>
            <th className="text-left px-1 py-1.5 font-medium">Lag</th>
            <th className="text-center px-1 py-1.5 font-medium w-7">S</th>
            <th className="text-center px-1 py-1.5 font-medium w-7">V</th>
            <th className="text-center px-1 py-1.5 font-medium w-7">O</th>
            <th className="text-center px-1 py-1.5 font-medium w-7">F</th>
            <th className="text-center px-1 py-1.5 font-medium w-10">GM</th>
            <th className="text-center px-1 py-1.5 font-medium w-8">+/-</th>
            <th className="text-center px-3 py-1.5 font-bold w-8">P</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const gd = row.gf - row.ga
            const directAdvance = i < 2 && row.played > 0
            const bestThird = i === 2 && bestThirdTeams.includes(row.team)
            const advancing = directAdvance || bestThird
            const isMe = row.team === 'Sverige'
            return (
              <tr key={row.team}
                className={`border-b border-pitch-700/50 last:border-0
                  ${isMe ? 'bg-blue-900/20' : directAdvance ? 'bg-pitch-700/20' : bestThird ? 'bg-yellow-900/10' : ''}`}>
                <td className="px-3 py-2 text-white/30 text-xs">{i + 1}</td>
                <td className="px-1 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{FLAG(row.team)}</span>
                    <span className={`font-medium text-xs sm:text-sm truncate
                      ${isMe ? 'text-yellow-400' : directAdvance ? 'text-white' : bestThird ? 'text-yellow-300/80' : 'text-white/70'}`}>
                      {row.team}
                    </span>
                    {directAdvance && <span className="hidden sm:block text-xs text-green-400/60">↑</span>}
                    {bestThird && <span className="hidden sm:block text-xs text-yellow-400/60">★</span>}
                  </div>
                </td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.played}</td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.won}</td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.drawn}</td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.lost}</td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.gf}–{row.ga}</td>
                <td className={`text-center px-1 py-2 text-xs font-medium
                  ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-white/40'}`}>
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="text-center px-3 py-2 font-bold text-white">{row.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </motion.div>
  )
}

function BestThirdsTable({ allGroupData }) {
  const thirds = calcBestThirds(allGroupData)
  if (thirds.length === 0) return null

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="rounded-2xl border border-yellow-600/40 overflow-hidden bg-pitch-800">
      <div className="px-4 py-2.5 bg-gradient-to-r from-yellow-900/40 to-pitch-800">
        <span className="font-display text-lg text-yellow-400 tracking-wide">
          ★ Bästa treorna
        </span>
        <span className="text-white/30 text-xs ml-2">8 av 12 går vidare</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/30 text-xs border-b border-pitch-700">
            <th className="text-left px-3 py-1.5 font-medium w-6">#</th>
            <th className="text-left px-1 py-1.5 font-medium">Lag</th>
            <th className="text-center px-1 py-1.5 font-medium w-12">Grupp</th>
            <th className="text-center px-1 py-1.5 font-medium w-7">S</th>
            <th className="text-center px-1 py-1.5 font-medium w-10">GM</th>
            <th className="text-center px-1 py-1.5 font-medium w-8">+/-</th>
            <th className="text-center px-3 py-1.5 font-bold w-8">P</th>
            <th className="text-center px-2 py-1.5 w-16">Status</th>
          </tr>
        </thead>
        <tbody>
          {thirds.map((row, i) => {
            const gd = row.gf - row.ga
            const advances = i < 8
            return (
              <tr key={row.team}
                className={`border-b border-pitch-700/50 last:border-0
                  ${advances ? 'bg-yellow-900/10' : 'opacity-50'}`}>
                <td className="px-3 py-2 text-white/30 text-xs">{i + 1}</td>
                <td className="px-1 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{FLAG(row.team)}</span>
                    <span className={`font-medium text-xs sm:text-sm truncate
                      ${advances ? 'text-yellow-300/90' : 'text-white/50'}`}>
                      {row.team}
                    </span>
                  </div>
                </td>
                <td className="text-center px-1 py-2 text-white/40 text-xs">{row.group.replace('Grupp ','')}</td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.played}</td>
                <td className="text-center px-1 py-2 text-white/50 text-xs">{row.gf}–{row.ga}</td>
                <td className={`text-center px-1 py-2 text-xs font-medium
                  ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-white/40'}`}>
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="text-center px-3 py-2 font-bold text-white">{row.pts}</td>
                <td className="text-center px-2 py-2">
                  {advances
                    ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">★ Vidare</span>
                    : <span className="text-xs text-white/20">–</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </motion.div>
  )
}

export default function Groups() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/matches').then(r => { setMatches(r.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>

  const playedCount = matches.filter(m => m.homeGoals !== null).length

  // Calculate all standings
  const allGroupData = {}
  Object.entries(GROUPS).forEach(([g, t]) => {
    allGroupData[g] = calcStandings(matches.filter(m => m.round === g), t)
  })
  const bestThirds = calcBestThirds(allGroupData)

  const groupEntries = Object.entries(GROUPS)
  const filtered = filter === 'sweden'
    ? groupEntries.filter(([_, t]) => t.includes('Sverige'))
    : groupEntries

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Gruppspel</h1>
        <p className="text-white/40 text-sm mt-0.5">{playedCount} av 72 matcher spelade</p>
      </div>

      <div className="flex gap-2">
        {[['all','Alla grupper'],['sweden','Grupp F 🇸🇪'],['thirds','Bästa treorna ★']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === val ? 'bg-gold-500 text-pitch-900' : 'btn-ghost'}`}>
            {label}
          </button>
        ))}
      </div>

      {filter === 'thirds' ? (
        <BestThirdsTable allGroupData={allGroupData} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(([groupName, teams]) => (
            <GroupTable key={groupName} groupName={groupName} teams={teams}
              matches={matches.filter(m => m.round === groupName)}
              bestThirds={bestThirds} />
          ))}
        </div>
      )}

      <p className="text-white/20 text-xs text-center">
        ↑ direktkvalificerade · ★ bästa trea (preliminärt)
      </p>
    </div>
  )
}
