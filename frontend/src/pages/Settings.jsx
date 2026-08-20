import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Settings = () => {
  const { user, login } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' })

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  const token = localStorage.getItem('token')

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone })
      })
      const data = await res.json()
      if (res.ok) {
        login({ ...user, name: data.user.name, email: data.user.email, phone: data.user.phone }, token)
        setMessage({ text: '✅ Profile updated successfully!', type: 'success' })
      } else {
        setMessage({ text: data.error || 'Failed to update profile.', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Network error. Make sure the server is running.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMessage({ text: 'Passwords do not match.', type: 'error' })
      return
    }
    if (passwords.newPassword.length < 6) {
      setPwMessage({ text: 'Password must be at least 6 characters.', type: 'error' })
      return
    }
    setPwLoading(true)
    setPwMessage({ text: '', type: '' })
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, phone: user.phone, password: passwords.newPassword })
      })
      if (res.ok) {
        setPwMessage({ text: '✅ Password changed successfully!', type: 'success' })
        setPasswords({ newPassword: '', confirmPassword: '' })
      } else {
        const err = await res.json()
        setPwMessage({ text: err.error || 'Failed to change password.', type: 'error' })
      }
    } catch {
      setPwMessage({ text: 'Network error. Make sure the server is running.', type: 'error' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="mt-1 text-slate-500 font-medium">Manage your personal information and security.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 relative" />

        {/* Avatar */}
        <div className="px-8 pb-8">
          <div className="-mt-12 mb-6 flex items-end justify-between">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-indigo-600 select-none">
              {initials}
            </div>
            <div className="text-right mb-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                user?.role === 'Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                user?.role === 'IT Manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border font-medium text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                placeholder="your@email.com"
              />
              <p className="text-xs text-slate-400 mt-1.5">📧 Must be unique — no other account can use the same email.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : '💾 Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h2 className="text-xl font-bold text-amber-900">Change Password</h2>
            <p className="text-sm text-amber-700/70 mt-0.5">Set a new secure password for your account.</p>
          </div>
        </div>
        <div className="p-8">
          {pwMessage.text && (
            <div className={`mb-6 p-4 rounded-xl border font-medium text-sm ${
              pwMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {pwMessage.text}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwords.newPassword}
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 font-medium text-slate-800 transition"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 font-medium text-slate-800 transition ${
                    passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-amber-100'
                  }`}
                  placeholder="Repeat new password"
                />
                {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                  <p className="text-xs text-rose-500 font-medium mt-1.5">⚠️ Passwords don't match</p>
                )}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={pwLoading || (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {pwLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                ) : '🔐 Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
        </div>
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
            <p className="font-bold text-slate-800">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
            <p className="font-bold text-slate-800 truncate">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
            <p className="font-bold text-slate-800">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
            <p className="font-bold text-slate-800">{user?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Settings
