import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

      login(data.user, data.token)
      navigate('/dashboard')

    } catch (err) {
      setError('Cannot reach server. Make sure the Node server is running.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-emerald-50/30 overflow-hidden font-sans">

      {/* Decorative ambient glows */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-200/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-200/50 blur-[120px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl border border-emerald-100 rounded-3xl p-10 w-full max-w-[440px] shadow-xl shadow-emerald-950/5">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-500/25">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Asset<span className="text-emerald-600 font-light">Manager</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Enterprise Management Portal</p>
          </div>

          {error && (
            <div className="bg-emerald-50 text-emerald-900 p-3.5 rounded-2xl mb-6 text-xs font-semibold text-center border border-emerald-200 shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">Email address</label>
              <input
                type="email" required
                className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required
                  className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 pr-12"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                <input type="checkbox" className="rounded-md border-emerald-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                Remember me
              </label>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 disabled:opacity-50 mt-4"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="pt-4 text-center">
              <Link to="/register" className="text-xs text-emerald-600 hover:text-emerald-800 font-bold transition">
                Don't have an account? <span className="underline decoration-emerald-200 underline-offset-4">Register Here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login