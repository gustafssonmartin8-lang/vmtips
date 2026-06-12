import { createContext, useContext, useState } from 'react'
import api, { saveAuth, getSavedUser, clearAuth } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSavedUser())

  const [activeGroup, setActiveGroupState] = useState(() => {
    const saved = localStorage.getItem('vmtips_group')
    if (saved) return JSON.parse(saved)
    const u = getSavedUser()
    if (u?.groups?.length > 0) return u.groups[0]
    return null
  })

  const setActiveGroup = (group) => {
    localStorage.setItem('vmtips_group', JSON.stringify(group))
    setActiveGroupState(group)
  }

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    saveAuth(data)
    setUser(data)
    if (data.groups?.length > 0) {
      setActiveGroup(data.groups[0])
    }
    return data
  }

  const logout = () => {
    clearAuth()
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
