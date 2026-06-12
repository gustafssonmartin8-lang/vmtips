import { createContext, useContext, useState } from 'react'
import api from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('vmtips_user')
    return s ? JSON.parse(s) : null
  })
  const [activeGroup, setActiveGroupState] = useState(() => {
    const s = localStorage.getItem('vmtips_group')
    return s ? JSON.parse(s) : null
  })

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('vmtips_token', data.token)
    localStorage.setItem('vmtips_user', JSON.stringify(data))
    setUser(data)
    // Auto-select first group
    if (data.groups?.length > 0) {
      setActiveGroup(data.groups[0])
    }
    return data
  }

  const setActiveGroup = (group) => {
    localStorage.setItem('vmtips_group', JSON.stringify(group))
    setActiveGroupState(group)
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
