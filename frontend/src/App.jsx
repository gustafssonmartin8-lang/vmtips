import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import MyTips from './pages/MyTips'
import AllTips from './pages/AllTips'
import Schedule from './pages/Schedule'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import Stats from './pages/Stats'
import Achievements from './pages/Achievements'
import Groups from './pages/Groups'
import Dashboard from './pages/Dashboard'
import Bracket from './pages/Bracket'
import Snack from './pages/Snack'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="mina-tips"   element={<MyTips />} />
            <Route path="alla-tips"   element={<AllTips />} />
            <Route path="schema"      element={<Schedule />} />
            <Route path="topplista"   element={<Leaderboard />} />
            <Route path="admin"       element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="statistik"   element={<Stats />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="grupper"      element={<Groups />} />
            <Route path="slutspel"     element={<Bracket />} />
            <Route path="snack"        element={<Snack />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
