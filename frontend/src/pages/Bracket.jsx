import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { FIFA_ANNEX_C } from '../lib/fifaAnnexC'
import { useAuth } from '../hooks/useAuth'

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
    if ((b.gf-b.ga) !== (a.gf-a.ga)) return (b.gf-b.ga)-(a.gf-a.ga)
    return b.gf - a.gf
  })
}

function buildBracket(matches) {
  // Build standings per group
  const standings = {}
  Object.entries(GROUPS).forEach(([g, teams]) => {
    standings[g] = calcStandings(matches.filter(m => m.round === `Grupp ${g}`), teams)
  })

  // Get 3rd place teams ranked
  const thirds = Object.entries(standings)
    .map(([g, s]) => s[2] ? { ...s[2], group: g } : null)
    .filter(x => x && x.played > 0)
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if ((b.gf-b.ga) !== (a.gf-a.ga)) return (b.gf-b.ga)-(a.gf-a.ga)
      return b.gf - a.gf
    })

  // Top 8 thirds
  const top8thirds = thirds.slice(0, 8)
  const thirdsByGroup = {}
  top8thirds.forEach(t => { thirdsByGroup[t.group] = t.team })

  // Build combination key
  const qualifyingGroups = top8thirds.map(t => t.group).sort()
  const combinationKey = qualifyingGroups.join('')

  // Look up FIFA Annex C mapping
  const mapping = FIFA_ANNEX_C[combinationKey]

  // Helper: get team by group position
  const get = (pos) => {
    const rank = parseInt(pos[0]) - 1
    const group = pos[1]
    return standings[group]?.[rank]?.team || null
  }

  // Build R32 - fixed positions (group winners/runners-up) + dynamic thirds
  // Official match order: 73-88
  const r32 = [
    // Fixed runner-up vs runner-up matches
    { home: get('2A'), away: get('2B'), key: 'M73', type: 'fixed' },      // M73: 2A vs 2B
    { home: get('1E'), away: mapping ? thirdsByGroup[mapping['1E']?.slice(1)] : null, key: 'M74', type: mapping?'annex':'prelim' }, // M74: 1E vs 3(ABCDF)
    { home: get('1F'), away: get('2C'), key: 'M75', type: 'fixed' },      // M75: 1F vs 2C
    { home: get('1C'), away: get('2F'), key: 'M76', type: 'fixed' },      // M76: 1C vs 2F
    { home: get('1I'), away: mapping ? thirdsByGroup[mapping['1I']?.slice(1)] : null, key: 'M77', type: mapping?'annex':'prelim' }, // M77: 1I vs 3(CDFGH)
    { home: get('2E'), away: get('2I'), key: 'M78', type: 'fixed' },      // M78: 2E vs 2I
    { home: get('1A'), away: mapping ? thirdsByGroup[mapping['1A']?.slice(1)] : null, key: 'M79', type: mapping?'annex':'prelim' }, // M79: 1A vs 3(CEFHI)
    { home: get('1L'), away: mapping ? thirdsByGroup[mapping['1L']?.slice(1)] : null, key: 'M80', type: mapping?'annex':'prelim' }, // M80: 1L vs 3(EHIJK)
    { home: get('1D'), away: mapping ? thirdsByGroup[mapping['1D']?.slice(1)] : null, key: 'M81', type: mapping?'annex':'prelim' }, // M81: 1D vs 3(BEFIJ)
    { home: get('1G'), away: mapping ? thirdsByGroup[mapping['1G']?.slice(1)] : null, key: 'M82', type: mapping?'annex':'prelim' }, // M82: 1G vs 3(AEHIJ)
    { home: get('2K'), away: get('2L'), key: 'M83', type: 'fixed' },      // M83: 2K vs 2L
    { home: get('1H'), away: get('2J'), key: 'M84', type: 'fixed' },      // M84: 1H vs 2J
    { home: get('1B'), away: mapping ? thirdsByGroup[mapping['1B']?.slice(1)] : null, key: 'M85', type: mapping?'annex':'prelim' }, // M85: 1B vs 3(EFGIJ)
    { home: get('1J'), away: get('2H'), key: 'M86', type: 'fixed' },      // M86: 1J vs 2H
    { home: get('1K'), away: mapping ? thirdsByGroup[mapping['1K']?.slice(1)] : null, key: 'M87', type: mapping?'annex':'prelim' }, // M87: 1K vs 3(DEIJL)
    { home: get('2D'), away: get('2G'), key: 'M88', type: 'fixed' },      // M88: 2D vs 2G
  ]

  return { r32, mapping, combinationKey, qualifyingGroups, top8thirds }
}

function MatchCard({ home, away, prelim, type }) {
  const hasResult = home?.goals !== null && home?.goals !== undefined && away

  const TeamRow = ({ t, won }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${won ? 'bg-pitch-600/40' : ''}`}>
      {t?.name ? (
        <>
          <span className="text-sm shrink-0">{FLAG(t.name)}</span>
          <span className={`text-xs truncate flex-1 ${won ? 'font-bold text-white' : 'text-white/70'}`}>
            {t.name}
          </span>
          {hasResult && (
            <span className={`text-xs font-bold shrink-0 ${won ? 'text-gold-400' : 'text-white/40'}`}>
              {t.goals}
            </span>
          )}
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
      ${hasResult ? 'border-pitch-500' : prelim ? 'border-white/10' : 'border-pitch-700'}`}>
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
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/matches').then(r => { setMatches(r.data); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>

  const { r32, mapping, combinationKey, top8thirds } = buildBracket(matches)

  // Group stage complete?
  const groupPlayed = matches.filter(m => m.round?.startsWith('Grupp') && m.homeGoals !== null).length
  const groupComplete = groupPlayed >= 72

  // Push computed R32 pairings to backend so they become tippable
  const populateR32 = async () => {
    setSaving(true); setSaveMsg(null)
    try {
      const pairs = r32.map(m => ({ homeTeam: m.home || null, awayTeam: m.away || null }))
      await api.post('/admin/bracket/r32', { pairs })
      setSaveMsg('✅ Sextondelsfinalerna är ifyllda – nu kan alla tippa dem under Mina Tips.')
      const r = await api.get('/matches'); setMatches(r.data)
    } catch (e) {
      setSaveMsg('⚠️ ' + (e?.response?.data || 'Kunde inte fylla i. Är gruppspelet klart?'))
    }
    setSaving(false)
  }

  // Check for confirmed KO matches
  const koMatches = matches.filter(m =>
    ['Sextondelsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Final','Match om 3:e plats'].includes(m.round)
  )
  const getKO = (round, i) => koMatches.filter(m => m.round === round)[i] || null

  const buildRound = (round, count) =>
    Array.from({ length: count }, (_, i) => {
      const m = getKO(round, i)
      return {
        home: m?.homeTeam ? { name: m.homeTeam, goals: m.homeGoals } : null,
        away: m?.awayTeam ? { name: m.awayTeam, goals: m.awayGoals } : null,
      }
    })

  // Use confirmed KO data if available, otherwise use preliminary r32
  const r32Cards = r32.map((m, i) => {
    const db = getKO('Sextondelsfinal', i)
    if (db?.homeTeam) {
      return { home: { name: db.homeTeam, goals: db.homeGoals }, away: { name: db.awayTeam, goals: db.awayGoals }, prelim: false }
    }
    return {
      home: m.home ? { name: m.home } : null,
      away: m.away ? { name: m.away } : null,
      prelim: m.type !== 'fixed',
      type: m.type
    }
  })

  const r16 = buildRound('Åttondelsfinal', 8)
  const qf  = buildRound('Kvartsfinal', 4)
  const sf  = buildRound('Semifinal', 2)
  const fin = buildRound('Final', 1)
  const third = buildRound('Match om 3:e plats', 1)

  const hasPrelim = r32Cards.some(m => m.prelim && m.home)
  const has8thirds = top8thirds.length >= 8
  const hasMapping = !!mapping

  const RoundCol = ({ title, items, w = 'w-36' }) => (
    <div className={`flex flex-col shrink-0 ${w}`}>
      <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2 px-1">{title}</div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {items.map((m, i) => (
          <motion.div key={i} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.03}}>
            <MatchCard {...m} />
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Slutspel</h1>
        <p className="text-white/40 text-sm mt-0.5">VM 2026 · Knockout-bracket</p>
      </div>

      {/* Admin: fyll i sextondelsfinaler för tippning */}
      {user?.isAdmin && (
        <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-pitch-800 border border-gold-500/30">
          <div className="text-sm text-white/70">
            {groupComplete
              ? 'Gruppspelet är klart. Fyll i sextondelsfinalerna så de blir tippbara.'
              : `Gruppspelet pågår (${groupPlayed}/72 spelade). Knappen aktiveras när alla gruppmatcher är spelade.`}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={populateR32} disabled={!groupComplete || saving}
              className="px-4 py-1.5 rounded-lg text-sm font-bold bg-gold-500 text-pitch-900 disabled:opacity-30">
              {saving ? 'Fyller i…' : 'Fyll i sextondelsfinaler'}
            </button>
            {combinationKey && (
              <span className="text-xs text-white/40">Annex C: <span className="font-mono">{combinationKey}</span></span>
            )}
          </div>
          {saveMsg && <div className="text-xs text-white/70">{saveMsg}</div>}
        </div>
      )}

      {/* Status */}
      {hasPrelim && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-900/20 border border-yellow-700/40 text-sm">
          <span className="text-yellow-400 shrink-0">⚠️</span>
          <div className="text-yellow-300/80">
            <div>Preliminärt bracket baserat på nuvarande grupptabeller</div>
            {has8thirds && hasMapping && (
              <div className="text-yellow-400/60 text-xs mt-1">
                FIFA Annex C kombination: <span className="font-mono">{combinationKey}</span>
                {' · '}Treor: {top8thirds.map(t => `${t.group}(${t.team})`).join(', ')}
              </div>
            )}
            {has8thirds && !hasMapping && (
              <div className="text-orange-400/60 text-xs mt-1">
                Kombination {combinationKey} ej i tabell – visar uppskattning
              </div>
            )}
          </div>
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
              <MatchCard {...(sf[0]||{})} />
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold text-gold-400 uppercase tracking-wider text-center mb-2">🏆 Final</div>
                <MatchCard {...(fin[0]||{})} />
              </div>
              <div>
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">🥉 Brons</div>
                <MatchCard {...(third[0]||{})} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-wider text-center mb-2">Semifinal</div>
              <MatchCard {...(sf[1]||{})} />
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
        Bracket beräknas via FIFA Annex C (495 kombinationer) · Uppdateras automatiskt
      </p>
    </div>
  )
}
