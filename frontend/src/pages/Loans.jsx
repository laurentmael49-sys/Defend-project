import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:5000/api'

const getLoanStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'ongoing', text: 'Ongoing (No due date)', badge: null, color: 'text-slate-500' }
  const end = new Date(endDateStr)
  const today = new Date()
  end.setHours(0,0,0,0); today.setHours(0,0,0,0)
  
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'overdue', text: `${Math.abs(diffDays)} days overdue`, badge: 'OVERDUE', badgeColor: 'bg-rose-700 text-white border-rose-800', color: 'text-rose-600 font-black' }
  } else if (diffDays === 0) {
    return { status: 'soon', text: 'Due today', badge: 'DUE TODAY', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300', color: 'text-amber-700 font-bold' }
  } else if (diffDays <= 7) {
    return { status: 'soon', text: `Expires in ${diffDays} days`, badge: 'EXPIRING SOON', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300', color: 'text-amber-700 font-bold' }
  } else {
    return { status: 'ok', text: `${diffDays} days remaining`, badge: null, color: 'text-emerald-600 font-bold' }
  }
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
})

const Loans = () => {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'IT Manager'
  const isEmployee = user?.role === 'Employee'

  const [activeTab, setActiveTab] = useState('active')
  const [loans, setLoans] = useState([])
  const [requests, setRequests] = useState([])
  const [pendingReturns, setPendingReturns] = useState([])
  const [loading, setLoading] = useState(true)

  const [showHandover, setShowHandover] = useState(null)
  const [showContract, setShowContract] = useState(false)

  // New Secure Loan form state
  const [availableAssets, setAvailableAssets] = useState([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loanForm, setLoanForm] = useState({
    asset_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    signature: ''
  })
  const [formStep, setFormStep] = useState(1)

  // Return request modal state (employee) — tracks phase in diagram
  const [showReturnRequestModal, setShowReturnRequestModal] = useState(null)
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [returnPhase1Result, setReturnPhase1Result] = useState(null) // null | 'ok' | error string

  // Return inspection modal state (admin/IT manager)
  const [showReturnModal, setShowReturnModal] = useState(null)
  const [returnForm, setReturnForm] = useState({ condition: 'available', notes: '' })
  const [inspectionConformityError, setInspectionConformityError] = useState(null) // INVALID state
  const [inspectionResultState, setInspectionResultState] = useState(null) // null | 'ok' | error string
  const [submittingInspection, setSubmittingInspection] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const promises = [
        fetch(`${API}/loans`),
        fetch(`${API}/requests`)
      ]
      if (isAdminOrManager) {
        promises.push(
          fetch(`${API}/loans/pending-returns`, { headers: authHeaders() })
        )
      }

      const results = await Promise.all(promises)
      if (results[0].ok) setLoans(await results[0].json())
      if (results[1].ok) setRequests(await results[1].json())
      if (isAdminOrManager && results[2]?.ok) setPendingReturns(await results[2].json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [isAdminOrManager])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openContractModal = async () => {
    setLoanForm({ asset_id: '', start_date: '', end_date: '', reason: '', signature: '' })
    setFormStep(1)
    setShowContract(true)
    setAssetsLoading(true)
    try {
      const res = await fetch(`${API}/assets`)
      if (res.ok) {
        const data = await res.json()
        setAvailableAssets(data.filter(a => a.status === 'available'))
      }
    } catch (e) {
      console.error('Failed to load assets', e)
    } finally {
      setAssetsLoading(false)
    }
  }

  const submitLoanRequest = async () => {
    if (!loanForm.asset_id || !loanForm.start_date || !loanForm.end_date || !loanForm.reason) {
      alert('Please fill in all required fields.')
      return
    }
    if (!loanForm.signature.trim()) {
      alert('Please type your name as a digital signature to confirm.')
      return
    }
    if (!user?.id) {
      alert('You must be logged in to submit a request.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          asset_id: loanForm.asset_id,
          start_date: loanForm.start_date,
          end_date: loanForm.end_date,
          reason: loanForm.reason
        })
      })
      if (res.ok) {
        setShowContract(false)
        alert('Your loan request has been submitted! An IT Manager will review it shortly.')
        fetchData()
        setActiveTab('requests')
      } else {
        const err = await res.json()
        alert(`Failed to submit request: ${err.error || 'Unknown error'}`)
      }
    } catch (e) {
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Employee: submit a return request (Phase 1 of diagram) ──────────────────
  // Diagram: Send Return Signal Query → DBMS Execute → Process Result → Check Result
  //   NOT OK → Display Error Message  |  OK → Display Pending Return Notification
  const handleSubmitReturnRequest = async () => {
    if (!showReturnRequestModal) return
    setSubmittingReturn(true)
    setReturnPhase1Result(null) // reset result state
    try {
      const res = await fetch(`${API}/loans/${showReturnRequestModal.id}/request-return`, {
        method: 'PATCH',
        headers: authHeaders()
      })
      const data = await res.json()

      // Process Result + Check Result (diagram nodes)
      if (res.ok) {
        setReturnPhase1Result('ok') // → Display Pending Return Notification
        fetchData() // refresh data so IT Manager badge updates
      } else {
        setReturnPhase1Result(data.error || 'Failed to submit return request.') // NOT OK → Display Error
      }
    } catch (e) {
      setReturnPhase1Result('Network error. Please try again.') // NOT OK → Display Error
    } finally {
      setSubmittingReturn(false)
    }
  }

  // ── Admin/IT Manager: approve a return after inspection (Phase 2 of diagram) ─
  // Diagram: Check Conformity → VALID → Send Approval Query → DBMS → Process Result → Check Result
  //   INVALID → Display Error (loop back to form)  |  NOT OK → Display Error  |  OK → Display Success
  const openReturnModal = (loan) => {
    setReturnForm({ condition: 'available', notes: '' })
    setInspectionConformityError(null)
    setInspectionResultState(null)
    setShowReturnModal(loan)
  }

  const handleConfirmReturn = async () => {
    if (!showReturnModal) return

    // ── Check Conformity (diagram node) ─────────────────────────────────────
    if (!returnForm.condition) {
      setInspectionConformityError('Please select the inspected condition of the item.')
      return
    }
    if (returnForm.condition === 'maintenance' && !returnForm.notes.trim()) {
      setInspectionConformityError('Please describe the damage or reason for maintenance in the notes.')
      return
    }
    // Conformity passed — clear any previous error
    setInspectionConformityError(null)
    setInspectionResultState(null)
    setSubmittingInspection(true)

    try {
      // ── Send Approval Query (diagram node) → DBMS ──────────────────────
      const res = await fetch(`${API}/loans/${showReturnModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returned: true,
          asset_id: showReturnModal.asset_id,
          condition: returnForm.condition,
          notes: returnForm.notes,
          admin_user_id: user?.id
        })
      })

      // ── Process Result + Check Result (diagram nodes) ──────────────────
      if (res.ok) {
        setInspectionResultState('ok') // → Display Success Message
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        setInspectionResultState(err.error || 'Failed to process return. Please try again.') // NOT OK
      }
    } catch (e) {
      setInspectionResultState('Network error. Please try again.') // NOT OK
    } finally {
      setSubmittingInspection(false)
    }
  }

  const approveRequest = async (req) => {
    try {
      await fetch(`${API}/requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      })
      await fetch(`${API}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: req.asset_id,
          user_id: req.user_id,
          start_date: req.start_date,
          end_date: req.end_date,
          reason: req.reason
        })
      })
      alert('Request approved and loan issued.')
      fetchData()
    } catch (e) {
      alert('Error approving request.')
    }
  }

  const rejectRequest = async (reqId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return
    try {
      await fetch(`${API}/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      })
      fetchData()
    } catch (e) {
      alert('Error rejecting request.')
    }
  }

  // Filter loans based on role
  const myLoans = isEmployee ? loans.filter(l => l.user_id === user?.id) : loans
  const activeLoans = myLoans.filter(l => !l.returned)
  const historyLoans = myLoans.filter(l => l.returned)
  const pendingRequests = requests.filter(r => r.status === 'Pending')

  const overdueCount = activeLoans.filter(l => {
    if (!l.end_date) return false
    const end = new Date(l.end_date)
    const today = new Date()
    end.setHours(0,0,0,0); today.setHours(0,0,0,0)
    return end < today
  }).length

  return (
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl pt-16">
        
        {/* Overdue Alert Banner */}
        {overdueCount > 0 && (
          <div className="mb-8 rounded-3xl bg-amber-500 text-white p-5 flex items-center gap-4 shadow-xl shadow-amber-500/20 border border-amber-400">
            <div className="bg-white/20 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0">!</div>
            <div>
              <h3 className="font-bold text-sm">Action Required: Overdue Loans</h3>
              <p className="text-amber-100 text-xs font-medium mt-0.5">There {overdueCount === 1 ? 'is' : 'are'} {overdueCount} {overdueCount === 1 ? 'loan' : 'loans'} past return date. Please inspect details below.</p>
            </div>
          </div>
        )}

        {/* Pending Returns Alert (Admin/IT Manager) */}
        {isAdminOrManager && pendingReturns.length > 0 && (
          <div
            className="mb-8 rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-5 flex items-center gap-4 shadow-xl shadow-violet-500/25 border border-violet-500 cursor-pointer hover:opacity-95 transition"
            onClick={() => setActiveTab('pending-returns')}
          >
            <div className="bg-white/20 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0">📦</div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Pending Return Approvals</h3>
              <p className="text-violet-200 text-xs font-medium mt-0.5">
                {pendingReturns.length} {pendingReturns.length === 1 ? 'employee has' : 'employees have'} submitted a return — click to review and approve.
              </p>
            </div>
            <div className="bg-white/20 text-white text-sm font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0">
              {pendingReturns.length}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Loans & Returns</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Track equipment requests, active loans, and completed returns.</p>
          </div>
          {isEmployee && (
            <button 
              onClick={openContractModal}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white transition hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 text-sm"
            >
              + New Secure Loan
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-emerald-100 pb-3">
          <button 
            onClick={() => setActiveTab('active')}
            className={`rounded-2xl px-5 py-2.5 font-bold transition text-xs ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:bg-emerald-50'}`}
          >
            Active Loans ({activeLoans.length})
          </button>
          {isAdminOrManager && (
            <>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`rounded-2xl px-5 py-2.5 font-bold transition text-xs ${activeTab === 'requests' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:bg-emerald-50'} relative`}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black">{pendingRequests.length}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('pending-returns')}
                className={`rounded-2xl px-5 py-2.5 font-bold transition text-xs relative ${activeTab === 'pending-returns' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-500 hover:bg-violet-50'}`}
              >
                Pending Returns
                {pendingReturns.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black">{pendingReturns.length}</span>
                )}
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveTab('history')}
            className={`rounded-2xl px-5 py-2.5 font-bold transition text-xs ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:bg-emerald-50'}`}
          >
            History
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-4">
            
            {/* ACTIVE LOANS OR HISTORY */}
            {(activeTab === 'active' || activeTab === 'history') && (
              <>
                {(activeTab === 'active' ? activeLoans : historyLoans).map(loan => {
                  const status = !loan.returned ? getLoanStatus(loan.end_date) : null
                  const returnPending = !loan.returned && loan.return_requested == 1
                  return (
                    <div key={loan.id} className={`rounded-3xl border ${status?.status === 'overdue' ? 'border-rose-300' : returnPending ? 'border-violet-200 bg-violet-50/30' : 'border-emerald-100'} bg-white/90 p-6 shadow-lg shadow-emerald-950/5 transition hover:shadow-xl relative overflow-hidden`}>
                      {status?.status === 'overdue' && !returnPending && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
                      )}
                      {returnPending && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500"></div>
                      )}
                      
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pl-2">
                        <div className="flex items-center gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 font-bold text-emerald-800 border border-emerald-100 text-sm">
                            {loan.user_name?.split(' ').map(n => n[0]).join('').substring(0,2) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{loan.asset_name}</h3>
                              {status?.badge && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${status.badgeColor}`}>
                                  {status.badge}
                                </span>
                              )}
                              {returnPending && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border bg-violet-100 text-violet-800 border-violet-200">
                                  🔄 Return Pending Approval
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {isEmployee ? 'Your loan' : <>Loaned to <strong className="text-slate-900 font-bold">{loan.user_name}</strong></>} — {loan.reason}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        {!loan.returned && (
                          <div className="flex gap-2 flex-wrap">
                            {/* Employee: Submit Return OR Pending badge */}
                            {isEmployee && !returnPending && (
                              <button 
                                onClick={() => setShowReturnRequestModal(loan)}
                                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700 shadow-sm"
                              >
                                📦 Return Item
                              </button>
                            )}
                            {/* Admin/IT Manager: Process Return (direct) or Approve Return (from pending) */}
                            {isAdminOrManager && (
                              <>
                                {!returnPending && (
                                  <button 
                                    onClick={() => setShowHandover(loan)}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                                  >
                                    Handover
                                  </button>
                                )}
                                <button 
                                  onClick={() => openReturnModal(loan)}
                                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-sm ${returnPending ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                  {returnPending ? '✅ Approve Return' : 'Process Return'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pl-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                        <div className="bg-emerald-50/50 p-2 px-3.5 rounded-xl border border-emerald-100">
                          <span>From <strong className="text-slate-800">{new Date(loan.start_date).toLocaleDateString()}</strong>{loan.end_date ? ` to ` : ''}<strong className="text-slate-800">{loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'Indefinite'}</strong></span>
                        </div>
                        {!loan.returned && loan.end_date && !returnPending && (
                          <div className="flex items-center gap-2">
                            <span className={`${status.color}`}>{status.text}</span>
                          </div>
                        )}
                        {returnPending && loan.return_requested_at && (
                          <div className="flex items-center gap-2 text-violet-600 font-bold">
                            Submitted return: {new Date(loan.return_requested_at).toLocaleString()}
                          </div>
                        )}
                        {loan.returned && (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold">
                            ✓ Returned
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(activeTab === 'active' ? activeLoans : historyLoans).length === 0 && (
                  <div className="text-center py-16 bg-white/90 rounded-3xl border border-emerald-100 border-dashed">
                    <p className="text-slate-400 text-xs font-semibold">No loans found in this category.</p>
                  </div>
                )}
              </>
            )}

            {/* PENDING RETURNS (Admin/IT Manager) */}
            {activeTab === 'pending-returns' && isAdminOrManager && (
              <>
                {pendingReturns.length > 0 ? (
                  pendingReturns.map(loan => {
                    const loanStatus = getLoanStatus(loan.end_date)
                    return (
                      <div key={loan.id} className="rounded-3xl border border-violet-200 bg-white/90 p-6 shadow-lg shadow-violet-950/5 transition hover:shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500"></div>
                        
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pl-2">
                          <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 font-bold text-violet-800 border border-violet-100 text-sm">
                              {loan.user_name?.split(' ').map(n => n[0]).join('').substring(0,2) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{loan.asset_name}</h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border bg-violet-100 text-violet-800 border-violet-200">
                                  Awaiting Inspection
                                </span>
                                {loanStatus.badge && (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${loanStatus.badgeColor}`}>
                                    {loanStatus.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Returned by <strong className="text-slate-900 font-bold">{loan.user_name}</strong> — {loan.reason}
                              </p>
                              {loan.user_email && (
                                <p className="text-[11px] text-slate-400 mt-0.5">{loan.user_email}</p>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => openReturnModal(loan)}
                            className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-violet-700 shadow-md shadow-violet-500/25 flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approve & Inspect
                          </button>
                        </div>
                        
                        <div className="mt-4 pl-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                          <div className="bg-violet-50/50 p-2 px-3.5 rounded-xl border border-violet-100">
                            <span>Loan period: <strong className="text-slate-800">{new Date(loan.start_date).toLocaleDateString()}</strong> → <strong className="text-slate-800">{loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'Indefinite'}</strong></span>
                          </div>
                          {loan.return_requested_at && (
                            <div className="flex items-center gap-2 text-violet-600 font-bold">
                              📦 Employee submitted: {new Date(loan.return_requested_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-20 bg-white/90 rounded-3xl border border-violet-100 border-dashed">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-slate-800 text-sm font-bold">All clear!</p>
                    <p className="text-slate-400 text-xs font-semibold mt-1">No pending returns to inspect right now.</p>
                  </div>
                )}
              </>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <>
                {pendingRequests.map(req => (
                  <div key={req.id} className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-950/5 relative overflow-hidden">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pl-2">
                      <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 font-bold text-emerald-800 border border-emerald-100 text-sm">
                          {req.user_name?.split(' ').map(n => n[0]).join('').substring(0,2) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{req.asset_name}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border bg-amber-100 text-amber-900 border-amber-200">Pending</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">Requested by <strong className="text-slate-900 font-bold">{req.user_name}</strong> — {req.reason}</p>
                        </div>
                      </div>
                      {isAdminOrManager && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => rejectRequest(req.id)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => approveRequest(req)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                          >
                            Approve & Issue
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pl-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <div className="bg-emerald-50/50 p-2 px-3.5 rounded-xl border border-emerald-100">
                        <span>Requested: <strong className="text-slate-800">{new Date(req.start_date).toLocaleDateString()}</strong> to <strong className="text-slate-800">{new Date(req.end_date).toLocaleDateString()}</strong></span>
                      </div>
                      <span className="text-[11px] text-slate-400">Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="text-center py-16 bg-white/90 rounded-3xl border border-emerald-100 border-dashed">
                    <p className="text-slate-400 text-xs font-semibold">No pending requests at this time.</p>
                  </div>
                )}
              </>
            )}

          </div>
        )}
      </div>

      {/* ── Employee: Return Item Modal (Phase 1) ──────────────────────────────── */}
      {/* Diagram: Display Return Confirmation → Send Query → Check Result → Error OR Success Notification */}
      {showReturnRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-violet-100">

            {/* ── Phase 1 OK: Display Pending Return Notification (diagram node) ── */}
            {returnPhase1Result === 'ok' ? (
              <>
                <div className="p-6 border-b border-violet-50 bg-violet-50/50 flex justify-between items-center">
                  <h2 className="text-base font-bold text-slate-900">Return Submitted ✅</h2>
                  <button onClick={() => { setShowReturnRequestModal(null); setReturnPhase1Result(null) }} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-violet-100 transition">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5 text-center space-y-2">
                    <div className="text-4xl">📦</div>
                    <p className="text-sm font-bold text-slate-900">Pending Return Notification Sent</p>
                    <p className="text-xs text-slate-500">The IT Manager has been notified and will inspect <strong>{showReturnRequestModal.asset_name}</strong> shortly.</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800">
                    <p className="font-bold mb-1">📋 What happens next?</p>
                    <ul className="space-y-1 list-disc pl-4">
                      <li>The IT Manager will inspect the returned item.</li>
                      <li>Once approved, your loan will be closed in the system.</li>
                      <li>The asset will be restored to available inventory.</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-white border-t border-violet-50 flex justify-end">
                  <button
                    onClick={() => { setShowReturnRequestModal(null); setReturnPhase1Result(null) }}
                    className="rounded-2xl bg-violet-600 px-6 py-2.5 font-bold text-white transition hover:bg-violet-700 shadow-md text-xs"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              /* ── Phase 1: Display Return Confirmation (diagram node) ── */
              <>
                <div className="p-6 border-b border-violet-50 bg-violet-50/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Return Item</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Notify IT that you've physically handed back this item.</p>
                  </div>
                  <button onClick={() => setShowReturnRequestModal(null)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-violet-100 transition">✕</button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4 space-y-1 text-xs text-slate-700">
                    <p><strong className="font-bold text-slate-900">Item:</strong> {showReturnRequestModal.asset_name}</p>
                    <p><strong className="font-bold text-slate-900">Due Date:</strong> {showReturnRequestModal.end_date ? new Date(showReturnRequestModal.end_date).toLocaleDateString() : 'Indefinite'}</p>
                    <p><strong className="font-bold text-slate-900">Loan ID:</strong> #{showReturnRequestModal.id}</p>
                  </div>

                  {/* NOT OK → Display Error Message (diagram node) */}
                  {returnPhase1Result && returnPhase1Result !== 'ok' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 font-medium">
                      ❌ {returnPhase1Result}
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                    <p className="font-bold mb-1">⚠️ What happens next?</p>
                    <ul className="space-y-1 list-disc pl-4">
                      <li>An IT Manager will be notified to inspect the item.</li>
                      <li>The loan remains active until they approve the return.</li>
                      <li>Once approved, the item is marked as returned in the system.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-violet-50 flex justify-end gap-3">
                  <button onClick={() => setShowReturnRequestModal(null)} className="rounded-2xl px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReturnRequest}
                    disabled={submittingReturn}
                    className="rounded-2xl bg-violet-600 px-6 py-2.5 font-bold text-white transition hover:bg-violet-700 shadow-md text-xs disabled:opacity-50"
                  >
                    {submittingReturn ? 'Sending...' : '📦 Confirm Return Item'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Smart Handover Modal ───────────────────────────────────────────────── */}
      {showHandover && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-emerald-100">
            <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/40">
              <h2 className="text-base font-bold text-slate-900">Smart Handover</h2>
              <button onClick={() => setShowHandover(null)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-emerald-100 transition">✕</button>
            </div>
            <div className="p-6">
              <div className="bg-emerald-50 text-slate-900 p-4 rounded-2xl border border-emerald-100 mb-6 text-xs font-medium leading-relaxed">
                Transferring <strong>{showHandover.asset_name}</strong> from <strong>{showHandover.user_name}</strong>.
              </div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">Transfer to Employee</label>
              <select className="w-full border border-emerald-100 rounded-2xl px-4 py-3 bg-emerald-50/30 font-medium mb-4 text-slate-800 text-xs outline-none">
                <option>Select an employee...</option>
              </select>
            </div>
            <div className="p-4 bg-emerald-50/30 border-t border-emerald-50 flex justify-end gap-3">
              <button onClick={() => setShowHandover(null)} className="rounded-2xl px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 text-xs">Cancel</button>
              <button onClick={() => setShowHandover(null)} className="rounded-2xl bg-emerald-600 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-700 text-xs shadow-md">Initiate Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Secure Loan Modal ─────────────────────────────────────────────── */}
      {showContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-emerald-100 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/40 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">New Secure Loan Request</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${formStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>1 Details</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${formStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>2 Sign & Submit</span>
                </div>
              </div>
              <button onClick={() => setShowContract(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-emerald-100 transition">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-5">

              {/* STEP 1: Request Details */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Select Asset *</label>
                    {assetsLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs p-3">Loading available assets...</div>
                    ) : availableAssets.length === 0 ? (
                      <p className="text-xs text-slate-900 font-semibold p-3 bg-emerald-50 rounded-2xl border border-emerald-200">No assets are currently available for loan.</p>
                    ) : (
                      <select
                        value={loanForm.asset_id}
                        onChange={e => setLoanForm(f => ({ ...f, asset_id: e.target.value }))}
                        className="w-full border border-emerald-100 rounded-2xl px-4 py-3 bg-emerald-50/30 font-medium text-slate-800 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                      >
                        <option value="">-- Choose an available asset --</option>
                        {availableAssets.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Start Date *</label>
                      <input
                        type="date"
                        value={loanForm.start_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setLoanForm(f => ({ ...f, start_date: e.target.value }))}
                        className="w-full border border-emerald-100 rounded-2xl px-4 py-3 bg-emerald-50/30 font-medium text-slate-800 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Return Date *</label>
                      <input
                        type="date"
                        value={loanForm.end_date}
                        min={loanForm.start_date || new Date().toISOString().split('T')[0]}
                        onChange={e => setLoanForm(f => ({ ...f, end_date: e.target.value }))}
                        className="w-full border border-emerald-100 rounded-2xl px-4 py-3 bg-emerald-50/30 font-medium text-slate-800 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Reason for Request *</label>
                    <textarea
                      value={loanForm.reason}
                      onChange={e => setLoanForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Briefly explain why you need this equipment..."
                      rows={3}
                      className="w-full border border-emerald-100 rounded-2xl px-4 py-3 bg-emerald-50/30 font-medium text-slate-800 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Sign & Submit */}
              {formStep === 2 && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                    <h3 className="font-extrabold text-slate-900 mb-2 text-xs uppercase tracking-wider">Request Summary</h3>
                    <div className="space-y-1 text-xs text-slate-700">
                      <p><strong>Asset:</strong> {availableAssets.find(a => String(a.id) === String(loanForm.asset_id))?.name}</p>
                      <p><strong>Dates:</strong> {loanForm.start_date} → {loanForm.end_date}</p>
                      <p><strong>Reason:</strong> {loanForm.reason}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 text-center mb-4 pb-3 border-b border-emerald-50">Equipment Liability Agreement</h3>
                    <div className="text-slate-600 text-xs leading-relaxed space-y-2">
                      <p>By signing this agreement, I, <strong>{user?.name}</strong>, acknowledge that I am requesting equipment from the company inventory.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use equipment solely for authorized company purposes.</li>
                        <li>Return equipment by the agreed return date in good working condition.</li>
                        <li>Report any damage or loss immediately to the IT department.</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Digital Signature *</label>
                    <input
                      type="text"
                      value={loanForm.signature}
                      onChange={e => setLoanForm(f => ({ ...f, signature: e.target.value }))}
                      placeholder={`Type "${user?.name}" to confirm`}
                      className="w-full border-2 border-dashed border-emerald-200 rounded-2xl px-4 py-3 bg-emerald-50/30 text-slate-900 text-sm font-bold italic outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-emerald-50 flex justify-between items-center gap-3 shrink-0">
              <button
                onClick={() => formStep === 1 ? setShowContract(false) : setFormStep(1)}
                className="rounded-2xl px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 text-xs"
              >
                {formStep === 1 ? 'Cancel' : '← Back'}
              </button>

              {formStep === 1 ? (
                <button
                  onClick={() => {
                    if (!loanForm.asset_id || !loanForm.start_date || !loanForm.end_date || !loanForm.reason.trim()) {
                      alert('Please fill in all required fields before continuing.')
                      return
                    }
                    setFormStep(2)
                  }}
                  className="rounded-2xl bg-emerald-600 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-700 shadow-md text-xs"
                >
                  Continue to Sign →
                </button>
              ) : (
                <button
                  onClick={submitLoanRequest}
                  disabled={submitting || !loanForm.signature.trim()}
                  className="rounded-2xl bg-emerald-600 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-700 shadow-md disabled:opacity-50 text-xs"
                >
                  {submitting ? 'Submitting...' : 'Sign & Submit Request'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Admin/IT Manager: Approve & Inspect Return Modal (Phase 2) ──────────── */}
      {/* Diagram: Display Inspection Form → Check Conformity → Send Query → Check Result → Success/Error */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-emerald-100 font-sans">

            {/* ── Phase 2 OK: Display Success Message (diagram node) ── */}
            {inspectionResultState === 'ok' ? (
              <>
                <div className="p-5 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/50">
                  <h2 className="text-base font-bold text-slate-900">Return Approved ✅</h2>
                  <button onClick={() => { setShowReturnModal(null); setInspectionResultState(null) }} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-emerald-100 transition">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 text-center space-y-2">
                    <div className="text-4xl">✅</div>
                    <p className="text-sm font-bold text-slate-900">Return Inspected & Approved</p>
                    <p className="text-xs text-slate-500">
                      <strong>{showReturnModal.asset_name}</strong> has been returned by <strong>{showReturnModal.user_name}</strong>.
                      Asset status updated to <strong>{returnForm.condition === 'maintenance' ? 'Maintenance' : 'Available'}</strong>.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => { setShowReturnModal(null); setInspectionResultState(null) }}
                    className="rounded-2xl bg-emerald-600 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-700 shadow-md text-xs"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              /* ── Phase 2: Display Inspection Form (diagram node) ── */
              <>
                <div className="p-5 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/50">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Approve &amp; Inspect Return</h2>
                    <p className="text-xs text-slate-500">Confirm equipment inspection before restoring inventory status.</p>
                  </div>
                  <button onClick={() => setShowReturnModal(null)} className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-emerald-100 transition">✕</button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-emerald-50/70 text-slate-800 p-4 rounded-2xl border border-emerald-100 text-xs space-y-1">
                    <p><strong>Item:</strong> {showReturnModal.asset_name}</p>
                    <p><strong>Borrower:</strong> {showReturnModal.user_name}</p>
                    <p><strong>Due Date:</strong> {showReturnModal.end_date ? new Date(showReturnModal.end_date).toLocaleDateString() : 'Indefinite'}</p>
                    {showReturnModal.return_requested_at && (
                      <p><strong>Return submitted:</strong> {new Date(showReturnModal.return_requested_at).toLocaleString()}</p>
                    )}
                  </div>

                  {/* INVALID → Display Conformity Error (diagram node) */}
                  {inspectionConformityError && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-800 font-semibold">
                      ⚠️ {inspectionConformityError}
                    </div>
                  )}

                  {/* NOT OK → Display Result Error (diagram node) */}
                  {inspectionResultState && inspectionResultState !== 'ok' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 font-semibold">
                      ❌ {inspectionResultState}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">Inspected Condition *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setReturnForm(f => ({ ...f, condition: 'available' })); setInspectionConformityError(null) }}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                          returnForm.condition === 'available'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span>🟢 Good Condition</span>
                        <span className="text-[10px] font-normal text-slate-500">Restore as Available</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setReturnForm(f => ({ ...f, condition: 'maintenance' })); setInspectionConformityError(null) }}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                          returnForm.condition === 'maintenance'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span>🛠️ Damaged / Repairs</span>
                        <span className="text-[10px] font-normal text-slate-500">Set to Maintenance</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      Inspection Notes {returnForm.condition === 'maintenance' ? '*' : '(Optional)'}
                    </label>
                    <textarea
                      value={returnForm.notes}
                      onChange={e => { setReturnForm(f => ({ ...f, notes: e.target.value })); setInspectionConformityError(null) }}
                      placeholder={returnForm.condition === 'maintenance' ? 'Describe the damage or reason for maintenance...' : 'e.g. Returned on time, charger included...'}
                      rows={2}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-2.5 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setShowReturnModal(null)} className="rounded-2xl px-4 py-2 font-bold text-slate-500 hover:bg-slate-200/60 text-xs">Cancel</button>
                  <button
                    onClick={handleConfirmReturn}
                    disabled={submittingInspection}
                    className="rounded-2xl bg-emerald-600 px-5 py-2.5 font-bold text-white transition hover:bg-emerald-700 shadow-md text-xs disabled:opacity-50"
                  >
                    {submittingInspection ? 'Processing...' : 'Approve & Complete Return'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Loans