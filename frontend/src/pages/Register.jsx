import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
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
        setSuccess('Account created successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      setError('Cannot reach server. Make sure XAMPP and the Node server are running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 overflow-hidden py-12">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/60 blur-[100px]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-200/60 blur-[100px]"></div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-10 w-full max-w-[520px] shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30">A</div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">Asset<span className="text-indigo-600">Manager</span></span>
            </div>
            <p className="text-[15px] font-semibold text-slate-700 tracking-wide mt-2">Create Account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center border border-red-100">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl mb-4 text-sm text-center border border-emerald-100">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First Name & Last Name side by side */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                <input
                  type="text" name="first_name" required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm bg-white/50"
                  placeholder="John"
                  value={formData.first_name} onChange={handleChange}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                <input
                  type="text" name="last_name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm bg-white/50"
                  placeholder="Doe"
                  value={formData.last_name} onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input
                type="email" name="email" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm bg-white/50"
                placeholder="your@email.com"
                value={formData.email} onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password *</label>
              <input
                type="password" name="password" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm bg-white/50"
                placeholder="Enter a password"
                value={formData.password} onChange={handleChange}
              />
            </div>

            {/* Department & Phone side by side */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Department</label>
                <input
                  type="text" name="department"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm bg-white/50"
                  placeholder="e.g. IT, Finance"
                  value={formData.department} onChange={handleChange}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Phone <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="tel" name="phone"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition text-sm bg-white/50"
                  placeholder="+237 675898801"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Role *</label>
              <select
                name="role" required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none transition text-sm text-gray-700 bg-white/50"
                value={formData.role} onChange={handleChange}
              >
                <option value="Employee">Employee</option>
                <option value="IT Manager">IT Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#203456] hover:bg-[#162540] text-white text-sm font-medium py-3 rounded-lg mt-6 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div className="pt-4 text-center">
              <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">
                Already have an account? Log In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
