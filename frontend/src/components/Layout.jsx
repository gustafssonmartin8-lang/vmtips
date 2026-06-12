import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Trophy, Calendar, Users, Star, ShieldCheck, LogOut, ChevronDown, BarChart2 } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, activeGroup, setActiveGroup, logout } = useAuth()
  const navigate = useNavigate()
  const [groupOpen, setGroupOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const links = [
    { to: '/mina-tips',  label: 'Mina Tips',  icon: Star },
    { to: '/alla-tips',  label: 'Alla Tips',  icon: Users },
    { to: '/schema',     label: 'Schema',     icon: Calendar },
    { to: '/topplista',  label: 'Topplista',  icon: Trophy },
    { to: '/statistik',  label: 'Statistik',  icon: BarChart2 },
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ]

  const groups = user?.groups || []
  const multiGroup = groups.length > 1

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-pitch-900/95 backdrop-blur border-b border-pitch-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-3xl">⚽</span>
            <div>
              <div className="font-display text-xl text-gold-400 leading-none tracking-wide">VM-TIPS</div>
              <div className="text-xs text-white/40 leading-none">2026 • USA / KAN / MEX</div>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={16} />{label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Group selector */}
            {multiGroup && (
              <div className="relative">
                <button
                  onClick={() => setGroupOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pitch-700
                             border border-pitch-600 hover:border-grass-500 transition-colors text-sm">
                  <span className="text-grass-400 font-medium">{activeGroup?.name || 'Välj grupp'}</span>
                  <ChevronDown size={14} className="text-white/40" />
                </button>
                <AnimatePresence>
                {groupOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-1 bg-pitch-800 border border-pitch-600
                               rounded-xl overflow-hidden shadow-xl z-50 min-w-32">
                    {groups.map(g => (
                      <button key={g.id}
                        onClick={() => { setActiveGroup(g); setGroupOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pitch-700 transition-colors
                          ${activeGroup?.id === g.id ? 'text-gold-400 font-bold' : 'text-white/70'}`}>
                        {g.name}
                        {activeGroup?.id === g.id && ' ✓'}
                      </button>
                    ))}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            )}

            {!multiGroup && activeGroup && (
              <span className="hidden sm:block text-xs px-2.5 py-1 rounded-lg bg-pitch-700 text-grass-400 font-medium border border-pitch-600">
                {activeGroup.name}
              </span>
            )}

            <span className="text-sm text-white/60 hidden sm:block">
              👋 <span className="text-white font-medium">{user?.username}</span>
              {user?.isAdmin && <span className="ml-1 badge bg-gold-500/20 text-gold-400">Admin</span>}
            </span>
            <button onClick={handleLogout}
              className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3">
              <LogOut size={14} />Logga ut
            </button>
          </div>
        </div>

        <nav className="md:hidden flex border-t border-pitch-700 bg-pitch-900">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors
                 ${isActive ? 'text-gold-400' : 'text-white/40 hover:text-white/70'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Group banner for mobile */}
      {multiGroup && (
        <div className="md:hidden bg-pitch-800 border-b border-pitch-700 px-4 py-2 flex gap-2">
          {groups.map(g => (
            <button key={g.id}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${activeGroup?.id === g.id
                  ? 'bg-gold-500 text-pitch-900'
                  : 'bg-pitch-700 text-white/50'}`}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>

      <footer className="text-center text-white/20 text-xs py-4 border-t border-pitch-800">
        VM-Tips 2026 🏆 USA · Kanada · Mexiko
      </footer>
    </div>
  )
}
