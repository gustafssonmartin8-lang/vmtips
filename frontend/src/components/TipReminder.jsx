import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'

// Visar en banner om användaren har otippade, ännu olåsta matcher,
// med nedräkning till nästa låsning (matchens/rondens första avspark).
export default function TipReminder({ matches = [], tippedIds = new Set() }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000 * 30) // uppdatera var 30:e sek
    return () => clearInterval(t)
  }, [])

  // Otippade matcher som har lag och inte är låsta
  const untipped = matches.filter(m =>
    m.homeTeam && m.awayTeam && !m.isLocked && !tippedIds.has(m.id)
  )
  if (untipped.length === 0) return null

  // Närmaste låsningstid bland otippade matcher
  const lockTimes = untipped
    .map(m => (m.locksAt ? new Date(m.locksAt).getTime() : null))
    .filter(t => t && t > now)
    .sort((a, b) => a - b)
  const nextLock = lockTimes[0] || null

  let countdown = null
  if (nextLock) {
    const diff = nextLock - now
    const h = Math.floor(diff / 3.6e6)
    const m = Math.floor((diff % 3.6e6) / 6e4)
    countdown = h > 0 ? `${h} tim ${m} min` : `${m} min`
  }

  const urgent = nextLock && (nextLock - now) < 3 * 3.6e6 // under 3 tim

  return (
    <Link to="/mina-tips"
      className={`block rounded-2xl border px-4 py-3 transition-colors
        ${urgent
          ? 'bg-red-900/30 border-red-600/50 hover:border-red-500'
          : 'bg-gold-500/10 border-gold-500/40 hover:border-gold-500/70'}`}>
      <div className="flex items-center gap-3">
        <div className={`shrink-0 ${urgent ? 'text-red-400' : 'text-gold-400'}`}>
          {urgent ? <AlertTriangle size={22} /> : <Clock size={22} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold ${urgent ? 'text-red-300' : 'text-gold-300'}`}>
            Du har {untipped.length} otippad{untipped.length === 1 ? ' match' : 'e matcher'}
          </div>
          {countdown && (
            <div className="text-sm text-white/60">
              Nästa låsning om <span className="font-semibold text-white/80">{countdown}</span>
            </div>
          )}
        </div>
        <div className={`shrink-0 text-sm font-bold ${urgent ? 'text-red-300' : 'text-gold-400'}`}>
          Tippa nu →
        </div>
      </div>
    </Link>
  )
}
