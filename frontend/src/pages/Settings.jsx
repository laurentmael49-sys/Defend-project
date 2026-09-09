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
        setMessage({ text: 'Profile updated successfully!', type: 'success' })
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
        setPwMessage({ text: 'Password changed successfully!', type: 'success' })
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
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 pt-16 pb-12">

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personal Profile</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage your personal profile and account credentials.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
          {/* Top Banner */}
          <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500 relative" />

          {/* Avatar */}
          <div className="px-8 pb-8">
            <div className="-mt-12 mb-6 flex items-end justify-between">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-white select-none">
                {initials}
              </div>
              <div className="text-right mb-2">
                <span className="text-xs font-black px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className="mb-6 p-4 rounded-2xl border font-bold text-xs bg-emerald-50 text-slate-900 border-emerald-200">
                {message.text}
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                  placeholder="your@email.com"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-2xl font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 bg-emerald-50/40 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & Password</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Update your password to keep your account safe.</p>
            </div>
          </div>
          <div className="p-8">
            {pwMessage.text && (
              <div className="mb-6 p-4 rounded-2xl border font-bold text-xs bg-emerald-50 text-slate-900 border-emerald-200">
                {pwMessage.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                    placeholder="Repeat new password"
                  />
                  {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1.5">Passwords do not match</p>
                  )}
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={pwLoading || (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold text-xs transition shadow-md disabled:opacity-50"
                >
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 bg-emerald-50/40">
            <h2 className="text-base font-bold text-slate-900">Account Information</h2>
          </div>
          <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
              <p className="font-bold text-slate-900 text-xs">{user?.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email</p>
              <p className="font-bold text-slate-900 text-xs truncate">{user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Role</p>
              <p className="font-bold text-slate-900 text-xs">{user?.role}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone</p>
              <p className="font-bold text-slate-900 text-xs">{user?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">Active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Settings
