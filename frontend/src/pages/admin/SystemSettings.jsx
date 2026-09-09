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
        setProfileMsg({ text: 'Profile updated successfully!', type: 'success' })
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
        setPwMsg({ text: 'Password changed successfully!', type: 'success' })
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
    const filename = `asset_manager_backup_${new Date().toISOString().split('T')[0]}.json`
    let handle = null

    if ('showSaveFilePicker' in window) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] },
          }],
        })
      } catch (err) {
        if (err.name === 'AbortError') return // User cancelled file picker dialog
      }
    }

    try {
      const res = await fetch(`http://localhost:5000/api/backup?user_id=${user.id}`)
      if (!res.ok) throw new Error('Backup failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

      if (handle) {
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error downloading backup: ' + e.message)
    }
  }

  // ── Tab config ─────────────────────────────────────────────
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'categories', label: 'Categories' },
    { id: 'backup', label: 'Data & Backup' },
  ]

  return (
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto pt-16 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage administrative configurations, categories, backups, and profile options.</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-emerald-100 pb-3 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-5 py-2.5 font-bold transition text-xs whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-500 hover:bg-emerald-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Profile ─────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500" />
            <div className="px-8 pb-8">
              <div className="-mt-12 mb-6 flex items-end justify-between">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-white select-none">
                  {initials}
                </div>
                <span className="text-xs font-black px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider mb-2">
                  {user?.role}
                </span>
              </div>

              {profileMsg.text && (
                <div className="mb-6 p-4 rounded-2xl border font-bold text-xs bg-emerald-50 text-slate-900 border-emerald-200">{profileMsg.text}</div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input type="text" required value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input type="tel" value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={profileLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-2xl font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50">
                    {profileLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB: Security ────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
            <div className="p-6 border-b border-emerald-50 bg-emerald-50/40">
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Set a new secure password for your account.</p>
            </div>
            <div className="p-8">
              {pwMsg.text && (
                <div className="mb-6 p-4 rounded-2xl border font-bold text-xs bg-emerald-50 text-slate-900 border-emerald-200">{pwMsg.text}</div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">New Password *</label>
                    <input type="password" required minLength={6} value={passwords.newPassword}
                      onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                    <input type="password" required value={passwords.confirmPassword}
                      onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-slate-800 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={pwLoading || (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold text-xs transition shadow-md disabled:opacity-50">
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB: Categories ──────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
            <div className="p-6 border-b border-emerald-50 bg-emerald-50/40">
              <h2 className="text-base font-bold text-slate-900">Asset Categories</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage dropdown options for inventory categorization.</p>
            </div>
            <div className="p-6">
              <form onSubmit={addCategory} className="flex gap-3 mb-6">
                <input type="text" placeholder="New Category Name..."
                  className="flex-1 px-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 text-xs font-medium text-slate-800"
                  value={newCat} onChange={e => setNewCat(e.target.value)}
                />
                <button type="submit" className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-emerald-700 transition shadow-md text-xs">Add Category</button>
              </form>
              {catLoading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>
              ) : categories.length === 0 ? (
                <p className="text-slate-400 text-center py-8 font-medium text-xs">No categories yet. Add one above!</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {categories.map(c => (
                    <div key={c.id} className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                      <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                      <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-slate-900 font-bold transition text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Data & Backup ───────────────────────────── */}
        {activeTab === 'backup' && (
          <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
            <div className="p-6 border-b border-emerald-50 bg-emerald-50/40">
              <h2 className="text-base font-bold text-slate-900">Security & Data Backup</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Export system records and database backups.</p>
            </div>
            <div className="p-6">
              <div className="border border-emerald-100 rounded-2xl p-6 bg-emerald-50/20 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Database Backup</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">Export a complete JSON snapshot of all system tables (Users, Assets, Loans, Audits).</p>
                </div>
                <button onClick={downloadBackup}
                  className="bg-slate-900 text-white font-bold px-6 py-3 rounded-2xl hover:bg-slate-800 transition shadow-md shrink-0 text-xs">
                  Download .json Backup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Info Footer */}
        <div className="mt-8 bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
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

export default SystemSettings
