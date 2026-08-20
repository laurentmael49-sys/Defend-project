import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const SystemSettings = () => {
  const { user, login } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // ── Profile state ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' })
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' })

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  const token = localStorage.getItem('token')

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg({ text: '', type: '' })
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone })
      })
      const data = await res.json()
      if (res.ok) {
        login({ ...user, name: data.user.name, email: data.user.email, phone: data.user.phone }, token)
        setProfileMsg({ text: '✅ Profile updated successfully!', type: 'success' })
      } else {
        setProfileMsg({ text: data.error || 'Failed to update profile.', type: 'error' })
      }
    } catch {
      setProfileMsg({ text: 'Network error.', type: 'error' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMsg({ text: 'Passwords do not match.', type: 'error' }); return
    }
    if (passwords.newPassword.length < 6) {
      setPwMsg({ text: 'Password must be at least 6 characters.', type: 'error' }); return
    }
    setPwLoading(true)
    setPwMsg({ text: '', type: '' })
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, phone: user.phone, password: passwords.newPassword })
      })
      if (res.ok) {
        setPwMsg({ text: '✅ Password changed successfully!', type: 'success' })
        setPasswords({ newPassword: '', confirmPassword: '' })
      } else {
        const err = await res.json()
        setPwMsg({ text: err.error || 'Failed to change password.', type: 'error' })
      }
    } catch {
      setPwMsg({ text: 'Network error.', type: 'error' })
    } finally {
      setPwLoading(false)
    }
  }

  // ── Categories state ───────────────────────────────────────
  const [categories, setCategories] = useState([])
  const [newCat, setNewCat] = useState('')
  const [catLoading, setCatLoading] = useState(true)

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch (e) { console.error(e) }
    finally { setCatLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCat.trim()) return
    try {
      await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCat })
      })
      setNewCat('')
      fetchCategories()
    } catch (e) { alert('Failed to add category') }
  }

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await fetch(`http://localhost:5000/api/categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (e) { alert('Failed to delete category') }
  }

  // ── Backup ─────────────────────────────────────────────────
  const downloadBackup = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/backup?user_id=${user.id}`)
      if (!res.ok) throw new Error('Backup failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `defend_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error downloading backup: ' + e.message)
    }
  }

  // ── Tab config ─────────────────────────────────────────────
  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'categories', label: '🏷️ Categories', icon: '🏷️' },
    { id: 'backup', label: '🛡️ Data & Backup', icon: '🛡️' },
  ]

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="mt-1 text-slate-500 font-medium">Manage your profile, security, categories, and system data.</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-5 py-2.5 font-bold transition text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Profile ─────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
          <div className="px-8 pb-8">
            <div className="-mt-12 mb-6 flex items-end justify-between">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-indigo-600 select-none">
                {initials}
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-purple-100 text-purple-700 border-purple-200 mb-2">
                {user?.role}
              </span>
            </div>

            {profileMsg.text && (
              <div className={`mb-6 p-4 rounded-xl border font-medium text-sm ${
                profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>{profileMsg.text}</div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <input type="tel" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input type="email" required value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                />
                <p className="text-xs text-slate-400 mt-1.5">📧 Must be unique — no other account can use the same email.</p>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={profileLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2">
                  {profileLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : '💾 Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB: Security ────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h2 className="text-xl font-bold text-amber-900">Change Password</h2>
              <p className="text-sm text-amber-700/70 mt-0.5">Set a new secure password for your account.</p>
            </div>
          </div>
          <div className="p-8">
            {pwMsg.text && (
              <div className={`mb-6 p-4 rounded-xl border font-medium text-sm ${
                pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>{pwMsg.text}</div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">New Password <span className="text-rose-500">*</span></label>
                  <input type="password" required minLength={6} value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 font-medium text-slate-800 transition"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password <span className="text-rose-500">*</span></label>
                  <input type="password" required value={passwords.confirmPassword}
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
                <button type="submit" disabled={pwLoading || (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2">
                  {pwLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</> : '🔐 Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB: Categories ──────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
            <h2 className="text-xl font-bold text-indigo-900">🏷️ Asset Categories</h2>
            <p className="text-sm text-indigo-700/70 mt-1">Manage dropdown options for inventory.</p>
          </div>
          <div className="p-6">
            <form onSubmit={addCategory} className="flex gap-3 mb-6">
              <input type="text" placeholder="New Category Name..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                value={newCat} onChange={e => setNewCat(e.target.value)}
              />
              <button type="submit" className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-md">Add</button>
            </form>
            {catLoading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
            ) : categories.length === 0 ? (
              <p className="text-slate-400 text-center py-8 font-medium">No categories yet. Add one above!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map(c => (
                  <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition">
                    <span className="font-bold text-slate-700 text-sm">{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-rose-600 font-bold transition text-lg leading-none">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Data & Backup ───────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-rose-50/50">
            <h2 className="text-xl font-bold text-rose-900">🛡️ Security & Data</h2>
            <p className="text-sm text-rose-700/70 mt-1">Manage backups and critical system operations.</p>
          </div>
          <div className="p-6">
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Database Backup</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">Export a complete JSON snapshot of all system tables (Users, Assets, Loans, Audits).</p>
              </div>
              <button onClick={downloadBackup}
                className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition shadow-lg shrink-0 flex items-center gap-2">
                Download .json 📥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Info Footer */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
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

export default SystemSettings
