import { useMemo } from 'react'

// Häftig blågul fest-animation som visas när Sverige står som nästa match.
// Ren CSS (inga extra beroenden). Confetti, vajande flagga, studsande boll, skimmer.
export default function SwedenHype({ home, away, time, tv }) {
  // Slumpa confetti-bitar en gång
  const confetti = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      dur: 2.5 + Math.random() * 2.5,
      size: 6 + Math.random() * 8,
      blue: Math.random() > 0.5,
      rot: Math.random() * 360,
    })), [])

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-400/70
                    bg-gradient-to-br from-[#006AA7] via-[#0a4d8c] to-[#004b7a] p-5 shadow-2xl">
      <style>{`
        @keyframes hypeConfetti {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(260px) rotate(720deg); opacity: 0; }
        }
        @keyframes hypeShimmer {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        @keyframes hypeWave {
          0%,100% { transform: rotate(-6deg) scale(1); }
          50%     { transform: rotate(6deg) scale(1.08); }
        }
        @keyframes hypeBounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(-14px) rotate(180deg); }
        }
        @keyframes hypePulse {
          0%,100% { text-shadow: 0 0 8px rgba(255,221,0,0.6); }
          50%     { text-shadow: 0 0 22px rgba(255,221,0,1), 0 0 40px rgba(255,221,0,0.5); }
        }
        @keyframes hypePop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .hype-reduce { animation: none !important; }
      `}</style>

      {/* Confetti-lager */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map(c => (
          <span key={c.id}
            style={{
              position: 'absolute',
              top: '-10px',
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.size * 0.6}px`,
              background: c.blue ? '#006AA7' : '#FFCD00',
              borderRadius: '2px',
              transform: `rotate(${c.rot}deg)`,
              animation: `hypeConfetti ${c.dur}s linear ${c.delay}s infinite`,
            }} />
        ))}
      </div>

      {/* Skimmer-svep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 w-1/3"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            animation: 'hypeShimmer 3.5s ease-in-out infinite',
          }} />
      </div>

      <div className="relative z-10">
        {/* Rubrik */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl inline-block" style={{ animation: 'hypeWave 1.4s ease-in-out infinite', transformOrigin: 'bottom left' }}>
            🇸🇪
          </span>
          <span className="font-display text-2xl sm:text-3xl tracking-wide text-yellow-300"
            style={{ animation: 'hypePulse 1.6s ease-in-out infinite' }}>
            DAGS FÖR SVERIGE!
          </span>
          <span className="text-2xl inline-block ml-auto" style={{ animation: 'hypeBounce 1s ease-in-out infinite' }}>
            ⚽
          </span>
        </div>

        <div className="text-sm text-yellow-100/80 mb-4 italic">
          {home === 'Sverige'
            ? 'Vi spelar hemma – ge järnet, heja blågult! 💛💙'
            : 'Hela Sverige håller andan – nu kör vi! 💛💙'}
        </div>

        {/* Matchen */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 bg-black/20 rounded-xl py-4 px-3"
          style={{ animation: 'hypePop 0.6s ease-out' }}>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-4xl">{home === 'Sverige' ? '🇸🇪' : flagOf(home)}</span>
            <span className={`font-bold text-center ${home === 'Sverige' ? 'text-yellow-300' : 'text-white'}`}>
              {home || '?'}
            </span>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <span className="text-yellow-400 font-display text-2xl">VS</span>
            <span className="text-yellow-200 font-bold text-lg mt-1">{time}</span>
            {tv && <span className="text-[10px] text-white/60 mt-0.5">{tv}</span>}
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-4xl">{away === 'Sverige' ? '🇸🇪' : flagOf(away)}</span>
            <span className={`font-bold text-center ${away === 'Sverige' ? 'text-yellow-300' : 'text-white'}`}>
              {away || '?'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Liten flagg-hjälp så komponenten klarar sig själv (samma som FLAG i Schedule)
function flagOf(t) {
  const F = {
    'Sverige':'🇸🇪','Frankrike':'🇫🇷','Brasilien':'🇧🇷','Tyskland':'🇩🇪','Spanien':'🇪🇸',
    'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹','Argentina':'🇦🇷','Nederländerna':'🇳🇱','Belgien':'🇧🇪',
    'Kroatien':'🇭🇷','Japan':'🇯🇵','Marocko':'🇲🇦','Norge':'🇳🇴','Paraguay':'🇵🇾',
    'Ecuador':'🇪🇨','Österrike':'🇦🇹','Senegal':'🇸🇳','Algeriet':'🇩🇿','Kap Verde':'🇨🇻',
    'Egypten':'🇪🇬','Ghana':'🇬🇭','Colombia':'🇨🇴','Schweiz':'🇨🇭','Australien':'🇦🇺',
    'USA':'🇺🇸','Mexiko':'🇲🇽','Kanada':'🇨🇦','Sydafrika':'🇿🇦','Uzbekistan':'🇺🇿',
    'Kongo-Kinshasa':'🇨🇩','Bosnien-Hercegovina':'🇧🇦','Elfenbenskusten':'🇨🇮',
  }
  return F[t] || '🏳️'
}
