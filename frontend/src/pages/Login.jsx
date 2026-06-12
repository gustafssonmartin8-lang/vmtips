import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(username, password)
      navigate('/mina-tips')
    } catch {
      setError('Fel användarnamn eller lösenord')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pitch-900 pitch-bg px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="text-7xl mb-4 inline-block">⚽</motion.div>
          <h1 className="font-display text-5xl text-gold-400 tracking-widest">VM-TIPS</h1>
          <p className="text-white/40 text-sm mt-1">2026 · USA / Kanada / Mexiko</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-5 text-white/80">Logga in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block uppercase tracking-wider">Namn</label>
              <input className="input" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ditt namn" autoFocus />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block uppercase tracking-wider">Lösenord</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 py-3 text-base">
              {loading ? '⏳ Loggar in...' : '⚽ Logga in'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Kontakta Martin om du glömt ditt lösenord
        </p>
      </motion.div>
    </div>
  )
}
