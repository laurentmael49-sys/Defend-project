import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const getLoanStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'ongoing', text: 'Ongoing (No due date)', badge: null, color: 'text-slate-500' }
  const end = new Date(endDateStr)
  const today = new Date()
  end.setHours(0,0,0,0); today.setHours(0,0,0,0)
  
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'overdue', text: `${Math.abs(diffDays)} days overdue`, badge: 'OVERDUE', badgeColor: 'bg-rose-100 text-rose-700 border-rose-200', color: 'text-rose-600 font-bold' }
  } else if (diffDays === 0) {
    return { status: 'soon', text: 'Due today', badge: 'DUE TODAY', badgeColor: 'bg-amber-100 text-amber-700 border-amber-200', color: 'text-amber-600 font-bold' }
  } else if (diffDays <= 7) {
    return { status: 'soon', text: `Expires in ${diffDays} days`, badge: 'EXPIRING SOON', badgeColor: 'bg-amber-100 text-amber-700 border-amber-200', color: 'text-amber-600 font-bold' }
  } else {
    return { status: 'ok', text: `${diffDays} days remaining`, badge: null, color: 'text-emerald-600 font-bold' }
  }
}

const Loans = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('active')
  
  const [loans, setLoans] = useState([])
  const [requests, setRequests] = useState([])
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
  const [formStep, setFormStep] = useState(1) // step 1 = details, step 2 = sign & submit

  const fetchData = async () => {
    setLoading(true)
    try {
      const [loansRes, reqRes] = await Promise.all([
        fetch('http://localhost:5000/api/loans'),
        fetch('http://localhost:5000/api/requests')
      ])
      if (loansRes.ok) setLoans(await loansRes.json())
      if (reqRes.ok) setRequests(await reqRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openContractModal = async () => {
    setLoanForm({ asset_id: '', start_date: '', end_date: '', reason: '', signature: '' })
    setFormStep(1)
    setShowContract(true)
    setAssetsLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/assets')
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
      const res = await fetch('http://localhost:5000/api/requests', {
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
        alert('✅ Your loan request has been submitted! An IT Manager will review it shortly.')
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

  const processReturn = async (loan) => {
    if (!window.confirm(`Mark ${loan.asset_name} as returned?`)) return
    
    try {
      const res = await fetch(`http://localhost:5000/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returned: true, asset_id: loan.asset_id })
      })
      if (res.ok) {
        alert('Return processed successfully.')
        fetchData()
      } else {
        alert('Failed to process return.')
      }
    } catch (e) {
      alert('Network error.')
    }
  }

  const approveRequest = async (req) => {
    try {
      // 1. Mark request as approved
      await fetch(`http://localhost:5000/api/requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      })

      // 2. Create the loan (which also updates asset status in backend)
      await fetch('http://localhost:5000/api/loans', {
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
      await fetch(`http://localhost:5000/api/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      })
      fetchData()
    } catch (e) {
      alert('Error rejecting request.')
    }
  }

  const activeLoans = loans.filter(l => !l.returned)
  const historyLoans = loans.filter(l => l.returned)
  const pendingRequests = requests.filter(r => r.status === 'Pending')

  const overdueCount = activeLoans.filter(l => {
    if (!l.end_date) return false;
    const end = new Date(l.end_date);
    const today = new Date();
    end.setHours(0,0,0,0); today.setHours(0,0,0,0);
    return end < today;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* Overdue Alert Banner */}
        {overdueCount > 0 && (
          <div className="mb-8 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 shadow-sm shadow-rose-100/50 animate-pulse" style={{animationDuration: '3s'}}>
            <div className="bg-rose-200 text-rose-700 w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">🚨</div>
            <div>
              <h3 className="font-bold text-rose-800">Action Required: Overdue Loans</h3>
              <p className="text-rose-700 text-sm font-medium">There {overdueCount === 1 ? 'is' : 'are'} {overdueCount} {overdueCount === 1 ? 'loan' : 'loans'} past {overdueCount === 1 ? 'its' : 'their'} return date. Please follow up.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Loans & Returns</h1>
            <p className="mt-1 text-slate-500 font-medium">Track equipment requests and completed returns with ease.</p>
          </div>
          {user?.role === 'Employee' && (
            <button 
              onClick={openContractModal}
              className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-900/20"
            >
              + New Secure Loan ✍️
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 pb-3">
          <button 
            onClick={() => setActiveTab('active')}
            className={`rounded-lg px-5 py-2.5 font-bold transition text-sm ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            Active Loans ({activeLoans.length})
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`rounded-lg px-5 py-2.5 font-bold transition text-sm ${activeTab === 'requests' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'} relative`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{pendingRequests.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`rounded-lg px-5 py-2.5 font-bold transition text-sm ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            History
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-4">
            
            {/* ACTIVE LOANS OR HISTORY */}
            {(activeTab === 'active' || activeTab === 'history') && (
              <>
                {(activeTab === 'active' ? activeLoans : historyLoans).map(loan => {
                  const status = !loan.returned ? getLoanStatus(loan.end_date) : null;
                  return (
                    <div key={loan.id} className={`rounded-3xl border ${status?.status === 'overdue' ? 'border-rose-200' : 'border-slate-200'} bg-white p-6 shadow-sm transition hover:shadow-md relative overflow-hidden`}>
                      {status?.status === 'overdue' && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                      )}
                      
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pl-2">
                        <div className="flex items-center gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 border border-slate-200 text-sm">
                            {loan.user_name?.split(' ').map(n => n[0]).join('').substring(0,2) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{loan.asset_name}</h3>
                              {status?.badge && (
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${status.badgeColor}`}>
                                  {status.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">Loaned to <strong className="text-slate-900">{loan.user_name}</strong> — {loan.reason}</p>
                          </div>
                        </div>
                        {!loan.returned && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowHandover(loan)}
                              className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 shadow-sm shadow-indigo-100/50"
                            >
                              Handover 🤝
                            </button>
                            <button 
                              onClick={() => processReturn(loan)}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 shadow-sm shadow-emerald-100/50"
                            >
                              Process Return
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-5 pl-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                        <div className="bg-slate-50 p-2.5 px-4 rounded-xl border border-slate-100">
                          <span>📅 From <strong className="text-slate-800">{new Date(loan.start_date).toLocaleDateString()}</strong>{loan.end_date ? ` to ` : ''}<strong className="text-slate-800">{loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'Indefinite'}</strong></span>
                        </div>
                        {!loan.returned && loan.end_date && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            <span className={`${status.color}`}>{status.text}</span>
                          </div>
                        )}
                        {loan.returned && (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold">
                            <span className="text-lg">✅</span> Returned
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(activeTab === 'active' ? activeLoans : historyLoans).length === 0 && (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                    <p className="text-slate-500 font-medium">No loans found in this category.</p>
                  </div>
                )}
              </>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <>
                {pendingRequests.map(req => (
                  <div key={req.id} className="rounded-3xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pl-2">
                      <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-bold text-slate-700 border border-slate-200 text-sm">
                          {req.user_name?.split(' ').map(n => n[0]).join('').substring(0,2) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{req.asset_name}</h3>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border bg-amber-100 text-amber-700 border-amber-200">Pending</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">Requested by <strong className="text-slate-900">{req.user_name}</strong> — {req.reason}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => rejectRequest(req.id)}
                          className="rounded-xl border border-rose-200 bg-white px-5 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 shadow-sm"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => approveRequest(req)}
                          className="rounded-xl border border-emerald-200 bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                        >
                          Approve & Issue
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 pl-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                      <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-sm">
                        <span>📅 Requested Dates: <strong className="text-slate-800">{new Date(req.start_date).toLocaleDateString()}</strong> to <strong className="text-slate-800">{new Date(req.end_date).toLocaleDateString()}</strong></span>
                      </div>
                      <span className="text-xs text-slate-400">Submitted on: {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                    <p className="text-slate-500 font-medium">No pending requests at this time.</p>
                  </div>
                )}
              </>
            )}

          </div>
        )}
      </div>

      {/* Smart Handover Modal */}
      {showHandover && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="text-indigo-600">🤝</span> Smart Handover
              </h2>
              <button onClick={() => setShowHandover(null)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-200">✕</button>
            </div>
            <div className="p-8">
              <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl border border-indigo-100 mb-6 text-sm font-medium">
                Transferring <strong>{showHandover.asset_name}</strong> from <strong>{showHandover.user_name}</strong>. The liability will automatically shift upon acceptance.
              </div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Transfer to Employee (Demo Only)</label>
              <select className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium mb-4 text-slate-800 appearance-none">
                <option>Select an employee...</option>
                <option>Alice Williams</option>
                <option>David Chen</option>
              </select>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowHandover(null)} className="rounded-xl px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
              <button onClick={() => setShowHandover(null)} className="rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white transition hover:bg-indigo-500 shadow-md">Initiate Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* New Secure Loan Modal */}
      {showContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="text-emerald-600">✍️</span> New Secure Loan Request
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${formStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1 Request Details</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${formStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2 Sign & Submit</span>
                </div>
              </div>
              <button onClick={() => setShowContract(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-200">✕</button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 flex-grow">

              {/* STEP 1: Request Details */}
              {formStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Asset <span className="text-rose-500">*</span></label>
                    {assetsLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm p-3"><div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div> Loading available assets...</div>
                    ) : availableAssets.length === 0 ? (
                      <p className="text-sm text-rose-500 font-medium p-3 bg-rose-50 rounded-xl border border-rose-200">⚠️ No assets are currently available for loan.</p>
                    ) : (
                      <select
                        value={loanForm.asset_id}
                        onChange={e => setLoanForm(f => ({ ...f, asset_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
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
                      <label className="block text-sm font-bold text-slate-700 mb-2">Start Date <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        value={loanForm.start_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setLoanForm(f => ({ ...f, start_date: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Return Date <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        value={loanForm.end_date}
                        min={loanForm.start_date || new Date().toISOString().split('T')[0]}
                        onChange={e => setLoanForm(f => ({ ...f, end_date: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Request <span className="text-rose-500">*</span></label>
                    <textarea
                      value={loanForm.reason}
                      onChange={e => setLoanForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Briefly explain why you need this equipment..."
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800 resize-none transition"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Sign & Submit */}
              {formStep === 2 && (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                    <h3 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wider">Request Summary</h3>
                    <div className="space-y-1.5 text-sm text-indigo-800">
                      <p><strong>Asset:</strong> {availableAssets.find(a => String(a.id) === String(loanForm.asset_id))?.name}</p>
                      <p><strong>Dates:</strong> {loanForm.start_date} → {loanForm.end_date}</p>
                      <p><strong>Reason:</strong> {loanForm.reason}</p>
                    </div>
                  </div>

                  {/* Contract Text */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 text-center mb-4 pb-4 border-b border-slate-100">Equipment Liability Agreement</h3>
                    <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                      <p>By signing this agreement, I, <strong>{user?.name}</strong>, acknowledge that I am requesting the above-listed equipment from the company inventory.</p>
                      <p>I agree to:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use the equipment solely for authorized company purposes.</li>
                        <li>Return the equipment by the agreed return date in good working condition.</li>
                        <li>Report any damage or loss immediately to the IT department.</li>
                        <li>Accept financial responsibility for any negligent damage caused.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Signature */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Digital Signature — Type your full name to sign <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={loanForm.signature}
                      onChange={e => setLoanForm(f => ({ ...f, signature: e.target.value }))}
                      placeholder={`Type "${user?.name}" to confirm`}
                      className="w-full border-2 border-dashed border-slate-300 rounded-xl px-4 py-4 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-semibold text-slate-800 text-lg italic transition placeholder:font-normal placeholder:not-italic placeholder:text-base"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">By signing, you digitally agree to the Equipment Liability Agreement above.</p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center gap-3 shrink-0">
              <button
                onClick={() => formStep === 1 ? setShowContract(false) : setFormStep(1)}
                className="rounded-xl px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 transition"
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
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white transition hover:bg-indigo-500 shadow-md"
                >
                  Continue to Sign →
                </button>
              ) : (
                <button
                  onClick={submitLoanRequest}
                  disabled={submitting || !loanForm.signature.trim()}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</> : '✍️ Sign & Submit Request'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default Loans