import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

const UserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, loansRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/${id}`),
          fetch(`http://localhost:5000/api/loans`)
        ])
        if (userRes.ok) setProfile(await userRes.json())
        if (loansRes.ok) {
          const allLoans = await loansRes.json()
          setLoans(allLoans.filter(l => String(l.user_id) === String(id)))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-32 font-sans">
        <p className="text-slate-500 font-medium text-sm">User not found.</p>
        <Link to="/admin/users" className="mt-4 inline-block text-emerald-600 font-bold hover:underline text-xs">
          Back to Users
        </Link>
      </div>
    )
  }

  const initials = profile.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  const activeLoans = loans.filter(l => !l.returned)
  const returnedLoans = loans.filter(l => l.returned)

  return (
    <div className="min-h-screen bg-emerald-50/30 px-4 py-8 text-slate-800 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 pt-16 pb-12">

        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to User Management
        </button>

        {/* Profile Hero Card */}
        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500" />
          <div className="px-8 pb-8">
            <div className="-mt-14 mb-6 flex items-end justify-between">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-white select-none">
                {initials}
              </div>
              <div className="mb-2 flex flex-col items-end gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  {profile.role}
                </span>
                <span className={`text-[10px] font-black px-3 py-0.5 rounded-full ${profile.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {profile.status}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{profile.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 p-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
            <p className="font-bold text-slate-900 text-xs">{profile.name}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email</p>
            <p className="font-bold text-slate-900 text-xs truncate">{profile.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone</p>
            <p className="font-bold text-slate-900 text-xs">{profile.phone || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Role</p>
            <p className="font-bold text-slate-900 text-xs">{profile.role}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${profile.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {profile.status}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Member Since</p>
            <p className="font-bold text-slate-900 text-xs">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Loan Activity */}
        <div className="bg-white/90 rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-950/5 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 bg-emerald-50/40 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Loan Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">All equipment loans for this user.</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-1.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-base font-black text-slate-900">{activeLoans.length}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Active</p>
              </div>
              <div className="text-center px-4 py-1.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-base font-black text-emerald-600">{returnedLoans.length}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Returned</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-emerald-50">
            {loans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-xs font-semibold">No loan history for this user.</p>
              </div>
            ) : (
              loans.map(loan => (
                <div key={loan.id} className="p-5 flex items-center justify-between hover:bg-emerald-50/30 transition">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{loan.asset_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{loan.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${loan.returned ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white'}`}>
                      {loan.returned ? 'Returned' : 'Active'}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {new Date(loan.start_date).toLocaleDateString()} → {loan.end_date ? new Date(loan.end_date).toLocaleDateString() : 'Indefinite'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default UserProfile
