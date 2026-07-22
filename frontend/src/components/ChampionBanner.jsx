import { useMemo } from 'react'
import { Avatar } from '../lib/avatars'

// Guldkonfetti-banner som firar vinnaren när sido-facit är ifyllt
// (= turneringen är avgjord). Hanterar delad seger.
export default function ChampionBanner({ winners = [], points }) {
  const confetti = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      dur: 2.8 + Math.random() * 2.5,
      size: 6 + Math.random() * 9,
      gold: Math.random() > 0.35,
      rot: Math.random() * 360,
    })), [])

  if (!winners.length) return null
  const shared = winners.length > 1

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-gold-400/80
                    bg-gradient-to-br from-[#3d2e00] via-[#5c4500] to-[#2a1f00] p-5 shadow-2xl">
      <style>{`
        @keyframes champConfetti {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(240px) rotate(720deg); opacity: 0; }
        }
        @keyframes champGlow {
          0%,100% { text-shadow: 0 0 10px rgba(255,215,0,0.7); transform: scale(1); }
          50%     { text-shadow: 0 0 26px rgba(255,215,0,1), 0 0 50px rgba(255,215,0,0.5); transform: scale(1.04); }
        }
        @keyframes champTrophy {
          0%,100% { transform: rotate(-8deg); }
          50%     { transform: rotate(8deg); }
        }
      `}</style>

      {/* Konfetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map(c => (
          <span key={c.id}
            style={{
              position: 'absolute', top: '-10px', left: `${c.left}%`,
              width: `${c.size}px`, height: `${c.size * 0.6}px`,
              background: c.gold ? '#FFD700' : '#ffffff',
              borderRadius: '2px', transform: `rotate(${c.rot}deg)`,
              animation: `champConfetti ${c.dur}s linear ${c.delay}s infinite`,
            }} />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <div className="text-4xl inline-block mb-1" style={{ animation: 'champTrophy 1.3s ease-in-out infinite' }}>🏆</div>
        <div className="font-display text-2xl sm:text-3xl tracking-widest text-yellow-300"
          style={{ animation: 'champGlow 1.8s ease-in-out infinite' }}>
          {shared ? 'VM-TIPS MÄSTARE (DELAD SEGER)!' : 'VM-TIPS MÄSTARE!'}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
          {winners.map(w => (
            <div key={w} className="flex flex-col items-center gap-1.5">
              <Avatar username={w} size={64} ring />
              <span className="font-bold text-yellow-200 text-lg">{w}</span>
            </div>
          ))}
        </div>

        {points != null && (
          <div className="text-yellow-100/70 text-sm mt-2">
            {points} poäng · Turneringen är avgjord 🎉
          </div>
        )}
      </div>
    </div>
  )
}
