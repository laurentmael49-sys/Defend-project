import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed.')
        setLoading(false)
        return
      }

      // Save user + token to AuthContext (persisted in localStorage)
      login(data.user, data.token)

      // Route to dashboard based on role
      navigate('/dashboard')

    } catch (err) {
      setError('Cannot reach server. Make sure XAMPP and the Node server are running.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 overflow-hidden">

      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/60 blur-[100px]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-200/60 blur-[100px]"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-10 w-full max-w-[420px] shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30">A</div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">Asset<span className="text-indigo-600">Manager</span></span>
            </div>
            <p className="text-[13px] font-medium text-slate-500 tracking-wide">Assets Management Portal</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email address</label>
              <input
                type="email" required
                className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password" required
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm"
                placeholder="Enter Your Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="flex items-center text-sm">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded-sm border-gray-300 text-blue-600 w-4 h-4 bg-gray-50" />
                Remember me
              </label>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#203456] hover:bg-[#162540] text-white text-sm font-medium py-3 rounded mt-6 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="pt-4 text-center">
              <Link to="/register" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">
                Don't have an account? Register Here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login