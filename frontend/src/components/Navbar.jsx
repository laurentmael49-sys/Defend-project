import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/api/notifications?user_id=${user.id}&role=${user.role}`)
        .then(res => res.json())
        .then(data => setNotifications(data || []))
        .catch(err => console.error('Failed to load notifications', err))
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  const roleLinks = {
    'Admin': ['dashboard', 'users', 'inventory', 'loans', 'reports', 'settings'],
    'IT Manager': ['dashboard', 'inventory', 'loans', 'reports', 'settings'],
    'Employee': ['dashboard', 'inventory', 'loans', 'settings']
  }

  const visibleLinks = roleLinks[user?.role] || roleLinks.admin

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-300 shadow-sm">
      <div className="w-full px-6 md:px-10 h-16 flex justify-between items-center">
        
        {/* Left side: Brand */}
        <div className="flex items-center gap-3 w-1/4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
            A
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 hidden sm:block">Asset<span className="text-indigo-600">Manager</span></span>
        </div>
        
        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center justify-center gap-8 flex-grow">
           {user && visibleLinks.map(link => {
             const isActive = location.pathname.includes(link);
             return (
               <Link 
                 key={link} 
                 to={
                   link === 'users' ? '/admin/users' :
                   link === 'settings' && user?.role === 'Admin' ? '/admin/settings' :
                   `/${link}`
                 } 
                 className={`relative h-16 flex items-center text-sm font-semibold capitalize transition-colors duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 {link}
                 {isActive && (
                   <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
                 )}
               </Link>
             )
           })}
        </div>

        {/* Right side: User Profile & Actions */}
        <div className="flex items-center justify-end gap-5 w-1/4">
           {user ? (
             <div className="flex items-center gap-5">
               {/* Search Icon (Hidden for now) */}
               <button className="hidden text-slate-400 hover:text-indigo-600 transition-colors sm:hidden">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </button>
               {/* Notification Icon */}
               <div className="relative hidden sm:block" ref={notifRef}>
                 <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="text-slate-400 hover:text-indigo-600 transition-colors relative focus:outline-none"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   {notifications.length > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-rose-500 rounded-full border border-white text-[9px] font-bold text-white flex items-center justify-center px-1">
                       {notifications.length}
                     </span>
                   )}
                 </button>
                 
                 {/* Notification Dropdown */}
                 {showNotifications && (
                   <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                     <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                       <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                       <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{notifications.length}</span>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto">
                       {notifications.length === 0 ? (
                         <div className="p-6 text-center text-slate-400 text-sm">
                           <p>No new notifications</p>
                         </div>
                       ) : (
                         <div className="divide-y divide-slate-100">
                           {notifications.map(notif => (
                             <Link 
                               key={notif.id} 
                               to="/loans"
                               onClick={() => setShowNotifications(false)}
                               className="p-4 hover:bg-slate-50 transition flex gap-3 block"
                             >
                               <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'overdue' ? 'bg-rose-100 text-rose-600' : notif.type === 'due_today' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                               <div>
                                 <p className="text-sm text-slate-700 leading-snug">{notif.message}</p>
                                 <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${notif.type === 'overdue' ? 'text-rose-500' : notif.type === 'due_today' ? 'text-amber-500' : 'text-blue-500'}`}>{notif.type.replace('_', ' ')}</p>
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
               <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
               
               {/* Profile */}
               <div className="flex items-center gap-3">
                 <div className="text-right hidden md:block">
                   <p className="text-[13px] font-bold text-slate-800 leading-none">{user.name}</p>
                   <p className="text-[11px] font-medium text-slate-500 mt-1 capitalize">{user.role}</p>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner">
                   {user.name.charAt(0)}
                 </div>
                 <button 
                   onClick={handleLogout} 
                   className="text-slate-400 hover:text-rose-500 transition-colors ml-2" 
                   title="Logout"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </button>
               </div>
             </div>
           ) : (
             <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30">
               Sign In
             </Link>
           )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar