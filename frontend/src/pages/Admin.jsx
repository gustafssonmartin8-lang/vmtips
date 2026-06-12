import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { ShieldCheck, Plus, Key, Trophy, Target } from 'lucide-react'

const ROUNDS = ['Grupp A','Grupp B','Grupp C','Grupp D','Grupp E','Grupp F',
  'Grupp G','Grupp H','Grupp I','Grupp J','Grupp K','Grupp L',
  'Åttondelsfinal','Kvartsfinal','Semifinal','Match om 3:e plats','Final']

export default function Admin() {
  const [tab, setTab] = useState('results')
  const [matches, setMatches]   = useState([])
  const [users,   setUsers]     = useState([])
  const [sido,    setSido]      = useState({ skyttekung:'', assistkung:'', gultKort:'' })
  const [msg,     setMsg]       = useState('')
  const [newUser, setNewUser]   = useState({ username:'', password:'', isAdmin:false })
  const [pwReset, setPwReset]   = useState({})
  const [editResult, setEditResult] = useState({}) // matchId -> {homeGoals, awayGoals, homeTeam, awayTeam, isLocked}

  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  useEffect(() => {
    api.get('/matches').then(r => setMatches(r.data))
    api.get('/admin/users').then(r => setUsers(r.data))
    api.get('/admin/sido').then(r => setSido(r.data))
  }, [])

  const saveResult = async (matchId) => {
    const e = editResult[matchId]
    if (!e) return
    await api.put(`/admin/matches/${matchId}`, {
      homeGoals: e.homeGoals !== '' ? Number(e.homeGoals) : null,
      awayGoals: e.awayGoals !== '' ? Number(e.awayGoals) : null,
      homeTeam:  e.homeTeam  || null,
      awayTeam:  e.awayTeam  || null,
      isLocked:  e.isLocked ?? true,
    })
    const r = await api.get('/matches')
    setMatches(r.data)
    setEditResult(p => { const n = {...p}; delete n[matchId]; return n })
    flash('✅ Resultat sparat!')
  }

  const initEdit = (m) => {
    setEditResult(p => ({
      ...p,
      [m.id]: {
        homeGoals: m.homeGoals ?? '',
        awayGoals: m.awayGoals ?? '',
        homeTeam:  m.homeTeam || '',
        awayTeam:  m.awayTeam || '',
        isLocked:  m.isLocked,
      }
    }))
  }

  const saveSido = async () => {
    await api.put('/admin/sido', sido)
    flash('✅ Sido-svar sparat!')
  }

  const createUser = async () => {
    if (!newUser.username || !newUser.password) return
    await api.post('/admin/users', newUser)
    const r = await api.get('/admin/users')
    setUsers(r.data)
    setNewUser({ username:'', password:'', isAdmin:false })
    flash('✅ Användare skapad!')
  }

  const resetPw = async (id) => {
    const pw = pwReset[id]
    if (!pw) return
    await api.put(`/admin/users/${id}/password`, { newPassword: pw })
    setPwReset(p => { const n={...p}; delete n[id]; return n })
    flash('✅ Lösenord uppdaterat!')
  }

  const grouped = ROUNDS.reduce((acc, r) => {
    const ms = matches.filter(m => m.round === r)
    if (ms.length) acc[r] = ms
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <ShieldCheck size={28} className="text-gold-400" />
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">ADMIN</h1>
      </div>

      {msg && (
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
          className="bg-grass-500/20 border border-grass-500/50 rounded-xl px-4 py-3 text-grass-400 font-medium">
          {msg}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-pitch-700 pb-1">
        {[['results','Resultat',Target],['sido','Sido-svar',Trophy],['users','Användare',ShieldCheck]].map(([key,label,Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${tab===key ? 'text-gold-400 border-b-2 border-gold-400' : 'text-white/40 hover:text-white'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* RESULTS TAB */}
      {tab === 'results' && (
        <div className="space-y-4">
          <p className="text-white/40 text-sm">Fyll i matchresultat och lås matcher. Poäng räknas ut automatiskt.</p>
          {Object.entries(grouped).map(([round, rMatches]) => (
            <div key={round} className="card">
              <h3 className="font-display text-xl text-gold-400 mb-3">{round}</h3>
              <div className="space-y-2">
                {rMatches.map(m => {
                  const e = editResult[m.id]
                  const isKo = !round.startsWith('Grupp')
                  return (
                    <div key={m.id} className="bg-pitch-700/50 rounded-xl p-3 border border-pitch-600/50">
                      {e ? (
                        <div className="space-y-2">
                          {isKo && (
                            <div className="grid grid-cols-2 gap-2">
                              <input className="input text-sm" placeholder="Hemmalag"
                                value={e.homeTeam} onChange={ev => setEditResult(p => ({...p,[m.id]:{...e,homeTeam:ev.target.value}}))} />
                              <input className="input text-sm" placeholder="Bortalag"
                                value={e.awayTeam} onChange={ev => setEditResult(p => ({...p,[m.id]:{...e,awayTeam:ev.target.value}}))} />
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-white/60 flex-1 text-right">
                              {isKo ? (e.homeTeam||'?') : m.homeTeam}
                            </span>
                            <input type="number" min="0" className="score-input w-12"
                              value={e.homeGoals}
                              onChange={ev => setEditResult(p => ({...p,[m.id]:{...e,homeGoals:ev.target.value}}))} />
                            <span className="text-white/30">–</span>
                            <input type="number" min="0" className="score-input w-12"
                              value={e.awayGoals}
                              onChange={ev => setEditResult(p => ({...p,[m.id]:{...e,awayGoals:ev.target.value}}))} />
                            <span className="text-sm text-white/60 flex-1">
                              {isKo ? (e.awayTeam||'?') : m.awayTeam}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-white/60">
                              <input type="checkbox" checked={e.isLocked}
                                onChange={ev => setEditResult(p => ({...p,[m.id]:{...e,isLocked:ev.target.checked}}))} />
                              Låst
                            </label>
                            <button className="btn-primary text-sm py-1.5 px-4" onClick={() => saveResult(m.id)}>Spara</button>
                            <button className="btn-ghost text-sm py-1.5 px-3"
                              onClick={() => setEditResult(p => {const n={...p};delete n[m.id];return n})}>Avbryt</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/30 w-5">{m.id}</span>
                          <span className="flex-1 text-sm text-right text-white/80">{m.homeTeam||'?'}</span>
                          <span className="font-bold text-white px-3">
                            {m.homeGoals !== null ? `${m.homeGoals}–${m.awayGoals}` : '–'}
                          </span>
                          <span className="flex-1 text-sm text-white/80">{m.awayTeam||'?'}</span>
                          {m.isLocked && <span className="text-xs text-white/30">🔒</span>}
                          <button className="btn-ghost text-xs py-1 px-2.5" onClick={() => initEdit(m)}>
                            Redigera
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SIDO TAB */}
      {tab === 'sido' && (
        <div className="card max-w-lg">
          <h3 className="font-display text-2xl text-gold-400 mb-4">Rätta Sido-Svar</h3>
          <p className="text-white/40 text-sm mb-4">Fyll i de faktiska vinnarna. Poäng beräknas automatiskt.</p>
          <div className="space-y-4">
            {[['skyttekung','🥅 Skyttekung (flest mål)'],['assistkung','🎯 Assistkung (flest assist)'],['gultKort','🟡 Flest gula kort']].map(([key,label]) => (
              <div key={key}>
                <label className="text-xs text-white/50 mb-1.5 block uppercase tracking-wider">{label}</label>
                <input className="input" value={sido[key]||''}
                  onChange={e => setSido(s => ({...s,[key]:e.target.value}))}
                  placeholder="Spelarens namn" />
              </div>
            ))}
            <button className="btn-primary w-full mt-2" onClick={saveSido}>Spara svar</button>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Existing users */}
          <div className="card">
            <h3 className="font-display text-2xl text-gold-400 mb-4">Befintliga Användare</h3>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 bg-pitch-700/50 rounded-xl p-3 border border-pitch-600/50">
                  <span className="font-medium flex-1">{u.username}</span>
                  {u.isAdmin && <span className="badge bg-gold-500/20 text-gold-400">Admin</span>}
                  <div className="flex items-center gap-2">
                    <input className="input text-sm py-1.5 w-36" type="password"
                      placeholder="Nytt lösenord"
                      value={pwReset[u.id]||''}
                      onChange={e => setPwReset(p => ({...p,[u.id]:e.target.value}))} />
                    <button className="btn-ghost text-xs py-1.5 flex items-center gap-1"
                      onClick={() => resetPw(u.id)}>
                      <Key size={12} />Byt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create user */}
          <div className="card max-w-md">
            <h3 className="font-display text-2xl text-gold-400 mb-4">
              <Plus size={20} className="inline mr-2" />Lägg till Användare
            </h3>
            <div className="space-y-3">
              <input className="input" placeholder="Användarnamn"
                value={newUser.username} onChange={e => setNewUser(n=>({...n,username:e.target.value}))} />
              <input className="input" type="password" placeholder="Lösenord"
                value={newUser.password} onChange={e => setNewUser(n=>({...n,password:e.target.value}))} />
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input type="checkbox" checked={newUser.isAdmin}
                  onChange={e => setNewUser(n=>({...n,isAdmin:e.target.checked}))} />
                Admin-behörighet
              </label>
              <button className="btn-primary w-full" onClick={createUser}>Skapa användare</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
