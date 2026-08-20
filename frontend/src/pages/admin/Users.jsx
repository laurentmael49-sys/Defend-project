import { useState, useEffect } from 'react'

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
    if (!window.confirm(`Change role to ${newRole}?`)) return
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
    <div className="min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">User Management</h1>
        <p className="mt-1 text-slate-500 font-medium">Manage permissions and account states.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <h2 className="text-xl font-bold text-slate-900">Registered Users</h2>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading users...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <select 
                      className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="Employee">Employee</option>
                      <option value="IT Manager">IT Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.status === 'Active' ? (
                      <button onClick={() => updateStatus(u.id, 'Suspended')} className="text-xs font-bold bg-rose-50 text-rose-600 px-4 py-2 rounded-lg hover:bg-rose-100 border border-rose-200 transition">Suspend</button>
                    ) : (
                      <button onClick={() => updateStatus(u.id, 'Active')} className="text-xs font-bold bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition">Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users
