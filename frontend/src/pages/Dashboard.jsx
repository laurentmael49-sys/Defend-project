import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const getLoanStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'ongoing', badge: 'ACTIVE', badgeColor: 'bg-emerald-600 text-white' }
  const end = new Date(endDateStr)
  const today = new Date()
  end.setHours(0,0,0,0); today.setHours(0,0,0,0)
  
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { status: 'overdue', badge: 'OVERDUE', badgeColor: 'bg-rose-700 text-white border border-rose-800' }
  if (diffDays === 0) return { status: 'soon', badge: 'DUE TODAY', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' }
  if (diffDays <= 7) return { status: 'soon', badge: 'EXPIRING SOON', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300' }
  return { status: 'ok', badge: 'ACTIVE', badgeColor: 'bg-emerald-600 text-white' }
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
      <div className="min-h-screen bg-emerald-50/30 px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="mx-auto max-w-7xl pt-16">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {user.name}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Your personal equipment dashboard.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Active Loans */}
            <div className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg shadow-emerald-950/5 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">My Active Loans</h2>
                <Link to="/loans" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 transition">View All →</Link>
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
            <div className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg shadow-emerald-950/5 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Request Status</h2>
                <Link to="/inventory" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 transition">New Request +</Link>
              </div>
              <div className="p-6">
                {loading ? <Spinner /> : myRequests.length === 0 ? (
                  <EmptyState message="You have no requests yet." />
                ) : (
                  <div className="space-y-3">
                    {myRequests.map(req => (
                      <div key={req.id} className="border border-emerald-100 rounded-2xl p-4 hover:shadow-md transition bg-emerald-50/30">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-900">{req.asset_name}</h3>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="text-xs text-slate-600"><strong>Reason:</strong> {req.reason}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">Requested: {new Date(req.created_at).toLocaleDateString()}</p>
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
      <div className="min-h-screen bg-emerald-50/30 px-4 py-8 sm:px-6 lg:px-8 font-sans">
        <div className="mx-auto max-w-7xl pt-16">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Super User Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">System-wide metrics and real-time operational log.</p>
          </div>
          
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Total Assets" value={loading ? '…' : totalAssets} to="/inventory" />
            <StatCard title="Active Loans" value={loading ? '…' : activeLoans} to="/loans" />
            <StatCard title="Total Users" value={loading ? '…' : users.length} to="/admin/users" />
            <StatCard title="Active Users" value={loading ? '…' : activeUsers} to="/admin/users" />
          </div>

          {/* Live Audit Log Stream */}
          <div className="rounded-3xl shadow-xl shadow-emerald-950/10 overflow-hidden flex flex-col bg-slate-900 border border-slate-800">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-semibold tracking-wider">system-audit-stream.log</span>
            </div>
            
            <div className="bg-slate-900 font-mono text-xs text-slate-200 relative h-[480px] overflow-y-auto">
              {loading ? (
                <div className="p-6 flex justify-center"><Spinner /></div>
              ) : auditLogs.length === 0 ? (
                <div className="p-6 text-slate-500 text-center">No activity recorded yet.</div>
              ) : (
                <div className="p-6 space-y-3">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex space-x-3 hover:bg-slate-800/60 p-2 rounded-xl transition">
                      <span className="text-slate-500 shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                      <span className="text-emerald-400 font-bold shrink-0 w-28 uppercase">{log.action}</span>
                      <span className="text-slate-200"><span className="text-teal-300 font-bold">{log.user_name || 'System'}</span> — {log.details}</span>
                    </div>
                  ))}
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
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl pt-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">System overview — Welcome back, <strong>{user?.name}</strong>.</p>
        </div>

        {/* Overdue alert banner */}
        {overdueLoans.length > 0 && (
          <div className="mb-6 rounded-2xl bg-amber-500 text-white p-4 flex items-center justify-between shadow-lg shadow-amber-500/20">
            <div>
              <p className="font-bold text-sm">{overdueLoans.length} Overdue Loan{overdueLoans.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-100">Equipment is past return date — please inspect Loans queue.</p>
            </div>
            <Link to="/loans" className="bg-white text-amber-900 text-xs font-black px-4 py-2 rounded-xl hover:bg-amber-50 transition shrink-0">
              View Loans →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total Assets" value={loading ? '…' : total} to="/inventory" />
          <StatCard title="Available" value={loading ? '…' : available} to="/inventory" />
          <StatCard title="On Loan" value={loading ? '…' : loaned} to="/loans" />
          <StatCard title="Maintenance" value={loading ? '…' : maintenance} to="/inventory" />
          <StatCard title="Overdue" value={loading ? '…' : overdueLoans.length} to="/loans" />
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">

          {/* Pending Requests Queue */}
          <div className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg shadow-emerald-950/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Pending Requests</h2>
              {pendingRequests.length > 0 && (
                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                  {pendingRequests.length} pending
                </span>
              )}
            </div>
            <div className="p-5 flex-1 overflow-y-auto max-h-80">
              {loading ? <Spinner /> : pendingRequests.length === 0 ? (
                <EmptyState message="No pending requests. All caught up!" />
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-900 text-sm">{req.asset_name}</p>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-xs text-slate-600">By <strong>{req.user_name}</strong> — {req.reason}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Link to="/loans" className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition">
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
          <div className="rounded-3xl border border-emerald-100 bg-white/90 shadow-lg shadow-emerald-950/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Loans</h2>
            </div>
            <div className="overflow-y-auto max-h-80 flex-1">
              {loading ? <div className="p-6"><Spinner /></div> : allLoans.length === 0 ? (
                <div className="p-6"><EmptyState message="No loans recorded yet." /></div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-emerald-50 bg-emerald-50/20">
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Return</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {allLoans.slice(0, 8).map(loan => {
                      const overdue = !loan.returned && loan.end_date && new Date(loan.end_date) < new Date()
                      return (
                        <tr key={loan.id} className="border-b border-emerald-50/60 hover:bg-emerald-50/30 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{loan.asset_name}</td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{loan.user_name}</td>
                          <td className="px-5 py-3.5 text-slate-400 text-[11px]">{loan.end_date ? new Date(loan.end_date).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-3.5">
                            {loan.returned ? (
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">Returned</span>
                            ) : overdue ? (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Overdue</span>
                            ) : (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">Active</span>
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
    <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
  </div>
)

const EmptyState = ({ message }) => (
  <p className="text-slate-400 text-xs font-semibold text-center py-8">{message}</p>
)

const LoanCard = ({ loan }) => {
  const status = getLoanStatus(loan.end_date)
  return (
  <div className="border border-emerald-100 rounded-2xl p-4 hover:shadow-md transition bg-emerald-50/30">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-bold text-slate-900 text-sm">{loan.asset_name}</h3>
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-black ${status.badgeColor}`}>{status.badge}</span>
    </div>
    <p className="text-xs text-slate-600"><strong>Category:</strong> {loan.category}</p>
    <p className="text-xs text-slate-600"><strong>Reason:</strong> {loan.reason || 'N/A'}</p>
    <div className="flex gap-4 mt-3 pt-3 border-t border-emerald-100/60 text-[11px] font-medium text-slate-500">
      <span>From: {new Date(loan.start_date).toLocaleDateString()}</span>
      <span className={status.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>Return: {loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'Indefinite'}</span>
    </div>
  </div>
)}

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    Approved: 'bg-emerald-600 text-white',
    Rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

const StatCard = ({ title, value, to }) => {
  const CardContent = (
    <div className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-950/5 hover:border-emerald-300 hover:shadow-emerald-600/10 flex flex-col justify-center transition-all duration-300 h-full cursor-pointer group">
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition-colors">{title}</p>
      <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
    </div>
  )

  return to ? <Link to={to} className="block h-full">{CardContent}</Link> : CardContent
}

export default Dashboard