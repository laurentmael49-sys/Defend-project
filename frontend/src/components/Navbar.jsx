import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'IT Manager'

  useEffect(() => {
    if (!user) return

    // Loan due-date / overdue notifications
    fetch(`http://localhost:5000/api/notifications?user_id=${user.id}&role=${user.role}`)
      .then(res => res.json())
      .then(data => setNotifications(data || []))
      .catch(err => console.error('Failed to load notifications', err))

    // Pending return approvals (Admin / IT Manager only)
    if (isAdminOrManager) {
      fetch('http://localhost:5000/api/loans/pending-returns', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setPendingReturnsCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {})
    }
  }, [user, isAdminOrManager])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false)
    if (notif.id.startsWith('db_')) {
      try {
        await fetch(`http://localhost:5000/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        })
        // Remove from local state immediately
        setNotifications(prev => prev.filter(n => n.id !== notif.id))
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
  }

  const roleLinks = {
    'Admin': ['dashboard', 'users', 'inventory', 'loans', 'reports'],
    'IT Manager': ['dashboard', 'inventory', 'loans', 'reports'],
    'Employee': ['dashboard', 'inventory', 'loans']
  }

  const visibleLinks = roleLinks[user?.role] || []

  const handleLogout = () => {
    setShowProfileMenu(false)
    logout()
    navigate('/')
  }

  const settingsPath = user?.role === 'Admin' ? '/admin/settings' : '/settings'
  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 transition-all duration-300 shadow-sm font-sans">
      <div className="w-full px-6 md:px-10 h-16 flex justify-between items-center">

        {/* Left: Brand */}
        <div className="flex items-center gap-3 w-1/4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
            Asset<span className="text-emerald-600 font-light">Manager</span>
          </span>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center justify-center gap-8 flex-grow">
          {user && visibleLinks.map(link => {
            const isActive = location.pathname.includes(link)
            return (
              <Link
                key={link}
                to={link === 'users' ? '/admin/users' : `/${link}`}
                className={`relative h-16 flex items-center text-sm font-semibold capitalize transition-all duration-200 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                {link}
                {isActive && <span className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full shadow-sm shadow-emerald-500/50" />}
              </Link>
            )
          })}
        </div>

        {/* Right: Notifications + Profile Button (containing Profile option & Logout inside) */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {user ? (
            <div className="flex items-center gap-3">

              {/* Notification Bell */}
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                  className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 transition-all flex items-center justify-center relative focus:outline-none border border-emerald-100"
                  title="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {(notifications.length + pendingReturnsCount) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-4 bg-emerald-600 rounded-full border-2 border-white text-[9px] font-extrabold text-white flex items-center justify-center px-1">
                      {notifications.length + pendingReturnsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden z-50">
                    <div className="px-4 py-3.5 border-b border-emerald-50 bg-emerald-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{notifications.length + pendingReturnsCount}</span>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {/* Pending Returns Alert (Admin/IT Manager) */}
                      {isAdminOrManager && pendingReturnsCount > 0 && (
                        <Link
                          to="/loans"
                          onClick={() => setShowNotifications(false)}
                          className="p-4 hover:bg-violet-50/60 transition flex gap-3 block border-b border-violet-100 bg-violet-50/30"
                        >
                          <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-violet-100 text-violet-700">
                            <span className="text-sm">📦</span>
                          </div>
                          <div>
                            <p className="text-sm text-slate-800 font-bold leading-snug">
                              {pendingReturnsCount} pending return{pendingReturnsCount > 1 ? 's' : ''} awaiting inspection
                            </p>
                            <p className="text-[10px] font-bold mt-1 uppercase tracking-wider text-violet-600">Action Required</p>
                          </div>
                        </Link>
                      )}
                      {notifications.length === 0 && pendingReturnsCount === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm"><p>No new notifications</p></div>
                      ) : (
                        <div className="divide-y divide-emerald-50">
                          {notifications.map(notif => (
                            <Link key={notif.id} to="/loans" onClick={() => handleNotificationClick(notif)} className="p-4 hover:bg-emerald-50/60 transition flex gap-3 block">
                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.id.startsWith('db_') ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                <p className="text-sm text-slate-800 font-medium leading-snug">{notif.message}</p>
                                <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${notif.id.startsWith('db_') ? 'text-sky-600' : 'text-emerald-600'}`}>
                                  {notif.type.replace('_', ' ')}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-emerald-100 hidden sm:block" />

              {/* Profile Button (opens dropdown with Profile + Logout) */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false) }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-slate-800 transition-all border border-emerald-100 text-xs font-bold shadow-sm focus:outline-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                    {initials}
                  </div>
                  <span>Profile</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden z-50">
                    <div className="px-4 py-4 bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-emerald-500/20">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                          <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 bg-emerald-100 text-emerald-800">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        to={settingsPath}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/70 flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        View Profile
                      </Link>
                    </div>

                    <div className="border-t border-emerald-50 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <Link to="/login" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/25">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
