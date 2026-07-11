import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy } from 'lucide-react'
import { Avatar } from '../lib/avatars'

const FLAG = t => ({
  'Sverige':'🇸🇪','Frankrike':'🇫🇷','Brasilien':'🇧🇷','Tyskland':'🇩🇪','Spanien':'🇪🇸',
  'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Portugal':'🇵🇹','Argentina':'🇦🇷','Nederländerna':'🇳🇱','Belgien':'🇧🇪',
  'Kroatien':'🇭🇷','Japan':'🇯🇵','Marocko':'🇲🇦','Norge':'🇳🇴','Paraguay':'🇵🇾',
  'Ecuador':'🇪🇨','Österrike':'🇦🇹','Senegal':'🇸🇳','Algeriet':'🇩🇿','Kap Verde':'🇨🇻',
  'Egypten':'🇪🇬','Ghana':'🇬🇭','Colombia':'🇨🇴','Schweiz':'🇨🇭','Australien':'🇦🇺',
  'USA':'🇺🇸','Mexiko':'🇲🇽','Kanada':'🇨🇦','Sydafrika':'🇿🇦','Uzbekistan':'🇺🇿',
  'Kongo-Kinshasa':'🇨🇩','Bosnien-Hercegovina':'🇧🇦','Elfenbenskusten':'🇨🇮',
}[t] || '🏳️')

const ptColor = p => p === 5 ? 'text-emerald-400' : p >= 3 ? 'text-green-400' : p >= 1 ? 'text-yellow-400' : 'text-red-400'
const ptBg = p => p === 5 ? 'bg-emerald-500/15' : p >= 3 ? 'bg-green-500/15' : p >= 1 ? 'bg-yellow-500/15' : 'bg-red-500/10'

export default function RecapPopup({ matches, onClose }) {
  const [idx, setIdx] = useState(0) // för intro-animationen

  // Lås scroll bakom modalen
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!matches?.length) return null

  const count = matches.length

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col
                     bg-pitch-900 border border-gold-500/40 rounded-3xl shadow-2xl"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}>

          {/* Header */}
          <div className="relative shrink-0 px-5 py-4 bg-gradient-to-r from-gold-900/40 to-pitch-800 border-b border-pitch-700">
            <button onClick={onClose}
              className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <h2 className="font-display text-2xl text-gold-400 tracking-wide">Det här missade du!</h2>
                <p className="text-white/50 text-xs mt-0.5">
                  {count === 1 ? '1 match spelad' : `${count} matcher spelade`} sedan du var här sist
                </p>
              </div>
            </div>
          </div>

          {/* Matcher */}
          <div className="overflow-y-auto px-4 py-4 space-y-4">
            {matches.map((m, mi) => {
              const sorted = [...(m.tips || [])].sort((a, b) => b.points - a.points)
              const topP = sorted.length ? sorted[0].points : 0
              return (
                <motion.div key={m.matchId}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mi * 0.12 }}
                  className="bg-pitch-800 border border-pitch-700 rounded-2xl overflow-hidden">
                  {/* Resultat */}
                  <div className="px-4 py-3 bg-gradient-to-r from-pitch-700/60 to-pitch-800">
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{m.round}</div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-1 text-right font-medium text-white/90 text-sm truncate">
                        {m.homeTeam} <span className="text-lg">{FLAG(m.homeTeam)}</span>
                      </div>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: mi * 0.12 + 0.15, type: 'spring' }}
                        className="shrink-0 font-display text-2xl text-gold-400 px-3 py-1 bg-black/30 rounded-xl">
                        {m.homeGoals}–{m.awayGoals}
                      </motion.div>
                      <div className="flex-1 text-left font-medium text-white/90 text-sm truncate">
                        <span className="text-lg">{FLAG(m.awayTeam)}</span> {m.awayTeam}
                      </div>
                    </div>
                  </div>

                  {/* Allas tips + poäng */}
                  <div className="p-3 space-y-1.5">
                    {sorted.map((t, ti) => (
                      <motion.div key={t.username}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mi * 0.12 + 0.2 + ti * 0.05 }}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${ptBg(t.points)}`}>
                        <Avatar username={t.username} size={26} />
                        <span className="flex-1 text-sm text-white/80 truncate">{t.username}</span>
                        <span className="text-sm text-white/50 tabular-nums">{t.homeGoals}–{t.awayGoals}</span>
                        <span className={`text-sm font-bold w-8 text-right ${ptColor(t.points)}`}>
                          {t.points}p
                        </span>
                        {t.points === topP && topP > 0 && <Trophy size={13} className="text-gold-400 shrink-0" />}
                      </motion.div>
                    ))}
                    {sorted.length === 0 && (
                      <div className="text-center text-white/30 text-xs py-2">Ingen tippade denna match</div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-3 border-t border-pitch-700">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gold-500 text-pitch-900 font-bold hover:bg-gold-400 transition-colors">
              Till topplistan →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
