import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { shortName } from '../lib/teamNames'
import TipReminder from '../components/TipReminder'
import { Lock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const ROUNDS_ORDER = ['Grupp A','Grupp B','Grupp C','Grupp D','Grupp E','Grupp F',
  'Grupp G','Grupp H','Grupp I','Grupp J','Grupp K','Grupp L',
  'Sextondelsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Match om 3:e plats','Final']

// Schedule order: sort matches by ID (follows chronological order)
const sortBySchedule = (matches) => [...matches].sort((a, b) => a.id - b.id)

const FLAG = t => ({
  'Sverige':'🇸🇪','Mexiko':'🇲🇽','Kanada':'🇨🇦','USA':'🇺🇸','Brasilien':'🇧🇷',
  'Frankrike':'🇫🇷','Argentina':'🇦🇷','Spanien':'🇪🇸','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹',
  'Belgien':'🇧🇪','Nederländerna':'🇳🇱','Tyskland':'🇩🇪','Japan':'🇯🇵','Tunisien':'🇹🇳',
  'Marocko':'🇲🇦','Sydkorea':'🇰🇷','Australien':'🇦🇺','Kroatien':'🇭🇷','Uruguay':'🇺🇾',
  'Schweiz':'🇨🇭','Saudiarabien':'🇸🇦','Ghana':'🇬🇭','Senegal':'🇸🇳','Norge':'🇳🇴',
  'Ecuador':'🇪🇨','Österrike':'🇦🇹','Colombia':'🇨🇴','Sydafrika':'🇿🇦','Qatar':'🇶🇦',
  'Tjeckien':'🇨🇿','Haiti':'🇭🇹','Skottland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Turkiet':'🇹🇷','Curacao':'🇨🇼',
  'Iran':'🇮🇷','Kap Verde':'🇨🇻','Irak':'🇮🇶','Algeriet':'🇩🇿','Jordanien':'🇯🇴',
  'Elfenbenskusten':'🇨🇮','Paraguay':'🇵🇾','Egypten':'🇪🇬','Belgien':'🇧🇪','Nya Zeeland':'🇳🇿',
  'Bosnien-Hercegovina':'🇧🇦','Uzbekistan':'🇺🇿','Kongo-Kinshasa':'🇨🇩','Panama':'🇵🇦',
}[t] || '🏳️')

function pointsBadge(pts, locked) {
  if (!locked || pts === undefined) return null
  const colors = ['bg-red-500/20 text-red-300', 'bg-orange-500/20 text-orange-300',
    'bg-yellow-500/20 text-yellow-300','bg-green-500/20 text-green-300','bg-emerald-500/20 text-emerald-300',
    'bg-gold-500/20 text-gold-400']
  return <span className={`badge ${colors[Math.min(pts,5)]}`}>{pts}p</span>
}

export default function MyTips() {
  const [myData, setMyData]       = useState(null)
  const [matches, setMatches]     = useState([])
  const [pending, setPending]     = useState({})   // {matchId: {home,away}}
  const [saving, setSaving]       = useState({})
  const [saved, setSaved]         = useState({})
  const [tipFilter, setTipFilter] = useState('all')
  const [sidoEdit, setSidoEdit]   = useState(false)
  const [sidoForm, setSidoForm]   = useState({ skyttekung:'', assistkung:'', gultKort:'' })
  const { activeGroup } = useAuth()
  const [collapsed, setCollapsed] = useState({})

  const load = useCallback(async () => {
    const [md, mc] = await Promise.all([api.get(`/tips/me?groupId=${activeGroup?.id || 1}`), api.get('/matches')])
    setMyData(md.data)
    setMatches(mc.data)
    setSidoForm({
      skyttekung: md.data.sidoTip?.skyttekung || '',
      assistkung: md.data.sidoTip?.assistkung || '',
      gultKort:   md.data.sidoTip?.gultKort   || '',
    })
  }, [])

  useEffect(() => { load() }, [load])

  const tipFor = matchId => {
    if (pending[matchId]) return pending[matchId]
    const t = myData?.tips?.find(t => t.matchId === matchId)
    return t ? { home: t.homeGoals, away: t.awayGoals } : { home: '', away: '' }
  }

  const matchFor = matchId => matches.find(m => m.id === matchId)

  const handleChange = (matchId, side, val) => {
    const v = val === '' ? '' : Math.max(0, Math.min(99, parseInt(val)||0))
    setPending(p => ({ ...p, [matchId]: { ...tipFor(matchId), [side]: v } }))
  }

  const saveTip = async matchId => {
    const t = tipFor(matchId)
    if (t.home === '' || t.away === '') return
    setSaving(s => ({ ...s, [matchId]: true }))
    try {
      await api.post('/tips', { matchId, homeGoals: Number(t.home), awayGoals: Number(t.away) })
      setSaved(s => ({ ...s, [matchId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [matchId]: false })), 2000)
      await load()
    } finally { setSaving(s => ({ ...s, [matchId]: false })) }
  }

  const saveSido = async () => {
    await api.post('/tips/sido', sidoForm)
    setSidoEdit(false)
    await load()
  }

  const tippedMatchIds = new Set(myData?.tips?.map(t => t.matchId) || [])

  const grouped = ROUNDS_ORDER.reduce((acc, r) => {
    let ms = sortBySchedule(matches.filter(m => m.round === r))
    // Apply filter
    if (tipFilter === 'untipped') ms = ms.filter(m => !m.isLocked && !tippedMatchIds.has(m.id))
    if (tipFilter === 'played') ms = ms.filter(m => m.homeGoals !== null)
    if (ms.length) acc[r] = ms
    return acc
  }, {})

  if (!myData) return <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-gold-400 tracking-wide">Mina Tips</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {myData.matchPoints}p match · {myData.sidoPoints}p sido ·{' '}
            <span className="text-gold-400 font-bold">{myData.totalPoints}p totalt</span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-3xl font-display text-gold-400">{myData.totalPoints}</div>
          <div className="text-xs text-white/40">POÄNG</div>
        </div>
      </div>

      {/* Tippnings-påminnelse */}
      <TipReminder matches={matches} tippedIds={tippedMatchIds} />

      {/* Sido-tipps card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-gold-400 tracking-wide">⭐ Sido-Tipps</h2>
          {myData.sidoPoints > 0 && (
            <span className="badge bg-gold-500/20 text-gold-400">{myData.sidoPoints}p</span>
          )}
        </div>
        {sidoEdit ? (
          <div className="space-y-3">
            {[['skyttekung','🥅 Skyttekung (flest mål)'],['assistkung','🎯 Assistkung (flest assist)'],['gultKort','🟡 Flest gula kort']].map(([key,label]) => (
              <div key={key}>
                <label className="text-xs text-white/50 mb-1 block">{label}</label>
                <input className="input" value={sidoForm[key]}
                  onChange={e => setSidoForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="Spelarens namn" />
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <button className="btn-primary" onClick={saveSido}>Spara</button>
              <button className="btn-ghost" onClick={() => setSidoEdit(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[['🥅 Skyttekung', myData.sidoTip?.skyttekung],
              ['🎯 Assistkung', myData.sidoTip?.assistkung],
              ['🟡 Flest gula kort', myData.sidoTip?.gultKort]].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-pitch-700 last:border-0">
                <span className="text-white/50 text-sm">{label}</span>
                <span className={val ? 'text-white font-medium' : 'text-white/20 italic text-sm'}>
                  {val || 'Ej ifyllt'}
                </span>
              </div>
            ))}
            <button className="btn-ghost text-sm mt-2" onClick={() => setSidoEdit(true)}>
              ✏️ Redigera sido-tipps
            </button>
          </div>
        )}
      </div>

      {/* Match tips per group */}
      {Object.entries(grouped).map(([round, rMatches]) => {
        const isOpen = !collapsed[round]
        const roundTips = rMatches.map(m => myData.tips?.find(t => t.matchId === m.id))
        const roundPts  = roundTips.reduce((s,t) => s + (t?.points||0), 0)
        const isGroup   = round.startsWith('Grupp')

        return (
          <div key={round} className="card">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setCollapsed(c => ({ ...c, [round]: isOpen }))}>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl tracking-wide
                  {round === 'Grupp F' ? 'text-grass-400' : 'text-gold-400'}">
                  {round === 'Grupp F' ? '⭐ ' : ''}{round.toUpperCase()}
                </h2>
                {roundPts > 0 && <span className="badge bg-grass-500/20 text-grass-400">{roundPts}p</span>}
              </div>
              {isOpen ? <ChevronUp size={18} className="text-white/30" /> : <ChevronDown size={18} className="text-white/30" />}
            </button>

            <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden mt-4 space-y-2">
                {rMatches.map(match => {
                  const tip  = tipFor(match.id)
                  const dbTip = myData.tips?.find(t => t.matchId === match.id)
                  const pts   = dbTip?.points
                  return (
                    <div key={match.id}
                      className="flex items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-xl bg-pitch-700/50
                                 border border-pitch-600/50 hover:border-pitch-500/70 transition-colors">
                      {/* Home */}
                      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                        <span className="text-sm font-medium text-right truncate hidden sm:block">
                          {FLAG(match.homeTeam)} {match.homeTeam || '?'}
                        </span>
                        <span className="flex flex-col items-end leading-tight sm:hidden min-w-0">
                          <span className="text-base">{FLAG(match.homeTeam)}</span>
                          <span className="text-[11px] font-medium text-white/70 truncate max-w-[64px]">
                            {match.homeTeam ? shortName(match.homeTeam, true) : '?'}
                          </span>
                        </span>
                      </div>

                      {/* Tip: editable when not locked and teams known, else read-only */}
                      {(match.isLocked || !match.homeTeam || !match.awayTeam) ? (
                        <div className="flex items-center gap-1.5">
                          {match.isLocked && <Lock size={12} className="text-white/30" />}
                          <span className="text-lg font-bold text-white/60 w-6 text-center">
                            {tip.home !== '' ? tip.home : '–'}
                          </span>
                          <span className="text-white/30">–</span>
                          <span className="text-lg font-bold text-white/60 w-6 text-center">
                            {tip.away !== '' ? tip.away : '–'}
                          </span>
                          {pointsBadge(pts, match.isLocked && match.homeGoals !== null)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input type="number" min="0" max="99"
                            className="score-input"
                            value={tip.home}
                            onChange={e => handleChange(match.id, 'home', e.target.value)} />
                          <span className="text-white/30 font-bold">–</span>
                          <input type="number" min="0" max="99"
                            className="score-input"
                            value={tip.away}
                            onChange={e => handleChange(match.id, 'away', e.target.value)} />
                          <button
                            onClick={() => saveTip(match.id)}
                            disabled={saving[match.id] || tip.home==='' || tip.away===''}
                            className="ml-1 w-8 h-8 rounded-lg bg-grass-500/20 hover:bg-grass-500/40 flex items-center justify-center transition-colors disabled:opacity-30">
                            {saved[match.id] ? <CheckCircle size={16} className="text-grass-400" /> :
                             saving[match.id] ? <span className="text-xs">⏳</span> :
                             <span className="text-grass-400 text-lg leading-none">✓</span>}
                          </button>
                        </div>
                      )}

                      {/* Away */}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate hidden sm:block">
                          {FLAG(match.awayTeam)} {match.awayTeam || '?'}
                        </span>
                        <span className="flex flex-col items-start leading-tight sm:hidden min-w-0">
                          <span className="text-base">{FLAG(match.awayTeam)}</span>
                          <span className="text-[11px] font-medium text-white/70 truncate max-w-[64px]">
                            {match.awayTeam ? shortName(match.awayTeam, true) : '?'}
                          </span>
                        </span>
                      </div>

                      {/* Actual result */}
                      {match.homeGoals !== null && match.awayGoals !== null && (
                        <div className="text-xs text-white/30 ml-1 hidden sm:block">
                          ({match.homeGoals}–{match.awayGoals})
                        </div>
                      )}
                    </div>
                  )
                })}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
