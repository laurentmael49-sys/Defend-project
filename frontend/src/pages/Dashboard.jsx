import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const getLoanStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'ongoing', badge: 'ACTIVE', badgeColor: 'bg-emerald-100 text-emerald-700' }
  const end = new Date(endDateStr)
  const today = new Date()
  end.setHours(0,0,0,0); today.setHours(0,0,0,0)
  
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { status: 'overdue', badge: 'OVERDUE', badgeColor: 'bg-rose-100 text-rose-700' }
  if (diffDays === 0) return { status: 'soon', badge: 'DUE TODAY', badgeColor: 'bg-amber-100 text-amber-700' }
  if (diffDays <= 7) return { status: 'soon', badge: 'EXPIRING SOON', badgeColor: 'bg-amber-100 text-amber-700' }
  return { status: 'ok', badge: 'ACTIVE', badgeColor: 'bg-emerald-100 text-emerald-700' }
}

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  // IT Manager / Admin state
  const [assets, setAssets] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [allLoans, setAllLoans] = useState([])
  
  // Admin specific state
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  // Employee state
  const [myLoans, setMyLoans] = useState([])
  const [myRequests, setMyRequests] = useState([])

  useEffect(() => {
    if (user?.role === 'Employee') {
      fetchEmployeeData()
    } else if (user?.role === 'IT Manager') {
      fetchManagerData()
    } else if (user?.role === 'Admin') {
      fetchAdminData()
    }
  }, [user])

  const fetchEmployeeData = async () => {
    setLoading(true)
    try {
      const [loansRes, requestsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/loans?user_id=${user.id}`),
        fetch(`http://localhost:5000/api/requests?user_id=${user.id}`)
      ])
      if (loansRes.ok) setMyLoans(await loansRes.json())
      if (requestsRes.ok) setMyRequests(await requestsRes.json())
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const fetchManagerData = async () => {
    setLoading(true)
    try {
      const [assetsRes, requestsRes, loansRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/requests'),
        fetch('http://localhost:5000/api/loans'),
      ])
      if (assetsRes.ok) setAssets(await assetsRes.json())
      if (requestsRes.ok) setPendingRequests((await requestsRes.json()).filter(r => r.status === 'Pending'))
      if (loansRes.ok) setAllLoans(await loansRes.json())
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [assetsRes, usersRes, loansRes, auditRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/loans'),
        fetch('http://localhost:5000/api/audit'),
      ])
      if (assetsRes.ok) setAssets(await assetsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (loansRes.ok) setAllLoans(await loansRes.json())
      if (auditRes.ok) setAuditLogs(await auditRes.json())
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  // ── EMPLOYEE VIEW ──────────────────────────────────────────────────
  if (user?.role === 'Employee') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome, {user.name} 👋</h1>
            <p className="mt-1 text-slate-500 font-medium">Your personalized equipment dashboard.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Active Loans */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <h2 className="text-xl font-bold text-indigo-900">My Active Loans</h2>
                </div>
                <Link to="/loans" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline">View All →</Link>
              </div>
              <div className="p-6">
                {loading ? <Spinner /> : myLoans.filter(l => !l.returned).length === 0 ? (
                  <EmptyState message="You currently have no active loans." />
                ) : (
                  <div className="space-y-3">
                    {myLoans.filter(l => !l.returned).map(loan => (
                      <LoanCard key={loan.id} loan={loan} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* My Requests */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <h2 className="text-xl font-bold text-blue-900">Request Status</h2>
                </div>
                <Link to="/inventory" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline">New Request +</Link>
              </div>
              <div className="p-6">
                {loading ? <Spinner /> : myRequests.length === 0 ? (
                  <EmptyState message="You have no requests yet." />
                ) : (
                  <div className="space-y-3">
                    {myRequests.map(req => (
                      <div key={req.id} className="border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-800">{req.asset_name}</h3>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="text-sm text-slate-500"><strong>Reason:</strong> {req.reason}</p>
                        <p className="text-xs text-slate-400 mt-2">Requested: {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ADMIN VIEW ──────────────────────────────────────────────
  if (user?.role === 'Admin') {
    const totalAssets = assets.length
    const activeLoans = allLoans.filter(l => !l.returned).length
    const activeUsers = users.filter(u => u.status === 'Active').length
    
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Super User Dashboard</h1>
            <p className="mt-1 text-slate-500 font-medium">System-wide metrics and comprehensive audit logs.</p>
          </div>
          
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Total Assets" value={loading ? '…' : totalAssets} color="blue" icon="🗄️" to="/inventory" />
            <StatCard title="Active Loans" value={loading ? '…' : activeLoans} color="yellow" icon="📤" to="/loans" />
            <StatCard title="Total Users" value={loading ? '…' : users.length} color="green" icon="👥" to="/admin/users" />
            <StatCard title="Active Users" value={loading ? '…' : activeUsers} color="emerald" icon="✅" to="/admin/users" />
          </div>

          {/* Live Audit Log - Terminal Style */}
          <div className="rounded-xl shadow-2xl overflow-hidden flex flex-col bg-slate-900 border border-slate-800">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900 z-10 relative">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs text-slate-400 font-mono">system-audit-stream.log</span>
            </div>
            
            <div className="bg-slate-900 font-mono text-sm text-slate-300 relative h-[500px] overflow-y-auto">
              <div className="sticky top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-10"></div>
              {loading ? (
                <div className="p-6 flex justify-center"><Spinner /></div>
              ) : auditLogs.length === 0 ? (
                <div className="p-6 text-slate-500 text-center">No activity recorded yet.</div>
              ) : (
                <div className="p-6 pt-2 space-y-3 pb-8">
                  {auditLogs.map(log => {
                    let colorClass = "text-blue-400"
                    const action = log.action.toLowerCase()
                    if (action.includes("reject") || action.includes("delete") || action.includes("fail") || action.includes("error")) colorClass = "text-red-400"
                    else if (action.includes("update") || action.includes("edit") || action.includes("loan") || action.includes("warn")) colorClass = "text-yellow-400"
                    else if (action.includes("approve") || action.includes("add") || action.includes("create") || action.includes("success") || action.includes("return")) colorClass = "text-green-400"
                    
                    return (
                      <div key={log.id} className="flex space-x-3 hover:bg-slate-800/50 p-1 -mx-1 rounded transition group">
                        <span className="text-slate-500 shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                        <span className={`${colorClass} font-bold shrink-0 w-24 group-hover:text-white transition`}>{log.action.toUpperCase()}</span>
                        <span className="text-slate-300"><span className="text-slate-400 font-semibold">{log.user_name || 'System'}</span> — {log.details}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── IT MANAGER VIEW ────────────────────────────────────────
  const total = assets.length
  const available = assets.filter(a => a.status === 'available').length
  const loaned = assets.filter(a => a.status === 'loaned').length
  const maintenance = assets.filter(a => a.status === 'maintenance').length
  const overdueLoans = allLoans.filter(l => {
    if (l.returned || !l.end_date) return false
    return new Date(l.end_date) < new Date()
  })

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-500 font-medium">System overview — Welcome back, <strong>{user?.name}</strong>.</p>
        </div>

        {/* Overdue alert banner */}
        {overdueLoans.length > 0 && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-rose-800">{overdueLoans.length} Overdue Loan{overdueLoans.length > 1 ? 's' : ''}</p>
              <p className="text-sm text-rose-600 font-medium">Items past their return date — check the Loans page.</p>
            </div>
            <Link to="/loans" className="ml-auto bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-rose-700 transition shrink-0">View Loans →</Link>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total Assets" value={loading ? '…' : total} color="blue" icon="🗄️" to="/inventory" />
          <StatCard title="Available" value={loading ? '…' : available} color="green" icon="✅" to="/inventory" />
          <StatCard title="On Loan" value={loading ? '…' : loaned} color="yellow" icon="📤" to="/loans" />
          <StatCard title="Maintenance" value={loading ? '…' : maintenance} color="red" icon="🔧" to="/inventory" />
          <StatCard title="Overdue" value={loading ? '…' : overdueLoans.length} color="rose" icon="⚠️" to="/loans" />
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">

          {/* Pending Requests Queue */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <h2 className="text-xl font-bold text-slate-900">Pending Requests</h2>
              </div>
              {pendingRequests.length > 0 && (
                <span className="bg-amber-100 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-200">
                  {pendingRequests.length} pending
                </span>
              )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-80">
              {loading ? <Spinner /> : pendingRequests.length === 0 ? (
                <EmptyState message="No pending requests. All caught up! 🎉" />
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="border border-amber-100 bg-amber-50/30 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-900">{req.asset_name}</p>
                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-sm text-slate-600">By <strong>{req.user_name}</strong> — {req.reason}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Link to="/loans" className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                          Review in Loans →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Loans */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <h2 className="text-xl font-bold text-slate-900">Recent Loans</h2>
            </div>
            <div className="overflow-y-auto max-h-80 flex-1">
              {loading ? <div className="p-6"><Spinner /></div> : allLoans.length === 0 ? (
                <div className="p-6"><EmptyState message="No loans recorded yet." /></div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Return</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {allLoans.slice(0, 8).map(loan => {
                      const overdue = !loan.returned && loan.end_date && new Date(loan.end_date) < new Date()
                      return (
                        <tr key={loan.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="px-5 py-3 font-bold text-slate-800">{loan.asset_name}</td>
                          <td className="px-5 py-3 text-slate-600">{loan.user_name}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{loan.end_date ? new Date(loan.end_date).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-3">
                            {loan.returned ? (
                              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">Returned</span>
                            ) : overdue ? (
                              <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Overdue</span>
                            ) : (
                              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Active</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared Sub-components ─────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
)

const EmptyState = ({ message }) => (
  <p className="text-slate-400 text-sm font-medium text-center py-8">{message}</p>
)

const LoanCard = ({ loan }) => {
  const status = getLoanStatus(loan.end_date)
  return (
  <div className="border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition bg-white">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-bold text-slate-800">{loan.asset_name}</h3>
      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${status.badgeColor}`}>{status.badge}</span>
    </div>
    <p className="text-sm text-slate-500"><strong>Category:</strong> {loan.category}</p>
    <p className="text-sm text-slate-500"><strong>Reason:</strong> {loan.reason || 'N/A'}</p>
    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-50 text-xs font-medium">
      <span className="text-slate-500">From: {new Date(loan.start_date).toLocaleDateString()}</span>
      <span className={status.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}>Return: {loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'Indefinite'}</span>
    </div>
  </div>
)}

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

const StatCard = ({ title, value, color, icon, to }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    red: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  }
  
  const CardContent = (
    <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]} flex flex-col justify-center relative transition-colors h-full cursor-pointer`}>
      {icon && <span className="absolute top-3 right-4 text-lg opacity-60">{icon}</span>}
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider opacity-80">{title}</p>
      <p className="text-4xl font-black tracking-tight">{value}</p>
    </div>
  )
  
  return to ? <Link to={to} className="block h-full">{CardContent}</Link> : CardContent
}

export default Dashboard