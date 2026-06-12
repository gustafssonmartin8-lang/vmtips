import { createContext, useContext, useState } from 'react'
import api from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('vmtips_user')
    return s ? JSON.parse(s) : null
  })

  const [activeGroup, setActiveGroupState] = useState(() => {
    // Try saved group first
    const saved = localStorage.getItem('vmtips_group')
    if (saved) return JSON.parse(saved)
    // Fall back to first group from saved user
    const u = localStorage.getItem('vmtips_user')
    if (u) {
      const parsed = JSON.parse(u)
      if (parsed.groups?.length > 0) return parsed.groups[0]
    }
    return null
  })

  const setActiveGroup = (group) => {
    localStorage.setItem('vmtips_group', JSON.stringify(group))
    setActiveGroupState(group)
  }

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('vmtips_token', data.token)
    localStorage.setItem('vmtips_user', JSON.stringify(data))
    setUser(data)
    // Always set first group on login
    if (data.groups?.length > 0) {
      setActiveGroup(data.groups[0])
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('vmtips_token')
    localStorage.removeItem('vmtips_user')
    localStorage.removeItem('vmtips_group')
    setUser(null)
    setActiveGroupState(null)
  }

  return (
    <AuthCtx.Provider value={{ user, activeGroup, setActiveGroup, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)

