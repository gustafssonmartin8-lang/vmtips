import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Trophy, Calendar, Users, Star, ShieldCheck, LogOut } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const links = [
    { to: '/mina-tips',  label: 'Mina Tips',  icon: Star },
    { to: '/alla-tips',  label: 'Alla Tips',  icon: Users },
    { to: '/schema',     label: 'Schema',     icon: Calendar },
    { to: '/topplista',  label: 'Topplista',  icon: Trophy },
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 bg-pitch-900/95 backdrop-blur border-b border-pitch-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="text-3xl">⚽</span>
            <div>
              <div className="font-display text-xl text-gold-400 leading-none tracking-wide">VM-TIPS</div>
              <div className="text-xs text-white/40 leading-none">2026 • USA / KAN / MEX</div>
            </div>
          </NavLink>

          {/* Nav links – desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={16} />{label}
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-3">
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

        {/* Mobile bottom nav */}
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
