import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../lib/avatars'
import TipReminder from '../components/TipReminder'
import SwedenHype from '../components/SwedenHype'
import { Trophy, Calendar, Star, Users, BarChart2, GitBranch, Grid3x3 } from 'lucide-react'

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

const SCHEDULE_ORDER = [
  1,2,7,8,19,13,14,20,25,31,26,32,43,37,44,38,49,50,55,56,61,67,
  68,62,3,9,10,4,21,15,16,22,33,27,28,34,45,39,46,40,57,51,52,58,
  63,69,70,64,11,12,17,18,5,6,29,30,35,36,23,24,53,54,47,48,41,42,
  71,72,65,66,59,60
]

const TV_MAP = {
  32:'SVT', 33:'TV4', 35:'SVT', 5:'SVT', 6:'SVT', 29:'SVT', 36:'SVT',
}

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [matches, setMatches] = useState([])
  const [myData, setMyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, activeGroup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!activeGroup) return
    Promise.all([
      api.get(`/leaderboard?groupId=${activeGroup.id}`),
      api.get('/matches'),
      api.get(`/tips/me?groupId=${activeGroup.id}`),
    ]).then(([lb, m, me]) => {
      setLeaderboard(lb.data || [])
      setMatches(m.data || [])
      setMyData(me.data || {})
      setLoading(false)
    }).catch(err => {
      console.error('Dashboard load error:', err)
      setLoading(false)
    })
  }, [activeGroup])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/40">Laddar...</div>
  )

  // Next match
  const sortedMatches = [...matches].sort((a, b) =>
    ((SCHEDULE_ORDER.indexOf(a.id) + 1) || 999) - ((SCHEDULE_ORDER.indexOf(b.id) + 1) || 999)
  )
  const nextMatch = sortedMatches.find(m => m.homeGoals === null && m.homeTeam)
  const recentMatches = sortedMatches.filter(m => m.homeGoals !== null).slice(-3).reverse()

  // My position
  const myEntry = (leaderboard || []).find(e => e.username === user?.username)
  const myRank = (leaderboard || []).findIndex(e => e.username === user?.username) + 1

  // Untipped count
  const unlockedMatches = matches.filter(m => !m.isLocked && m.homeTeam)
  const tippedIds = new Set((myData?.tips || []).map(t => t.matchId))
  const untippedCount = unlockedMatches.filter(m => !tippedIds.has(m.id)).length

  const isSweden = nextMatch?.homeTeam === 'Sverige' || nextMatch?.awayTeam === 'Sverige'

  // Spelar Sverige IDAG (svensk lokal dag)? Visa hype-banner hela dagen.
  const todayStr = new Date().toLocaleDateString('sv-SE') // "2026-06-30"
  const swedenToday = matches.find(m => {
    if (m.homeTeam !== 'Sverige' && m.awayTeam !== 'Sverige') return false
    if (m.homeGoals !== null) return false // redan spelad
    const when = m.startsAt ? new Date(m.startsAt) : (m.matchDate ? new Date(m.matchDate) : null)
    if (!when) return false
    return when.toLocaleDateString('sv-SE') === todayStr
  })

  const quickLinks = [
    { to: '/schema',     label: 'Schema',    icon: Calendar,  color: 'bg-blue-900/40 border-blue-700/50' },
    { to: '/topplista',  label: 'Topplista', icon: Trophy,    color: 'bg-yellow-900/40 border-yellow-700/50' },
    { to: '/mina-tips',  label: 'Mina Tips', icon: Star,      color: 'bg-emerald-900/40 border-emerald-700/50' },
    { to: '/alla-tips',  label: 'Alla Tips', icon: Users,     color: 'bg-purple-900/40 border-purple-700/50' },
    { to: '/grupper',    label: 'Grupper',   icon: Grid3x3,   color: 'bg-orange-900/40 border-orange-700/50' },
    { to: '/slutspel',   label: 'Slutspel',  icon: GitBranch, color: 'bg-red-900/40 border-red-700/50' },
    { to: '/statistik',  label: 'Statistik', icon: BarChart2, color: 'bg-pitch-700 border-pitch-600' },
  ]

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Welcome */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex items-center gap-3">
        <Avatar username={user?.username} size={52} ring />
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Hej, <span className="text-gold-400">{user?.username}</span>!
          </h1>
          <p className="text-white/40 text-sm mt-1">VM 2026 · {activeGroup?.name}</p>
        </div>
      </motion.div>

      {/* Tippnings-påminnelse */}
      <TipReminder matches={matches} tippedIds={tippedIds} />

      {/* Sverige spelar idag! */}
      {swedenToday && (
        <SwedenHype
          home={swedenToday.homeTeam}
          away={swedenToday.awayTeam}
          time={swedenToday.startsAt
            ? new Date(swedenToday.startsAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
            : ''}
          tv={null} />
      )}

      {/* Next match */}
      {nextMatch && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.05}}
          onClick={() => navigate('/schema')}
          className={`card cursor-pointer hover:border-white/20 transition-colors
            ${isSweden
              ? 'border-yellow-500/50 bg-gradient-to-r from-blue-900/50 to-yellow-900/20'
              : 'border-pitch-600'}`}>
          <div className={`text-xs font-bold uppercase tracking-widest mb-2
            ${isSweden ? 'text-yellow-400' : 'text-white/40'}`}>
            {isSweden ? '🇸🇪 SVERIGES NÄSTA MATCH' : '⚡ NÄSTA MATCH'}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-bold text-white text-sm sm:text-base">{nextMatch.homeTeam}</span>
              <span className="text-xl">{FLAG(nextMatch.homeTeam)}</span>
            </div>
            <div className="text-center px-3">
              <div className="text-white/30 text-sm font-bold">vs</div>
              {nextMatch.matchDate && (
                <div className="text-white/40 text-xs mt-0.5">{nextMatch.matchDate}</div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{FLAG(nextMatch.awayTeam)}</span>
              <span className="font-bold text-white text-sm sm:text-base">{nextMatch.awayTeam}</span>
            </div>
          </div>
          {/* Untipped warning */}
          {untippedCount > 0 && (
            <div className="mt-3 text-xs text-orange-400/80 flex items-center gap-1.5">
              ⚠️ Du har <strong>{untippedCount}</strong> otippade matcher kvar
            </div>
          )}
        </motion.div>
      )}

      {/* My position + Recent results */}
      <div className="grid grid-cols-2 gap-3">
        {/* My rank */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
          onClick={() => navigate('/topplista')}
          className="card cursor-pointer hover:border-gold-500/30 transition-colors">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Din placering</div>
          <div className="flex items-end gap-2">
            <span className="font-display text-5xl text-gold-400">#{myRank}</span>
          </div>
          <div className="text-xs text-white/40 mt-1">
            {myEntry?.totalPoints || 0}p totalt
          </div>
          {myEntry && (
            <div className="text-xs text-white/30 mt-0.5">
              av {(leaderboard || []).length} spelare
            </div>
          )}
        </motion.div>

        {/* Recent results */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.12}}
          onClick={() => navigate('/schema')}
          className="card cursor-pointer hover:border-white/20 transition-colors">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Senaste matcher</div>
          {recentMatches.length === 0 ? (
            <p className="text-white/20 text-xs italic">Inga spelade matcher</p>
          ) : (
            <div className="space-y-1.5">
              {recentMatches.map(m => (
                <div key={m.id} className="flex items-center gap-1.5 text-xs">
                  <span>{FLAG(m.homeTeam)}</span>
                  <span className="font-bold text-white">{m.homeGoals}–{m.awayGoals}</span>
                  <span>{FLAG(m.awayTeam)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mini leaderboard – alla spelare */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
        onClick={() => navigate('/topplista')}
        className="card cursor-pointer hover:border-gold-500/20 transition-colors">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Topplista · {activeGroup?.name}</div>
        <div className="space-y-2">
          {(leaderboard || []).map((e, i) => {
            const isMe = e.username === user?.username
            const medals = ['🥇','🥈','🥉']
            return (
              <div key={e.username} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                ${isMe ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-pitch-700/30'}`}>
                <span className="text-lg w-6 text-center">{medals[i] || `${i+1}`}</span>
                <Avatar username={e.username} size={28} ring={isMe} />
                <span className={`flex-1 font-medium text-sm ${isMe ? 'text-gold-400' : 'text-white/80'}`}>
                  {e.username} {isMe && '(du)'}
                </span>
                <span className="font-display text-xl text-white">{e.totalPoints}</span>
                <span className="text-white/30 text-xs">p</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Genvägар</div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {quickLinks.map(({ to, label, icon: Icon, color }) => (
            <button key={to} onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border
                text-white/60 hover:text-white transition-all ${color}`}>
              <Icon size={18} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
