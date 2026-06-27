// Profilbilder – importeras så Vite buntar och hashar dem.
import martin from '../assets/avatars/martin.jpg'
import martha from '../assets/avatars/martha.jpg'
import linn from '../assets/avatars/linn.jpg'
import sebbe from '../assets/avatars/sebbe.jpg'
import maths from '../assets/avatars/maths.jpg'
import anette from '../assets/avatars/anette.jpg'
import sebnastian from '../assets/avatars/sebnastian.jpg'
import jonas from '../assets/avatars/jonas.jpg'
import tim from '../assets/avatars/tim.jpg'
import kalle from '../assets/avatars/kalle.jpg'

// Nyckel = användarnamn i gemener
const AVATARS = {
  martin, martha, linn, sebbe, maths, anette, sebnastian, jonas, tim, kalle,
}

export function avatarFor(username) {
  if (!username) return null
  return AVATARS[username.toLowerCase()] || null
}

// Återanvändbar cirkelavatar. Faller tillbaka på initial om bild saknas.
export function Avatar({ username, size = 32, ring = false, className = '' }) {
  const src = avatarFor(username)
  const dim = { width: size, height: size }
  const ringCls = ring ? 'ring-2 ring-gold-500/60' : ''
  if (src) {
    return (
      <img
        src={src}
        alt={username || ''}
        style={dim}
        className={`rounded-full object-cover shrink-0 ${ringCls} ${className}`}
      />
    )
  }
  // Fallback: initial i cirkel
  const initial = (username || '?').charAt(0).toUpperCase()
  return (
    <div
      style={dim}
      className={`rounded-full shrink-0 flex items-center justify-center
                  bg-pitch-600 text-white/70 font-bold ${ringCls} ${className}`}>
      <span style={{ fontSize: size * 0.45 }}>{initial}</span>
    </div>
  )
}
