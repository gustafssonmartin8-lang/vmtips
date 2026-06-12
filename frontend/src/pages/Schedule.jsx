import { useEffect, useState } from 'react'
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
  'Nya Zeeland':'🇳🇿','Kap Verde':'🇨🇻','Bosnien-Hercegovina':'🇧🇦',
}[t] || '')

// Fullständigt spelschema med svenska tider (UTC+2 sommartid)
const SCHEDULE = [
  // Grupp A
  {id:1,  home:'Mexiko',        away:'Sydafrika',           date:'2026-06-11', time:'23:00', round:'Grupp A'},
  {id:2,  home:'Sydkorea',      away:'Tjeckien',            date:'2026-06-12', time:'04:00', round:'Grupp A'},
  // Grupp B
  {id:7,  home:'Kanada',        away:'Bosnien-Hercegovina', date:'2026-06-12', time:'21:00', round:'Grupp B'},
  {id:8,  home:'Qatar',         away:'Schweiz',             date:'2026-06-13', time:'21:00', round:'Grupp B'},
  // Grupp D
  {id:19, home:'USA',           away:'Paraguay',            date:'2026-06-13', time:'03:00', round:'Grupp D'},
  // Grupp C
  {id:13, home:'Brasilien',     away:'Marocko',             date:'2026-06-14', time:'00:00', round:'Grupp C'},
  {id:14, home:'Haiti',         away:'Skottland',           date:'2026-06-14', time:'03:00', round:'Grupp C'},
  // Grupp D
  {id:20, home:'Australien',    away:'Turkiet',             date:'2026-06-14', time:'06:00', round:'Grupp D'},
  // Grupp E
  {id:25, home:'Tyskland',      away:'Curacao',             date:'2026-06-14', time:'19:00', round:'Grupp E'},
  // Grupp E
  {id:26, home:'Elfenbenskusten',away:'Ecuador',            date:'2026-06-15', time:'01:00', round:'Grupp E'},
  // Grupp F
  {id:31, home:'Nederländerna', away:'Japan',               date:'2026-06-14', time:'22:00', round:'Grupp F'},
  {id:32, home:'Sverige',       away:'Tunisien',            date:'2026-06-15', time:'04:00', round:'Grupp F'},
  // Grupp G
  {id:37, home:'Belgien',       away:'Egypten',             date:'2026-06-15', time:'21:00', round:'Grupp G'},
  // Grupp H
  {id:43, home:'Spanien',       away:'Kap Verde',           date:'2026-06-15', time:'18:00', round:'Grupp H'},
  {id:44, home:'Saudiarabien',  away:'Uruguay',             date:'2026-06-16', time:'00:00', round:'Grupp H'},
  // Grupp G
  {id:38, home:'Iran',          away:'Nya Zeeland',         date:'2026-06-16', time:'03:00', round:'Grupp G'},
  // Grupp I
  {id:49, home:'Frankrike',     away:'Senegal',             date:'2026-06-16', time:'21:00', round:'Grupp I'},
  // Grupp J
  {id:55, home:'Argentina',     away:'Algeriet',            date:'2026-06-17', time:'03:00', round:'Grupp J'},
  {id:56, home:'Österrike',     away:'Jordanien',           date:'2026-06-17', time:'06:00', round:'Grupp J'},
  // Grupp I
  {id:50, home:'Irak',          away:'Norge',               date:'2026-06-17', time:'00:00', round:'Grupp I'},
  // Grupp K
  {id:61, home:'Portugal',      away:'Kongo-Kinshasa',      date:'2026-06-17', time:'19:00', round:'Grupp K'},
  // Grupp L
  {id:67, home:'England',       away:'Kroatien',            date:'2026-06-17', time:'22:00', round:'Grupp L'},
  // Grupp B
  {id:9,  home:'Schweiz',       away:'Bosnien-Hercegovina', date:'2026-06-18', time:'21:00', round:'Grupp B'},
  // Grupp K
  {id:62, home:'Uzbekistan',    away:'Colombia',            date:'2026-06-18', time:'04:00', round:'Grupp K'},
  // Grupp L
  {id:68, home:'Ghana',         away:'Panama',              date:'2026-06-18', time:'01:00', round:'Grupp L'},
  // Grupp A
  {id:3,  home:'Tjeckien',      away:'Sydafrika',           date:'2026-06-18', time:'18:00', round:'Grupp A'},
  // Grupp A
  {id:4,  home:'Mexiko',        away:'Sydkorea',            date:'2026-06-19', time:'03:00', round:'Grupp A'},
  // Grupp B
  {id:10, home:'Kanada',        away:'Qatar',               date:'2026-06-19', time:'00:00', round:'Grupp B'},
  // Grupp D
  {id:21, home:'USA',           away:'Australien',          date:'2026-06-19', time:'21:00', round:'Grupp D'},
  // Grupp F
  {id:33, home:'Nederländerna', away:'Sverige',             date:'2026-06-20', time:'19:00', round:'Grupp F'},
  // Grupp C
  {id:15, home:'Skottland',     away:'Marocko',             date:'2026-06-20', time:'00:00', round:'Grupp C'},
  {id:16, home:'Brasilien',     away:'Haiti',               date:'2026-06-20', time:'02:30', round:'Grupp C'},
  // Grupp D
  {id:22, home:'Turkiet',       away:'Paraguay',            date:'2026-06-20', time:'05:00', round:'Grupp D'},
  // Grupp E
  {id:27, home:'Tyskland',      away:'Elfenbenskusten',     date:'2026-06-20', time:'22:00', round:'Grupp E'},
  // Grupp E
  {id:28, home:'Ecuador',       away:'Curacao',             date:'2026-06-21', time:'02:00', round:'Grupp E'},
  // Grupp F
  {id:34, home:'Tunisien',      away:'Japan',               date:'2026-06-21', time:'06:00', round:'Grupp F'},
  // Grupp G
  {id:39, home:'Belgien',       away:'Iran',                date:'2026-06-21', time:'21:00', round:'Grupp G'},
  // Grupp H
  {id:45, home:'Spanien',       away:'Saudiarabien',        date:'2026-06-21', time:'18:00', round:'Grupp H'},
  // Grupp I
  {id:51, home:'Frankrike',     away:'Irak',                date:'2026-06-22', time:'23:00', round:'Grupp I'},
  // Grupp J
  {id:57, home:'Argentina',     away:'Österrike',           date:'2026-06-22', time:'19:00', round:'Grupp J'},
  // Grupp H
  {id:46, home:'Uruguay',       away:'Kap Verde',           date:'2026-06-22', time:'00:00', round:'Grupp H'},
  // Grupp G
  {id:40, home:'Nya Zeeland',   away:'Egypten',             date:'2026-06-22', time:'22:00', round:'Grupp G'}, // rättad tid
  // Grupp I
  {id:52, home:'Norge',         away:'Senegal',             date:'2026-06-23', time:'02:00', round:'Grupp I'},
  // Grupp J
  {id:58, home:'Jordanien',     away:'Algeriet',            date:'2026-06-23', time:'05:00', round:'Grupp J'},
  // Grupp K
  {id:63, home:'Portugal',      away:'Uzbekistan',          date:'2026-06-23', time:'19:00', round:'Grupp K'},
  // Grupp L
  {id:69, home:'England',       away:'Ghana',               date:'2026-06-23', time:'22:00', round:'Grupp L'},
  // Grupp B
  {id:11, home:'Bosnien-Hercegovina',away:'Qatar',          date:'2026-06-24', time:'21:00', round:'Grupp B'},
  {id:12, home:'Schweiz',       away:'Kanada',              date:'2026-06-24', time:'21:00', round:'Grupp B'},
  // Grupp K
  {id:64, home:'Colombia',      away:'Kongo-Kinshasa',      date:'2026-06-24', time:'04:00', round:'Grupp K'},
  // Grupp L
  {id:70, home:'Panama',        away:'Kroatien',            date:'2026-06-24', time:'01:00', round:'Grupp L'},
  // Grupp A
  {id:5,  home:'Tjeckien',      away:'Mexiko',              date:'2026-06-25', time:'03:00', round:'Grupp A'},
  {id:6,  home:'Sydafrika',     away:'Sydkorea',            date:'2026-06-25', time:'03:00', round:'Grupp A'},
  // Grupp C
  {id:17, home:'Marocko',       away:'Haiti',               date:'2026-06-25', time:'00:00', round:'Grupp C'},
  {id:18, home:'Skottland',     away:'Brasilien',           date:'2026-06-25', time:'00:00', round:'Grupp C'},
  // Grupp E
  {id:29, home:'Ecuador',       away:'Tyskland',            date:'2026-06-25', time:'22:00', round:'Grupp E'},
  {id:30, home:'Curacao',       away:'Elfenbenskusten',     date:'2026-06-25', time:'22:00', round:'Grupp E'},
  // Grupp F
  {id:35, home:'Japan',         away:'Sverige',             date:'2026-06-26', time:'01:00', round:'Grupp F'},
  {id:36, home:'Tunisien',      away:'Nederländerna',       date:'2026-06-26', time:'01:00', round:'Grupp F'},
  // Grupp D
  {id:23, home:'Turkiet',       away:'USA',                 date:'2026-06-26', time:'04:00', round:'Grupp D'},
  {id:24, home:'Paraguay',      away:'Australien',          date:'2026-06-26', time:'04:00', round:'Grupp D'},
  // Grupp I
  {id:53, home:'Senegal',       away:'Irak',                date:'2026-06-26', time:'21:00', round:'Grupp I'},
  {id:54, home:'Norge',         away:'Frankrike',           date:'2026-06-26', time:'21:00', round:'Grupp I'},
  // Grupp G
  {id:41, home:'Nya Zeeland',   away:'Belgien',             date:'2026-06-27', time:'07:00', round:'Grupp G'},
  {id:42, home:'Egypten',       away:'Iran',                date:'2026-06-27', time:'05:00', round:'Grupp G'},
  // Grupp H
  {id:47, home:'Uruguay',       away:'Spanien',             date:'2026-06-27', time:'02:00', round:'Grupp H'},
  {id:48, home:'Kap Verde',     away:'Saudiarabien',        date:'2026-06-27', time:'02:00', round:'Grupp H'},
  // Grupp L
  {id:71, home:'Panama',        away:'England',             date:'2026-06-27', time:'23:00', round:'Grupp L'},
  {id:72, home:'Kroatien',      away:'Ghana',               date:'2026-06-27', time:'23:00', round:'Grupp L'},
  // Grupp J
  {id:59, home:'Jordanien',     away:'Argentina',           date:'2026-06-28', time:'04:00', round:'Grupp J'},
  {id:60, home:'Algeriet',      away:'Österrike',           date:'2026-06-28', time:'04:00', round:'Grupp J'},
  // Grupp K
  {id:65, home:'Kongo-Kinshasa',away:'Uzbekistan',          date:'2026-06-28', time:'01:30', round:'Grupp K'},
  {id:66, home:'Colombia',      away:'Portugal',            date:'2026-06-28', time:'01:30', round:'Grupp K'},
  // Slutspel
  {id:73, home:null, away:null, date:'2026-06-28', time:'21:00', round:'Sextondelsfinal'},
  {id:74, home:null, away:null, date:'2026-06-29', time:'21:00', round:'Sextondelsfinal'},
  {id:75, home:null, away:null, date:'2026-06-30', time:'00:00', round:'Sextondelsfinal'},
  {id:76, home:null, away:null, date:'2026-06-30', time:'21:00', round:'Sextondelsfinal'},
  {id:77, home:null, away:null, date:'2026-07-01', time:'00:00', round:'Sextondelsfinal'},
  {id:78, home:null, away:null, date:'2026-07-01', time:'21:00', round:'Sextondelsfinal'},
  {id:79, home:null, away:null, date:'2026-07-02', time:'00:00', round:'Sextondelsfinal'},
  {id:80, home:null, away:null, date:'2026-07-03', time:'00:00', round:'Sextondelsfinal'},
  {id:81, home:null, away:null, date:'2026-07-04', time:'21:00', round:'Åttondelsfinal'},
  {id:82, home:null, away:null, date:'2026-07-05', time:'00:00', round:'Åttondelsfinal'},
  {id:83, home:null, away:null, date:'2026-07-05', time:'21:00', round:'Åttondelsfinal'},
  {id:84, home:null, away:null, date:'2026-07-06', time:'00:00', round:'Åttondelsfinal'},
  {id:85, home:null, away:null, date:'2026-07-09', time:'21:00', round:'Kvartsfinal'},
  {id:86, home:null, away:null, date:'2026-07-10', time:'00:00', round:'Kvartsfinal'},
  {id:87, home:null, away:null, date:'2026-07-11', time:'21:00', round:'Kvartsfinal'},
  {id:88, home:null, away:null, date:'2026-07-12', time:'00:00', round:'Kvartsfinal'}, // rättad
  {id:85, home:null, away:null, date:'2026-07-14', time:'21:00', round:'Semifinal'},
  {id:86, home:null, away:null, date:'2026-07-15', time:'21:00', round:'Semifinal'},
  {id:87, home:null, away:null, date:'2026-07-18', time:'21:00', round:'Match om 3:e plats'},
  {id:88, home:null, away:null, date:'2026-07-19', time:'21:00', round:'Final'},
]

// Sort by date+time
const sortedSchedule = [...SCHEDULE].sort((a, b) => {
  const da = new Date(`${a.date}T${a.time}`)
  const db = new Date(`${b.date}T${b.time}`)
  return da - db
})

const ROUND_COLORS = {
  'Grupp A':'bg-pitch-700','Grupp B':'bg-pitch-700','Grupp C':'bg-pitch-700',
  'Grupp D':'bg-pitch-700','Grupp E':'bg-pitch-700','Grupp F':'bg-green-900',
  'Grupp G':'bg-pitch-700','Grupp H':'bg-pitch-700','Grupp I':'bg-pitch-700',
  'Grupp J':'bg-pitch-700','Grupp K':'bg-pitch-700','Grupp L':'bg-pitch-700',
  'Sextondelsfinal':'bg-blue-900','Åttondelsfinal':'bg-blue-800',
  'Kvartsfinal':'bg-purple-900','Semifinal':'bg-yellow-900',
  'Match om 3:e plats':'bg-orange-900','Final':'bg-red-900',
}

export default function Schedule() {
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    api.get('/matches').then(r => setMatches(r.data))
  }, [])

  const now = new Date()

  // Merge API data (results) with schedule (times)
  const enriched = sortedSchedule.map(s => {
    const apiMatch = matches.find(m => m.id === s.id)
    return {
      ...s,
      homeTeam: apiMatch?.homeTeam || s.home,
      awayTeam: apiMatch?.awayTeam || s.away,
      homeGoals: apiMatch?.homeGoals,
      awayGoals: apiMatch?.awayGoals,
      isLocked: apiMatch?.isLocked || false,
      datetime: new Date(`${s.date}T${s.time}`),
    }
  })

  const filtered = enriched.filter(m => {
    if (filter === 'all') return true
    if (filter === 'played') return m.homeGoals !== null && m.homeGoals !== undefined
    if (filter === 'upcoming') return m.homeGoals === null || m.homeGoals === undefined
    return true
  })

  // Group by date for display
  const byDate = {}
  filtered.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = []
    byDate[m.date].push(m)
  })

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('sv-SE', { weekday:'long', day:'numeric', month:'long' })
  }

  // Find next match
  const nextMatch = enriched.find(m => m.homeGoals === null || m.homeGoals === undefined)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Spelschema</h1>
        <p className="text-white/40 text-sm">VM 2026 · Alla tider är svensk sommartid (UTC+2)</p>
      </div>

      {/* Next match banner */}
      {nextMatch && filter === 'upcoming' && (
        <div className="card border-gold-500/50 bg-gradient-to-r from-pitch-800 to-pitch-700">
          <div className="text-xs text-gold-400 font-bold uppercase tracking-widest mb-2">⚡ Nästa match</div>
          <div className="flex items-center gap-3 flex-wrap">
            {FLAG(nextMatch.homeTeam) && <span className="text-2xl">{FLAG(nextMatch.homeTeam)}</span>}
            <span className="font-bold text-white">{nextMatch.homeTeam}</span>
            <span className="text-white/40 mx-1">vs</span>
            <span className="font-bold text-white">{nextMatch.awayTeam}</span>
            {FLAG(nextMatch.awayTeam) && <span className="text-2xl">{FLAG(nextMatch.awayTeam)}</span>}
            <span className="ml-auto text-gold-400 font-bold">{nextMatch.time}</span>
            <span className="text-white/40 text-sm">{nextMatch.date}</span>
          </div>
          <div className="text-xs text-white/30 mt-1">{nextMatch.round}</div>
        </div>
      )}

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

      {/* Matches grouped by date */}
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          {/* Date header */}
          <div className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2 px-1">
            {formatDate(date)}
          </div>

          <div className="space-y-2">
            {dayMatches.map(m => (
              <div key={`${m.id}-${m.time}`}
                className="flex items-center gap-3 py-3 px-4 rounded-xl border
                           bg-pitch-800 border-pitch-600 hover:border-pitch-500 transition-colors">

                {/* Time */}
                <div className="text-gold-400 font-bold text-sm w-12 shrink-0">{m.time}</div>

                {/* Home */}
                <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-right truncate text-white/90">
                    {m.homeTeam || '?'}
                  </span>
                  {FLAG(m.homeTeam) && <span className="text-lg shrink-0">{FLAG(m.homeTeam)}</span>}
                </div>

                {/* Score or vs */}
                <div className="w-16 text-center shrink-0">
                  {m.homeGoals !== null && m.homeGoals !== undefined ? (
                    <span className="font-display text-2xl text-white">
                      {m.homeGoals}–{m.awayGoals}
                    </span>
                  ) : (
                    <span className="text-white/30 text-sm font-medium">vs</span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {FLAG(m.awayTeam) && <span className="text-lg shrink-0">{FLAG(m.awayTeam)}</span>}
                  <span className="text-xs sm:text-sm font-medium truncate text-white/90">
                    {m.awayTeam || '?'}
                  </span>
                </div>

                {/* Round badge */}
                <div className={`text-xs px-2 py-0.5 rounded-full shrink-0 text-white/60
                  ${m.round === 'Grupp F' ? 'bg-green-900/60 text-green-400' : 'bg-pitch-700'}`}>
                  {m.round === 'Final' ? '🏆 Final' :
                   m.round === 'Semifinal' ? '🏅 Semi' :
                   m.round === 'Kvartsfinal' ? 'Kvartsf.' :
                   m.round === 'Åttondelsfinal' ? 'Åttondf.' :
                   m.round === 'Sextondelsfinal' ? 'Sextondf.' :
                   m.round === 'Match om 3:e plats' ? '🥉 Brons' :
                   m.round}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
