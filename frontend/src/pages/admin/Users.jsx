import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users')
      if (res.ok) setUsers(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateRole = async (id, newRole) => {
    const currentITManager = users.find(u => u.role === 'IT Manager')
    if (newRole === 'IT Manager' && currentITManager && currentITManager.id !== id) {
      if (!window.confirm(`Only one IT Manager is allowed.\n\n"${currentITManager.name}" will be demoted to Employee.\n\nProceed?`)) return
    } else {
      if (!window.confirm(`Change role to ${newRole}?`)) return
    }
    try {
      await fetch(`http://localhost:5000/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      fetchUsers()
    } catch (e) {
      alert('Error updating role')
    }
  }

  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return
    try {
      await fetch(`http://localhost:5000/api/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchUsers()
    } catch (e) {
      alert('Error updating status')
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl pt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage system users, roles, permissions, and account states.</p>
        </div>

        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 bg-emerald-50/40 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Registered Users</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full">{users.length} Users</span>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-emerald-50 bg-emerald-50/20">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Loading users...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-b border-emerald-50/60 hover:bg-emerald-50/30 transition">
                    <td className="p-4 font-bold text-slate-900">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="hover:text-emerald-600 hover:underline transition-colors cursor-pointer"
                      >
                        {u.name}
                      </Link>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="p-4">
                      <select 
                        className="border border-emerald-100 rounded-2xl px-3 py-1.5 bg-emerald-50/30 text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 text-xs"
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                      >
                        <option value="Employee">Employee</option>
                        <option value="IT Manager">IT Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        u.status === 'Active' ? 'bg-emerald-600 text-white' :
                        u.status === 'Pending' ? 'bg-amber-400 text-white' :
                        'bg-rose-600 text-white'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      {u.status === 'Pending' ? (
                        <button onClick={() => updateStatus(u.id, 'Active')} className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 px-4 py-1.5 rounded-2xl hover:bg-amber-100 transition">
                          ✓ Approve
                        </button>
                      ) : u.status === 'Active' ? (
                        <button onClick={() => updateStatus(u.id, 'Suspended')} className="text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 px-4 py-1.5 rounded-2xl hover:bg-rose-100 transition">Suspend</button>
                      ) : (
                        <button onClick={() => updateStatus(u.id, 'Active')} className="text-xs font-bold bg-emerald-600 text-white px-4 py-1.5 rounded-2xl hover:bg-emerald-700 transition">Activate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Users
