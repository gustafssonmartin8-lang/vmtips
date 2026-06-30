import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import MatchPoll from '../components/MatchPoll'
import SwedenHype from '../components/SwedenHype'

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
}[t] || '')

const TV = {
  1:"TV4", 2:"TV4", 3:"TV4", 4:"TV4", 5:"SVT", 6:"SVT",
  7:"SVT", 8:"TV4", 9:"TV4", 10:"TV4", 11:"TV4", 12:"TV4",
  13:"SVT", 14:"SVT", 15:"SVT", 16:"TV4", 17:"TV4", 18:"TV4",
  19:"TV4", 20:"TV4", 21:"SVT", 22:"TV4", 23:"TV4", 24:"TV4",
  25:"TV4", 26:"TV4", 27:"TV4", 28:"TV4", 29:"SVT", 30:"SVT",
  31:"TV4", 32:"SVT", 33:"TV4", 34:"SVT", 35:"SVT", 36:"SVT",
  37:"SVT", 38:"TV4", 39:"TV4", 40:"TV4", 41:"TV4", 42:"TV4",
  43:"SVT", 44:"TV4", 45:"TV4", 46:"TV4", 47:"TV4", 48:"TV4",
  49:"SVT", 50:"TV4", 51:"SVT", 52:"SVT", 53:"TV4", 54:"TV4",
  55:"TV4", 56:"TV4", 57:"SVT", 58:"TV4", 59:"TV4", 60:"TV4",
  61:"TV4", 62:"TV4", 63:"SVT", 64:"SVT", 65:"TV4", 66:"TV4",
  67:"TV4", 68:"TV4", 69:"SVT", 70:"TV4", 71:"SVT", 72:"SVT",
  // Åttondelsfinaler (id 73-80)
  73:"TV4", 74:"SVT", 75:"TV4", 76:"SVT", 77:"TV4", 78:"TV4", 79:"TV4", 80:"SVT",
  // Kvarts/semi/final (id 81-88) – uppdateras vid behov
  81:"TV4", 82:"SVT", 83:"TV4", 84:"SVT", 85:"TV4", 86:"TV4", 87:"TV4", 88:"SVT",
  // Sextondelsfinaler (id 89-104)
  89:"TV4",  90:"SVT",  91:"SVT", 92:"TV4", 93:"TV4", 94:"TV4", 95:"TV4", 96:"SVT",
  97:"TV4",  98:"TV4",  99:"TV4", 100:"SVT", 101:"TV4", 102:"SVT", 103:"SVT", 104:"TV4",
}

const SCHEDULE = [
  {id:1,  home:'Mexiko',        away:'Sydafrika',           date:'2026-06-11', time:'21:00', round:'Grupp A'},
  {id:2,  home:'Sydkorea',      away:'Tjeckien',            date:'2026-06-12', time:'04:00', round:'Grupp A'},
  {id:7,  home:'Kanada',        away:'Bosnien-Hercegovina', date:'2026-06-12', time:'21:00', round:'Grupp B'},
  {id:8,  home:'Qatar',         away:'Schweiz',             date:'2026-06-13', time:'21:00', round:'Grupp B'},
  {id:19, home:'USA',           away:'Paraguay',            date:'2026-06-13', time:'03:00', round:'Grupp D'},
  {id:13, home:'Brasilien',     away:'Marocko',             date:'2026-06-14', time:'00:00', round:'Grupp C'},
  {id:14, home:'Haiti',         away:'Skottland',           date:'2026-06-14', time:'03:00', round:'Grupp C'},
  {id:20, home:'Australien',    away:'Turkiet',             date:'2026-06-14', time:'06:00', round:'Grupp D'},
  {id:25, home:'Tyskland',      away:'Curacao',             date:'2026-06-14', time:'19:00', round:'Grupp E'},
  {id:31, home:'Nederländerna', away:'Japan',               date:'2026-06-14', time:'22:00', round:'Grupp F'},
  {id:26, home:'Elfenbenskusten',away:'Ecuador',            date:'2026-06-15', time:'01:00', round:'Grupp E'},
  {id:32, home:'Sverige',       away:'Tunisien',            date:'2026-06-15', time:'04:00', round:'Grupp F'},
  {id:43, home:'Spanien',       away:'Kap Verde',           date:'2026-06-15', time:'18:00', round:'Grupp H'},
  {id:37, home:'Belgien',       away:'Egypten',             date:'2026-06-15', time:'21:00', round:'Grupp G'},
  {id:44, home:'Saudiarabien',  away:'Uruguay',             date:'2026-06-16', time:'00:00', round:'Grupp H'},
  {id:38, home:'Iran',          away:'Nya Zeeland',         date:'2026-06-16', time:'03:00', round:'Grupp G'},
  {id:49, home:'Frankrike',     away:'Senegal',             date:'2026-06-16', time:'21:00', round:'Grupp I'},
  {id:50, home:'Irak',          away:'Norge',               date:'2026-06-17', time:'00:00', round:'Grupp I'},
  {id:55, home:'Argentina',     away:'Algeriet',            date:'2026-06-17', time:'03:00', round:'Grupp J'},
  {id:56, home:'Österrike',     away:'Jordanien',           date:'2026-06-17', time:'06:00', round:'Grupp J'},
  {id:61, home:'Portugal',      away:'Kongo-Kinshasa',      date:'2026-06-17', time:'19:00', round:'Grupp K'},
  {id:67, home:'England',       away:'Kroatien',            date:'2026-06-17', time:'22:00', round:'Grupp L'},
  {id:68, home:'Ghana',         away:'Panama',              date:'2026-06-18', time:'01:00', round:'Grupp L'},
  {id:62, home:'Uzbekistan',    away:'Colombia',            date:'2026-06-18', time:'04:00', round:'Grupp K'},
  {id:3,  home:'Tjeckien',      away:'Sydafrika',           date:'2026-06-18', time:'18:00', round:'Grupp A'},
  {id:9,  home:'Schweiz',       away:'Bosnien-Hercegovina', date:'2026-06-18', time:'21:00', round:'Grupp B'},
  {id:10, home:'Kanada',        away:'Qatar',               date:'2026-06-19', time:'00:00', round:'Grupp B'},
  {id:4,  home:'Mexiko',        away:'Sydkorea',            date:'2026-06-19', time:'03:00', round:'Grupp A'},
  {id:21, home:'USA',           away:'Australien',          date:'2026-06-19', time:'21:00', round:'Grupp D'},
  {id:15, home:'Skottland',     away:'Marocko',             date:'2026-06-20', time:'00:00', round:'Grupp C'},
  {id:16, home:'Brasilien',     away:'Haiti',               date:'2026-06-20', time:'03:00', round:'Grupp C'},
  {id:22, home:'Turkiet',       away:'Paraguay',            date:'2026-06-20', time:'06:00', round:'Grupp D'},
  {id:33, home:'Nederländerna', away:'Sverige',             date:'2026-06-20', time:'19:00', round:'Grupp F'},
  {id:27, home:'Tyskland',      away:'Elfenbenskusten',     date:'2026-06-20', time:'22:00', round:'Grupp E'},
  {id:28, home:'Ecuador',       away:'Curacao',             date:'2026-06-21', time:'02:00', round:'Grupp E'},
  {id:34, home:'Tunisien',      away:'Japan',               date:'2026-06-21', time:'06:00', round:'Grupp F'},
  {id:45, home:'Spanien',       away:'Saudiarabien',        date:'2026-06-21', time:'18:00', round:'Grupp H'},
  {id:39, home:'Belgien',       away:'Iran',                date:'2026-06-21', time:'21:00', round:'Grupp G'},
  {id:46, home:'Uruguay',       away:'Kap Verde',           date:'2026-06-22', time:'00:00', round:'Grupp H'},
  {id:40, home:'Nya Zeeland',   away:'Egypten',             date:'2026-06-22', time:'03:00', round:'Grupp G'},
  {id:57, home:'Argentina',     away:'Österrike',           date:'2026-06-22', time:'19:00', round:'Grupp J'},
  {id:51, home:'Frankrike',     away:'Irak',                date:'2026-06-22', time:'23:00', round:'Grupp I'},
  {id:52, home:'Norge',         away:'Senegal',             date:'2026-06-23', time:'02:00', round:'Grupp I'},
  {id:58, home:'Jordanien',     away:'Algeriet',            date:'2026-06-23', time:'05:00', round:'Grupp J'},
  {id:63, home:'Portugal',      away:'Uzbekistan',          date:'2026-06-23', time:'19:00', round:'Grupp K'},
  {id:69, home:'England',       away:'Ghana',               date:'2026-06-23', time:'22:00', round:'Grupp L'},
  {id:70, home:'Panama',        away:'Kroatien',            date:'2026-06-24', time:'01:00', round:'Grupp L'},
  {id:64, home:'Colombia',      away:'Kongo-Kinshasa',      date:'2026-06-24', time:'04:00', round:'Grupp K'},
  {id:11, home:'Bosnien-Hercegovina',away:'Qatar',          date:'2026-06-24', time:'21:00', round:'Grupp B'},
  {id:12, home:'Schweiz',       away:'Kanada',              date:'2026-06-24', time:'21:00', round:'Grupp B'},
  {id:17, home:'Marocko',       away:'Haiti',               date:'2026-06-25', time:'00:00', round:'Grupp C'},
  {id:18, home:'Skottland',     away:'Brasilien',           date:'2026-06-25', time:'00:00', round:'Grupp C'},
  {id:5,  home:'Tjeckien',      away:'Mexiko',              date:'2026-06-25', time:'03:00', round:'Grupp A'},
  {id:6,  home:'Sydafrika',     away:'Sydkorea',            date:'2026-06-25', time:'03:00', round:'Grupp A'},
  {id:29, home:'Ecuador',       away:'Tyskland',            date:'2026-06-25', time:'22:00', round:'Grupp E'},
  {id:30, home:'Curacao',       away:'Elfenbenskusten',     date:'2026-06-25', time:'22:00', round:'Grupp E'},
  {id:35, home:'Japan',         away:'Sverige',             date:'2026-06-26', time:'01:00', round:'Grupp F'},
  {id:36, home:'Tunisien',      away:'Nederländerna',       date:'2026-06-26', time:'01:00', round:'Grupp F'},
  {id:23, home:'Turkiet',       away:'USA',                 date:'2026-06-26', time:'04:00', round:'Grupp D'},
  {id:24, home:'Paraguay',      away:'Australien',          date:'2026-06-26', time:'04:00', round:'Grupp D'},
  {id:53, home:'Senegal',       away:'Irak',                date:'2026-06-26', time:'21:00', round:'Grupp I'},
  {id:54, home:'Norge',         away:'Frankrike',           date:'2026-06-26', time:'21:00', round:'Grupp I'},
  {id:47, home:'Uruguay',       away:'Spanien',             date:'2026-06-27', time:'02:00', round:'Grupp H'},
  {id:48, home:'Kap Verde',     away:'Saudiarabien',        date:'2026-06-27', time:'02:00', round:'Grupp H'},
  {id:41, home:'Nya Zeeland',   away:'Belgien',             date:'2026-06-27', time:'05:00', round:'Grupp G'},
  {id:42, home:'Egypten',       away:'Iran',                date:'2026-06-27', time:'05:00', round:'Grupp G'},
  {id:71, home:'Panama',        away:'England',             date:'2026-06-27', time:'23:00', round:'Grupp L'},
  {id:72, home:'Kroatien',      away:'Ghana',               date:'2026-06-27', time:'23:00', round:'Grupp L'},
  {id:65, home:'Kongo-Kinshasa',away:'Uzbekistan',          date:'2026-06-28', time:'01:30', round:'Grupp K'},
  {id:66, home:'Colombia',      away:'Portugal',            date:'2026-06-28', time:'01:30', round:'Grupp K'},
  {id:59, home:'Jordanien',     away:'Argentina',           date:'2026-06-28', time:'04:00', round:'Grupp J'},
  {id:60, home:'Algeriet',      away:'Österrike',           date:'2026-06-28', time:'04:00', round:'Grupp J'},
  // Slutspel
  // Sextondelsfinaler (R32) – id 89-104. Lag fylls från live-data (admin/bracket) men har fallback här.
  {id:89,  home:'Sydafrika',       away:'Kanada',          date:'2026-06-28', time:'21:00', round:'Sextondelsfinal'},
  {id:90,  home:'Tyskland',        away:'Paraguay',        date:'2026-06-29', time:'22:30', round:'Sextondelsfinal'},
  {id:91,  home:'Nederländerna',   away:'Marocko',         date:'2026-06-30', time:'03:00', round:'Sextondelsfinal'},
  {id:92,  home:'Brasilien',       away:'Japan',           date:'2026-06-29', time:'19:00', round:'Sextondelsfinal'},
  {id:93,  home:'Frankrike',       away:'Sverige',         date:'2026-06-30', time:'23:00', round:'Sextondelsfinal'},
  {id:94,  home:'Elfenbenskusten', away:'Norge',           date:'2026-06-30', time:'19:00', round:'Sextondelsfinal'},
  {id:95,  home:'Mexiko',          away:'Ecuador',         date:'2026-07-01', time:'03:00', round:'Sextondelsfinal'},
  {id:96,  home:'England',         away:'Kongo-Kinshasa',  date:'2026-07-01', time:'18:00', round:'Sextondelsfinal'},
  {id:97,  home:'USA',             away:'Bosnien-Hercegovina', date:'2026-07-02', time:'02:00', round:'Sextondelsfinal'},
  {id:98,  home:'Belgien',         away:'Senegal',         date:'2026-07-01', time:'22:00', round:'Sextondelsfinal'},
  {id:99,  home:'Portugal',        away:'Kroatien',        date:'2026-07-03', time:'01:00', round:'Sextondelsfinal'},
  {id:100, home:'Spanien',         away:'Österrike',       date:'2026-07-02', time:'21:00', round:'Sextondelsfinal'},
  {id:101, home:'Schweiz',         away:'Algeriet',        date:'2026-07-03', time:'05:00', round:'Sextondelsfinal'},
  {id:102, home:'Argentina',       away:'Kap Verde',       date:'2026-07-04', time:'00:00', round:'Sextondelsfinal'},
  {id:103, home:'Colombia',        away:'Ghana',           date:'2026-07-04', time:'03:30', round:'Sextondelsfinal'},
  {id:104, home:'Australien',      away:'Egypten',         date:'2026-07-03', time:'20:00', round:'Sextondelsfinal'},
  // Åttondelsfinaler (id 73-80) – lag fylls senare
  {id:73, home:null, away:null, homePath:'Vinnare Sydafrika/Kanada',  awayPath:'Vinnare Nederländerna/Marocko', date:'2026-07-04', time:'19:00', round:'Åttondelsfinal'},
  {id:74, home:null, away:null, homePath:'Vinnare Tyskland/Paraguay', awayPath:'Vinnare Frankrike/Sverige',      date:'2026-07-04', time:'23:00', round:'Åttondelsfinal'},
  {id:75, home:null, away:null, homePath:'Vinnare Brasilien/Japan',   awayPath:'Vinnare Elfenbenskusten/Norge',  date:'2026-07-05', time:'22:00', round:'Åttondelsfinal'},
  {id:76, home:null, away:null, homePath:'Vinnare Mexiko/Ecuador',    awayPath:'Vinnare England/DR Kongo',       date:'2026-07-06', time:'02:00', round:'Åttondelsfinal'},
  {id:77, home:null, away:null, homePath:'Vinnare Portugal/Kroatien', awayPath:'Vinnare Spanien/Österrike',      date:'2026-07-06', time:'21:00', round:'Åttondelsfinal'},
  {id:78, home:null, away:null, homePath:'Vinnare USA/Bosnien-Hercegovina', awayPath:'Vinnare Belgien/Senegal',  date:'2026-07-07', time:'02:00', round:'Åttondelsfinal'},
  {id:79, home:null, away:null, homePath:'Vinnare Argentina/Kap Verde', awayPath:'Vinnare Australien/Egypten',   date:'2026-07-07', time:'18:00', round:'Åttondelsfinal'},
  {id:80, home:null, away:null, homePath:'Vinnare Schweiz/Algeriet',  awayPath:'Vinnare Colombia/Ghana',         date:'2026-07-07', time:'22:00', round:'Åttondelsfinal'},
  {id:81, home:null, away:null, date:'2026-07-09', time:'22:00', round:'Kvartsfinal'},
  {id:82, home:null, away:null, date:'2026-07-10', time:'21:00', round:'Kvartsfinal'},
  {id:83, home:null, away:null, date:'2026-07-11', time:'23:00', round:'Kvartsfinal'},
  {id:84, home:null, away:null, date:'2026-07-12', time:'03:00', round:'Kvartsfinal'},
  {id:85, home:null, away:null, date:'2026-07-14', time:'21:00', round:'Semifinal'},
  {id:86, home:null, away:null, date:'2026-07-15', time:'21:00', round:'Semifinal'},
  {id:87, home:null, away:null, date:'2026-07-18', time:'23:00', round:'Match om 3:e plats'},
  {id:88, home:null, away:null, date:'2026-07-19', time:'21:00', round:'Final'},
]

export default function Schedule() {
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('upcoming')
  const [allTips, setAllTips] = useState([])
  const [expandedMatch, setExpandedMatch] = useState(null)
  const { activeGroup, user } = useAuth()

  useEffect(() => {
    api.get('/matches').then(r => setMatches(r.data))
  }, [])

  useEffect(() => {
    if (!activeGroup) return
    api.get(`/tips/all?groupId=${activeGroup.id}`).then(r => setAllTips(r.data))
  }, [activeGroup])

  const sorted = [...SCHEDULE].sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
  const enriched = sorted.map(s => {
    const apiMatch = matches.find(m => m.id === s.id && m.round === s.round)
      || matches.find(m => m.id === s.id)
    return {
      ...s,
      homeTeam: apiMatch?.homeTeam || s.home,
      awayTeam: apiMatch?.awayTeam || s.away,
      homeGoals: apiMatch?.homeGoals ?? null,
      awayGoals: apiMatch?.awayGoals ?? null,
      isLocked: apiMatch?.isLocked ?? false,
      startsAt: apiMatch?.startsAt ?? null,
      locksAt: apiMatch?.locksAt ?? null,
      tv: TV[s.id] || null,
    }
  })

  const filtered = (() => {
    const f = enriched.filter(m => {
      if (filter === 'all') return true
      if (filter === 'played') return m.homeGoals !== null
      return m.homeGoals === null
    })
    // Spelade matcher: senaste först
    if (filter === 'played') return [...f].reverse()
    return f
  })()

  const byDate = {}
  filtered.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = []
    byDate[m.date].push(m)
  })

  const formatDate = d => new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday:'long', day:'numeric', month:'long'
  })

  const nextMatch = enriched.find(m => m.homeGoals === null)

  const tvStyle = ch => ch === 'SVT'
    ? 'bg-blue-900/60 text-blue-300'
    : ch === 'TV4'
    ? 'bg-red-900/60 text-red-300'
    : 'bg-pitch-700 text-white/40'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Spelschema</h1>
        <p className="text-white/40 text-sm mt-0.5">VM 2026 · Svenska tider (UTC+2)</p>
      </div>

      {/* Nästa match */}
      {nextMatch && filter === 'upcoming' && (() => {
        const isSweden = nextMatch.homeTeam === 'Sverige' || nextMatch.awayTeam === 'Sverige'
        return (
          <div className="space-y-3">
            {isSweden && (
              <SwedenHype
                home={nextMatch.homeTeam}
                away={nextMatch.awayTeam}
                time={nextMatch.time}
                tv={nextMatch.tv} />
            )}
          <div className={`card ${isSweden
            ? 'border-yellow-400/60 bg-gradient-to-r from-blue-900/60 via-blue-800/40 to-yellow-900/30'
            : 'border-gold-500/40 bg-gradient-to-r from-pitch-800 to-pitch-700'}`}>
            {!isSweden && (
              <div className="text-xs text-gold-400 font-bold uppercase tracking-widest mb-2">⚡ Nästa match</div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {FLAG(nextMatch.homeTeam) && <span className="text-2xl">{FLAG(nextMatch.homeTeam)}</span>}
              <span className={`font-bold text-lg ${isSweden && nextMatch.homeTeam === 'Sverige' ? 'text-yellow-300' : 'text-white'}`}>
                {nextMatch.homeTeam || '?'}
              </span>
              <span className="text-white/30 font-bold">vs</span>
              <span className={`font-bold text-lg ${isSweden && nextMatch.awayTeam === 'Sverige' ? 'text-yellow-300' : 'text-white'}`}>
                {nextMatch.awayTeam || '?'}
              </span>
              {FLAG(nextMatch.awayTeam) && <span className="text-2xl">{FLAG(nextMatch.awayTeam)}</span>}
              <span className={`ml-auto font-bold ${isSweden ? 'text-yellow-400' : 'text-gold-400'}`}>{nextMatch.time}</span>
              {nextMatch.tv && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tvStyle(nextMatch.tv)}`}>
                  {nextMatch.tv}
                </span>
              )}
            </div>
            <div className="text-xs text-white/30 mt-1">{nextMatch.round} · {nextMatch.date}</div>

            {/* Poll */}
            <MatchPoll match={nextMatch} />

            {/* Tips per person */}
            {allTips.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">Deltagarnas tips</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {allTips.map(u => {
                    const tip = u.tips?.find(t => t.matchId === nextMatch.id)
                    return (
                      <div key={u.userId}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm
                          ${u.username === user?.username
                            ? 'bg-gold-500/20 border border-gold-500/30'
                            : 'bg-pitch-700/60'}`}>
                        <span className={`font-medium ${u.username === user?.username ? 'text-gold-400' : 'text-white/70'}`}>
                          {u.username}
                        </span>
                        {tip?.isHidden ? (
                          <span className="text-white/40 text-sm" title="Dolt tills matchen är låst">🔒</span>
                        ) : tip ? (
                          <span className="font-bold text-white">
                            {tip.homeGoals}–{tip.awayGoals}
                          </span>
                        ) : (
                          <span className="text-white/25 text-xs italic">–</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          </div>
        )
      })()}

      {/* Filter */}
      <div className="flex gap-2">
        {[['upcoming','Kommande'],['played','Spelade'],['all','Alla']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter===val ? 'bg-gold-500 text-pitch-900' : 'btn-ghost'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Matcher per datum */}
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          <div className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2 px-1 capitalize">
            {formatDate(date)}
          </div>
          <div className="space-y-1.5">
            {dayMatches.map((m, i) => (
              <div key={`${m.id}-${m.time}-${i}`} className="space-y-0">
              <div
                className={`flex items-center gap-2 py-2.5 px-3 rounded-xl cursor-pointer
                           border transition-colors
                           ${m.isLive
                             ? 'bg-red-900/20 border-red-600/60 hover:border-red-500'
                             : m.homeGoals !== null
                             ? 'bg-pitch-800 border-pitch-600 hover:border-gold-500/50'
                             : 'bg-pitch-800 border-pitch-600 hover:border-pitch-500'}`}
                onClick={() => (m.homeTeam || m.homePath) && setExpandedMatch(ex => ex === m.id ? null : m.id)}>

                {/* Tid */}
                <div className="text-gold-400 font-bold text-sm w-11 shrink-0">{m.time}</div>

                {/* Hemmalag */}
                <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                  <span className={`text-xs sm:text-sm font-medium text-right truncate ${m.homeTeam ? 'text-white/90' : 'text-white/40 italic'}`}>
                    {m.homeTeam || m.homePath || '?'}
                  </span>
                  {FLAG(m.homeTeam) && <span className="text-base shrink-0">{FLAG(m.homeTeam)}</span>}
                </div>

                {/* Resultat / vs / live */}
                <div className="w-16 text-center shrink-0">
                  {m.isLive ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                        <span className="font-display text-xl text-white">
                          {m.liveHomeGoals ?? 0}–{m.liveAwayGoals ?? 0}
                        </span>
                      </div>
                      <span className="text-xs text-red-400 font-bold">
                        {m.liveStatus === 'HT' ? 'HT' : m.liveElapsed ? `${m.liveElapsed}'` : 'LIVE'}
                      </span>
                    </div>
                  ) : m.homeGoals !== null ? (
                    <span className="font-display text-xl text-white">
                      {m.homeGoals}–{m.awayGoals}
                    </span>
                  ) : (
                    <span className="text-white/25 text-xs">vs</span>
                  )}
                </div>

                {/* Bortalag */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {FLAG(m.awayTeam) && <span className="text-base shrink-0">{FLAG(m.awayTeam)}</span>}
                  <span className={`text-xs sm:text-sm font-medium truncate ${m.awayTeam ? 'text-white/90' : 'text-white/40 italic'}`}>
                    {m.awayTeam || m.awayPath || '?'}
                  </span>
                </div>

                {/* Grupp */}
                <div className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 hidden sm:block
                  ${m.round === 'Grupp F' ? 'bg-green-900/60 text-green-400' : 'text-white/30'}`}>
                  {m.round === 'Final' ? '🏆' :
                   m.round === 'Semifinal' ? 'Semi' :
                   m.round === 'Kvartsfinal' ? 'Kvartsf.' :
                   m.round === 'Åttondelsfinal' ? 'Åttondf.' :
                   m.round === 'Sextondelsfinal' ? 'Sextondf.' :
                   m.round === 'Match om 3:e plats' ? '🥉' :
                   m.round}
                </div>

                {/* TV-kanal */}
                {m.tv && (
                  <div className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${tvStyle(m.tv)}`}>
                    {m.tv}
                  </div>
                )}
                {(m.homeTeam || m.homePath) && (
                  <div className="text-white/20 text-xs shrink-0">
                    {expandedMatch === m.id ? '▴' : '▾'}
                  </div>
                )}
              </div>

              {/* Expandable: deltagarnas tips/poäng */}
              {expandedMatch === m.id && (
                <div className="bg-pitch-700/50 rounded-b-xl px-3 py-2.5 border border-t-0 border-pitch-600 -mt-1">
                  {allTips.length === 0 ? (
                    <div className="text-white/30 text-xs text-center py-1">Inga tips ännu</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {allTips.map(u => {
                        const tip = u.tips?.find(t => t.matchId === m.id)
                        const ptColor = !tip ? '' :
                                        tip.points === 5 ? 'text-emerald-400' :
                                        tip.points >= 3 ? 'text-green-400' :
                                        tip.points >= 1 ? 'text-yellow-400' : 'text-red-400'
                        return (
                          <div key={u.userId} className="flex items-center justify-between
                            bg-pitch-800/60 rounded-lg px-2.5 py-1.5 text-xs">
                            <span className="text-white/60 truncate mr-1">{u.username}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!tip ? (
                                <span className="text-white/20">–</span>
                              ) : tip.isHidden ? (
                                <span className="text-white/30" title="Dolt tills matchen är låst">🔒</span>
                              ) : (
                                <>
                                  <span className="text-white/50">{tip.homeGoals}–{tip.awayGoals}</span>
                                  {m.homeGoals !== null && <span className={`font-bold ${ptColor}`}>{tip.points}p</span>}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
