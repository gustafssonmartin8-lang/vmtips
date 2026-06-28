import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../lib/avatars'
import { Send, Trash2, Smile } from 'lucide-react'

const EMOJIS = ['👍', '😂', '🔥', '😮', '❤️', '😭', '⚽', '🤡']

function timeAgo(iso) {
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'nyss'
  if (s < 3600) return `${Math.floor(s / 60)} min sedan`
  if (s < 86400) return `${Math.floor(s / 3600)} tim sedan`
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Snack() {
  const { user, activeGroup } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [pickerFor, setPickerFor] = useState(null)
  const bottomRef = useRef(null)

  const groupId = activeGroup?.id || 1

  const load = async (scroll = false) => {
    try {
      const r = await api.get(`/comments?groupId=${groupId}`)
      setComments(r.data)
      if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      console.error('Kunde inte ladda kommentarer', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
    const t = setInterval(load, 20000) // uppdatera var 20:e sek
    return () => clearInterval(t)
  }, [groupId])

  const post = async () => {
    const t = text.trim()
    if (!t || posting) return
    setPosting(true)
    try {
      await api.post('/comments', { groupId, text: t })
      setText('')
      await load(true)
    } catch (e) {
      console.error('Kunde inte posta', e)
    }
    setPosting(false)
  }

  const react = async (commentId, emoji) => {
    setPickerFor(null)
    // optimistisk uppdatering
    setComments(cs => cs.map(c => {
      if (c.id !== commentId) return c
      const existing = c.reactions.find(r => r.emoji === emoji)
      let reactions
      if (existing) {
        const count = existing.count + (existing.mine ? -1 : 1)
        reactions = count <= 0
          ? c.reactions.filter(r => r.emoji !== emoji)
          : c.reactions.map(r => r.emoji === emoji ? { ...r, count, mine: !r.mine } : r)
      } else {
        reactions = [...c.reactions, { emoji, count: 1, mine: true }]
      }
      return { ...c, reactions }
    }))
    try { await api.post(`/comments/${commentId}/react`, { emoji }) }
    catch (e) { console.error('Reaktion misslyckades', e); load() }
  }

  const remove = async (id) => {
    setComments(cs => cs.filter(c => c.id !== id))
    try { await api.delete(`/comments/${id}`) }
    catch (e) { console.error('Kunde inte radera', e); load() }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-gold-400 tracking-wide">Snack</h1>
        <p className="text-white/40 text-sm mt-0.5">{activeGroup?.name} · snacka skit & heja fram</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Laddar...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-white/30 py-10">
          Inga inlägg ännu – var först med att skriva något! 🎤
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {comments.map(c => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-pitch-800 border border-pitch-700 rounded-2xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <Avatar username={c.username} size={36} ring={c.mine} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${c.mine ? 'text-gold-400' : 'text-white'}`}>
                        {c.username}
                      </span>
                      <span className="text-xs text-white/30">{timeAgo(c.createdAt)}</span>
                      {(c.mine || user?.isAdmin) && (
                        <button onClick={() => remove(c.id)}
                          className="ml-auto text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-white/80 text-sm mt-0.5 break-words whitespace-pre-wrap">{c.text}</p>

                    {/* Reaktioner */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {c.reactions.map(r => (
                        <button key={r.emoji} onClick={() => react(c.id, r.emoji)}
                          className={`text-xs rounded-full px-2 py-0.5 border transition-colors
                            ${r.mine
                              ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                              : 'bg-pitch-700 border-pitch-600 text-white/60 hover:border-pitch-500'}`}>
                          {r.emoji} {r.count}
                        </button>
                      ))}
                      <div className="relative">
                        <button onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}
                          className="text-white/30 hover:text-white/60 transition-colors p-0.5">
                          <Smile size={16} />
                        </button>
                        {pickerFor === c.id && (
                          <div className="absolute z-10 bottom-7 left-0 bg-pitch-900 border border-pitch-600
                                          rounded-xl p-1.5 flex gap-1 shadow-xl">
                            {EMOJIS.map(e => (
                              <button key={e} onClick={() => react(c.id, e)}
                                className="text-lg hover:scale-125 transition-transform px-0.5">
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Skrivruta */}
      <div className="sticky bottom-3 flex items-end gap-2 bg-pitch-900/90 backdrop-blur
                      border border-pitch-700 rounded-2xl p-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post() } }}
          rows={1}
          maxLength={500}
          placeholder="Skriv något…"
          className="flex-1 bg-transparent resize-none outline-none text-white/90 text-sm px-2 py-1.5
                     placeholder:text-white/30 max-h-32" />
        <button onClick={post} disabled={!text.trim() || posting}
          className="shrink-0 w-9 h-9 rounded-xl bg-gold-500 text-pitch-900 flex items-center
                     justify-center disabled:opacity-30 transition-opacity">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
