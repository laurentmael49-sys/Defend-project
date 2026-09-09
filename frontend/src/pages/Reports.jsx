import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const Reports = () => {
  const [assets, setAssets] = useState([])
  const [loans, setLoans] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [assetsRes, loansRes, requestsRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/loans'),
        fetch('http://localhost:5000/api/requests'),
      ])
      if (assetsRes.ok) setAssets(await assetsRes.json())
      if (loansRes.ok) setLoans(await loansRes.json())
      if (requestsRes.ok) setRequests(await requestsRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Generate Live Alerts ─────────────────────────────────────
  const buildAlerts = () => {
    const alerts = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Overdue loans
    loans.filter(l => !l.returned && l.end_date).forEach(loan => {
      const end = new Date(loan.end_date)
      end.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((today - end) / (1000 * 60 * 60 * 24))
      if (diffDays > 0) {
        alerts.push({
          id: `overdue-${loan.id}`,
          type: 'critical',
          message: `${loan.asset_name} is overdue by ${diffDays} day${diffDays > 1 ? 's' : ''} — loaned to ${loan.user_name}`,
          time: `Due: ${new Date(loan.end_date).toLocaleDateString()}`,
          action: 'View Loans',
          to: '/loans',
        })
      }
    })

    // 2. Loans due within 3 days
    loans.filter(l => !l.returned && l.end_date).forEach(loan => {
      const end = new Date(loan.end_date)
      end.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 3) {
        alerts.push({
          id: `due-soon-${loan.id}`,
          type: 'warning',
          message: `${loan.asset_name} is due ${diffDays === 0 ? 'today' : `in ${diffDays} day${diffDays > 1 ? 's' : ''}`} — ${loan.user_name}`,
          time: `Return: ${new Date(loan.end_date).toLocaleDateString()}`,
          action: 'View Loans',
          to: '/loans',
        })
      }
    })

    // 3. Pending requests
    const pending = requests.filter(r => r.status === 'Pending')
    if (pending.length > 0) {
      alerts.push({
        id: 'pending-requests',
        type: 'info',
        message: `${pending.length} pending loan request${pending.length > 1 ? 's' : ''} awaiting review`,
        time: `Latest: ${new Date(pending[0].created_at).toLocaleDateString()}`,
        action: 'Review',
        to: '/loans',
      })
    }

    // 4. Maintenance assets
    const maintenance = assets.filter(a => a.status === 'maintenance')
    if (maintenance.length > 0) {
      alerts.push({
        id: 'maintenance',
        type: 'warning',
        message: `${maintenance.length} asset${maintenance.length > 1 ? 's' : ''} currently under maintenance`,
        time: 'Inventory update needed',
        action: 'View Inventory',
        to: '/inventory',
      })
    }

    return alerts
  }

  const liveAlerts = buildAlerts()
  const criticalCount = liveAlerts.filter(a => a.type === 'critical').length
  const warningCount = liveAlerts.filter(a => a.type === 'warning').length

  const statusCounts = { available: 0, loaned: 0, maintenance: 0 }
  assets.forEach(m => { if (statusCounts[m.status] !== undefined) statusCounts[m.status]++ })
  const total = assets.length

  const catValues = {}
  assets.forEach(m => { catValues[m.category] = (catValues[m.category] || 0) + Number(m.price || 0) })
  const totalValue = Object.values(catValues).reduce((a, b) => a + b, 0)

  const statusLabels = { available: 'Available', loaned: 'On Loan', maintenance: 'Maintenance' }
  const statusColors = { available: 'bg-emerald-600', loaned: 'bg-teal-500', maintenance: 'bg-amber-500' }
  const catColors = { Computer: '#059669', Monitor: '#0d9488', Phone: '#10b981', Network: '#14b8a6', Peripheral: '#34d399', Furniture: '#2dd4bf' }

  const exportReport = async () => {
    const filename = `asset_manager_report_${new Date().toISOString().split('T')[0]}.csv`
    let handle = null

    if ('showSaveFilePicker' in window) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'CSV Report File',
            accept: { 'text/csv': ['.csv'] },
          }],
        })
      } catch (err) {
        if (err.name === 'AbortError') return // User cancelled file picker dialog
      }
    }

    setExporting(true)
    try {
      const [assetsRes, loansRes, requestsRes] = await Promise.all([
        fetch('http://localhost:5000/api/assets'),
        fetch('http://localhost:5000/api/loans'),
        fetch('http://localhost:5000/api/requests')
      ])
      const assetsData = assetsRes.ok ? await assetsRes.json() : []
      const loansData = loansRes.ok ? await loansRes.json() : []
      const requestsData = requestsRes.ok ? await requestsRes.json() : []

      const toCSV = (headers, rows) => [
        headers.join(','),
        ...rows.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const fullCsv =
        '=== ASSETS ===\n' + toCSV(['id', 'name', 'category', 'status'], assetsData) +
        '\n\n=== LOANS ===\n' + toCSV(['id', 'asset_name', 'user_name', 'start_date', 'end_date', 'returned', 'reason'], loansData) +
        '\n\n=== REQUESTS ===\n' + toCSV(['id', 'asset_name', 'user_name', 'status', 'reason', 'start_date', 'end_date', 'created_at'], requestsData)

      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' })

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
      alert('Failed to export report: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const alertRowStyle = {
    critical: { row: 'bg-rose-50/50 border-b border-rose-100', text: 'text-rose-700 font-bold', badge: 'bg-rose-100 text-rose-700' },
    warning:  { row: 'bg-amber-50/50 border-b border-amber-100', text: 'text-amber-800 font-semibold', badge: 'bg-amber-100 text-amber-800' },
    info:     { row: 'bg-emerald-50/50 border-b border-emerald-100', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' },
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl pt-16">

        {/* Header */}
        <div className="mb-8 rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-950/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports & Alerts</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Live overview of your asset status, system notifications, and financial value distribution.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 border border-emerald-100 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={exportReport}
              disabled={exporting}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-bold text-white transition hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV Report'}
            </button>
          </div>
        </div>

        {/* Live Alerts Center */}
        <div className="mb-8 rounded-3xl border border-emerald-100 bg-white/90 shadow-lg shadow-emerald-950/5 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 flex flex-wrap justify-between items-center gap-3 bg-emerald-50/40">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">Active Alerts</h2>
              {!loading && (
                <span className="text-[11px] text-slate-400 font-medium">Live · Auto-refreshes every 30s</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="bg-rose-100 text-rose-700 font-extrabold px-3 py-1 rounded-full text-[10px]">
                  {criticalCount} Overdue
                </span>
              )}
              {warningCount > 0 && (
                <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full text-[10px]">
                  {warningCount} Warnings
                </span>
              )}
              {liveAlerts.length === 0 && !loading && (
                <span className="bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full text-[10px]">
                  All Clear
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : liveAlerts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-900 font-bold text-base">No active alerts</p>
              <p className="text-slate-400 text-xs mt-1">Everything looks good — no overdue loans or pending issues.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-emerald-50 bg-emerald-50/20">
                  <th className="px-5 py-3">Alert</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Time / Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {liveAlerts.map(alert => {
                  const style = alertRowStyle[alert.type]
                  return (
                    <tr key={alert.id} className={`last:border-0 transition ${style.row}`}>
                      <td className="px-5 py-4">
                        <p className={style.text}>{alert.message}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell text-slate-400 text-xs">{alert.time}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={alert.to}
                          className="rounded-xl border border-emerald-100 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 shadow-sm inline-block"
                        >
                          {alert.action} →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Charts / Reports */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-lg shadow-emerald-950/5">
              <h2 className="mb-8 text-lg font-bold text-slate-900 tracking-tight">Asset Status Distribution</h2>
              <div className="space-y-6">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const pct = Math.round((count / total) * 100) || 0
                  return (
                    <div key={status}>
                      <div className="mb-2 flex justify-between items-end">
                        <span className="font-bold text-xs text-slate-700">{statusLabels[status]}</span>
                        <span className="font-extrabold text-slate-900 text-xs">{count} units <span className="text-slate-400 font-medium ml-1">({pct}%)</span></span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-emerald-50 border border-emerald-100">
                        <div className={`h-full ${statusColors[status]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-lg shadow-emerald-950/5 flex flex-col">
              <h2 className="mb-8 text-lg font-bold text-slate-900 tracking-tight">Total Value by Category</h2>
              <div className="space-y-6 flex-grow">
                {Object.entries(catValues).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                  const pct = Math.round((val / totalValue) * 100) || 0
                  return (
                    <div key={cat}>
                      <div className="mb-2 flex justify-between items-end">
                        <span className="font-bold text-xs text-slate-700">{cat}</span>
                        <span className="font-extrabold text-slate-900 text-xs">{val.toLocaleString()} FCFA <span className="text-slate-400 font-medium ml-1">({pct}%)</span></span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-emerald-50 border border-emerald-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: catColors[cat] || '#059669' }} />
                      </div>
                    </div>
                  )
                })}
                {Object.keys(catValues).length === 0 && (
                  <p className="text-slate-400 text-xs font-semibold">No priced assets found in inventory.</p>
                )}
              </div>
              <div className="flex justify-between items-center border-t border-emerald-50 pt-6 mt-6">
                <span className="text-slate-400 font-black uppercase tracking-wider text-xs">Total Inventory Value</span>
                <span className="text-xl font-black text-emerald-600">{totalValue.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports