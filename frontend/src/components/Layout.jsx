import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../lib/avatars'
import { Trophy, Calendar, Users, Star, ShieldCheck, LogOut, ChevronDown, BarChart2, Award, Menu, X, Grid3x3, GitBranch, Home } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Layout() {
  const { user, activeGroup, setActiveGroup, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [groupOpen, setGroupOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  const links = [
    { to: '/',            label: 'Hem',        icon: Home, exact: true },
    { to: '/mina-tips',   label: 'Mina Tips',  icon: Star },
    { to: '/alla-tips',   label: 'Alla Tips',  icon: Users },
    { to: '/schema',      label: 'Schema',     icon: Calendar },
    { to: '/topplista',   label: 'Topplista',  icon: Trophy },
    { to: '/statistik',   label: 'Statistik',  icon: BarChart2 },
    { to: '/achievements',label: 'Märken',     icon: Award },
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ]

  const groups = user?.groups || []
  const multiGroup = groups.length > 1

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-pitch-900/95 backdrop-blur border-b border-pitch-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">⚽</span>
            <div className="hidden sm:block">
              <div className="font-display text-lg text-gold-400 leading-none tracking-wide">VM-TIPS</div>
              <div className="text-xs text-white/40 leading-none">2026</div>
            </div>
            <div className="sm:hidden font-display text-lg text-gold-400">VM-TIPS</div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                   ${isActive ? 'text-gold-400 bg-pitch-700' : 'text-white/60 hover:text-white hover:bg-pitch-700/50'}`}>
                <Icon size={15} />{label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Group selector */}
            {multiGroup && (
              <div className="relative">
                <button onClick={() => setGroupOpen(o => !o)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pitch-700
                             border border-pitch-600 hover:border-grass-500 transition-colors text-sm">
                  <span className="text-grass-400 font-medium text-xs">{activeGroup?.name || 'Grupp'}</span>
                  <ChevronDown size={12} className="text-white/40" />
                </button>
                <AnimatePresence>
                  {groupOpen && (
                    <motion.div
                      initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                      className="absolute right-0 top-full mt-1 bg-pitch-800 border border-pitch-600
                                 rounded-xl overflow-hidden shadow-xl z-50 min-w-28">
                      {groups.map(g => (
                        <button key={g.id} onClick={() => { setActiveGroup(g); setGroupOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pitch-700 transition-colors
                            ${activeGroup?.id === g.id ? 'text-gold-400 font-bold' : 'text-white/70'}`}>
                          {g.name} {activeGroup?.id === g.id && '✓'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Username – desktop only */}
            <span className="text-sm text-white/50 hidden xl:flex items-center gap-2">
              <Avatar username={user?.username} size={30} ring />
              <span className="text-white font-medium">{user?.username}</span>
              {user?.isAdmin && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400">Admin</span>}
            </span>

            {/* Avatar only – desktop lg..xl (full name shows from xl) */}
            <span className="hidden lg:flex xl:hidden">
              <Avatar username={user?.username} size={30} ring />
            </span>

            {/* Logout – desktop */}
            <button onClick={handleLogout}
              className="hidden lg:flex items-center gap-1.5 border border-pitch-600 hover:border-red-500/50
                         text-white/50 hover:text-red-400 text-xs py-1.5 px-3 rounded-xl transition-all">
              <LogOut size={13} />Logga ut
            </button>

            {/* Avatar – mobile/tablet (next to hamburger) */}
            <span className="lg:hidden">
              <Avatar username={user?.username} size={30} ring />
            </span>

            {/* Hamburger – mobile/tablet */}
            <button onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl bg-pitch-700 hover:bg-pitch-600 transition-colors">
              {menuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity:0, height:0 }}
              animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }}
              className="lg:hidden overflow-hidden border-t border-pitch-700 bg-pitch-900">

              {/* User info */}
              <div className="px-4 py-3 border-b border-pitch-800 flex items-center justify-between">
                <span className="text-white font-medium flex items-center gap-2">
                  <Avatar username={user?.username} size={32} ring />
                  {user?.username}
                  {user?.isAdmin && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400">Admin</span>}
                </span>
                {multiGroup && (
                  <div className="flex gap-1.5">
                    {groups.map(g => (
                      <button key={g.id} onClick={() => setActiveGroup(g)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                          ${activeGroup?.id === g.id ? 'bg-gold-500 text-pitch-900' : 'bg-pitch-700 text-white/50'}`}>
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nav links */}
              <div className="px-3 py-3 grid grid-cols-2 gap-1.5">
                {links.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all
                       ${isActive ? 'bg-gold-500/20 text-gold-400' : 'bg-pitch-800 text-white/60 hover:text-white hover:bg-pitch-700'}`}>
                    <Icon size={16} />{label}
                  </NavLink>
                ))}
              </div>

              {/* Logout */}
              <div className="px-3 pb-3">
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             bg-red-900/20 border border-red-800/40 text-red-400 text-sm hover:bg-red-900/40 transition-all">
                  <LogOut size={15} />Logga ut
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.25 }}>
          <Outlet />
        </motion.div>
      </main>

      <footer className="text-center text-white/20 text-xs py-4 border-t border-pitch-800">
        VM-Tips 2026 🏆 USA · Kanada · Mexiko
      </footer>
    </div>
  )
}
