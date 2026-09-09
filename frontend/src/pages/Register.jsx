import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Employee'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.first_name || !formData.email || !formData.password) {
      setError('First name, email and password are required.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed.')
      } else {
        setSuccess(
          formData.role === 'IT Manager'
            ? 'Account submitted! Awaiting Admin approval before you can log in.'
            : 'Account created successfully! Redirecting to login...'
        )
        if (formData.role === 'Employee') setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      setError('Cannot reach server. Make sure the Node server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-emerald-50/30 overflow-hidden py-12 font-sans">
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-200/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-200/50 blur-[120px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl border border-emerald-100 rounded-3xl p-10 w-full max-w-[540px] shadow-xl shadow-emerald-950/5">

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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Create New User Account</p>
          </div>

          {error && (
            <div className="bg-emerald-50 text-emerald-950 p-3.5 rounded-2xl mb-6 text-xs font-semibold text-center border border-emerald-200 shadow-sm">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-100 text-emerald-950 p-3.5 rounded-2xl mb-6 text-xs font-bold text-center border border-emerald-300 shadow-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First Name & Last Name side by side */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">First Name *</label>
                <input
                  type="text" name="first_name" required
                  className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="John"
                  value={formData.first_name} onChange={handleChange}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text" name="last_name"
                  className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Doe"
                  value={formData.last_name} onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Email *</label>
              <input
                type="email" name="email" required
                className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="your@email.com"
                value={formData.email} onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Password *</label>
              <input
                type="password" name="password" required
                className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••••••"
                value={formData.password} onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="tel" name="phone"
                className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="+237 675898801"
                value={formData.phone} onChange={handleChange}
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">I am registering as *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'Employee' })}
                  className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                    formData.role === 'Employee'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/20'
                      : 'border-emerald-100 bg-emerald-50/30 text-slate-500 hover:border-emerald-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'IT Manager' })}
                  className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                    formData.role === 'IT Manager'
                      ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm shadow-teal-500/20'
                      : 'border-emerald-100 bg-emerald-50/30 text-slate-500 hover:border-emerald-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  IT Manager
                </button>
              </div>
              {formData.role === 'IT Manager' && (
                <div className="mt-2.5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-amber-800">Your account will be <span className="font-black">Pending Approval</span>. You can only access the app once the System Admin approves your IT Manager role.</p>
                </div>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div className="pt-4 text-center">
              <Link to="/login" className="text-xs text-emerald-600 hover:text-emerald-800 font-bold transition">
                Already have an account? <span className="underline decoration-emerald-200 underline-offset-4">Log In</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
