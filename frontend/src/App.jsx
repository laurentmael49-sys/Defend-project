import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Loans from './pages/Loans'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Navbar from './components/Navbar'
import Users from './pages/admin/Users'
import SystemSettings from './pages/admin/SystemSettings'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  
  if (!user) return <Navigate to="/login" />
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 w-full pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Private Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/loans" element={<PrivateRoute><Loans /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute allowedRoles={['Admin', 'IT Manager']}><Reports /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<PrivateRoute allowedRoles={['Admin']}><Users /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute allowedRoles={['Admin']}><SystemSettings /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App